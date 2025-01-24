import typing
from dataProvider import DataProvider
import flask_cors
import flask
import data.config
import chatModel
import io

app = flask.Flask(__name__)
flask_cors.CORS(app)
# set secret
app.secret_key = data.config.SECRET_KEY


def parseRequestRange(s, flen):
    s = s[s.find('=')+1:]
    c = s.split('-')
    if len(c) != 2:
        return None
    else:
        if c[0] == '' and c[1] == '':
            return [0, flen - 1]
        elif c[1] == '':
            return [int(c[0]), flen - 1]
        elif c[0] == '':
            return [flen - int(c[1]) - 1, flen - 1]
        else:
            return [int(i) for i in c]


def makeFileResponse(file: bytes, mime: str):
    isPreview = not mime.startswith('application')
    if flask.request.headers.get('Range') != None:
        fileLength = len(file)
        reqRange = parseRequestRange(
            flask.request.headers.get('Range'), fileLength)

        response_file = bytes()

        response_file = file[reqRange[0]:reqRange[1]
                             if reqRange[0] != reqRange[1] else reqRange[1] + 1]

        response = flask.make_response(response_file)
        response.headers['Accept-Ranges'] = 'bytes'
        response.headers['Content-Range'] = 'bytes ' + \
            str(reqRange[0]) + '-' + \
            str(reqRange[1]) + '/' + str(fileLength)
        response.headers['Content-Type'] = mime
        if response.headers['Content-Type'].startswith('application'):
            response.headers['Content-Disposition'] = "attachment;"

        response.status_code = 206
        return response

    return flask.send_file(io.BytesIO(file), as_attachment=not isPreview, mimetype=mime)


@app.after_request
def after_request(response):
    DataProvider.db.db.commit()
    return response

@app.route('/v1/service/info', methods=['GET'])
def service_status():
    return {
        'status': 'running',
        'version': data.config.VERSION,
        'buildNumber': data.config.BUILD_NUMBER,
        'authenticated_session': flask.session.get('userAuth') if 'userAuth' in flask.session else -1,
        'initialized': DataProvider.checkIfInitialized()
    }
    
@app.route("/v1/admin/initialize", methods=['POST'])
def initialize():
    form: dict[str, typing.Any] = flask.request.json
    username = form.get('username')
    password = form.get('password')
    email = form.get('email')
    google_api_key = form.get('google_api_key')
    chatbot_persona = form.get('chatbot_persona')
    chatbot_name = form.get('chatbot_name')
    if not username or not password or not email or not google_api_key:
        return DataProvider.makeResult(False, 'Username, password, email and Google API key are required to initialize the server.')
    print(email, password, username)
    return DataProvider.initialize(username, password, email, chatbot_name, chatbot_persona, google_api_key)
    
@app.route('/v1/user/<int:userId>/info')
def get_user_info(userId):
    return DataProvider.getUserInfoByID(userId)

@app.route('/v1/user/<int:userId>/avatar')
def get_user_avatar_by_id(userId):
    avatar, mime = DataProvider.getUserAvatarByID(userId)
    if avatar:
        byteIO = io.BytesIO(avatar)
        return flask.send_file(byteIO, mimetype=mime)
    else:
        return DataProvider.makeResult(False, 'User avatar not found.')

@app.route('/v1/user/avatar')
def get_user_avatar():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    userId = flask.session['userAuth']
    avatar, mime = DataProvider.getUserAvatarByID(userId)
    if avatar:
        byteIO = io.BytesIO(avatar)
        return flask.send_file(byteIO, mimetype=mime)
    else:
        return DataProvider.makeResult(False, 'User avatar not found.')

@app.route('/v1/user/info')
def get_current_user_info():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    userId = flask.session['userAuth']
    return DataProvider.makeResult(True, DataProvider.getUserInfoByID(userId))

@app.route('/v1/user/register')
def register_user():
    form: dict[str, typing.Any] = flask.request.json
    username = form.get('username')
    password = form.get('password')
    email = form.get('email')
    if not username or not password or not email:
        return DataProvider.makeResult(False, 'Username, password and email are required.')
    else:
        return DataProvider.createUser(username, password, email)

@app.route("/v1/user/login", methods=['POST'])
def login():
    form: dict[str, typing.Any] = flask.request.json
    email = form.get('email')
    password = form.get('password')
    if not email or not password:
        return DataProvider.makeResult(False, 'Email and password are required.')
    else:
        result = DataProvider.checkUserIdentityByEmail(email, password)
        if result['status']:
            flask.session['userAuth'] = result['data']['id']
        return DataProvider.makeResult(True)


