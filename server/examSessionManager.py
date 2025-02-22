import os
import lameenc
import json
import queue
import time
import wave
import examJudger
import av.container
import livekit.api
import data.config
import google.genai.live
import websockets_proxy
import dataProvider
import threading
import tools
import typing
import logger
import asyncio
import livekit
import livekit.rtc
import google.genai
import chatModel
import numpy
import cv2
import PIL.Image
import PIL.ImageDraw
import PIL.ImageFont
import av
from AIDubMiddleware import AIDubMiddlewareAPI
import io

asyncio.set_event_loop(asyncio.new_event_loop())

async def getLiveKitAPI():
    return livekit.api.LiveKitAPI(f"wss://{data.config.LIVEKIT_API_EXTERNAL_URL}", data.config.LIVEKIT_API_KEY, data.config.LIVEKIT_API_SECRET)


class SpeakingExaminationLLMState():
    DISCONNECTED = -3
    AWAITING_CONNECTION = -2
    PARTI_INITIATION = -1
    PARTI_CONVERSATION = 0
    PartII_AWAIT_TASK_CARD = 1
    PARTII_STUDENT_PREPARATION = 2
    PARTII_STUDENT_STATEMENT = 3
    PARTII_FOLLOW_UP_QUESTIONING = 4
    PARTIII_DISCUSSING = 5
    PARTIV_EVALUATING = 6
    
    def isConversationState(state: int) -> bool:
        return state in [
            SpeakingExaminationLLMState.PARTI_CONVERSATION,
            SpeakingExaminationLLMState.PARTII_FOLLOW_UP_QUESTIONING,
            SpeakingExaminationLLMState.PARTIII_DISCUSSING
        ]


class BroadcastMissionManager():
    def __init__(self):
        self.APIInstance = AIDubMiddlewareAPI(dataProvider.DataProvider.getConfig()['data']['AIDubEndpoint'])
        self.broadcastMissions: queue.Queue[str] = queue.Queue()
        self.readyMissions: queue.Queue[av.container.InputContainer | av.container.OutputContainer] = queue.Queue()
        self.processThread: threading.Thread = threading.Thread(target=self.processMissions, daemon=True)
        self.finished = False
        self.clearBufferTrigger: typing.Callable = None
        self.processThread.start()
        
        
    def onClearBuffer(self, callback: typing.Callable) -> None:
        self.clearBufferTrigger = callback
        
    
    def finalize(self):
        self.finished = True
        self.processThread.join()
        
        
    def put(self, mission: str) -> None:
        print(mission)
        mission = mission\
                        .replace('\n', ' ')\
                        .replace('. ', '|sep|')\
                        .replace('? ', '|sep|')\
                        .replace('! ', '|sep|')\
                        .replace('  ','')
                            
        missions = mission.split('|sep|')
        for m in missions:
            self.broadcastMissions.put(m)
        self.broadcastMissions.put('|TRIGGER|')
        
        
    def processMissions(self):
        while not self.finished:
            if not self.broadcastMissions.empty():
                try:
                    mission = self.broadcastMissions.get()
                    if mission == '|TRIGGER|':
                        if self.clearBufferTrigger is not None:
                            self.clearBufferTrigger()
                        continue
                    
                    resp = self.APIInstance.dub(mission, dataProvider.DataProvider.getConfig()['data']['AIDubModel'])
                    bytesIO = io.BytesIO(resp.content)
                    self.readyMissions.put(av.open(bytesIO))
                    logger.Logger.log(f"Mission {mission} is ready for broadcasting")
                except:
                    logger.Logger.log(f"Error processing mission {mission}")
            else:
                time.sleep(0.1)
        
    
    async def getMission(self) -> av.container.InputContainer | av.container.OutputContainer:
        while self.readyMissions.empty():
            await asyncio.sleep(0.1)
        return self.readyMissions.get()


class SpeakingExaminaionVirtualExaminee():
    def __init__(self):
        self.prompt = f'''
        You are a skillful IELTS Speaking Examination participant. Your task is to attend a speaking examination with your full effort.
        You are required to speak and answer the questions the examiner asked.
        When you receive a task card, you are required to read the task given to you and give the speech immediately.
        All of your answers should be in no more than 200 words.
        
        Your personality is as follows:
        
        Name: Jerry Chou
        Gender: Male
        Age: 15
        Hometown: Zhaoqing, Guangdong
        Favourite Subject: English
        Hobbies: Coding, reading
        '''
        self.llm = chatModel.ChatGoogleGenerativeAI("gemini-2.0-flash-thinking-exp-01-21", 0.7, system_prompt=self.prompt)
        self.APIInstance = AIDubMiddlewareAPI(dataProvider.DataProvider.getConfig()['data']['AIDubEndpoint'])
        self.isInitiated = False
    
    
    def answer(self, question: str) -> str:
        print('Question sent')
        data = self.llm.chat([question]) if self.isInitiated else self.llm.initiate([question])
        print(question, data)
        resp = self.APIInstance.dub(data, 'Yoimiya')
        mime, data = resp.headers['Content-Type'], resp.content
        return mime, data
        

