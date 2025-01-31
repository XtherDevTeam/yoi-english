import os
import json
import time
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


class SpeakingExaminationLLMState():
    DISCONNECTED = -1
    PARTI_CONVERSATION = 0
    PartII_AWAIT_TASK_CARD = 1
    PARTII_STUDENT_PREPARATION = 2
    PARTII_STUDENT_STATEMENT = 3
    PARTII_FOLLOW_UP_QUESTIONING = 4
    PARTIII_DISCUSSING = 5
    
    def isConversationState(state: int) -> bool:
        return state in [
            SpeakingExaminationLLMState.PARTI_CONVERSATION,
            SpeakingExaminationLLMState.PARTII_FOLLOW_UP_QUESTIONING,
            SpeakingExaminationLLMState.PARTIII_DISCUSSING
        ]


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
        self.llmStateInfo: dict[str, typing.Any] = {
            'PartI_Conversation_Round_Counter': 0
        }
        self.warmUpTopics = warmUpTopics
        self.specificTopic = specificTopic
        self.broadcastVideoTrack: livekit.rtc.LocalVideoTrack = None
        self.videoBroadcastingThread: threading.Thread = None
        self.loggerCallbackId: int = None
        self.exitCallback: typing.Callable = None
        self.llmPreSession = None

        
    async def start(self, botToken: str, loop: asyncio.AbstractEventLoop): 
        logger.Logger.log('Preparing to start chat...')
        self.loop = loop
        self.chatRoom = livekit.rtc.Room(loop)
        self.connected = True
        self.loggerCallbackId = logger.Logger.registerCallback(lambda s: self.connectionLogs.append(s))
        logger.Logger.log('Connecting to LiveKit server...')
        
        if os.getenv("ALL_PROXY") is not None:
            logger.Logger.log("ALL_PROXY environment variable detected, patching google.genai.live.connect")
            proxy = websockets_proxy.Proxy.from_url(os.getenv("ALL_PROXY"))
            def fake_connect(*args, **kwargs):
                return websockets_proxy.proxy_connect(*args, proxy=proxy, **kwargs)
            google.genai.live.connect = fake_connect

        client = google.genai.Client(http_options={'api_version': 'v1alpha'})
        model_id = "gemini-2.0-flash-exp"
        config = {
            "response_modalities": ["TEXT"], 
            "system_instruction": chatModel.PromptForOralEnglishExamInitiation(),
            "temperature": 0.7
        }
        # patch for proxy
        if os.getenv("ALL_PROXY") is not None:
            logger.Logger.log("ALL_PROXY environment variable detected, patching google.genai.live.connect")
            proxy = websockets_proxy.Proxy.from_url(os.getenv("ALL_PROXY"))
            def fake_connect(*args, **kwargs):
                return websockets_proxy.proxy_connect(*args, proxy=proxy, **kwargs)
            google.genai.live.connect = fake_connect

        self.llmPreSession = client.aio.live.connect(model=model_id, config=config)
        self.llmSession: google.genai.live.AsyncSession = await self.llmPreSession.__aenter__() # to simulate async context manager
        asyncio.ensure_future(self.chatRealtime())

        @self.chatRoom.on("track_subscribed")
        def on_track_subscribed(track: livekit.rtc.Track, publication: livekit.rtc.RemoteTrackPublication, participant: livekit.rtc.RemoteParticipant):
            logger.Logger.log(f"track subscribed: {publication.sid}")
            if track.kind == livekit.rtc.TrackKind.KIND_AUDIO:
                logger.Logger.log('running user input loop...')
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
            self.terminateSession()

        @self.chatRoom.on("connected")
        def on_connected() -> None:
            logger.Logger.log("connected")

        logger.Logger.log('connecting to room...')
        await self.chatRoom.connect(
            f"wss://{data.config.LIVEKIT_API_EXTERNAL_URL}", botToken)

        videoSource = livekit.rtc.VideoSource(
            data.config.LIVEKIT_VIDEO_WIDTH, data.config.LIVEKIT_VIDEO_HEIGHT)
        self.broadcastVideoTrack = livekit.rtc.LocalVideoTrack.create_video_track(
            "video_track", videoSource)

        publication_video = await self.chatRoom.local_participant.publish_track(
            self.broadcastVideoTrack, livekit.rtc.TrackPublishOptions(source=livekit.rtc.TrackSource.SOURCE_CAMERA, red=False))
        logger.Logger.log(f"broadcast video track published: {
            publication_video.track.name}")

        self.videoBroadcastingThread = threading.Thread(
            target=self.runVideoBroadcastingLoop, args=(videoSource,))
        self.videoBroadcastingThread.start()

        logger.Logger.log('chat session started')
        logger.Logger.log('Sending the first system prompt...')
        
        self.llmState = SpeakingExaminationLLMState.PARTI_CONVERSATION
        self.llmSession.send(input=chatModel.Prompt(
            data.config.PROMPT_FOR_THE_FIRST_PART_OF_ORAL_ENGLISH_EXAM,
            {
                'specific_topics': ', '.join(self.warmUpTopics)
            }
        ))
    
    def terminateSession(self) -> None:
        """
        Terminate the chat session.

        FIXME: it will only be triggered when other events received first. strange
        """
        # self.bot.terminateChat()
        self.connected = False
        logger.Logger.log('Triggering terminate session callback')
        if self.exitCallback is not None:
            self.exitCallback()

        async def f():
            logger.Logger.log('terminating chat session...')
            logger.Logger.unregisterCallback(self.loggerCallbackId)
            await self.chatRoom.disconnect()

        asyncio.ensure_future(f())

    


    def drawLogs(self) -> numpy.ndarray:
        img = PIL.Image.new('RGBA', (data.config.LIVEKIT_VIDEO_WIDTH, data.config.LIVEKIT_VIDEO_HEIGHT), color='black')
        draw = PIL.ImageDraw.Draw(img)
        try:
            font = PIL.ImageFont.truetype(
                'consolas.ttf', size=20)
        except IOError:
            font = PIL.ImageFont.load_default(size=20)
        for i, log in enumerate(self.connectionLogs[-48:]):
            draw.text((10, 10 + i * 20), log, font=font, fill=(255, 255, 255))
            
        if len(self.connectionLogs) > 48:
           del self.connectionLogs[:48]
        # export ndarray for image
        img_np = numpy.array(img)
        # logger.Logger.log(img_np.shape)
        return img_np


    def terminateSession(self):
        self.connected = False


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
            img_np = self.drawLogs()
            # logger.Logger.log(img_np.shape, len(img_np.tobytes()))
            livekitFrame = livekit.rtc.VideoFrame(
                data=img_np.astype(numpy.uint8),
                width=data.config.LIVEKIT_VIDEO_WIDTH,
                height=data.config.LIVEKIT_VIDEO_HEIGHT,
                type=livekit.rtc.VideoBufferType.BGRA
            )
            source.capture_frame(livekitFrame)
            await asyncio.sleep(1/30)
        
        logger.Logger.log('broadcasting video stopped')



    async def chatRealtime(self):
        # 预计是要做成状态机那种模式
        buffer = ''
        while True:
            async for response in self.llmSession.receive():
                # recv a turn of chat
                if response.text is not None:
                    buffer += response.text
            
            if not self.connected:
                logger.Logger.log('Session terminated, stopping chatRealtime loop')
                await self.llmPreSession.__aexit__(None, None, None) # memory stored, close the session safely
                break
            
            logger.Logger.log(f'Received chat message: {buffer}')
            match self.llmState:
                case SpeakingExaminationLLMState.DISCONNECTED:
                    logger.Logger.log('LLM state: DISCONNECTED')
                    pass
                case SpeakingExaminationLLMState.PARTI_CONVERSATION:
                    self.llmStateInfo['PartI_Conversation_Round_Counter'] += 1
                    self.llmStateInfo['PartI_Conversation_Answers'].append(
                        self.data_buffer_for_conv
                    )
                    if self.llmStateInfo['PartI_Conversation_Round_Counter'] == 2:
                        # send last turn signal
                        self.llmSession.send(input='[system_prompt]Last turn[/system_prompt]')
                        # wait for the user to finish the last turn
                    if self.llmStateInfo['PartI_Conversation_Round_Counter'] == 3:
                        if not '[last_turn_ends][/last_turn_ends]' in buffer.strip():
                            # wrong signal, warning
                            logger.Logger.log('Wrong signal for last turn, ignoring and continue conversation')
                        
                        # finalize this round of conversation.
                        self.llmState = SpeakingExaminationLLMState.PartII_AWAIT_TASK_CARD
                        self.llmStateInfo['PartI_Conversation_Questions'] = []
                        self.llmStateInfo['PartI_Conversation_Answers'] = []
                        self.llmStateInfo['PartI_Conversation_Round_Counter'] = 0
                        self.llmSession.send(input=chatModel.Prompt(
                            data.config.PROMPT_FOR_THE_SECOND_PART_OF_ORAL_ENGLISH_EXAM_1,
                            {
                                'specific_topics': self.specificTopic
                            }
                        ))
                        continue
                    
                    # anyway, collect the questions here
                    self.llmStateInfo['PartI_Conversation_Questions'].append(
                        buffer.strip()
                    )
                    # send to client for TTS through livekit
                    self.chatRoom.emit('tts', buffer.strip())
                case SpeakingExaminationLLMState.PartII_AWAIT_TASK_CARD:
                    # now we process the task card and send off the begin words
                    task_card = buffer[buffer.rfind('[task_card]') + 12:buffer.rfind('[/task_card]')].strip()
                    begin_word = buffer[buffer.rfind('[begin_word]') + 13:buffer.rfind('[/begin_word]')].strip()
                    self.llmStateInfo['PartII_Task_Card'] = task_card
                    self.chatRoom.emit('control', {
                        'type': 'task_card_send_off',
                        'content': task_card
                    })
                    self.chatRoom.emit('tts', begin_word)
                    self.llmState = SpeakingExaminationLLMState.PARTII_STUDENT_PREPARATION
                    self.chatRoom.emit('control', {
                        'type': 'preparation_timer_start'
                    })
                    self.llmStateInfo['userManualInterruption'] = False
                    seconds = 0
                    while not self.llmStateInfo['userManualInterruption'] and seconds <= 60:
                        await asyncio.sleep(1)
                    self.llmStateInfo['userManualInterruption'] = False
                    self.chatRoom.emit('control', {
                        'type': 'statement_timer_start'
                    })
                    await asyncio.sleep(60)
                    self.llmSession.send(input=data.config.PROMPT_FOR_THE_SECOND_PART_OF_ORAL_ENGLISH_EXAM_2)
                    self.llmState = SpeakingExaminationLLMState.PARTII_STUDENT_STATEMENT
                    self.llmStateInfo['userManualInterruption'] = False
                    seconds = 0
                    while not self.llmStateInfo['userManualInterruption'] and seconds <= 120:
                        await asyncio.sleep(1)
                    self.llmStateInfo['userManualInterruption'] = False    
                    self.llmState = SpeakingExaminationLLMState.PARTII_FOLLOW_UP_QUESTIONING
                    self.chatRoom.emit('control', {
                        'type': 'follow_up_questioning'
                    })
                case SpeakingExaminationLLMState.PARTII_FOLLOW_UP_QUESTIONING:
                    # follow up questioning
                    # increase the counter
                    self.llmStateInfo['PartII_Follow_Up_Questioning_Round_Counter'] += 1
                    # send to client for TTS through livekit
                    self.chatRoom.emit('tts', buffer.strip())
                    # up for user input processor to enter the next state
                case SpeakingExaminationLLMState.PARTIII_DISCUSSING:
                    # discuss the answer
                    # counter increase
                    self.llmStateInfo['PartIII_Discussion_Round_Counter'] += 1
                    # send to client for TTS through livekit
                    self.chatRoom.emit('tts', buffer.strip())
                    # up for user input processor to enter the next state
    
            buffer = ''
            
            
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
            last_sec_frames += 1
            frames += 1
            avFrame = av.AudioFrame.from_ndarray(numpy.frombuffer(frame.frame.remix_and_resample(16000, 1).data, dtype=numpy.int16).reshape(frame.frame.num_channels, -1), layout='mono', format='s16')
            data_chunk += avFrame.to_ndarray().tobytes()
            if frames % limit_to_send == 0:
                if SpeakingExaminationLLMState.isConversationState(self.llmState) or self.llmState == SpeakingExaminationLLMState.PARTII_STUDENT_STATEMENT:
                    self.data_buffer_for_conv += data_chunk
                else:
                    self.data_buffer_for_conv = b''
                    
                await self.llmSesion.send({"data": data_chunk, "mime_type": "audio/pcm"})
                
                
                data_chunk = b''
                    
            if time.time() - last_sec > 1:
                last_sec = time.time()
                logger.Logger.log(f"forwardAudioStream: last second: {last_sec_frames} frames, num_channels: {frame.frame.num_channels}, sample_rate: {frame.frame.sample_rate}, limit_to_send: {limit_to_send}")
                last_sec_frames = 0

    
    def onExit(self, func: typing.Callable[[], None]):
        """
        Binding a callback function to the exit event.
        When the chat session is terminated, the callback function will be called.

        Args:
            func (typing.Callable[[], None]): A callable, which will be called when the chat session is terminated.
        """
        self.exitCallback = func
        
    def onUserAnswered(self, func: typing.Callable[[bytes], None]): 
        """
        Binding a callback function to the user answered event.

        Args:
            func (typing.Callable[[bytes], None]): A callable, which receives a 16-bit PCM audio data chunk representing the user's answer.
        """
        self.userAnsweredCallback = func

    def onNewQuestion(self, func: typing.Callable[[str], None]):
        """
        Binding a callback function to the new question event.
        When AI asks a new question, the callback function will be called with the question string.

        Args:
            func (typing.Callable[[str], None]): A callable, which receives a string representing the new question.
        """
        self.newQuestionCallback = func
        
    


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
    
    
    def deamonThreadWrapper(self):
        logger.Logger.log('ExamSessionManager deamon thread started')
        while True:
            # check for expired sessions
            for examSessionId, examSession in self.session_pool.items():
                if examSession['endTime'] < int(time.time()):
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
                    del examSession['examPaper']['onePossibleVersion']
                examSession['username'] = dataProvider.DataProvider.getUserInfoByID(examSession['userId'])['username']
                return examSession
            elif examSession['type'] =='reading':
                examSession['examPaper'] = dataProvider.DataProvider.getReadingExamById(examSession['examId'])['data']
                examSession['sessionId'] = sessionId
                if hideAnswer:
                    for i in examSession['examPaper']['answerSheetFormat']:
                        del i['answer']
                examSession['username'] = dataProvider.DataProvider.getUserInfoByID(examSession['userId'])['username']
                return examSession
            else:
                return None # yet to be implemented
        return None
    
    
    def getOngoingSessionOfUser(self, userId: int) -> dict[str | typing.Any]:
        # get the details of the ongoing exam session of the user
        for examSessionId, examSession in self.session_pool.items():
            if examSession['userId'] == userId and examSession['endTime'] > int(time.time()):
                return self.getSessionDetails(examSessionId)
        return None
    
    
    def getExaminationSessionList(self) -> dict[str | typing.Any]:
        # get the list of all examination sessions
        sessions = [self.getSessionDetails(sessionId) for sessionId in self.session_pool]
        return sessions

ExamSessionManager = _ExamSessionManager()