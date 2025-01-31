import os
import json
import queue
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
    DISCONNECTED = -2
    PARTI_INITIATION = -1
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
        self.llmSession: chatModel.ChatGoogleGenerativeAI = chatModel.ChatGoogleGenerativeAI('gemini-2.0-flash-exp', 0.7, system_prompt=chatModel.PromptForOralEnglishExamInitiation(), tools=[])
        self.userManualInterruption = False
        self.userAnswers: queue.Queue[bytes] = queue.Queue()
        self.data_buffer_for_conv = b''
        

        
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

        @self.chatRoom.on("userManualInterruption")
        def on_user_manual_interruption():
            logger.Logger.log("user manual interruption")
            self.userManualInterruption = True

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
        
        asyncio.ensure_future(self.chat())
        self.llmState = SpeakingExaminationLLMState.PARTI_INITIATION
        
    
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



    async def chat(self):
        while True:
            match self.llmState:
                case SpeakingExaminationLLMState.DISCONNECTED:
                    logger.Logger.log('LLM state: DISCONNECTED')
                    break
                case SpeakingExaminationLLMState.PARTI_INITIATION:
                    resp = self.llmSession.initiate([chatModel.Prompt(data.config.PROMPT_FOR_THE_FIRST_PART_OF_ORAL_ENGLISH_EXAM, {
                        'specific_topics': self.warmUpTopics
                    })])
                    self.llmStateInfo['PartI_Conversation_Questions'].append(
                        resp
                    )
                    self.chatRoom.emit('tts', resp)
                    self.chatRoom.emit('control', {
                        'event': 'next_state',
                        'data': 'PartI_Conversation'
                    })
                    self.llmState = SpeakingExaminationLLMState.PARTI_CONVERSATION
                case SpeakingExaminationLLMState.PARTI_CONVERSATION:
                    while self.userAnswers.empty():
                        await asyncio.sleep(0.1)
                        
                    self.llmStateInfo['PartI_Conversation_Round_Counter'] += 1
                    user_answer = self.userAnswers.get()
                    # add to answer
                    self.llmStateInfo['PartI_Conversation_Answers'].append(
                        user_answer
                    )
                    # send to AI
                    resp = self.llmSession.chat([{
                        'mime_type': 'audio/pcm',
                        'data': user_answer
                    }])
                    self.chatRoom.emit('tts', resp)
                    if self.llmStateInfo['PartI_Conversation_Round_Counter'] == 2:
                        self.chatRoom.emit('control', {
                            'event': 'next_state',
                            'data': 'PartII_Await_Task_Card'
                        })
                        self.llmState = SpeakingExaminationLLMState.PARTII_STUDENT_PREPARATION
                        resp = self.llmSession.initiate([chatModel.Prompt(data.config.PROMPT_FOR_THE_SECOND_PART_OF_ORAL_ENGLISH_EXAM_1, {
                            'specific_topic': self.specificTopic
                        })])
                        
                        # parse task card
                        task_card = resp[resp.rfind('[task_card]')+12:resp.rfind('[/task_card]')]
                        self.llmStateInfo['PartII_Task_Card'] = task_card
                        # parse begin word
                        begin_word = resp[resp.rfind('[begin_word]')+13:resp.rfind('[/begin_word]')]
                        self.llmStateInfo['PartII_Begin_Word'] = begin_word
                        # emit tts
                        self.chatRoom.emit('tts', begin_word)
                        # emit task card
                        self.chatRoom.emit('control', {
                            'event': 'next_state',
                            'data': 'PartII_Preparation',
                            'task_card': task_card
                        })
                    else:
                        self.chatRoom.emit('control', {
                            'event': 'resume_recording',
                            'data': 'PartI_Conversation'
                        })
                case SpeakingExaminationLLMState.PARTII_STUDENT_PREPARATION:
                    # wait for student to prepare
                    current_time = time.time()
                    while self.userAnswers.empty() and current_time + 60 > time.time():
                        await asyncio.sleep(0.1)
                        
                    # drop answers
                    if not self.userAnswers.empty():
                        self.userAnswers.get()
                        
                    # start student statement
                    self.chatRoom.emit('control', {
                        'event': 'next_state',
                        'data': 'PartII_Student_Statement'
                    })
                    self.llmState = SpeakingExaminationLLMState.PARTII_STUDENT_STATEMENT
                case SpeakingExaminationLLMState.PARTII_STUDENT_STATEMENT:
                    # wait for student statement
                    current_time = time.time()
                    while self.userAnswers.empty() and current_time + 120 > time.time():
                        await asyncio.sleep(0.1)
                        
                    # get answers
                    if self.userAnswers.empty():
                        self.llmState['PartII_Student_Statement_Answer'] = b''
                    else:
                        self.llmState['PartII_Student_Statement_Answer'] = self.userAnswers.get()
                        
                    resp = self.llmSession.chat([{
                        'mime_type': 'audio/pcm',
                        'data': self.llmState['PartII_Student_Statement_Answer']
                    }])
                    self.llmStateInfo['PartII_Follow_Up_Questions'].append(
                        resp
                    )
                    self.chatRoom.emit('tts', resp)
                    self.chatRoom.emit('control', {
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
                    answer = self.userAnswers.get()
                    # add to answer
                    self.llmStateInfo['PartII_Follow_Up_Answers'].append(
                        answer
                    )
                    # if all rounds are done, start discussing
                    if self.llmStateInfo['PartII_Follow_Up_Round_Counter'] == 3:
                        self.chatRoom.emit('control', {
                            'event': 'next_state',
                            'data': 'PartIII_Discussion'
                        })
                        resp = self.llmSession.chat([
                            {
                                'mime_type': 'audio/pcm',
                                'data': answer,
                            },
                            data.config.PROMPT_FOR_THE_THIRD_PART_OF_ORAL_ENGLISH_EXAM,
                        ])
                        self.llmStateInfo['PartIII_Discussion_Questions'].append(
                            resp
                        )
                        self.chatRoom.emit('tts', resp)
                        self.llmState = SpeakingExaminationLLMState.PARTIII_DISCUSSING
                        self.llmStateInfo['PartIII_Discussion_Round_Counter'] = 0
                    else:
                        self.chatRoom.emit('control', {
                            'event': 'resume_recording',
                            'data': 'PartII_Follow_Up_Questioning'
                        })
                        resp = self.llmSession.chat([{
                            'mime_type': 'audio/pcm',
                            'data': answer
                        }])
                        # send to AI
                        self.chatRoom.emit('tts', resp)
                        self.llmStateInfo['PartII_Follow_Up_Questions'].append(
                            resp
                        )
                case SpeakingExaminationLLMState.PARTIII_DISCUSSING:
                    # wait for user answer
                    answer = b''
                    while self.userAnswers.empty():
                        await asyncio.sleep(0.1)
                     
                    # increase the counter
                    self.llmStateInfo['PartIII_Discussion_Round_Counter'] += 1
                    # get answer
                    answer = self.userAnswers.get()
                    # add to answer
                    self.llmStateInfo['PartIII_Discussion_Answers'].append(
                        answer
                    )
                    if self.llmStateInfo['PartIII_Discussion_Round_Counter'] == 3:
                        # end of discussion
                        self.chatRoom.emit('control', {
                            'event': 'await_for_analyze_result',
                        })
                        resp = self.llmSession.chat([{
                            'mime_type': 'audio/pcm',
                            'data': answer
                        }, data.config.PROMPT_FOR_ANALYZE_THE_ORAL_ENGLISH_EXAM_RESULT])
                        # parse feedback
                        feedback = resp[resp.rfind('[feedback]')+10:resp.rfind('[/feedback]')]
                        self.llmStateInfo['Feedback'] = feedback
                        self.chatRoom.emit('control', {
                            'event': 'feedback',
                            'data': feedback
                        })
                        # emit tts
                        self.terminateSession()
                        self.llmState = SpeakingExaminationLLMState.DISCONNECTED
                    else:
                        # start next round
                        self.chatRoom.emit('control', {
                            'event': 'next_state',
                            'data': 'PartIII_Discussion'
                        })
                        resp = self.llmSession.chat([{
                            'mime_type': 'audio/pcm',
                            'data': answer
                        }])
                        self.llmStateInfo['PartIII_Discussion_Questions'].append(
                            resp
                        )
                        self.chatRoom.emit('tts', resp)
        
            
            
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
                - `PartII_Preparation_Questions`: A list of preparation questions for the second part of the exam.
                - `PartII_Preparation_Answers`: A list of preparation answers for the second part of the exam.
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
    
    
    def createOralExamSession(self, examId: int, userId: int) -> str:
        ...
    
    
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