class SpeakingExaminationSessionBackend():
    def __init__(self, userId: int, warmUpTopics: list[str], specificTopic: str):
        self.userId = userId
        self.bot = ''
        self.loop: asyncio.AbstractEventLoop = None
        self.connected: bool = False
        self.connectionLogs: list[str] = []
        self.chatRoom: livekit.rtc.Room = None
        self.llmSession: google.genai.live.AsyncSession = None
        self.llmState: int = SpeakingExaminationLLMState.DISCONNECTED
        self.ttsManager: BroadcastMissionManager = BroadcastMissionManager()
        self.virtualExaminee: SpeakingExaminaionVirtualExaminee = SpeakingExaminaionVirtualExaminee()
        self.llmStateInfo: dict[str, typing.Any] = {
            'PartI_Conversation_Round_Counter': 0,
            'PartI_Conversation_Questions': [],
            'PartI_Conversation_Answers': [],
            'PartII_Student_Statement_Answer': b'',
            'PartII_Follow_Up_Round_Counter': 0,
            'PartII_Follow_Up_Questions': [],
            'PartII_Follow_Up_Answers': [],
            'PartIII_Discussion_Round_Counter': 0,
            'PartIII_Discussion_Questions': [],
            'PartIII_Discussion_Answers': [],
            'PartIII_Discussion_Round_Counter': 0,
            'PartIII_Discussion_Questions': [],
            'PartIII_Discussion_Answers': [],
        }
        config = dataProvider.DataProvider.getConfig()['data']
        self.warmUpTopics = warmUpTopics
        self.specificTopic = specificTopic
        self.broadcastVideoTrack: livekit.rtc.LocalVideoTrack = None
        self.videoBroadcastingThread: threading.Thread = None
        self.loggerCallbackId: int = None
        self.exitCallback: typing.Callable = None
        self.llmSession: chatModel.ChatGoogleGenerativeAI = chatModel.ChatGoogleGenerativeAI('gemini-2.0-flash-exp', 0.7, system_prompt=chatModel.PromptForOralEnglishExamInitiation(
            chatbotName=config['chatbotName'], chatbotPersona=config['chatbotPersona']), tools=[])
        self.userManualInterruption = False
        self.userAnswers: queue.Queue[bytes] = queue.Queue()
        self.data_buffer_for_conv = b''
        self.registeredEvents: dict[str, typing.Callable] = {}
        self.audioFrameDetails = {}
        self.latestQuestion = ''
        self.automaticAnswering = False
        
        
    async def emitEvent(self, event: str, data: typing.Any) -> None:
        await self.chatRoom.local_participant.publish_data(json.dumps(data, default=lambda x: None), reliable=True, topic=event)
        
        
    def registerEvent(self, event: str, callback: typing.Optional[typing.Callable] = None) -> typing.Callable:
        # self.registeredEvents[event] = callback
        def wrapper(callback: typing.Callable) -> typing.Callable:
            self.registeredEvents[event] = callback
            return callback
            
        return wrapper(callback) if callback is not None else wrapper
        

    def generateEmptyAudioFrame(self) -> livekit.rtc.AudioFrame:
        """
        Generate an empty audio frame.

        Returns:
            livekit.rtc.AudioFrame: empty audio frame
        """
        amplitude = 32767  # for 16-bit audio
        samples_per_channel = 480  # 10ms at 48kHz
        time = numpy.arange(samples_per_channel) / \
            48000
        total_samples = 0
        audio_frame = livekit.rtc.AudioFrame.create(
            48000, 1, samples_per_channel)
        audio_data = numpy.frombuffer(audio_frame.data, dtype=numpy.int16)
        time = (total_samples + numpy.arange(samples_per_channel)) / \
            48000
        wave = numpy.int16(0)
        numpy.copyto(audio_data, wave)
        # logger.Logger.log('done1')
        return audio_frame


    async def broadcastAudioLoop(self, source: livekit.rtc.AudioSource, frequency: int = 1000):
        logger.Logger.log('broadcasting audio...')
        while self.connected:
            if self.ttsManager.readyMissions.empty():
                frame = self.generateEmptyAudioFrame()
                await source.capture_frame(frame)
            else:
                mission = self.ttsManager.readyMissions.get()
                for frame in mission.decode(audio=0):
                    try:
                        # logger.Logger.log out attrs of livekitFrame when initializing it.
                        # logger.Logger.log(frame.samples * 2, len(frame.to_ndarray().astype(numpy.int16).tobytes()))
                        resampledFrame = av.AudioResampler(
                            format='s16', layout='mono', rate=48000).resample(frame)[0]
                        # logger.Logger.log(resampledFrame.samples * 2, len(resampledFrame.to_ndarray().astype(numpy.int16).tobytes()))
                        livekitFrame = livekit.rtc.AudioFrame(
                            data=resampledFrame.to_ndarray().astype(numpy.int16).tobytes(),
                            sample_rate=resampledFrame.sample_rate,
                            num_channels=len(resampledFrame.layout.channels),
                            samples_per_channel=resampledFrame.samples // len(resampledFrame.layout.channels),)
                        await source.capture_frame(livekitFrame)
                    except Exception as e:
                        # if there's problem with the frame, skip it and continue to the next one.
                        logger.Logger.log(
                            'Error processing frame, skipping it.')
                        continue
        
        logger.Logger.log('audio broadcasting loop terminated')


    def runBroadcastingLoop(self, source: livekit.rtc.AudioSource) -> None:
        """
        Start the loop for broadcasting audio.

        Returns:
            None
        """
        logger.Logger.log('starting audio broadcasting loop')
        new_loop = asyncio.new_event_loop()
        new_loop.run_until_complete(self.broadcastAudioLoop(source))

        
    async def start(self, botToken: str, loop: asyncio.AbstractEventLoop): 
        logger.Logger.log('Preparing to start chat...')
        self.loop = loop
        self.chatRoom = livekit.rtc.Room(loop)
        self.connected = True
        self.loggerCallbackId = logger.Logger.registerCallback(lambda s: self.connectionLogs.append(s))
        logger.Logger.log('Connecting to LiveKit server...')

        @self.chatRoom.on("track_subscribed")
        def on_track_subscribed(track: livekit.rtc.Track, publication: livekit.rtc.RemoteTrackPublication, participant: livekit.rtc.RemoteParticipant):
            logger.Logger.log(f"track subscribed: {publication.sid}")
            if track.kind == livekit.rtc.TrackKind.KIND_AUDIO:
                logger.Logger.log('running user input loop...')
                self.llmState = SpeakingExaminationLLMState.PARTI_INITIATION
                asyncio.ensure_future(
                    self.processUserInput(livekit.rtc.AudioStream(track), publication.mime_type))

        @self.chatRoom.on("track_unsubscribed")
        def on_track_unsubscribed(track: livekit.rtc.Track, publication: livekit.rtc.RemoteTrackPublication, participant: livekit.rtc.RemoteParticipant):
            logger.Logger.log(f"track unsubscribed: {publication.sid}")

        @self.chatRoom.on("participant_connected")
        def on_participant_connected(participant: livekit.rtc.RemoteParticipant):
            logger.Logger.log(f"participant connected: {
                participant.identity} {participant.sid}")

        @self.chatRoom.on("participant_disconnected")
        def on_participant_disconnected(participant: livekit.rtc.RemoteParticipant):
            logger.Logger.log(
                f"participant disconnected: {
                    participant.sid} {participant.identity}"
            )
            if self.llmState not in [
                SpeakingExaminationLLMState.PARTIV_EVALUATING,
                SpeakingExaminationLLMState.DISCONNECTED,
            ]:
                self.terminateSession()

        @self.chatRoom.on("connected")
        def on_connected() -> None:
            logger.Logger.log("connected")


        @self.chatRoom.on("data_received")
        def on_data_received(data: livekit.rtc.DataPacket):
            data.data.decode('utf-8')
            if data.participant.identity != self.chatRoom.local_participant.identity:
                if data.topic in self.registeredEvents:
                    self.registeredEvents[data.topic](data.data)
                else:
                    logger.Logger.log('unhandled event: ', data.topic)
            else:
                logger.Logger.log('ignoring own data packet')
        

        @self.registerEvent("userManualInterruption")
        def on_user_manual_interruption(data: dict = None):
            logger.Logger.log("user manual interruption")
            self.userManualInterruption = True

        logger.Logger.log('connecting to room...')
        await self.chatRoom.connect(
            f"wss://{data.config.LIVEKIT_API_EXTERNAL_URL}", botToken)

        audioSource = livekit.rtc.AudioSource(
            48000, 1)
        self.broadcastAudioTrack = livekit.rtc.LocalAudioTrack.create_audio_track(
            "stream_track", audioSource)


        # videoSource = livekit.rtc.VideoSource(
        #     data.config.LIVEKIT_VIDEO_WIDTH, data.config.LIVEKIT_VIDEO_HEIGHT)
        # self.broadcastVideoTrack = livekit.rtc.LocalVideoTrack.create_video_track(
        #     "video_track", videoSource)

        publication_audio = await self.chatRoom.local_participant.publish_track(
            self.broadcastAudioTrack, livekit.rtc.TrackPublishOptions(source=livekit.rtc.TrackSource.SOURCE_MICROPHONE, red=False))

        # options = livekit.rtc.TrackPublishOptions(source=livekit.rtc.TrackSource.SOURCE_CAMERA, red=False, simulcast=True)
        # publication_video = await self.chatRoom.local_participant.publish_track(
        #     self.broadcastVideoTrack, options)
        # # logger.Logger.log(f"broadcast video track published: {
        # #     publication_video.track.name}")

        asyncio.ensure_future(self.broadcastAudioLoop(audioSource))

        # self.videoBroadcastingThread = threading.Thread(
        #     target=self.runVideoBroadcastingLoop, args=(None,))
        # self.videoBroadcastingThread.start()

        logger.Logger.log('chat session started')
        logger.Logger.log('Sending the first system prompt...')
        self.llmState = SpeakingExaminationLLMState.AWAITING_CONNECTION
        asyncio.ensure_future(self.chat())
        
        def clearBuffer():
            logger.Logger.log('clearing buffer')
            self.data_buffer_for_conv = b''

        # make sure no dirty data in buffer before user answering
        self.ttsManager.onClearBuffer(clearBuffer)
        
    
    def terminateSession(self) -> None:
        """
        Terminate the chat session.

        FIXME: it will only be triggered when other events received first. strange
        """
        # self.bot.terminateChat()
        self.connected = False
        logger.Logger.log('Triggering terminate session callback')
        if self.exitCallback is not None:
            self.exitCallback(self.llmStateInfo)

        async def f():
            logger.Logger.log('terminating chat session...')
            logger.Logger.unregisterCallback(self.loggerCallbackId)
            await self.chatRoom.disconnect()

        asyncio.ensure_future(f())


    def drawLogs(self) -> numpy.ndarray:
        img = PIL.Image.new('RGBA', (data.config.LIVEKIT_VIDEO_WIDTH, data.config.LIVEKIT_VIDEO_HEIGHT), color='black')
        # draw = PIL.ImageDraw.Draw(img)
        # try:
        #     font = PIL.ImageFont.truetype(
        #         'consolas.ttf', size=20)
        # except IOError:
        #     font = PIL.ImageFont.load_default(size=20)
        # for i, log in enumerate(self.connectionLogs[-48:]):
        #     draw.text((10, 10 + i * 20), log, font=font, fill=(255, 255, 255))
            
        # if len(self.connectionLogs) > 48:
        #    del self.connectionLogs[:48]
        # export ndarray for image
        img_np = numpy.array(img)
        # logger.Logger.log(img_numpy.shape)
        return img_np


    def runVideoBroadcastingLoop(self, videoSource) -> None:
        """
        Start the loop for broadcasting video.

        Returns:
            None
        """
        logger.Logger.log('starting video broadcasting loop')
        new_loop = asyncio.new_event_loop()
        new_loop.run_until_complete(self.broadcastVideoLoop(videoSource))


    async def broadcastVideoLoop(self, source: livekit.rtc.VideoSource):
        logger.Logger.log('broadcasting video...')
        while self.connected:
            # logger.Logger.log(self.broadcastMissions.qsize(), 'missions in queue')
            # build video frame for 64 lines of logs 
            # img_np = self.drawLogs()
            # # print(img_numpy.shape)
            # logger.Logger.log(img_numpy.shape, len(img_numpy.tobytes()))
            # livekitFrame = livekit.rtc.VideoFrame(
            #     data=img_numpy.astype(numpy.uint8),
            #     width=data.config.LIVEKIT_VIDEO_WIDTH,
            #     height=data.config.LIVEKIT_VIDEO_HEIGHT,
            #     type=livekit.rtc.VideoBufferType.RGB24
            # )
            # source.capture_frame(livekitFrame)
            await asyncio.sleep(1/30)
        
        logger.Logger.log('broadcasting video stopped')


    def pcmToWav(self, pcm_data: bytes) -> bytes:
        """
        Convert PCM data to WAV format.

        Args:
            pcm_data (bytes): PCM data

        Returns:
            bytes: WAV data
        """
        with io.BytesIO() as wav_buffer:
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(16000)
                wav_file.writeframes(pcm_data)
            return wav_buffer.getvalue()


    def pcmToMp3(self, pcm_data: bytes) -> bytes:
        """
        Convert PCM data to MP3 format.

        Args:
            pcm_data (bytes): PCM data

        Returns:
            bytes: MP3 data
        """
        mp3_encoder = lameenc.Encoder()
        mp3_encoder.set_bit_rate(128)
        mp3_encoder.set_in_sample_rate(16000)
        mp3_encoder.set_channels(1)
        mp3_data: bytearray = mp3_encoder.encode(pcm_data)
        return bytes(mp3_data)
        
        
    def getVirtualExamineeAnswer(self, question: str) -> bytes:
        """
        Get the virtual examinee's answer to a question.

        Args:
            question (str): the question to ask the virtual examinee

        Returns:
            bytes: the virtual examinee's answer in MP3 format
        """
        mime, blob = self.virtualExaminee.answer(question)
        pcm = b''
        with av.open(io.BytesIO(blob), 'r') as container:
            for frame in container.decode(audio=0):
                resampledFrame = av.AudioResampler(
                    format='s16', layout='mono', rate=16000).resample(frame)[0]
                pcm += resampledFrame.to_ndarray().astype(numpy.int16).tobytes()
        
        return self.pcmToMp3(pcm)
    

    async def chat(self):
        while True:
            match self.llmState:
                case SpeakingExaminationLLMState.DISCONNECTED:
                    logger.Logger.log('LLM state: DISCONNECTED')
                    break
                case SpeakingExaminationLLMState.AWAITING_CONNECTION:
                    logger.Logger.log('LLM state: AWAITING_CONNECTION')
                    await asyncio.sleep(0.5)
                    continue
                case SpeakingExaminationLLMState.PARTI_INITIATION:
                    logger.Logger.log('LLM state: PARTI_INITIATION')
                    # send system prompt
                    resp = self.llmSession.initiate([chatModel.Prompt(data.config.PROMPT_FOR_THE_FIRST_PART_OF_ORAL_ENGLISH_EXAM, {
                        'specific_topics': self.warmUpTopics
                    })])
                    self.latestQuestion = resp
                    logger.Logger.log(resp)
                    self.llmStateInfo['PartI_Conversation_Questions'].append(
                        resp
                    )
                    self.ttsManager.put(resp)
                    await self.emitEvent('control', {
                        'event': 'next_state',
                        'data': 'PartI_Conversation'
                    })
                    self.llmState = SpeakingExaminationLLMState.PARTI_CONVERSATION
                case SpeakingExaminationLLMState.PARTI_CONVERSATION:
                    while self.userAnswers.empty():
                        await asyncio.sleep(0.1)
                        
                    self.llmStateInfo['PartI_Conversation_Round_Counter'] += 1
                    if self.automaticAnswering:
                        self.userAnswers.get()
                        user_answer = self.getVirtualExamineeAnswer(self.latestQuestion)
                    else:
                        user_answer = self.pcmToMp3(self.userAnswers.get())
                    
                    # add to answer
                    self.llmStateInfo['PartI_Conversation_Answers'].append(
                        user_answer
                    )
                    if self.llmStateInfo['PartI_Conversation_Round_Counter'] == 2:
                        await self.emitEvent('control', {
                            'event': 'next_state',
                            'data': 'PartII_Await_Task_Card'
                        })
                        self.llmState = SpeakingExaminationLLMState.PARTII_STUDENT_PREPARATION
                        resp = self.llmSession.chat([{
                            'mime_type': 'audio/mp3',
                            'data': user_answer
                        }, chatModel.Prompt(data.config.PROMPT_FOR_THE_SECOND_PART_OF_ORAL_ENGLISH_EXAM_1, {
                            'specific_topic': self.specificTopic
                        })])
                        self.latestQuestion = resp + "Now you can begin your speech."
                        print(resp)
                        
                        # parse task card
                        task_card = resp[resp.rfind('[task_card]')+12:resp.rfind('[/task_card]')]
                        self.llmStateInfo['PartII_Task_Card'] = task_card
                        # parse begin word
                        begin_word = resp[resp.rfind('[word_to_examinee]')+18:resp.rfind('[/word_to_examinee]')]
                        self.llmStateInfo['PartII_Begin_Word'] = begin_word
                        # emit tts
                        self.ttsManager.put(begin_word)
                        # emit task card
                        await self.emitEvent('control', {
                            'event': 'next_state',
                            'data': 'PartII_Preparation',
                            'task_card': task_card
                        })
                    else:
                        # send to AI
                        resp = self.llmSession.chat([{
                            'mime_type': 'audio/mp3',
                            'data': user_answer
                        }])
                        self.latestQuestion = resp
                        self.ttsManager.put(resp)
                        await self.emitEvent('control', {
                            'event': 'resume_recording',
                            'data': 'PartI_Conversation'
                        })
                case SpeakingExaminationLLMState.PARTII_STUDENT_PREPARATION:
                    # wait for student to prepare
                    while self.userAnswers.empty():
                        await asyncio.sleep(0.1)
                        
                    # drop answers
                    if not self.userAnswers.empty():
                        self.userAnswers.get()
                        
                    # start student statement
                    await self.emitEvent('control', {
                        'event': 'next_state',
                        'data': 'PartII_Student_Statement'
                    })
                    self.llmState = SpeakingExaminationLLMState.PARTII_STUDENT_STATEMENT
                case SpeakingExaminationLLMState.PARTII_STUDENT_STATEMENT:
                    # wait for student statement
                    while self.userAnswers.empty():
                        await asyncio.sleep(0.1)
                        
                    # get answers
                    if self.automaticAnswering:
                        self.userAnswers.get()
                        self.llmStateInfo['PartII_Student_Statement_Answer'] = self.getVirtualExamineeAnswer(self.latestQuestion)
                    else:
                        self.llmStateInfo['PartII_Student_Statement_Answer'] = self.pcmToMp3(self.userAnswers.get())
                    
                    resp = self.llmSession.chat([data.config.PROMPT_FOR_THE_SECOND_PART_OF_ORAL_ENGLISH_EXAM_2, {
                        'mime_type': 'audio/mp3',
                        'data': self.llmStateInfo['PartII_Student_Statement_Answer']
                    }])
                    self.latestQuestion = resp
                    self.llmStateInfo['PartII_Follow_Up_Questions'].append(
                        resp
                    )
                    self.ttsManager.put(resp)
                    await self.emitEvent('control', {
                        'event': 'next_state',
                        'data': 'PartII_Follow_Up_Questioning'
                    })
                    self.llmState = SpeakingExaminationLLMState.PARTII_FOLLOW_UP_QUESTIONING
                    self.llmStateInfo['PartII_Follow_Up_Round_Counter'] = 0
                case SpeakingExaminationLLMState.PARTII_FOLLOW_UP_QUESTIONING:
                    # wait for user answer
                    answer = b''
                    while self.userAnswers.empty():
                        await asyncio.sleep(0.1)
                        
                    # increase round counter
                    self.llmStateInfo['PartII_Follow_Up_Round_Counter'] += 1
                    # get answer
                    if self.automaticAnswering:
                        self.userAnswers.get() # drop the answer
                        answer = self.getVirtualExamineeAnswer(self.latestQuestion)
                    else:
                        answer = self.pcmToMp3(self.userAnswers.get())
                        
                    # add to answer
                    self.llmStateInfo['PartII_Follow_Up_Answers'].append(
                        answer
                    )
                    # if all rounds are done, start discussing
                    if self.llmStateInfo['PartII_Follow_Up_Round_Counter'] == 3:
                        resp = self.llmSession.chat([
                            {
                                'mime_type': 'audio/mp3',
                                'data': answer,
                            },
                            data.config.PROMPT_FOR_THE_THIRD_PART_OF_ORAL_ENGLISH_EXAM,
                        ])
                        self.latestQuestion = resp
                        self.llmStateInfo['PartIII_Discussion_Questions'].append(
                            resp
                        )
                        self.ttsManager.put(resp)
                        self.llmState = SpeakingExaminationLLMState.PARTIII_DISCUSSING
                        self.llmStateInfo['PartIII_Discussion_Round_Counter'] = 0
                        await self.emitEvent('control', {
                            'event': 'next_state',
                            'data': 'PartIII_Discussion'
                        })
                    else:
                        resp = self.llmSession.chat([{
                            'mime_type': 'audio/mp3',
                            'data': answer
                        }])
                        self.latestQuestion = resp
                        # send to AI
                        self.ttsManager.put(resp)
                        self.llmStateInfo['PartII_Follow_Up_Questions'].append(
                            resp
                        )
                        await self.emitEvent('control', {
                            'event': 'resume_recording',
                            'data': 'PartII_Follow_Up_Questioning'
                        })
                case SpeakingExaminationLLMState.PARTIII_DISCUSSING:
                    # wait for user answer
                    answer = b''
                    while self.userAnswers.empty():
                        await asyncio.sleep(0.1)
                     
                    # increase the counter
                    self.llmStateInfo['PartIII_Discussion_Round_Counter'] += 1
                    # get answer
                    # answer = self.pcmToMp3(self.userAnswers.get())
                    if self.automaticAnswering:
                        self.userAnswers.get() # drop the answer
                        answer = self.getVirtualExamineeAnswer(self.latestQuestion)
                    else:
                        answer = self.pcmToMp3(self.userAnswers.get())
                        
                    # add to answer
                    self.llmStateInfo['PartIII_Discussion_Answers'].append(
                        answer
                    )
                    if self.llmStateInfo['PartIII_Discussion_Round_Counter'] == 3:
                        # end of discussion
                        self.llmState = SpeakingExaminationLLMState.PARTIV_EVALUATING
                        await self.emitEvent('control', {
                            'event': 'await_for_analyze_result',
                        })
                        resp = self.llmSession.chat([{
                            'mime_type': 'audio/mp3',
                            'data': answer
                        }, data.config.PROMPT_FOR_ANALYZE_THE_ORAL_ENGLISH_EXAM_RESULT])
                        self.latestQuestion = resp
                        # parse feedback
                        feedback = resp[resp.rfind('[feedback]')+10:resp.rfind('[/feedback]')]
                        self.llmStateInfo['Feedback'] = feedback
                        await self.emitEvent('control', {
                            'event': 'feedback',
                            'data': feedback
                        })
                        self.terminateSession()
                        self.llmState = SpeakingExaminationLLMState.DISCONNECTED
                    else:
                        # start next round
                        resp = self.llmSession.chat([{
                            'mime_type': 'audio/mp3',
                            'data': answer
                        }])
                        self.latestQuestion = resp
                        self.llmStateInfo['PartIII_Discussion_Questions'].append(
                            resp
                        )
                        self.ttsManager.put(resp)
                        await self.emitEvent('control', {
                            'event': 'next_state',
                            'data': 'PartIII_Discussion'
                        })
        
            
    def calculateDecibel(self, audio_frame: av.AudioFrame) -> float:
        """计算音频帧的分贝值"""
        # 将音频帧转换为 numpy 数组（假设为 16-bit 有符号整数格式）
        samples = numpy.frombuffer(audio_frame.to_ndarray().tobytes(), dtype=numpy.int16)
        
        # 转换为浮点数（范围：-1.0 ~ 1.0）
        samples_float = samples.astype(numpy.float32) / 32768.0
        
        # 计算 RMS（均方根）
        rms = numpy.sqrt(numpy.mean(numpy.square(samples_float)))
        
        # 转换为分贝（避免除以零）
        db = 20 * numpy.log10(max(1e-5, rms))
        return db
            
                        
    async def processUserInput(self, stream: livekit.rtc.AudioStream, mimeType: str) -> None:
        frames = 0
        last_sec = time.time()
        last_sec_frames = 0
        limit_to_send = 100
        data_chunk = b''
        self.data_buffer_for_conv = b''

        async for frame in stream:
            if not self.connected:
                break
            if self.llmState == SpeakingExaminationLLMState.AWAITING_CONNECTION:
                self.llmState = SpeakingExaminationLLMState.PARTI_INITIATION
            last_sec_frames += 1
            frames += 1
            avFrame = av.AudioFrame.from_ndarray(numpy.frombuffer(frame.frame.remix_and_resample(16000, 1).data, dtype=numpy.int16).reshape(frame.frame.num_channels, -1), layout='mono', format='s16')
            data_chunk += avFrame.to_ndarray().tobytes()
            if frames % 25 == 0:
                # emit audio level per 0.25 seconds
                await self.emitEvent('audio_level', self.calculateDecibel(avFrame))
            if frames % limit_to_send == 0:
                if SpeakingExaminationLLMState.isConversationState(self.llmState) or self.llmState == SpeakingExaminationLLMState.PARTII_STUDENT_STATEMENT:
                    self.data_buffer_for_conv += data_chunk
                    
                if self.userManualInterruption:
                    self.userAnswers.put(self.data_buffer_for_conv)
                    self.data_buffer_for_conv = b''
                    self.userManualInterruption = False
                
                data_chunk = b''
                    
            if time.time() - last_sec > 1:
                last_sec = time.time()
                logger.Logger.log(f"forwardAudioStream: last second: {last_sec_frames} frames, num_channels: {frame.frame.num_channels}, sample_rate: {frame.frame.sample_rate}, limit_to_send: {limit_to_send}")
                last_sec_frames = 0

    
    def onExit(self, func: typing.Callable[[dict[str, typing.Any]], None]):
        """
        Binding a callback function to the exit event.
        When the chat session is terminated, the callback function will be called.

        Args:
            func (typing.Callable[[], None]): A callable, which will be called when the chat session is terminated. With a dictionary as the argument, which contains the following keys:
                - `PartI_Conversation_Questions`: A list of conversation questions for the first part of the exam.
                - `PartI_Conversation_Answers`: A list of conversation answers for the first part of the exam.
                - `PartI_Conversation_Round_Counter`: The number of rounds of conversation for the first part of the exam.
                - `PartII_Task_Card`: The task card for the second part of the exam.
                - `PartII_Begin_Word`: The begin word for the second part of the exam.
                - `PartII_Student_Statement_Answer`: The student statement answer for the second part of the exam.
                - `PartII_Follow_Up_Questions`: A list of follow-up questions for the second part of the exam.
                - `PartII_Follow_Up_Answers`: A list of follow-up answers for the second part of the exam.
                - `PartII_Follow_Up_Round_Counter`: The number of rounds of follow-up questions for the second part of the exam.
                - `PartIII_Discussion_Questions`: A list of discussion questions for the third part of the exam.
                - `PartIII_Discussion_Answers`: A list of discussion answers for the third part of the exam.
                - `PartIII_Discussion_Round_Counter`: The number of rounds of discussion for the third part of the exam.
                - `Feedback`: The feedback for the exam.
        """
        self.exitCallback = func



