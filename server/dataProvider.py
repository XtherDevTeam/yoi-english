from datetime import timedelta
import sqlite3
import threading
import time
import typing
import logger
import hashlib
import pathlib

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
            logger.Logger.info('Database not initialized')
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
            logger.Logger.info('Running initialization script')
            with open(f'./data/init.sql', 'r') as file:
                self.db.runScript(file.read())
                
    def addSalt(pwd: str) -> str:
        """
        Add salt to the password.

        Args:
            pwd (str): The password to be salted.

        Returns:
            str: The salted password.
        """
        return hashlib.md5(f'_@YoimiyaIsMyWaifu_{pwd}'.encode('utf-8')).hexdigest()


    def makeResult(ok: bool = True, data: typing.Any = None) -> dict[str | typing.Any]:
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
        passwordSalted = self.addSalt(password)
    
        avatar = pathlib.Path('./data/avatar.png').read_bytes()
        chatbotAvatar = pathlib.Path('./data/chatbotAvatar.png').read_bytes()
        
        self.createUser(userName, password, email, 114514, 114514, 0b11111000)
        self.db.query("insert into config (chatbotName, chatbotPersona, chatbotAvatar, googleApiKey) values (?,?,?,?)", (chatbotName, chatbotPersona, chatbotAvatar, googleApiKey))
        
    def getUserInfoByID(self, userId: int) -> dict[str | typing.Any]:
        """
        Get user information by user ID.

        Args:
            userId (int): The ID of the user.

        Returns:
            dict[str | typing.Any]: The user information.
        """
        
        # select infos except avatar, avatarMime
        return self.db.query("select id, username, email, oralExamQuota, oralExamResultViewQuota, permission from users where id = ?", (userId,), one=True)
    
    def getUserInfoByUsername(self, username: str) -> dict[str | typing.Any]:
        """
        Get user information by username.

        Args:
            username (str): The username of the user.

        Returns:
            dict[str | typing.Any]: The user information.
        """
        
        return self.db.query("select * from users where username = ?", (username,), one=True)
    
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
            return self.makeResult(False, message='Username already exists')
        if self.checkIfEmailExists(email):
            return self.makeResult(False, message='Email already exists')
        
        passwordSalted = self.addSalt(password)
        self.db.query("insert into users (username, passwordSalted, email, oralExamQuota, oralExamResultViewQuota, permission) values (?,?,?,?,?,?)", (username, passwordSalted, email, oralExamQuota, oralExamResultViewQuota, permission))
        return self.makeResult(True)
    
    def checkUserIdentity(self, username: str, password: str) -> dict[str | typing.Any]:
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
            return self.makeResult(False, message='Invalid username or password')
        
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
    
DataProvider = _DataProvider()