@app.route('/v1/user/logout', methods=['POST'])
def logout():
    if 'userAuth' in flask.session:
        del flask.session['userAuth']
    return DataProvider.makeResult(True, 'Logout successfully.')


@app.route('/v1/user/recent_results')
def get_recent_results():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    return DataProvider.getRecentExamResults(userId)

@app.route('/v1/user/exam_results')
def get_exam_results():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    filters = flask.request.json
    examType = filters.get('examType')
    
    
@app.route('/v1/admin/exams/reading/list')
def get_reading_exams():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'new_exam_paper_creat')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    filters = form.get('filters')
    if not filters:
        return DataProvider.makeResult(False, 'Filters are required.')
    
    return DataProvider.getAllReadingExams(filters)
        
        
@app.route('/v1/admin/exams/reading/delete')
def delete_reading_exam():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'new_exam_paper_creat')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    examId = form.get('examId')
    if not examId:
        return DataProvider.makeResult(False, 'Exam ID is required.')
    else:
        return DataProvider.deleteReadingExam(examId)


@app.route('/v1/admin/ask_ai', methods=['POST'])
def ask_ai():
    form: dict[str, typing.Any] = flask.request.json
    model = form.get('model', 'gemini-1.5-flash-002')
    temperature = form.get('temperature', 0.9)
    system_prompt = form.get('system_prompt', None)
    user_prompt = form.get('user_prompt', None)
    token = form.get('token', DataProvider.getGoogleApiKey())
    print(form)
    if system_prompt is None or user_prompt is None or not token:
        return DataProvider.makeResult(ok=False, data='System prompt, user prompt and Google API key is required.')
    else:
        chatModel.genai.configure(api_key=token)
        instance = chatModel.ChatGoogleGenerativeAI(model, temperature, system_prompt)
        return DataProvider.makeResult(ok=True, data={
            'answer': instance.initiate([user_prompt]),
            'temperature': temperature,
            'model': model,
            'system_prompt': system_prompt,
            'user_prompt': user_prompt
        })


@app.route('/v1/admin/users/create', methods=['POST'])
def create_user_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    username = form.get('username')
    password = form.get('password')
    email = form.get('email')
    permissions = form.get('permissions')
    oralExamQuota = form.get('oralExamQuota')
    oralExamViewQuota = form.get('oralExamViewQuota')
    
    if not username or not password or not email or not permissions:
        return DataProvider.makeResult(False, 'Username, password and email are required.')
    else:
        permissions = DataProvider.convertPermissionDictToBin(permissions)
        return DataProvider.createUser(username, password, email, oralExamQuota, oralExamViewQuota, permissions)
        
@app.route('/v1/admin/users/delete', methods=['POST'])
def delete_user_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    userId = form.get('userId')
    if userId is None:
        return DataProvider.makeResult(False, 'User ID is required.')
    else:
        return DataProvider.deleteUser(userId)
        
        
@app.route('/v1/admin/users/update', methods=['POST'])
def update_user_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    username = form.get('username')
    password = form.get('password')
    email = form.get('email')
    permissions = form.get('permissions')
    oralExamQuota = form.get('oralExamQuota')
    oralExamViewQuota = form.get('oralExamViewQuota')
    userId = form.get('userId')
    
    if not username or not password or not email or not permissions or not userId:
        return DataProvider.makeResult(False, 'Username, password, email, permissions and user ID are required.')
    else:
        permissions = DataProvider.convertPermissionDictToBin(permissions)
        return DataProvider.updateUser(userId, username, password, email, oralExamQuota, oralExamViewQuota, permissions)
    
    
@app.route('/v1/user/update_password', methods=['POST'])
def edit_password():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    form: dict[str, typing.Any] = flask.request.json
    oldPassword = form.get('oldPassword')
    newPassword = form.get('newPassword')
    if not oldPassword or not newPassword:
        return DataProvider.makeResult(False, 'Old password and new password are required.')
    else:
        if DataProvider.checkUserIdentityById(userId, oldPassword)['status']:
            return DataProvider.updatePassword(userId, newPassword)
        else:
            return DataProvider.makeResult(False, 'Old password is incorrect.')
        
        
@app.route('/v1/user/update_email', methods=['POST'])
def edit_email():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']    
    form: dict[str, typing.Any] = flask.request.json
    newEmail = form.get('newEmail')
    if not newEmail:
        return DataProvider.makeResult(False, 'New email is required.')
    else:
        return DataProvider.updateEmail(userId, newEmail)
    
    
