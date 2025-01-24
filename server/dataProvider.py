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

class ExamSessionManager:
    def __init__(self, dataProvider: '_DataProvider'):
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

                
    def initialize(self, userName: str, password: str, email: str, chatbotName: str, chatbotPersona: str, googleApiKey: str) -> None:
        """
        Initialize the database with user information.

        Args:
            userName (str): The username of administrator
            password (str): The password of administrator
            email (str): The email of administrator
            chatbotName (str): The name of the chatbot
            chatbotPersona (str): The persona of the chatbot
            googleApiKey (str): The Google API key for Gemini models
        """
        chatbotAvatar = pathlib.Path('./data/chatbotAvatar.png').read_bytes()
        print(email, password, userName)
        self.createUser(userName, password, email, 114514, 114514, 0b11111100)
        self.db.query("insert into config (chatbotName, chatbotPersona, chatbotAvatar, googleApiKey) values (?,?,?,?)", (chatbotName, chatbotPersona, chatbotAvatar, googleApiKey))
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
        
        
    def getUserInfoByID(self, userId: int) -> dict[str | typing.Any]:
        """
        Get user information by user ID.

        Args:
            userId (int): The ID of the user.

        Returns:
            dict[str | typing.Any]: The user information.
        """
        
        # select infos except avatar, avatarMime
        data = self.db.query("select id, username, email, oralExamQuota, oralExamResultViewQuota, permission from users where id = ?", (userId,), one=True)
        if data is None:
            return None
        else:
            data['capabilities'] = self.getUserCapabilities(userId)['data']
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
        return self.db.query("select * from oralEnglishExamResults where userId = ? and completeTime > ?", (userId, int(time.time() - durationOfAMonth)))
    
    def getRecentAcademicalEnglishExamResults(self, userId: int):
        """
        Get recent academic English exam results of the user.

        Args:
            userId (int): The ID of the user.

        Returns:
            list[dict[str | typing.Any]]: The recent academical English exam results.
        """
        
        durationOfAMonth = timedelta(days=30).total_seconds()
        return self.db.query("select * from academicalEnglishExamResults where userId = ? and completeTime > ?", (userId, int(time.time() - durationOfAMonth)))


    def getRecentExamResults(self, userId: int) -> dict[str | typing.Any]:
        """
        Get recent exam results of the user.

        Args:
            userId (int): The ID of the user.

        Returns:
            dict[str | typing.Any]: The recent exam results.
        """
        
        return {'oralEnglishExamResults': self.getRecentOralEnglishExamResults(userId), 'academicalEnglishExamResults': self.getRecentAcademicalEnglishExamResults(userId)}
    
    def getOralEnglishExamResultById(self, examId: int) -> dict[str | typing.Any]:
        """
        Get oral English exam result by ID.

        Args:
            examId (int): The ID of the exam.

        Returns:
            dict[str | typing.Any]: The oral English exam result.
        """
        
        return self.db.query("select * from oralEnglishExamResults where id = ?", (examId,), one=True)
    
    def getAcademicalEnglishExamResultById(self, examId: int) -> dict[str | typing.Any]:
        """
        Get academical English exam result by ID.

        Args:
            examId (int): The ID of the exam.

        Returns:
            dict[str | typing.Any]: The academical English exam result.
        """
        
        return self.db.query("select * from academicalEnglishExamResults where id = ?", (examId,), one=True)
    
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
            filterSqlCond += f" and availableTime >= {filter['availableTime'][0]} and expireTime <= {filter['availableTime'][1]}"
        
        return self.db.query(f"select * from academicalPassageExamPaper where 1=1 {filterSqlCond}")
    
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
        
        self.db.query("insert into artifact (userId, isPrivate, createTime, expireTime, mimetype, content) values (?,?,?,?,?,?)", (userId, isPrivate, int(time.time()), expireTime, mimeType, artifactContent))
        # get id (the latest inserted sorted by time)
        artifact = self.db.query("select id, userId, isPrivate, mimetype, createTime, expireTime from artifact order by createTime desc limit 1", one=True)
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
        exam = self.db.query("select id, userId, createTime, availableTime, expireTime, title, problemStatement, onePossibleVersion, duration from essayWritingExamPaper order by createTime desc limit 1", one=True)
        return self.makeResult(True, data=exam)
    
    
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
        
    
DataProvider = _DataProvider()