class _ExamSessionManager:
    def __init__(self):
        self.session_pool = {}
        self.deamon: threading.Thread = threading.Thread(target=self.deamonThreadWrapper)
        self.deamon.start()
        pass
    
    
    def finalizeReadingExamSession(self, sessionId: str) -> bool:
        # remove the session from the pool
        if sessionId in self.session_pool:
            # update the exam session status in the database
            examSession = self.session_pool[sessionId]
            res = dataProvider.DataProvider.submitReadingExamResult(
                userId=examSession['userId'],
                examId=examSession['examId'],
                completeTime=int(time.time()),
                answerSheet=examSession['answers'],
            )
            dataProvider.DataProvider.increaseOverallAssessmentTrigger(userId=examSession['userId'])
            del self.session_pool[sessionId]
            return res
    
    
    def finalizeWritingExamSession(self, sessionId: str) -> bool:
        # remove the session from the pool
        if sessionId in self.session_pool:
            # update the exam session status in the database
            examSession = self.session_pool[sessionId]
            res = dataProvider.DataProvider.submitWritingExamResult(
                userId=examSession['userId'],
                examId=examSession['examId'],
                completeTime=int(time.time()),
                composition=examSession['answer']
            )
            dataProvider.DataProvider.increaseOverallAssessmentTrigger(userId=examSession['userId'])
            del self.session_pool[sessionId]
            return res
        
        
    def finalizeOralExamSession(self, sessionId: str) -> bool:
        # remove the session from the pool
        if sessionId in self.session_pool:
            # update the exam session status in the database
            examSession = self.session_pool[sessionId]
            res = dataProvider.DataProvider.submitOralExamResult(
                userId=examSession['userId'],
                examId=examSession['examId'],
                completeTime=int(time.time()),
                answerDetails=examSession['answerDetails']
            )
            dataProvider.DataProvider.increaseOverallAssessmentTrigger(userId=examSession['userId'])
            del self.session_pool[sessionId]
            return res
    
    
    def deamonThreadWrapper(self):
        logger.Logger.log('ExamSessionManager deamon thread started')
        while True:
            # check for expired sessions
            for examSessionId, examSession in self.session_pool.items():
                if examSession.get('endTime') is not None and examSession['endTime'] < int(time.time()):
                    logger.Logger.log(f'ExamSession {examSessionId} expired, finalizing')
                    if examSession['type'] == 'writing':
                        self.finalizeWritingExamSession(examSessionId)
                    elif examSession['type'] =='reading':
                        self.finalizeReadingExamSession(examSessionId)
            time.sleep(60)
    
    def createReadingExamSession(self, examId: int, userId: int) -> str:
        # create a new exam session
        sessionId: str = tools.RandomHashProvider()
        # get exam information
        exam = dataProvider.DataProvider.getReadingExamById(examId)
        if exam['status']:
            exam = exam['data']
        else:
            return None
        
        examSession = {
            'type': 'reading',
            'examId': examId,
            'userId': userId,
            'duration': exam['duration'] * 60,
            'startTime': int(time.time()),
            'endTime': int(time.time()) + exam['duration'] * 60,
            'answers': []
        }
        self.session_pool[sessionId] = examSession
        return sessionId
    
    def updateReadingExamSessionAnswer(self, exameSessionId: str, answers: list[str]) -> bool:
        # update the answer of the exam session
        if exameSessionId in self.session_pool:
            examSession = self.session_pool[exameSessionId]
            examSession['answers'] = answers
            return True
        return False
    
    def createWritingExamSession(self, examId: int, userId: int) -> str:
        # create a new exam session
        sessionId: str = tools.RandomHashProvider()
        # get exam information
        exam = dataProvider.DataProvider.getWritingExamById(examId)
        if exam['status']:
            exam = exam['data']
        else:
            return None
        
        examSession = {
            'type': 'writing',
            'examId': examId,
            'userId': userId,
            'duration': exam['duration'] * 60,
            'startTime': int(time.time()),
            'endTime': int(time.time()) + exam['duration'] * 60,
            'answer': ''
        }
        self.session_pool[sessionId] = examSession
        return sessionId
    
    
    def createOralExamSession(self, examId: int, userId: int) -> str:
        # create a new exam session
        sessionId: str = tools.RandomHashProvider()
        # get exam information
        exam = dataProvider.DataProvider.getOralExamById(examId)
        if exam['status']:
            exam = exam['data']
        else:
            return None
        
        examSession = {
            'type': 'oral',
            'examId': examId,
            'userId': userId,
            'startTime': int(time.time()),
            'answerDetails': {
                'PartI_Conversation_Questions': [],
                'PartI_Conversation_Answers': [],
                'PartI_Conversation_Round_Counter': 0,
                'PartII_Task_Card': '',
                'PartII_Begin_Word': '',
                'PartII_Student_Statement_Answer': b'',
                'PartII_Follow_Up_Questions': [],
                'PartII_Follow_Up_Answers': [],
                'PartII_Follow_Up_Round_Counter': 0,
                'PartIII_Discussion_Questions': [],
                'PartIII_Discussion_Answers': [],
                'PartIII_Discussion_Round_Counter': 0,
                'Feedback': ''
            },
            'examPaper': exam,
            'livekitSession': None,
            'userToken': livekit.api.AccessToken(
                data.config.LIVEKIT_API_KEY, data.config.LIVEKIT_API_SECRET).with_identity(
                'user').with_name('yoi-english-user').with_grants(livekit.api.VideoGrants(room_join=True, room=sessionId)).to_jwt(),
            'botToken': livekit.api.AccessToken(
                data.config.LIVEKIT_API_KEY, data.config.LIVEKIT_API_SECRET).with_identity(
                'model').with_name('yoi-english-examiner').with_grants(livekit.api.VideoGrants(room_join=True, room=sessionId)).to_jwt(),
            'sessionBackend': SpeakingExaminationSessionBackend(userId, exam['warmUpTopics'], exam['mainTopic'])
        }


        def onExitEvent(llmStateInfo: dict[str, typing.Any]):
            # upload all the bytes data to database as artifacts
            if 'PartI_Conversation_Answers' in llmStateInfo:
                for idx, i in enumerate(llmStateInfo['PartI_Conversation_Answers']):
                    llmStateInfo['PartI_Conversation_Answers'][idx] = dataProvider.DataProvider.createArtifact(userId, True, 'audio/mp3', i)['data']['id']
            if 'PartII_Student_Statement_Answer' in llmStateInfo and llmStateInfo['PartII_Student_Statement_Answer']:
                llmStateInfo['PartII_Student_Statement_Answer'] = dataProvider.DataProvider.createArtifact(userId, True, 'audio/mp3', llmStateInfo['PartII_Student_Statement_Answer'])['data']['id']
            if 'PartII_Follow_Up_Answers' in llmStateInfo:
                for idx, i in enumerate(llmStateInfo['PartII_Follow_Up_Answers']):
                    llmStateInfo['PartII_Follow_Up_Answers'][idx] = dataProvider.DataProvider.createArtifact(userId, True, 'audio/mp3', i)['data']['id']
            if 'PartIII_Discussion_Answers' in llmStateInfo:
                for idx, i in enumerate(llmStateInfo['PartIII_Discussion_Answers']):
                    llmStateInfo['PartIII_Discussion_Answers'][idx] = dataProvider.DataProvider.createArtifact(userId, True, 'audio/mp3', i)['data']['id']
            
            # call judger to handle the result
            pron_eval_result = examJudger.Judger.evaluate_exam_result(llmStateInfo)
            llmStateInfo['Pronunciation_Evaluation_Result'] = pron_eval_result
            self.session_pool[sessionId]['answerDetails'] = llmStateInfo
            # call finalize function
            self.finalizeOralExamSession(sessionId)

        examSession['sessionBackend'].onExit(onExitEvent)


        # generate livekit session
        async def create_room():
            await (await getLiveKitAPI()).room.create_room(
                create=livekit.api.CreateRoomRequest(
                    name=sessionId,
                    empty_timeout=10*60,
                    max_participants=2
                )
            )
            
        asyncio.new_event_loop().run_until_complete(create_room())
        
        # create a new event loop and run for the backend
        def th():
            newloop = asyncio.new_event_loop()
            asyncio.set_event_loop(newloop)
            session: SpeakingExaminationSessionBackend = examSession['sessionBackend']
            asyncio.ensure_future(session.start(botToken=examSession['botToken'], loop=newloop))
            try:
                newloop.run_forever()
            finally:
                logger.Logger.log('Oral examination session backend loop closed')
                newloop.close()
        
        threading.Thread(target=th).start()
        self.session_pool[sessionId] = examSession
        return sessionId
    
    
    def updateWritingExamSessionAnswer(self, exameSessionId: str, answer: str) -> bool:
        # update the answer of the exam session
        if exameSessionId in self.session_pool:
            examSession = self.session_pool[exameSessionId]
            examSession['answer'] = answer
            return True
        return False
    
    
    def getSessionDetails(self, sessionId: str, hideAnswer: bool = False) -> dict[str | typing.Any]:
        # get the details of the exam session
        if sessionId in self.session_pool:
            examSession = self.session_pool[sessionId]
            # no result checking, cuz you've already know the exam paper won't disappear, unless the admin is an idiot
            if examSession['type'] == 'writing':
                examSession['examPaper'] = dataProvider.DataProvider.getWritingExamById(examSession['examId'])['data']
                examSession['sessionId'] = sessionId
                if hideAnswer:
                    if 'onePossibleVersion' in examSession['examPaper']:
                        del examSession['examPaper']['onePossibleVersion']
                examSession['username'] = dataProvider.DataProvider.getUserInfoByID(examSession['userId'])['username']
                return examSession
            elif examSession['type'] =='reading':
                examSession['examPaper'] = dataProvider.DataProvider.getReadingExamById(examSession['examId'])['data']
                examSession['sessionId'] = sessionId
                if hideAnswer:
                    for i in examSession['examPaper']['answerSheetFormat']:
                        if 'answer' in i:
                            del i['answer']
                examSession['username'] = dataProvider.DataProvider.getUserInfoByID(examSession['userId'])['username']
                return examSession
            elif examSession['type'] == 'oral':
                # delete all bytes data
                print(examSession)
                examSession['answerDetails'] = json.loads(json.dumps(examSession['answerDetails'], default=lambda x: None))
                # do not use delete
                # del examSession['livekitSession']
                # del examSession['sessionBackend']
                examSession['sessionId'] = sessionId
                examSession['username'] = dataProvider.DataProvider.getUserInfoByID(examSession['userId'])['username']
                return {
                    'examId': examSession['examId'],
                    'userId': examSession['userId'],
                    'username': examSession['username'],
                    'type': examSession['type'],
                    'startTime': examSession['startTime'],
                    'answerDetails': examSession['answerDetails'],
                    'livekitEndpoint': data.config.LIVEKIT_API_EXTERNAL_URL,
                    'userToken': examSession['userToken'],
                    'botToken': examSession['botToken'],
                    'sessionId': examSession['sessionId'],
                    'examPaper': examSession['examPaper'],
                }
            else:
                return None # yet to be implemented
        return None
    
    
    def getOngoingSessionOfUser(self, userId: int) -> dict[str | typing.Any]:
        # get the details of the ongoing exam session of the user
        for examSessionId, examSession in self.session_pool.items():
            
            if examSession['userId'] == userId and (examSession['type'] == 'oral' or examSession['endTime'] > int(time.time())):
                return self.getSessionDetails(examSessionId)
        return None
    
    
    def getExaminationSessionList(self) -> dict[str | typing.Any]:
        # get the list of all examination sessions
        sessions = [self.getSessionDetails(sessionId) for sessionId in self.session_pool]
        return sessions

ExamSessionManager = _ExamSessionManager()