@app.route('/v1/user/update_username', methods=['POST'])
def edit_username():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    form: dict[str, typing.Any] = flask.request.json
    newUsername = form.get('newUsername')
    if not newUsername:
        return DataProvider.makeResult(False, 'New username is required.')
    else:
        return DataProvider.updateUsername(userId, newUsername)
        
        
@app.route('/v1/admin/users/list', methods=['POST'])
def get_users():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    filters = form.get('filters')
    if filters is None:
        return DataProvider.makeResult(False, 'Filters are required.')
    
    return DataProvider.makeResult(True, DataProvider.getUsers(filters))


@app.route('/v1/artifact/create', methods=['POST'])
def upload_artifact():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'artifact_rw')
    if not perm_result['status']:
        return perm_result
    
    args = flask.request.args
    isPrivate = args.get('isPrivate')
    if isPrivate is None:
        return DataProvider.makeResult(False, 'isPrivate is required.')
    else:
        isPrivate = isPrivate.lower() == 'true'
    
    for i in flask.request.files:
        print(flask.request.files[i])
        file = io.BytesIO()
        flask.request.files[i].save(file)
        file.seek(0)
        return DataProvider.createArtifact(userId, isPrivate, flask.request.files[i].mimetype, file.read())
        # fuck the nexts


@app.route('/v1/artifact/get')
def download_artifact():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'artifact_rw')
    if not perm_result['status']:
        return perm_result
    
    artifactId = flask.request.args.get('id')
    if artifactId is None:
        return DataProvider.makeResult(False, 'Artifact ID is required.')
    else:
        artifact = DataProvider.getArtifactById(artifactId)
        if artifact is None:
            return DataProvider.makeResult(False, 'Artifact not found.')
        if artifact['userId'] != userId or DataProvider.checkIfUserHasPermission(userId, 'administrator')['status'] == False:
            return DataProvider.makeResult(False, 'You do not have permission to access this artifact.')
        
        return makeFileResponse(DataProvider.getArtifactContentById(artifactId), artifact['mimetype'])

    
@app.route('/v1/artifact/list', methods=['POST'])
def get_artifacts():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'artifact_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    filters = form.get('filters')
    if filters is None:
        return DataProvider.makeResult(False, 'Filters are required.')
    
    filters['userId'] = userId
    
    return DataProvider.makeResult(True, DataProvider.getArtifacts(filters))


@app.route('/v1/artifact/delete', methods=['POST'])
def delete_artifact():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'artifact_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    artifactId = form.get('artifactId')
    if artifactId is None:
        return DataProvider.makeResult(False, 'Artifact ID is required.')
    else:
        return DataProvider.deleteArtifact(artifactId)
    
    
@app.route('/v1/admin/artifact/list', methods=['POST'])
def get_artifacts_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    filters = form.get('filters')
    if filters is None:
        return DataProvider.makeResult(False, 'Filters are required.')
    
    return DataProvider.makeResult(True, DataProvider.getArtifacts(filters))


@app.route('/v1/admin/artifact/delete', methods=['POST'])
def delete_artifacts_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    artifactId = form.get('artifactId')
    if artifactId is None:
        return DataProvider.makeResult(False, 'Artifact ID is required.')
    else:
        return DataProvider.deleteArtifact(artifactId)
    

@app.route('/v1/admin/artifact/get')
def download_artifacts_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')    
    if not perm_result['status']:
        return perm_result
    
    artifactId = flask.request.args.get('id')
    if artifactId is None:
        return DataProvider.makeResult(False, 'Artifact ID is required.')
    else:
        artifact = DataProvider.getArtifactById(artifactId)
        if artifact is None:
            return DataProvider.makeResult(False, 'Artifact not found.')
        
        return makeFileResponse(DataProvider.getArtifactContentById(artifactId), artifact['mimetype'])
    
    
@app.route('/v1/admin/artifact/delete_outdated', methods=['POST'])
def delete_outdated_artifacts():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    return DataProvider.deleteAllOutdatedArtifacts()


@app.route('/v1/admin/examination/reading/list', methods=['POST'])
def get_examination_list_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    filters = form.get('filters')
    if filters is None:
        return DataProvider.makeResult(False, 'Filters are required.')
    
    return DataProvider.makeResult(True, DataProvider.getAllReadingExams(filters))


@app.route('/v1/admin/examination/reading/delete', methods=['POST'])
def delete_examination_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    examId = form.get('examId')
    if examId is None:
        return DataProvider.makeResult(False, 'Exam ID is required.')
    else:
        return DataProvider.deleteReadingExam(examId)
    
    
