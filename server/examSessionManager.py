import os
import json
import time
import dataProvider
import threading
import tools

class ExamSessionManager:
    def __init__(self, dataProvider: 'dataProvider._DataProvider'):
        self.DataProvider = dataProvider
        self.session_pool = {}
        self.deamon = threading.Thread(target=self.deamonThreadWrapper)
        pass
    
    def deamonThreadWrapper(self):
        while True:
            # check for expired sessions
            for examSessionId, examSession in self.session_pool.items():
                if examSession['endTime'] < int(time.time()):
                    # remove the session from the pool
                    del self.session_pool[examSessionId]
                    # update the exam session status in the database
                    self.
            time.sleep(60)
    
    def createReadingExamSession(self, examId: int, userId: int, duration: int) -> int:
        # create a new exam session
        sessionId: str = tools.RandomHashProvider()
        examSession = {
            'examId': examId,
            'userId': userId,
            'duration': duration,
            'startTime': int(time.time()),
            'endTime': int(time.time()) + duration,
            'answers': []
        }
        self.session_pool[sessionId] = examSession
        return sessionId
    
    def updateReadingExamSessionAnswer(self, exameSessionId: str, answer: str) -> bool:
        # update the answer of the exam session
        if exameSessionId in self.session_pool:
            examSession = self.session_pool[exameSessionId]
            examSession['answers'].append(answer)
            return True
        return False
    
    
    