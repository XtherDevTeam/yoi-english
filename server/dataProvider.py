import data.config
from datetime import timedelta
import json
import sqlite3
import threading
import time
import typing
import logger
import hashlib
import pathlib
import tools
import chatModel

class DatabaseObject:
    """
    Class representing a database connection object.

    Args:
        dbPath (str): Path to the SQLite database file.

    Methods:
        query(query, args=(), one=False):
            Execute an SQL query on the database.
        runScript(query):
            Execute an SQL script on the database.
        close():
            Close the database connection.
    """

    def __init__(self, dbPath: str) -> None:
        self.db = sqlite3.connect(dbPath, check_same_thread=False)
        self.lock = threading.Lock()

    def query(self, query, args=(), one=False) -> list[dict[str | typing.Any]] | dict[str | typing.Any]:
        """
        Execute an SQL query on the database.

        Args:
            query (str): The SQL query to be executed.
            args (tuple, optional): Query parameters. Defaults to ().
            one (bool, optional): Return only one result. Defaults to False.

        Returns:
            list[dict[str | typing.Any]] | dict[str | typing.Any]: Query result.
        """

        with self.lock:
            cur = self.db.execute(query, args)
            rv = [dict((cur.description[idx][0], value)
                       for idx, value in enumerate(row)) for row in cur.fetchall()]
            lastrowid = cur.lastrowid
            cur.close()
            if query.startswith('insert'):
                return lastrowid
            else:
                return (rv[0] if rv else None) if one else rv

    def runScript(self, query: str):
        """
        Execute an SQL script on the database.

        Args:
            query (str): The SQL script to be executed.
        """
        self.db.executescript(query)
        self.db.commit()
        return None

    def close(self):
        """Close the database connection."""
        self.db.close()
        