@app.route('/v1/admin/examination/reading/create', methods=['POST'])
def create_examination_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form = flask.request.json
    passages = form.get('passages')
    answerSheetFormat = form.get('answerSheetFormat')
    duration = form.get('duration')
    title = form.get('title')
    availableTime = form.get('availableTime')
    
    if not passages or not answerSheetFormat or not duration or not title or not availableTime:
        return DataProvider.makeResult(False, 'Passages, answer sheet format, duration and title are required.')
    else:
        return DataProvider.createReadingExam(
            userId=userId,
            passages=passages,
            answerSheetFormat=answerSheetFormat,
            duration=duration,
            title=title,
            availableTime=availableTime[0],
            expireTime=availableTime[1]
        )


@app.route('/v1/admin/examination/reading/update', methods=['POST'])
def update_examination_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form = flask.request.json
    examId = form.get('examId')
    passages = form.get('articles')
    answerSheetFormat = form.get('answerSheetFormat')
    duration = form.get('duration')
    title = form.get('title')
    availableTime = form.get('availableTime')
    
    if not examId or not passages or not answerSheetFormat or not duration or not title or not availableTime:
        return DataProvider.makeResult(False, 'Exam ID, passages, answer sheet format, duration and title are required.')
    else:
        return DataProvider.updateReadingExam(
            examId=examId,
            passages=passages,
            answerSheetFormat=answerSheetFormat,
            duration=duration,
            title=title,
            availableTime=availableTime[0],
            expireTime=availableTime[1]
        )


@app.route('/v1/admin/examination/reading/get', methods=['POST'])
def get_examination_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    examId = form.get('examId')
    if examId is None:
        return DataProvider.makeResult(False, 'Exam ID is required.')
    else:
        return DataProvider.getReadingExamById(examId)
    

@app.route('/v1/admin/examination/writing/list', methods=['POST'])
def get_writing_exam_list_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    filters = form.get('filters')
    if filters is None:
        return DataProvider.makeResult(False, 'Filters are required.')
    
    return DataProvider.makeResult(True, DataProvider.getWritingExams(filters))


@app.route('/v1/admin/examination/writing/delete', methods=['POST'])
def delete_writing_exam_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    examId = form.get('examId')
    if examId is None:
        return DataProvider.makeResult(False, 'Exam ID is required.')
    else:
        return DataProvider.deleteWritingExam(examId)

@app.route('/v1/admin/examination/writing/create', methods=['POST'])
def create_writing_exam_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form = flask.request.json
    title = form.get('title')
    availableTime = form.get('availableTime')
    duration = form.get('duration')
    problemStatement = form.get('problemStatement')
    onePossibleVersion = form.get('onePossibleVersion')
    
    if not title or not availableTime or not duration or not problemStatement or not onePossibleVersion:
        return DataProvider.makeResult(False, 'Title, available time, duration, problem statement and one possible version are required.')
    else:
        return DataProvider.createWritingExam(
            userId=userId,
            title=title,
            availableTime=availableTime[0],
            expireTime=availableTime[1],
            duration=duration,
            problemStatement=problemStatement,
            onePossibleVersion=onePossibleVersion
        )
        
        
@app.route('/v1/admin/examination/writing/get', methods=['POST'])
def get_writing_exam_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    examId = form.get('examId')
    if examId is None:
        return DataProvider.makeResult(False, 'Exam ID is required.')
    else:
        return DataProvider.getWritingExamById(examId)



@app.route('/v1/admin/examination/writing/update', methods=['POST'])
def update_writing_exam_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form = flask.request.json
    examId = form.get('examId')
    title = form.get('title')
    availableTime = form.get('availableTime')
    duration = form.get('duration')
    problemStatement = form.get('problemStatement')
    onePossibleVersion = form.get('onePossibleVersion')
    
    if not examId or not title or not availableTime or not duration or not problemStatement or not onePossibleVersion:
        return DataProvider.makeResult(False, 'Exam ID, title, available time, duration, problem statement and one possible version are required.')
    else:
        return DataProvider.updateWritingExam(
            examId=examId,
            title=title,
            availableTime=availableTime[0],
            expireTime=availableTime[1],
            duration=duration,
            problemStatement=problemStatement,
            onePossibleVersion=onePossibleVersion
        )



if __name__ == '__main__':
    app.run(debug=data.config.DEBUG, host=data.config.HOST, port=data.config.PORT)
