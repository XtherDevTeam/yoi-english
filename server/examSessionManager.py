import os
import json
import time
import dataProvider
import threading
import tools
import typing
import logger


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
    
    
    def getSessionDetails(self, sessionId: str) -> dict[str | typing.Any]:
        # get the details of the exam session
        if sessionId in self.session_pool:
            examSession = self.session_pool[sessionId]
            # no result checking, cuz you've already know the exam paper won't disappear, unless the admin is an idiot
            if examSession['type'] == 'writing':
                examSession['examPaper'] = dataProvider.DataProvider.getWritingExamById(examSession['examId'])['data']
                examSession['sessionId'] = sessionId
                return examSession
            elif examSession['type'] =='reading':
                examSession['examPaper'] = dataProvider.DataProvider.getReadingExamById(examSession['examId'])['data']
                examSession['sessionId'] = sessionId
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

ExamSessionManager = _ExamSessionManager()