class _DataProvider:
    def __init__(self, db_path: str = './blob/database.db'):
        self.db = DatabaseObject(db_path)
        if not self.checkIfInitialized():
            logger.Logger.log('Database not initialized')
        pass
    
    def checkIfInitialized(self):
        """
        Check if the database is initialized.

        Returns:
            bool: True if initialized, False otherwise.
        """
        try:
            return len(self.db.query("select 1 from config")) != 0
        except:
            logger.Logger.log('Running initialization script')
            with open(f'./data/init.sql', 'r') as file:
                self.db.runScript(file.read())
                self.db.db.commit()
                
    def addSalt(self, pwd: str) -> str:
        """
        Add salt to the password.

        Args:
            pwd (str): The password to be salted.

        Returns:
            str: The salted password.
        """
        return hashlib.md5(f'_@YoimiyaIsMyWaifu_{pwd}'.encode('utf-8')).hexdigest()


    def makeResult(self, ok: bool = True, data: typing.Any = None) -> dict[str | typing.Any]:
        """
        Make a result object.

        Args:
            ok (bool, optional): Whether the operation is successful. Defaults to True.
            data (typing.Any, optional): The data returned by the operation. Defaults to None.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        return {'status': ok, 'data': data} if ok else {'status': ok, 'message': data}

                
    def initialize(self, userName: str, password: str, email: str, chatbotName: str, chatbotPersona: str, googleApiKey: str, AIDubEndpoint: str, AIDubModel: str) -> None:
        """
        Initialize the database with user information.

        Args:
            userName (str): The username of administrator
            password (str): The password of administrator
            email (str): The email of administrator
            chatbotName (str): The name of the chatbot
            chatbotPersona (str): The persona of the chatbot
            googleApiKey (str): The Google API key for Gemini models
            AIDubEndpoint (str): The endpoint of the AI Dubbing model
            AIDubModel (str): The name of the AI Dubbing model
        """
        chatbotAvatar = pathlib.Path('./data/chatbotAvatar.png').read_bytes()
        print(email, password, userName)
        self.createUser(userName, password, email, 114514, 114514, 0b11111101)
        self.createUser('test_account', 'evaluation', 'test_acc@mail.xiaokang00010.top', 100, 100, 0b11111101)
        self.db.query("insert into config (chatbotName, chatbotPersona, chatbotAvatar, googleApiKey, AIDubEndpoint, AIDubModel) values (?,?,?,?,?,?)", (chatbotName, chatbotPersona, chatbotAvatar, googleApiKey, AIDubEndpoint, AIDubModel))
        return self.makeResult(True)
        
    def checkIfUserHasPermission(self, userId: int, permission: str) -> dict[str | typing.Any]:
        """
        Check if the user has the permission.

        Args:
            userId (int): The ID of the user.
            permission (str): The permission to be checked, includes 'new_exam_paper_creat', 'artifact_creat', 'all_exam_result_view','self_exam_result_view', 'artifact_rw', 'administrator'.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        user = self.getUserInfoByID(userId)
        if user is None:
            return self.makeResult(False, data='User not found')
        
        if user['permission'] & 0b00000001:
            return self.makeResult(True)
        if permission == 'new_exam_paper_creat':
            return self.makeResult(True) if user['permission'] & 0b10000000 else self.makeResult(False, data='No permission')
        elif permission == 'artifact_creat':
            return self.makeResult(True) if user['permission'] & 0b01000000 else self.makeResult(False, data='No permission')
        elif permission == 'all_exam_result_view':
            return self.makeResult(True) if user['permission'] & 0b00100000 else self.makeResult(False, data='No permission')
        elif permission == 'self_exam_result_view':
            return self.makeResult(True) if user['permission'] & 0b00010000 else self.makeResult(False, data='No permission')
        elif permission == 'artifact_rw':
            return self.makeResult(True) if user['permission'] & 0b00001000 else self.makeResult(False, data='No permission')
        elif permission == 'administrator':
            return self.makeResult(True) if user['permission'] & 0b00000001 else self.makeResult(False, data='No permission')
        else:
            return self.makeResult(False, data='Invalid permission')
        
        
    def getUserCapabilities(self, userId: int) -> dict[str | typing.Any]:
        """
        Get the capabilities of the user.

        Args:
            userId (int): The ID of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        user = self.db.query("select permission from users where id = ?", (userId,), one=True)
        if user is None:
            return self.makeResult(False, data='User not found')
        
        capability = {
            'new_exam_paper_creat': bool(user['permission'] & 0b10000000),
            'artifact_creat': bool(user['permission'] & 0b01000000),
            'all_exam_result_view': bool(user['permission'] & 0b00100000),
            'self_exam_result_view': bool(user['permission'] & 0b00010000),
            'artifact_rw': bool(user['permission'] & 0b00001000),
            'administrator': bool(user['permission'] & 0b00000001)
        }
        return self.makeResult(True, data=capability)
        
        
    def getUserInfoByID(self, userId: int, simple: bool = False) -> dict[str | typing.Any]:
        """
        Get user information by user ID.

        Args:
            userId (int): The ID of the user.
            simple (bool, optional): Whether to return only the basic information. Defaults to False.

        Returns:
            dict[str | typing.Any]: The user information.
        """
        
        # select infos except avatar, avatarMime
        data = self.db.query("select id, username, email, oralExamQuota, oralExamResultViewQuota, permission, overallPerformance, overallBand from users where id = ?", (userId,), one=True)
        if data is None:
            return None
        else:
            data['capabilities'] = self.getUserCapabilities(userId)['data']
            if simple:
                del data['oralExamQuota']
                del data['oralExamResultViewQuota']

            return data
    
    def getUserInfoByUsername(self, username: str) -> dict[str | typing.Any]:
        """
        Get user information by username.

        Args:
            username (str): The username of the user.

        Returns:
            dict[str | typing.Any]: The user information.
        """
        
        data = self.db.query("select * from users where username = ?", (username,), one=True)
        if data is None:
            return None
        else:
            data['capabilities'] = self.getUserCapabilities(data['id'])['data']
            return data
    
    def checkIfUsernameExists(self, username: str) -> bool:
        """
        Check if the username exists.

        Args:
            username (str): The username to be checked.

        Returns:
            bool: True if exists, False otherwise.
        """
        
        return len(self.db.query("select 1 from users where username = ?", (username,))) != 0
    
    def checkIfEmailExists(self, email: str) -> bool:
        """
        Check if the email exists.

        Args:
            email (str): The email to be checked.

        Returns:
            bool: True if exists, False otherwise.
        """
        
        return len(self.db.query("select 1 from users where email = ?", (email,))) != 0
    
    def createUser(self, username: str, password: str, email: str, oralExamQuota: int = 100, oralExamResultViewQuota: int = 100, permission: int = 0b11011000):
        """
        Create a new user.

        Args:
            username (str): The username of the user.
            password (str): The password of the user.
            email (str): The email of the user.
            oralExamQuota (int, optional): Quota of oral exams. Defaults to 100.
            oralExamResultViewQuota (int, optional): Quota of count of viewing oral exam result. Defaults to 100.
            permission (int, optional): Permission of the user. Defaults to 0b00000000.
        """
        
        if self.checkIfUsernameExists(username):
            return self.makeResult(False, data='Username already exists')
        if self.checkIfEmailExists(email):
            return self.makeResult(False, data='Email already exists')
        
        avatar = pathlib.Path('./data/avatar.png').read_bytes()
        print(email, password, username)
        passwordSalted = self.addSalt(password)
        self.db.query("insert into users (username, passwordSalted, email, oralExamQuota, oralExamResultViewQuota, permission, avatar, avatarMime) values (?,?,?,?,?,?,?,?)", (username, passwordSalted, email, oralExamQuota, oralExamResultViewQuota, permission, avatar, 'image/png'))
        return self.makeResult(True)
    
    def checkUserIdentityByUsername(self, username: str, password: str) -> dict[str | typing.Any]:
        """
        Check the identity of the user.

        Args:
            username (str): The username of the user.
            password (str): The password of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        passwordSalted = self.addSalt(password)
        user = self.db.query("select * from users where username = ? and passwordSalted = ?", (username, passwordSalted), one=True)
        if user:
            return self.makeResult(True, data=user)
        else:
            return self.makeResult(False, data='Invalid username or password')
        
        
    def checkUserIdentityById(self, id: int, password: str) -> dict[str | typing.Any]:
        """
        Check the identity of the user.

        Args:
            id (int): The id of the user.
            password (str): The password of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        passwordSalted = self.addSalt(password)
        
        user = self.db.query("select * from users where id = ? and passwordSalted = ?", (id, passwordSalted), one=True)
        if user:
            return self.makeResult(True, data=user)
        else:
            return self.makeResult(False, data='Invalid email or password')
        
        
    def checkUserIdentityByEmail(self, email: str, password: str) -> dict[str | typing.Any]:
        """
        Check the identity of the user.

        Args:
            email (str): The email of the user.
            password (str): The password of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        passwordSalted = self.addSalt(password)
        
        user = self.db.query("select * from users where email = ? and passwordSalted = ?", (email, passwordSalted), one=True)
        if user:
            return self.makeResult(True, data=user)
        else:
            return self.makeResult(False, data='Invalid email or password')
        
    def getRecentOralEnglishExamResults(self, userId: int):
        """
        Get recent oral English exam results of the user.

        Args:
            userId (int): The ID of the user.

        Returns:
            list[dict[str | typing.Any]]: The recent oral English exam results.
        """
        
        durationOfAMonth = timedelta(days=30).total_seconds()
        data = self.db.query("select * from oralEnglishExamResult where userId = ? and completeTime > ?", (userId, int(time.time() - durationOfAMonth)))
        for i, exam in enumerate(data):
            # get the exam paper
            data[i]['examPaper'] = self.getOralExamById(exam['examPaperId'])['data']
            
        return data
    
    def getRecentAcademicalEnglishExamResults(self, userId: int):
        """
        Get recent academic English exam results of the user.

        Args:
            userId (int): The ID of the user.

        Returns:
            list[dict[str | typing.Any]]: The recent academical English exam results.
        """
        
        durationOfAMonth = timedelta(days=30).total_seconds()
        data = self.db.query("select * from academicalPassageExamResult where userId = ? and completeTime > ?", (userId, int(time.time() - durationOfAMonth)))
        for i, exam in enumerate(data):
            # get the exam paper
            data[i]['examPaper'] = self.getReadingExamById(exam['examPaperId'])['data']
            
        return data

    def getRecentExamResults(self, userId: int) -> dict[str | typing.Any]:
        """
        Get recent exam results of the user.

        Args:
            userId (int): The ID of the user.

        Returns:
            dict[str | typing.Any]: The recent exam results.
        """
        
        return {'oralEnglishExamResults': self.getRecentOralEnglishExamResults(userId), 'readingExamResults': self.getRecentAcademicalEnglishExamResults(userId), 'writingExamResults': self.getRecentWritingExamResults(userId)}
    
    def getRecentWritingExamResults(self, userId: int):
        """
        Get recent writing exam results of the user.

        Args:
            userId (int): The ID of the user.

        Returns:
            list[dict[str | typing.Any]]: The recent writing exam results.
        """
        
        durationOfAMonth = timedelta(days=30).total_seconds()
        data = self.db.query("select * from essayWritingExamResult where userId = ? and completeTime > ?", (userId, int(time.time() - durationOfAMonth)))
        for i, exam in enumerate(data):
            # get the exam paper
            data[i]['examPaper'] = self.getWritingExamById(exam['examPaperId'])['data']
        return data
    
    
    def getOralEnglishExamResultById(self, examId: int) -> dict[str | typing.Any]:
        """
        Get oral English exam result by ID.

        Args:
            examId (int): The ID of the exam.

        Returns:
            dict[str | typing.Any]: The oral English exam result.
        """
        
        data = self.db.query("select * from oralEnglishExamResult where id = ?", (examId,), one=True)
        data['examPaper'] = self.getOralExamById(data['examPaperId'])['data']
        data['answerDetails'] = json.loads(data['answerDetails'])
        return self.makeResult(True, data=data)


    def getAcademicalEnglishExamResultById(self, examId: int) -> dict[str | typing.Any]:
        """
        Get academical English exam result by ID.

        Args:
            examId (int): The ID of the exam.

        Returns:
            dict[str | typing.Any]: The academical English exam result.
        """
        
        data = self.db.query("select * from academicalPassageExamResult where id = ?", (examId,), one=True)
        if data is None:
            return self.makeResult(False, data='Exam not found')
        else:
            data['examPaper'] = self.getReadingExamById(data['examPaperId'])['data']
            data['answerSheet'] = json.loads(data['answerSheet'])
            data['username'] = self.getUserInfoByID(data['userId'])['username']
            return self.makeResult(True, data=data)
    
    
    def getWritingExamResultById(self, examId: int) -> dict[str | typing.Any]:
        """
        Get writing exam result by ID.

        Args:
            examId (int): The ID of the exam.

        Returns:
            dict[str | typing.Any]: The writing exam result.
        """
        
        data = self.db.query("select * from essayWritingExamResult where id = ?", (examId,), one=True)
        if data is None:
            return self.makeResult(False, data='Exam not found')
        else:
            data['examPaper'] = self.getWritingExamById(data['examPaperId'])['data']
            data['username']= self.getUserInfoByID(data['userId'])['username']
            return self.makeResult(True, data=data)
    
    def createReadingExam(self, userId: int, title: str, availableTime: int, expireTime: int, passages: str, answerSheetFormat: str, duration: int) -> dict[str | typing.Any]:
        """
        Create a new reading exam.

        Args:
            userId (int): The ID of the user.
            passages (str): The passages of the exam.
            answerSheetFormat (str): The format of the answer sheet.
            duration (int): The duration of the exam. Unit: minutes.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("insert into academicalPassageExamPaper (userId, createTime, availableTime, expireTime, title, passages, answerSheetFormat, duration) values (?,?, ?, ?, ?, ?,?,?)", (userId, int(time.time()), availableTime, expireTime, title, passages, json.dumps(answerSheetFormat), duration))
        return self.makeResult(True)
    
    def getAllReadingExams(self, filter: dict[str | typing.Any] = None) -> list[dict[str | typing.Any]]:
        """
        Get all reading exams.

        Returns:
            list[dict[str | typing.Any]]: The list of all reading exams.
        """
        
        if filter is None:
            filter = {}
            
        filterSqlCond = ''
        if 'userId' in filter:
            filterSqlCond += f" and userId = {filter['userId']}"
        if 'title' in filter:
            filterSqlCond += f" and title like '%{filter['title']}%'"
        if 'availableTime' in filter:
            if filter['availableTime'][0] != 0:
                filterSqlCond += f" and availableTime >= {filter['availableTime'][0]}"
            if filter['availableTime'][1] != 0:
                filterSqlCond += f" and availableTime <= {filter['availableTime'][1]}"
        
        result = self.db.query(f"select id, title, availableTime, userId, duration, expireTime from academicalPassageExamPaper where 1=1 {filterSqlCond}")
        for i in result:
            isAvailable = int(time.time()) > i['availableTime'] and int(time.time()) < i['expireTime']
            i['isAvailable'] = isAvailable
            
        return result
    
    
    def getAllWritingExams(self, filter: dict[str | typing.Any] = None) -> list[dict[str | typing.Any]]:
        """
        Get all writing exams.

        Returns:
            list[dict[str | typing.Any]]: The list of all writing exams.
        """
        
        if filter is None:
            filter = {}
            
        filterSqlCond = ''
        if 'userId' in filter:
            filterSqlCond += f" and userId = {filter['userId']}"
        if 'title' in filter:
            filterSqlCond += f" and title like '%{filter['title']}%'"
        if 'availableTime' in filter:
            if filter['availableTime'][0] != 0:
                filterSqlCond += f" and availableTime >= {filter['availableTime'][0]}"
            if filter['availableTime'][1] != 0:
                filterSqlCond += f" and availableTime <= {filter['availableTime'][1]}"
        
        result = self.db.query(f"select id, title, availableTime, userId, duration, expireTime from essayWritingExamPaper where 1=1 {filterSqlCond}")
        for i in result:
            isAvailable = int(time.time()) > i['availableTime'] and int(time.time()) < i['expireTime']
            i['isAvailable'] = isAvailable
            
        return result
    
    def getAllOralExams(self, filter: dict[str | typing.Any] = None) -> list[dict[str | typing.Any]]:
        """
        Get all oral exams.

        Returns:
            list[dict[str | typing.Any]]: The list of all oral exams.
        """
        
        if filter is None:
            filter = {}
            
        filterSqlCond = ''
        if 'userId' in filter:
            filterSqlCond += f" and userId = {filter['userId']}"
        if 'title' in filter:
            filterSqlCond += f" and title like '%{filter['title']}%'"
        if 'availableTime' in filter:
            if filter['availableTime'][0] != 0:
                filterSqlCond += f" and availableTime >= {filter['availableTime'][0]}"
            if filter['availableTime'][1] != 0:
                filterSqlCond += f" and availableTime <= {filter['availableTime'][1]}"
        
        result = self.db.query(f"select id, title, availableTime, expireTime, userId from oralEnglishExamPaper where 1=1 {filterSqlCond}")
        for i in result:
            isAvailable = int(time.time()) > i['availableTime'] and int(time.time()) < i['expireTime']
            i['isAvailable'] = isAvailable
        return result
    
    
    def deleteReadingExam(self, examId: int) -> dict[str | typing.Any]:
        """
        Delete a reading exam.

        Args:
            examId (int): The ID of the exam.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("delete from academicalPassageExamPaper where id = ?", (examId,))
        return self.makeResult(True)
    
    
    def finializeReadingExamSession(self, sessionDetail: dict[str | typing.Any]) -> dict[str | typing.Any]:
        """
        Finialize a reading exam session.

        Args:
            sessionDetail (dict[str | typing.Any]): The detail of the session.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        examId = sessionDetail['examId']
        userId = sessionDetail['userId']
        score = sessionDetail['score']
        completeTime = sessionDetail['completeTime']
        self.db.query("insert into academicalPassageExamResult (examId, userId, score, completeTime) values (?,?,?,?)", (examId, userId, score, completeTime))
        return self.makeResult(True)
    
    
    def getGoogleApiKey(self) -> str | None:
        """
        Get the Google API key.

        Returns:
            str | None: The Google API key, or None if not set.
        """
        
        d = self.db.query("select googleApiKey from config", one=True)
        return d['googleApiKey'] if d else None
    
    
    def getUserAvatarByID(self, userId: int) -> typing.Tuple[bytes, str] | None:
        """
        Get the avatar of the user by ID.

        Args:
            userId (int): The ID of the user.

        Returns:
            typing.Tuple[bytes, str] | None: The avatar of the user, or None if not set.
        """
        
        d = self.db.query("select avatar, avatarMime from users where id = ?", (userId,), one=True)
        return (d['avatar'], d['avatarMime']) if d else None
    
    
    def getUsers(self, filter: dict[str | typing.Any] = None) -> list[dict[str | typing.Any]]:
        """
        Get all users.

        Args:
            filter (dict[str | typing.Any], optional): The filter of the users. Defaults to None.

        Returns:
            list[dict[str | typing.Any]]: The list of all users.
        """
        
        if filter is None:
            filter = {}
            
        filterSqlCond = ''
        
        if 'permissions' in filter:
            # convert permission to binary
            perm_bin = 0
            if 'new_exam_paper_creat' in filter['permissions']:
                perm_bin = perm_bin | 0b10000000 if filter['permissions']['new_exam_paper_creat'] else perm_bin & ~0b10000000
            if 'artifact_creat' in filter['permissions']:
                perm_bin = perm_bin | 0b01000000 if filter['permissions']['artifact_creat'] else perm_bin & ~0b01000000
            if 'all_exam_result_view' in filter['permissions']:
                perm_bin = perm_bin | 0b00100000 if filter['permissions']['all_exam_result_view'] else perm_bin & ~0b00100000
            if'self_exam_result_view' in filter['permissions']:
                perm_bin = perm_bin | 0b00010000 if filter['permissions']['self_exam_result_view'] else perm_bin & ~0b00010000
            if 'artifact_rw' in filter['permissions']:
                perm_bin = perm_bin | 0b00001000 if filter['permissions']['artifact_rw'] else perm_bin & ~0b00001000
            if 'administrator' in filter['permissions']:
                perm_bin = perm_bin | 0b00000001 if filter['permissions']['administrator'] else perm_bin & ~0b00000001
                
            filterSqlCond += f" and permission & {perm_bin} = {perm_bin}"
        if 'username' in filter:
            filterSqlCond += f" and username like '%{filter['username']}%'"
        if 'email' in filter:
            filterSqlCond += f" and email like '%{filter['email']}%'"
        
        print("Built conditon", filterSqlCond)
        
        data = self.db.query(f"select id, username, email, oralExamQuota, oralExamResultViewQuota, permission from users where 1=1 {filterSqlCond}")
        for i in data:
            i['capabilities'] = self.getUserCapabilities(i['id'])['data']
        return data
    
    
    def updateUserPermission(self, userId: int, specPermission: str, value: bool) -> dict[str | typing.Any]:
        """
        Update the permission of the user.

        Args:
            userId (int): The ID of the user.
            specPermission (str): The specific permission to be updated.
            value (bool): The value of the permission.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        user = self.db.query("select permission from users where id = ?", (userId,), one=True)
        if user is None:
            return self.makeResult(False, data='User not found')
        
        perm_bin = user['permission']
        if specPermission == 'new_exam_paper_creat':
            perm_bin = perm_bin | 0b10000000 if value else perm_bin & ~0b10000000
        elif specPermission == 'artifact_creat':
            perm_bin = perm_bin | 0b01000000 if value else perm_bin & ~0b01000000
        elif specPermission == 'all_exam_result_view':
            perm_bin = perm_bin | 0b00100000 if value else perm_bin & ~0b00100000
        elif specPermission =='self_exam_result_view':
            perm_bin = perm_bin | 0b00010000 if value else perm_bin & ~0b00010000
        elif specPermission == 'artifact_rw':
            perm_bin = perm_bin | 0b00001000 if value else perm_bin & ~0b00001000
        elif specPermission == 'administrator':
            perm_bin = perm_bin | 0b00000001 if value else perm_bin & ~0b00000001
        else:
            return self.makeResult(False, data='Invalid permission')
        
        self.db.query("update users set permission = ? where id = ?", (perm_bin, userId))
        return self.makeResult(True)
    
    
    def updateUser(self, userId: int, username: str, email: str, oralExamQuota: int, oralExamResultViewQuota: int, permission: dict[str | typing.Any]) -> dict[str | typing.Any]:
        """
        Update the user information.

        Args:
            userId (int): The ID of the user.
            username (str): The username of the user.
            email (str): The email of the user.
            oralExamQuota (int): The quota of oral exams.
            oralExamResultViewQuota (int): The quota of count of viewing oral exam result.
            permission (dict[str | typing.Any]): The permission of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        if self.checkIfUsernameExists(username) and username != self.db.query("select username from users where id = ?", (userId,), one=True)['username']:
            return self.makeResult(False, data='Username already exists')
        if self.checkIfEmailExists(email) and email != self.db.query("select email from users where id = ?", (userId,), one=True)['email']:
            return self.makeResult(False, data='Email already exists')
        
        perm_bin = self.convertPermissionDictToBin(permission)
        self.db.query("update users set username = ?, email = ?, oralExamQuota = ?, oralExamResultViewQuota = ?, permission = ? where id = ?", (username, email, oralExamQuota, oralExamResultViewQuota, perm_bin, userId))
        return self.makeResult(True)
    
    
    def convertPermissionDictToBin(self, permissionDict: dict[str | typing.Any]) -> int:
        """
        Convert the permission dictionary to binary.

        Args:
            permissionDict (dict[str | typing.Any]): The permission dictionary.

        Returns:
            int: The binary of the permission.
        """
        
        perm_bin = 0
        if 'new_exam_paper_creat' in permissionDict and permissionDict['new_exam_paper_creat']:
            perm_bin = perm_bin | 0b10000000
        if 'artifact_creat' in permissionDict and permissionDict['artifact_creat']:
            perm_bin = perm_bin | 0b01000000
        if 'all_exam_result_view' in permissionDict and permissionDict['all_exam_result_view']:
            perm_bin = perm_bin | 0b00100000
        if'self_exam_result_view' in permissionDict and permissionDict['self_exam_result_view']:
            perm_bin = perm_bin | 0b00010000
        if 'artifact_rw' in permissionDict and permissionDict['artifact_rw']:
            perm_bin = perm_bin | 0b00001000
        if 'administrator' in permissionDict and permissionDict['administrator']:
            perm_bin = perm_bin | 0b00000001
        return perm_bin
    
    
    def updateUserAvatar(self, userId: int, avatar: bytes, avatarMime: str) -> dict[str | typing.Any]:
        """
        Update the avatar of the user.

        Args:
            userId (int): The ID of the user.
            avatar (bytes): The avatar of the user.
            avatarMime (str): The MIME type of the avatar.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("update users set avatar = ?, avatarMime = ? where id = ?", (avatar, avatarMime, userId))
        return self.makeResult(True)
    
    
    def createArtifact(self, userId: int, isPrivate: bool, mimeType: str, artifactContent: bytes, expireTime: int = int(time.time() + 3600 * 24 * 30)) -> dict[str | typing.Any]:
        """
        Create a new artifact.

        Args:
            userId (int): The ID of the user.
            mimeType (str): The MIME type of the artifact.
            artifactContent (str): The content of the artifact.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        if type(artifactContent) != bytes:
            raise TypeError("Artifact content must be bytes")
        
        self.db.query("insert into artifact (userId, isPrivate, createTime, expireTime, mimetype, content) values (?,?,?,?,?,?)", (userId, isPrivate, int(time.time()), expireTime, mimeType, artifactContent))
        # get id (the latest inserted sorted by time)
        artifact = self.db.query("select id, userId, isPrivate, mimetype, createTime, expireTime from artifact order by id desc limit 1", one=True)
        return self.makeResult(True, data=artifact)
    
    
    def getArtifacts(self, filter: dict[str | typing.Any] = None) -> list[dict[str | typing.Any]]:
        """
        Get all artifacts of the user.

        Args:
            filter (dict[str | typing.Any], optional): The filter of the artifacts, including 'expired', 'createTime', 'type', 'userId'. Defaults to None.

        Returns:
            list[dict[str | typing.Any]]: The list of all artifacts.
        """
        
        cond = ""
        
        if filter is not None:
            if 'expireTime' in filter:
                cond += f" and expireTime < {int(filter['expired']['range_start'])} and expireTime > {int(filter['expired']['range_end'])}"
            if 'createTime' in filter:
                cond += f" and createTime < {int(filter['createTime']['range_start'])} and createTime > {int(filter['createTime']['range_end'])}"
            if 'mimetype' in filter:
                cond += f" and mimetype like '%{filter['mimetype']}%'"
            if 'userId' in filter:
                cond += f" and userId = {filter['userId']}"
            
        data = self.db.query(f"select id, userId, isPrivate, mimetype, createTime, expireTime from artifact where 1 = 1 {cond}")
        return data
    
    
    def getArtifactById(self, artifactId: int) -> dict[str | typing.Any] | None:
        """
        Get the artifact by ID.
        Args:
            artifactId (int): The ID of the artifact.

        Returns:
            dict[str | typing.Any] | None: The artifact, or None if not found.
        """
        return self.db.query("select id, userId, createTime, expireTime, mimetype, isPrivate from artifact where id = ?", (artifactId,), one=True)


    def getArtifactContentById(self, artifactId: int) -> bytes | None:
        """
        Get the content of the artifact by ID.

        Args:
            artifactId (int): The ID of the artifact.

        Returns:
            bytes | None: The content of the artifact, or None if not found.
        """
        
        artifact = self.db.query("select content from artifact where id = ?", (artifactId,), one=True)
        return artifact['content'] if artifact else None


    def deleteArtifact(self, artifactId: int) -> dict[str | typing.Any]:
        """
        Delete an artifact.

        Args:
            artifactId (int): The ID of the artifact.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("delete from artifact where id = ?", (artifactId,))
        return self.makeResult(True)
    
    
    def deleteAllOutdatedArtifacts(self) -> dict[str | typing.Any]:
        """
        Delete all outdated artifacts.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("delete from artifact where expireTime < ?", (int(time.time()),))
        return self.makeResult(True)
    
    
    def getReadingExamById(self, examId: int) -> dict[str | typing.Any]:
        """
        Get the reading exam by ID.

        Args:
            examId (int): The ID of the exam.

        Returns:
            dict[str | typing.Any] | None: The reading exam, or false result if not found.
        """
        
        res = self.db.query("select id, userId, createTime, availableTime, expireTime, title, passages, answerSheetFormat, duration from academicalPassageExamPaper where id = ?", (examId,), one=True)
        if res is None:
            return self.makeResult(False, data='Reading exam not found')
        else:
            res["answerSheetFormat"] = json.loads(res["answerSheetFormat"])
            return self.makeResult(True, data=res)
        
        
    def getWritingExams(self, filter: dict[str | typing.Any] = None) -> list[dict[str | typing.Any]]:
        """
        Get all writing exams.

        Args:
            filter (dict[str | typing.Any], optional): The filter of the exams. Defaults to None.
        Returns:
            list[dict[str | typing.Any]]: The list of all writing exams.
        """
        
        if filter is None:
            filter = {}
            
        filterSqlCond = ''
        if 'userId' in filter:
            filterSqlCond += f" and userId = {filter['userId']}"
        if 'title' in filter:
            filterSqlCond += f" and title like '%{filter['title']}%'"
        if 'availableTime' in filter:
            filterSqlCond += f" and availableTime >= {filter['availableTime'][0]} and expireTime <= {filter['availableTime'][1]}"
        
        return self.db.query(f"select * from essayWritingExamPaper where 1=1 {filterSqlCond}")
    
    def createWritingExam(self, userId: int, title: str, availableTime: int, expireTime: int, problemStatement: str, onePossibleVersion: str, duration: int) -> dict[str | typing.Any]:
        """
        Create a new writing exam.

        Args:
            userId (int): The ID of the user.
            title (str): The title of the exam.
            problemStatement (str): The problem statement of the exam, usually in markdown format.
            onePossibleVersion (str): The one possible version of the composition, usually in markdown format.
            duration (int): The duration of the exam. Unit: minutes.
            availableTime (int): When the exam is available.
            expireTime (int): When the exam is expired.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("insert into essayWritingExamPaper (userId, createTime, availableTime, expireTime, title, problemStatement, onePossibleVersion, duration) values (?,?,?,?,?,?,?,?)", (userId, int(time.time()), availableTime, expireTime, title, problemStatement, onePossibleVersion, duration))
        # get id (the latest inserted sorted by time)
        exam = self.db.query("select id, userId, createTime, availableTime, expireTime, title, problemStatement, onePossibleVersion, duration from essayWritingExamPaper order by id desc limit 1", one=True)
        return self.makeResult(True, data=exam)
    
    
    def createOralExam(self, userId: int, title: str, availableTime: int, expireTime: int, warmUpTopics: list[str], mainTopic: str):
        """
        Create a new oral exam.

        Args:
            userId (int): The ID of the user.
            title (str): The title of the exam.
            warmUpTopics (list[str]): The warm-up topics of the exam.
            mainTopic (str): The main topic of the exam.
            availableTime (int): When the exam is available.
            expireTime (int): When the exam is expired.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("insert into oralEnglishExamPaper (userId, createTime, availableTime, expireTime, title, warmUpTopics, mainTopic) values (?,?,?,?,?,?,?)", (userId, int(time.time()), availableTime, expireTime, title, json.dumps(warmUpTopics), mainTopic))
        # get id (the latest inserted sorted by time)
        exam = self.db.query("select id, userId, createTime, availableTime, expireTime, title, warmUpTopics, mainTopic from oralEnglishExamPaper order by id desc limit 1", one=True)
        return self.makeResult(True, data=exam)
    
    def getOralExams(self, filter: dict[str | typing.Any] = None) -> list[dict[str | typing.Any]]:
        """
        Get all oral exams.

        Args:
            filter (dict[str | typing.Any], optional): The filter of the exams. Defaults to None.

        Returns:
            list[dict[str | typing.Any]]: The list of all oral exams.
        """
        
        if filter is None:
            filter = {}
            
        filterSqlCond = ''
        if 'userId' in filter:
            filterSqlCond += f" and userId = {filter['userId']}"
        if 'title' in filter:
            filterSqlCond += f" and title like '%{filter['title']}%'"
        if 'availableTime' in filter:
            filterSqlCond += f" and availableTime >= {filter['availableTime'][0]} and expireTime <= {filter['availableTime'][1]}"
        
        return self.db.query(f"select * from oralEnglishExamPaper where 1=1 {filterSqlCond}")
    
    
    def getOralExamById(self, examId: int) -> dict[str | typing.Any]:
        """
        Get the oral exam by ID.

        Args:
            examId (int): The ID of the exam.

        Returns:
            dict[str | typing.Any] | None: The oral exam, or false result if not found.
        """
        
        res = self.db.query("select id, userId, createTime, availableTime, expireTime, title, warmUpTopics, mainTopic from oralEnglishExamPaper where id = ?", (examId,), one=True)
        if res is None:
            return self.makeResult(False, data='Oral exam not found')
        else:
            res["warmUpTopics"] = json.loads(res["warmUpTopics"])
            return self.makeResult(True, data=res)
    
    
    def updateOralExam(self, examId: int, title: str, availableTime: int, expireTime: int, warmUpTopics: list[str], mainTopic: str) -> dict[str | typing.Any]:
        """
        Update the oral exam.

        Args:
            examId (int): The ID of the exam.
            title (str): The title of the exam.
            availableTime (int): When the exam is available.
            expireTime (int): When the exam is expired.
            warmUpTopics (list[str]): The warm-up topics of the exam.
            mainTopic (str): The main topic of the exam.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("update oralEnglishExamPaper set title = ?, availableTime = ?, expireTime = ?, warmUpTopics = ?, mainTopic = ? where id = ?", (title, availableTime, expireTime, json.dumps(warmUpTopics), mainTopic, examId))
        return self.makeResult(True)
    
    def deleteOralExam(self, examId: int) -> dict[str | typing.Any]:
        """
        Delete an oral exam.

        Args:
            examId (int): The ID of the exam.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("delete from oralEnglishExamPaper where id = ?", (examId,))
        return self.makeResult(True)
    
    
    def deleteWritingExam(self, examId: int) -> dict[str | typing.Any]:
        """
        Delete a writing exam.

        Args:
            examId (int): The ID of the exam.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("delete from essayWritingExamPaper where id = ?", (examId,))
        return self.makeResult(True)
    
    
    def getWritingExamById(self, examId: int) -> dict[str | typing.Any]:
        """
        Get the writing exam by ID.

        Args:
            examId (int): The ID of the exam.

        Returns:
            dict[str | typing.Any] | None: The writing exam, or false result if not found.
        """
        
        res = self.db.query("select id, userId, createTime, availableTime, expireTime, title, problemStatement, onePossibleVersion, duration from essayWritingExamPaper where id = ?", (examId,), one=True)
        if res is None:
            return self.makeResult(False, data='Writing exam not found')
        else:
            return self.makeResult(True, data=res)
    
    def updateWritingExam(self, examId: int, title: str, availableTime: int, expireTime: int, problemStatement: str, onePossibleVersion: str, duration: int) -> dict[str | typing.Any]:
        """
        Update the writing exam.

        Args:
            examId (int): The ID of the exam.
            title (str): The title of the exam.
            availableTime (int): When the exam is available.
            expireTime (int): When the exam is expired.
            problemStatement (str): The problem statement of the exam, usually in markdown format.
            onePossibleVersion (str): The one possible version of the composition, usually in markdown format.
            duration (int): The duration of the exam. Unit: minutes.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("update essayWritingExamPaper set title = ?, availableTime = ?, expireTime = ?, problemStatement = ?, onePossibleVersion = ?, duration = ? where id = ?", (title, availableTime, expireTime, problemStatement, onePossibleVersion, duration, examId))
        return self.makeResult(True)
    
    
    def updateReadingExam(self, examId: int, title: str, availableTime: int, expireTime: int, passages: str, answerSheetFormat: str, duration: int) -> dict[str | typing.Any]:
        """
        Update the reading exam.

        Args:
            examId (int): The ID of the exam.
            title (str): The title of the exam.
            availableTime (int): When the exam is available.
            expireTime (int): When the exam is expired.
            passages (str): The passages of the exam, separated by semicolons.
            answerSheetFormat (str): The answer sheet format of the exam, in JSON format.
            duration (int): The duration of the exam. Unit: minutes.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("update academicalPassageExamPaper set title = ?, availableTime = ?, expireTime = ?, passages = ?, answerSheetFormat = ?, duration = ? where id = ?", (title, availableTime, expireTime, passages, json.dumps(answerSheetFormat), duration, examId))
        return self.makeResult(True)
    
    
    def deleteUser(self, userId: int) -> dict[str | typing.Any]:
        """
        Delete a user.

        Args:
            userId (int): The ID of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("delete from users where id = ?", (userId,))
        return self.makeResult(True)
    
    
    def updatePassword(self, userId: int, newPassword: str) -> dict[str | typing.Any]:
        """
        Update the password of the user. No authentication is required.

        Args:
            userId (int): The ID of the user.
            newPassword (str): The new password of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        res = self.getUserInfoByID(userId)
        if res is None:
            return self.makeResult(False, data='User not found')
        
        saltedNewPassword = self.addSalt(newPassword)
        self.db.query("update users set passwordSalted = ? where id = ?", (saltedNewPassword, userId))
        return self.makeResult(True)
    
    
    def updateEmail(self, userId: int, newEmail: str) -> dict[str | typing.Any]:
        """
        Update the email of the user.

        Args:
            userId (int): The ID of the user.
            newEmail (str): The new email of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        res = self.getUserInfoByID(userId)
        if res is None:
            return self.makeResult(False, data='User not found')
        
        # check whether the email is already used
        if self.db.query("select id from users where email = ? limit 1", (newEmail,), one=True) is not None:
            return self.makeResult(False, data='Email already used')
        
        self.db.query("update users set email = ? where id = ?", (newEmail, userId))
        return self.makeResult(True)
    
    
    def updateUsername(self, userId: int, newUsername: str) -> dict[str | typing.Any]:
        """
        Update the username of the user.

        Args:
            userId (int): The ID of the user.
            newUsername (str): The new username of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        res = self.getUserInfoByID(userId)
        if res is None:
            return self.makeResult(False, data='User not found')
        
        # check whether the username is already used
        if self.db.query("select id from users where username = ? limit 1", (newUsername,), one=True) is not None:
            return self.makeResult(False, data='Username already used')
        
        self.db.query("update users set username = ? where id = ?", (newUsername, userId))
        return self.makeResult(True)
        
        
    def submitReadingExamResult(self, userId: int, completeTime: int, examId: int, answerSheet: dict[str | typing.Any]) -> dict[str | typing.Any]:
        """
        Submit the reading exam result.

        Args:
            userId (int): The ID of the user.
            completeTime (int): The time when the exam is completed.
            examId (int): The ID of the exam.
            answerSheet (dict[str | typing.Any]): The answer sheet of the exam, in JSON format.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        exam = self.getReadingExamById(examId)['data']
        
        problem_count = len(exam['answerSheetFormat'])
        correct_count = 0
        error_answers = []
        band = ''
        
        # check the submission
        for ori, ans in zip(exam['answerSheetFormat'], answerSheet):
            if ori['answer'] == ans:
                correct_count += 1
            else:
                error_answers.append(ori['answer'])
                
        # judge overall band
        if correct_count >= problem_count * 0.7:
            band = 'A'
        elif correct_count >= problem_count * 0.5:
            band = 'B'
        elif correct_count >= problem_count * 0.3:
            band = 'C'
        else:
            band = 'D'
            
        # call AI to anaylyze the answer sheet
        feedback = chatModel.AnalyzeReadingExamResult(
            exam['passages'],
            correct_count, 
            problem_count,
            band,
            error_answers,
            exam['answerSheetFormat']
        )
        
        # insert the result
        self.db.query("insert into academicalPassageExamResult (userId, completeTime, examPaperId, answerSheet, correctAnsCount, band, feedback) values (?,?,?,?,?,?,?)", (userId, completeTime, examId, json.dumps(answerSheet), correct_count, band, feedback))
        
        # fetch the result back from the database
        res = self.db.query("select id, userId, completeTime, examPaperId, answerSheet, correctAnsCount, band, feedback from academicalPassageExamResult where userId = ? and examPaperId = ? order by id desc limit 1", (userId, examId), one=True)
        return self.makeResult(True, data=res)
    
    
    def submitWritingExamResult(self, userId: int, completeTime: int, examId: int, composition: str) -> dict[str | typing.Any]:
        """
        Submit the writing exam result.

        Args:
            userId (int): The ID of the user.
            completeTime (int): The time when the exam is completed.
            examId (int): The ID of the exam.
            composition (str): The composition of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        exam = self.getWritingExamById(examId)['data']

        # call AI to anaylyze the composition
        band, feedback = chatModel.AnalyzeWritingExamResult(
            exam['problemStatement'],
            exam['onePossibleVersion'],
            composition
        )
        
        # insert the result
        self.db.query("insert into essayWritingExamResult (userId, completeTime, examPaperId, answer, band, feedback) values (?,?,?,?,?,?)", (userId, completeTime, examId, composition, band, feedback))
        
        # fetch the result back from the database
        res = self.db.query("select id, userId, completeTime, examPaperId, answer, band, feedback from essayWritingExamResult where userId = ? and examPaperId = ? order by id desc limit 1", (userId, examId), one=True)
        return self.makeResult(True, data=res)
    
    
    def submitOralExamResult(self, userId: int, completeTime: int, examId: int, answerDetails: dict[str | typing.Any]) -> dict[str | typing.Any]:
        """
        Submit the oral exam result.

        Args:
            userId (int): The ID of the user.
            completeTime (int): The time when the exam is completed.
            examId (int): The ID of the exam.
            answerDetails (dict[str | typing.Any]): The answer details of the exam, in JSON format.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        prompt = chatModel.Prompt(data.config.PROMPT_FOR_ORAL_EXAM_ENGLISH_PRONUNCIATION_ASSESSMENT, {
            'student_result': json.dumps(answerDetails['Pronunciation_Evaluation_Result'], indent=4, ensure_ascii=False, default=lambda o: str(o)),
        })
        model = chatModel.ChatGoogleGenerativeAI('gemini-2.0-flash-thinking-exp-01-21', 0.8)
        resp = model.initiate([prompt])
        feedbackContent = resp[resp.rfind('[feedback]') + 10:resp.rfind('[/feedback]')]
        
        
        prompt = chatModel.Prompt(data.config.PROMPT_FOR_ORAL_EXAMINATION_OVERALL_FEEDBACK, {
            'oral_exam_result': answerDetails['Feedback'],
            'pronunciation_assessment_result': feedbackContent,
        })
        resp = model.initiate([prompt])
        overall_feedback = resp[resp.rfind('[feedback]') + 10:resp.rfind('[/feedback]')]
        overall_band = resp[resp.rfind('[band]') + 6:resp.rfind('[/band]')]
        
        # insert the result
        self.db.query("insert into oralEnglishExamResult (userId, completeTime, examPaperId, answerDetails, contentFeedback, pronounciationFeedback, overallFeedback, band) values (?,?,?,?,?,?,?,?)", 
                      (userId, completeTime, examId, json.dumps(answerDetails, default=lambda o: str(o)), answerDetails['Feedback'], feedbackContent, overall_feedback, overall_band))
        
        # fetch the result back from the database
        res = self.db.query("select id, userId, completeTime, examPaperId, answerDetails, contentFeedback, pronounciationFeedback, overallFeedback, band from oralEnglishExamResult where userId = ? and examPaperId = ? order by id desc limit 1", (userId, examId), one=True)
        return self.makeResult(True, data=res)
    
    
    def getReadingExamResultList(self, filter: dict[str | typing.Any] = None) -> list[dict[str | typing.Any]]:
        """
        Get the list of all reading exam results.

        Args:
            filter (dict[str | typing.Any], optional): The filter of the results. Defaults to None.
        Returns:
            list[dict[str | typing.Any]]: The list of all reading exam results.
        """
        
        if filter is None:
            filter = {}
            
        
            
        filterSqlCond = ''
        if 'userId' in filter:
            filterSqlCond += f" and userId = {filter['userId']}"
        if 'examId' in filter:
            filterSqlCond += f" and examPaperId = {filter['examId']}"
        if 'completeTime' in filter:
            filterSqlCond += f" and completeTime >= {filter['completeTime'][0]} and completeTime <= {filter['completeTime'][1]}"
        
        res = self.db.query(f"select id, band, completeTime, examPaperId, userId from academicalPassageExamResult where 1=1 {filterSqlCond} order by completeTime desc")
        for i in res:
            i['examPaper'] = {
                'title': self.getReadingExamById(i['examPaperId'])['data']['title'],
            }
            i['username'] = self.getUserInfoByID(i['userId'])['username']
        return res
    
    
    def getWritingExamResultList(self, filter: dict[str | typing.Any] = None) -> list[dict[str | typing.Any]]:
        """
        Get the list of all writing exam results.

        Args:
            filter (dict[str | typing.Any], optional): The filter of the results. Defaults to None.
        Returns:
            list[dict[str | typing.Any]]: The list of all writing exam results.
        """
        
        if filter is None:
            filter = {}
            
        filterSqlCond = ''
        if 'userId' in filter:
            filterSqlCond += f" and userId = {filter['userId']}"
        if 'examId' in filter:
            filterSqlCond += f" and examPaperId = {filter['examId']}"
        if 'completeTime' in filter:
            filterSqlCond += f" and completeTime >= {filter['completeTime'][0]} and completeTime <= {filter['completeTime'][1]}"
        
        res = self.db.query(f"select id, band, completeTime, examPaperId, userId from essayWritingExamResult where 1=1 {filterSqlCond} order by completeTime desc")
        for i in res:
            i['examPaper'] = {
                'title': self.getWritingExamById(i['examPaperId'])['data']['title'],
            }
            i['username'] = self.getUserInfoByID(i['userId'])['username']
        return res
    
    
    def getOralExamResultList(self, filter: dict[str | typing.Any] = None) -> list[dict[str | typing.Any]]:
        """
        Get the list of all oral exam results.

        Args:
            filter (dict[str | typing.Any], optional): The filter of the results. Defaults to None.
        Returns:
            list[dict[str | typing.Any]]: The list of all oral exam results.
        """
        
        if filter is None:
            filter = {}
            
        filterSqlCond = ''
        if 'userId' in filter:
            filterSqlCond += f" and userId = {filter['userId']}"
        if 'examId' in filter:
            filterSqlCond += f" and examPaperId = {filter['examId']}"
        if 'completeTime' in filter:
            filterSqlCond += f" and completeTime >= {filter['completeTime'][0]} and completeTime <= {filter['completeTime'][1]}"
        
        res = self.db.query(f"select id, completeTime, examPaperId, userId, band from oralEnglishExamResult where 1=1 {filterSqlCond} order by completeTime desc")
        for i in res:
            i['examPaper'] = self.getOralExamById(i['examPaperId'])['data']
            i['username'] = self.getUserInfoByID(i['userId'])['username']
            
        return res
    
    
    def triggerOverallAssessment(self, userId: int) -> dict[str | typing.Any]:
        """
        Trigger the overall assessment.

        Args:
            userId (int): The ID of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        import datetime
        # get all writing exams feedback
        writing = "\n\n".join(f"""
{datetime.datetime.fromtimestamp(i['completeTime']).strftime('%Y-%m-%d %H:%M:%S')}: 
{i['feedback']}
"""for i in self.db.query("select feedback, completeTime from essayWritingExamResult where userId = ? order by completeTime ", (userId,)))
        # get all reading exams feedback
        reading = "\n\n".join(f"""
{datetime.datetime.fromtimestamp(i['completeTime']).strftime('%Y-%m-%d %H:%M:%S')}
{i['feedback']}
                              """for i in self.db.query("select feedback, completeTime from academicalPassageExamResult where userId = ? order by completeTime ", (userId,)))
        oral = "\n\n".join(f"""
{datetime.datetime.fromtimestamp(i['completeTime']).strftime('%Y-%m-%d %H:%M:%S')}
{i['contentFeedback']}
{i['pronounciationFeedback']}
{i['overallFeedback']}
                              """for i in self.db.query("select contentFeedback, pronounciationFeedback, overallFeedback, completeTime from oralEnglishExamResult where userId = ? order by completeTime ", (userId,)))
        
        
        # call AI to anaylyze the feedback
        overall_band, overall_feedback = chatModel.AnalyzeOverallAssessment(writing, reading, oral)
        self.db.query("update users set overallBand = ?, overallPerformance = ? where id = ?", (overall_band, overall_feedback, userId))
        return self.makeResult(True)
    
    
    def increaseOverallAssessmentTrigger(self, userId: int) -> dict[str | typing.Any]:
        """
        Increase the overall assessment trigger of the user.

        Args:
            userId (int): The ID of the user.

        Returns:
            dict[str | typing.Any]: The result object.
        """
        
        self.db.query("update users set overallAssessmentTrigger = overallAssessmentTrigger + 1 where id = ?", (userId,))
        # query back
        res = self.db.query("select overallAssessmentTrigger from users where id = ?", (userId,), one=True)['overallAssessmentTrigger']
        if res % 4 == 0:
            self.triggerOverallAssessment(userId)
            
        return self.makeResult(True)
    

    def getConfig(self) -> dict[str | typing.Any]:
        """
        Get the config of the server.

        Returns:
            dict[str | typing.Any]: The config of the server.
        """
        
        res = self.db.query("select * from config limit 1", one=True)
        return self.makeResult(True, data=res)
    
    
    def updateConfig(self, chatbotName: str, chatbotPersona: str, AIDubEndpoint: str, AIDubModel: str, enableRegister: bool, googleApiKey: str):
        """
        Update the config of the server.

        Args:
            chatbotName (str): Chatbot name. Will be used when taking oral english examinations.
            chatbotPersona (str): Chatbot persona. Will be used when taking oral english examinations.
            AIDubEndpoint (str): Endpoint for AI TTS service.
            AIDubModel (str): Model for AI TTS service.
            enableRegister (bool): Whether to enable user registration.
            googleApiKey (str): Google API key for invoking Google Gemini API.
        """
        
        self.db.query("update config set chatbotName = ?, chatbotPersona = ?, AIDubEndpoint = ?, AIDubModel = ?, enableRegister = ?, googleApiKey = ?", (chatbotName, chatbotPersona, AIDubEndpoint, AIDubModel, enableRegister, googleApiKey))
        return self.makeResult(True)


    
DataProvider = _DataProvider()