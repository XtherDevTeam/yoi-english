import json
import typing
from dataProvider import DataProvider
from examSessionManager import ExamSessionManager
import flask_cors
import flask
import data.config
import chatModel
import io
import time
import os

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


@app.before_request
def before_request():
    if DataProvider.getGoogleApiKey() is not None:
        chatModel.genai.configure(api_key=DataProvider.getGoogleApiKey())


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
        'initialized': DataProvider.checkIfInitialized(),
        "authorized_organization": data.config.AUTHORIZED_ORGANIZATION,
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
    AIDubEndpoint = form.get('AIDubEndpoint')
    AIDubModel = form.get('AIDubModel')
    if not username or not password or not email or not google_api_key or not chatbot_persona or not chatbot_name or not AIDubEndpoint or not AIDubModel:
        return DataProvider.makeResult(False, 'Username, password, email, Google API key, chatbot persona, chatbot name, AIDubEndpoint, AIDubModel are required to initialize the server.')
    print(email, password, username)
    return DataProvider.initialize(username, password, email, chatbot_name, chatbot_persona, google_api_key, AIDubEndpoint, AIDubModel)
    

@app.route('/v1/user/info', methods=['POST'])
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
        else:
            return result


@app.route('/v1/user/logout', methods=['POST'])
def logout():
    if 'userAuth' in flask.session:
        del flask.session['userAuth']
    return DataProvider.makeResult(True, 'Logout successfully.')


@app.route('/v1/user/info', methods=['POST'])
def get_user_info():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    return DataProvider.makeResult(True, DataProvider.getUserInfoByID(userId))


@app.route('/v1/user/avatar', methods=['GET'])
def get_user_avatar_by_id():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    data, mime =  DataProvider.getUserAvatarByID(userId)
    if data:
        return makeFileResponse(data, mime)
    else:
        return DataProvider.makeResult(False, 'User avatar not found.')


@app.route('/v1/user/<int:userId>/avatar', methods=['GET'])
def get_user_avatar_by_id_admin(userId):
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')

    data, mime =  DataProvider.getUserAvatarByID(userId)
    if data:
        return makeFileResponse(data, mime)
    else:
        return DataProvider.makeResult(False, 'User avatar not found.')


@app.route('/v1/user/<int:userId>/info', methods=['POST'])
def get_user_info_id(userId):
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    return DataProvider.makeResult(True, DataProvider.getUserInfoByID(userId, True))


@app.route('/v1/user/recent_results', methods=['POST'])
def get_recent_results():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    return DataProvider.getRecentExamResults(userId)

@app.route('/v1/user/exam_results', methods=['POST'])
def get_exam_results():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    filters = flask.request.json
    examType = filters.get('examType')
    
    
@app.route('/v1/admin/exams/reading/list', methods=['POST'])
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
        
        
@app.route('/v1/admin/exams/reading/delete', methods=['POST'])  
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


@app.route('/v1/admin/config/get', methods=['POST'])
def get_config():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    return json.loads(json.dumps(DataProvider.getConfig(), default=lambda x: None))


@app.route('/v1/admin/config/update', methods=['POST'])
def update_config():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    formerConfig = DataProvider.getConfig()['data']
    
    form: dict[str, typing.Any] = flask.request.json
    chatbotPersona = form.get('chatbotPersona', formerConfig['chatbotPersona'])
    chatbotName = form.get('chatbotName', formerConfig['chatbotName'])
    AIDubEndpoint = form.get('AIDubEndpoint', formerConfig['AIDubEndpoint'])
    AIDubModel = form.get('AIDubModel', formerConfig['AIDubModel'])
    enableRegister = form.get('enableRegister', formerConfig['enableRegister'])
    googleApiKey = form.get('googleApiKey', DataProvider.getGoogleApiKey())
    
    if not chatbotPersona or not chatbotName or not AIDubEndpoint or not AIDubModel or not googleApiKey:
        return DataProvider.makeResult(False, 'Chatbot persona, chatbot name, AIDubEndpoint, AIDubModel and Google API key are required.')
    else:
        return DataProvider.updateConfig(chatbotName, chatbotPersona, AIDubEndpoint, AIDubModel, enableRegister, googleApiKey)


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


@app.route('/v1/admin/generate_answer_sheet', methods=['POST'])
def generate_answer_sheet():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'new_exam_paper_creat')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    examPaper = form.get('examPaper')
    if not examPaper:
        return DataProvider.makeResult(False, 'Exam paper text is required.')
    else:
        prompt = chatModel.Prompt(data.config.PROMPT_FOR_ANSWER_SHEET_GENERATION, {
            'examPaper': examPaper
        })
        model = chatModel.ChatGoogleGenerativeAI('gemini-2.0-flash-exp', 0.9)
        resp = model.initiate([prompt])
        answer_sheet_format = resp[resp.rfind('[answer_sheet_format]') + 22: resp.rfind('[/answer_sheet_format]')]
        print(resp, '\n', answer_sheet_format)
        try:
            return DataProvider.makeResult(True, json.loads(answer_sheet_format))
        except:
            return DataProvider.makeResult(False, 'Invalid answer sheet format given in response.')
        


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


@app.route('/v1/admin/examination/oral/list', methods=['POST'])
def get_oral_exam_list_admin():
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
    
    return DataProvider.makeResult(True, DataProvider.getAllOralExams(filters))


@app.route('/v1/admin/examination/oral/delete', methods=['POST'])
def delete_oral_exam_admin():
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
        return DataProvider.deleteOralExam(examId)

@app.route('/v1/admin/examination/oral/create/get_preferred_topics')
def get_preferred_topics_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    return DataProvider.makeResult(True, data.config.PREFERRED_ORAL_EXAM_TOPICS)

@app.route('/v1/admin/examination/oral/create', methods=['POST'])
def create_oral_exam_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form = flask.request.json
    title = form.get('title')
    availableTime = form.get('availableTime')
    warmUpTopics = form.get('warmUpTopics')
    mainTopic = form.get('mainTopic')
    
    if not title or not availableTime or not warmUpTopics or not mainTopic:
        return DataProvider.makeResult(False, 'Title, available time, warm up topics and main topic are required.')
    else:
        return DataProvider.createOralExam(
            userId=userId,
            title=title,
            availableTime=availableTime[0],
            expireTime=availableTime[1],
            warmUpTopics=warmUpTopics,
            mainTopic=mainTopic
        )


@app.route('/v1/admin/examination/oral/get', methods=['POST'])
def get_oral_exam_admin():
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
        return DataProvider.getOralExamById(examId)


@app.route('/v1/admin/examination/oral/update', methods=['POST'])
def update_oral_exam_admin():
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
    warmUpTopics = form.get('warmUpTopics')
    mainTopic = form.get('mainTopic')
    
    if not examId or not title or not availableTime or not warmUpTopics or not mainTopic:
        return DataProvider.makeResult(False, 'Exam ID, title, available time, duration, warm up topics and main topic are required.')
    else:
        return DataProvider.updateOralExam(
            examId=examId,
            title=title,
            availableTime=availableTime[0],
            expireTime=availableTime[1],
            warmUpTopics=warmUpTopics,
            mainTopic=mainTopic
        )


@app.route('/v1/exam/reading/list', methods=['POST'])
def get_reading_exam_list():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    return DataProvider.makeResult(True, DataProvider.getAllReadingExams())


@app.route('/v1/exam/writing/list', methods=['POST'])
def get_writing_exam_list():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result

    
    return DataProvider.makeResult(True, DataProvider.getAllWritingExams())


@app.route('/v1/exam/oral/list', methods=['POST'])
def get_oral_exam_list():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    return DataProvider.makeResult(True, DataProvider.getAllOralExams())


@app.route('/v1/exam/session/reading/establish', methods=['POST'])
def establish_reading_exam_session():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    if ExamSessionManager.getOngoingSessionOfUser(userId) is not None:
        return DataProvider.makeResult(False, 'You have an ongoing session.')
    
    form: dict[str, typing.Any] = flask.request.json
    examId = form.get('examId')
    if examId is None:
        return DataProvider.makeResult(False, 'Exam ID is required.')
    else:
        sid = ExamSessionManager.createReadingExamSession(examId, userId)
        if sid is None:
            return DataProvider.makeResult(False, 'Failed to establish session.')
        else:
            return DataProvider.makeResult(True, {
               'sessionId': sid
            })
            
            
@app.route('/v1/exam/session/writing/establish', methods=['POST'])
def establish_writing_exam_session():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    if ExamSessionManager.getOngoingSessionOfUser(userId) is not None:
        return DataProvider.makeResult(False, 'You have an ongoing session.')
    
    form: dict[str, typing.Any] = flask.request.json
    examId = form.get('examId')
    if examId is None:
        return DataProvider.makeResult(False, 'Exam ID is required.')
    else:
        return DataProvider.makeResult(True, {
           'sessionId': ExamSessionManager.createWritingExamSession(examId, userId)
        })
    
    
@app.route('/v1/exam/session/oral/establish', methods=['POST'])
def establish_oral_exam_session():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    if ExamSessionManager.getOngoingSessionOfUser(userId) is not None:
        return DataProvider.makeResult(False, 'You have an ongoing session.')
    
    form: dict[str, typing.Any] = flask.request.json
    examId = form.get('examId')
    if examId is None:
        return DataProvider.makeResult(False, 'Exam ID is required.')
    else:
        return DataProvider.makeResult(True, {
           'sessionId': ExamSessionManager.createOralExamSession(examId, userId)
        })
        
        
@app.route('/v1/exam/session/oral/get_details', methods=['POST'])
def get_oral_exam_session_details():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    sessionId = form.get('sessionId')
    if sessionId is None:
        return DataProvider.makeResult(False, 'Session ID is required.')
    else:
        details = ExamSessionManager.getSessionDetails(sessionId)
        if details is None:
            return DataProvider.makeResult(False, 'Session not found.')
        else:
            return DataProvider.makeResult(True, details)
    
    
@app.route('/v1/exam/session/reading/get_details', methods=['POST'])
def get_reading_exam_session_details():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    sessionId = form.get('sessionId')
    if sessionId is None:
        return DataProvider.makeResult(False, 'Session ID is required.')
    else:
        return DataProvider.makeResult(True, ExamSessionManager.getSessionDetails(sessionId))
    

@app.route('/v1/exam/session/reading/update_answer', methods=['POST'])
def update_reading_exam_session_answer():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    sessionId = form.get('sessionId')
    answer = form.get('answer')
    if sessionId is None or answer is None or ExamSessionManager.getSessionDetails(sessionId) is None:
        return DataProvider.makeResult(False, 'Session ID and answer are required.')
    elif ExamSessionManager.getSessionDetails(sessionId)['userId'] != userId:
        return DataProvider.makeResult(False, 'You are not authorized to update this session.')
    else:
        return DataProvider.makeResult(True, ExamSessionManager.updateReadingExamSessionAnswer(sessionId, answer))
    
    
@app.route('/v1/exam/session/reading/finalize', methods=['POST'])
def finalize_reading_exam_session():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    sessionId = form.get('sessionId')
    answer = form.get('answer')
    if sessionId is None:
        return DataProvider.makeResult(False, 'Session ID is required.')
    else:
        if answer is not None:
            ExamSessionManager.updateReadingExamSessionAnswer(sessionId, answer)
        return ExamSessionManager.finalizeReadingExamSession(sessionId)
    
@app.route('/v1/exam/session/writing/get_details', methods=['POST'])
def get_writing_exam_session_details():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    sessionId = form.get('sessionId')
    if sessionId is None:
        return DataProvider.makeResult(False, 'Session ID is required.')
    else:
        return DataProvider.makeResult(True, ExamSessionManager.getSessionDetails(sessionId))
    

@app.route('/v1/exam/session/writing/update_answer', methods=['POST'])
def update_writing_exam_session_answer():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    sessionId = form.get('sessionId')
    answer = form.get('answer')
    if sessionId is None or answer is None or ExamSessionManager.getSessionDetails(sessionId) is None:
        return DataProvider.makeResult(False, 'Session ID and answer are required.')
    elif ExamSessionManager.getSessionDetails(sessionId)['userId'] != userId:
        return DataProvider.makeResult(False, 'You are not authorized to update this session.')
    else:
        return DataProvider.makeResult(True, ExamSessionManager.updateWritingExamSessionAnswer(sessionId, answer))
    
    
@app.route('/v1/exam/session/writing/finalize', methods=['POST'])
def finalize_writing_exam_session():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    sessionId = form.get('sessionId')
    answer = form.get('answer')
    
    if sessionId is None:
        return DataProvider.makeResult(False, 'Session ID is required.')
    else:
        if answer is not None:
            ExamSessionManager.updateWritingExamSessionAnswer(sessionId, answer)
        
        return ExamSessionManager.finalizeWritingExamSession(sessionId)


@app.route('/v1/exam/session/ongoing', methods=['POST'])
def get_ongoing_exam_session():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    result = ExamSessionManager.getOngoingSessionOfUser(userId)
    return DataProvider.makeResult(True, result) if result else DataProvider.makeResult(False, 'No ongoing session.')


@app.route('/v1/exam_result/reading/list', methods=['POST'])
def get_reading_exam_result_list():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    filters = {
        'userId': userId
    }
    if filters is None:
        return DataProvider.makeResult(False, 'Filters are required.')
    else:
        return DataProvider.makeResult(True, DataProvider.getReadingExamResultList(filters))
    

@app.route('/v1/exam_result/writing/list', methods=['POST'])
def get_writing_exam_result_list():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    filters = {
        'userId': userId
    }
    if filters is None:
        return DataProvider.makeResult(False, 'Filters are required.')
    else:
        return DataProvider.makeResult(True, DataProvider.getWritingExamResultList(filters))
    
    
@app.route('/v1/exam_result/oral/list', methods=['POST'])
def get_oral_exam_result_list():
    ...
    
    
@app.route('/v1/exam_result/reading/get', methods=['POST'])
def get_reading_exam_result():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    recordId = form.get('id')
    if recordId is None:
        return DataProvider.makeResult(False, 'Exam ID is required.')
    else:
        return DataProvider.getAcademicalEnglishExamResultById(recordId)
    
    
@app.route('/v1/exam_result/writing/get', methods=['POST'])
def get_writing_exam_result():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    recordId = form.get('id')
    if recordId is None:
        return DataProvider.makeResult(False, 'Exam ID is required.')
    else:
        return DataProvider.getWritingExamResultById(recordId)
    
    
@app.route('/v1/exam_result/oral/get', methods=['POST'])
def get_oral_exam_result():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'exam_rw')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    recordId = form.get('id')
    if recordId is None:
        return DataProvider.makeResult(False, 'Exam ID is required.')
    else:
        ...


@app.route('/v1/admin/exam_session/list', methods=['POST'])
def get_exam_session_list():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    return DataProvider.makeResult(True, ExamSessionManager.getExaminationSessionList())


@app.route('/v1/admin/exam_result/reading/list', methods=['POST'])
def get_reading_exam_result_list_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form = flask.request.json
    filters = form.get('filters')
    if filters is None:
        return DataProvider.makeResult(False, 'Filters are required.')
    else:
        return DataProvider.makeResult(True, DataProvider.getReadingExamResultList(filters))
    
    
@app.route('/v1/admin/exam_result/writing/list', methods=['POST'])
def get_writing_exam_result_list_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form = flask.request.json
    filters = form.get('filters')
    if filters is None:
        return DataProvider.makeResult(False, 'Filters are required.')
    else:
        return DataProvider.makeResult(True, DataProvider.getWritingExamResultList(filters))
    
    
@app.route('/v1/admin/exam_result/oral/list', methods=['POST'])
def get_oral_exam_result_list_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form = flask.request.json
    filters = form.get('filters')
    if filters is None:
        return DataProvider.makeResult(False, 'Filters are required.')
    else:
        ...


@app.route('/v1/admin/exam_result/reading/get', methods=['POST'])
def get_reading_exam_result_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form = flask.request.json
    recordId = form.get('id')
    if recordId is None:
        return DataProvider.makeResult(False, 'Exam result ID is required.')
    else:
        return DataProvider.getAcademicalEnglishExamResultById(recordId)
    

@app.route('/v1/admin/exam_result/writing/get', methods=['POST'])
def get_writing_exam_result_admin():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'administrator')
    if not perm_result['status']:
        return perm_result
    
    form = flask.request.json
    recordId = form.get('id')
    if recordId is None:
        return DataProvider.makeResult(False, 'Exam result ID is required.')
    else:
        return DataProvider.getWritingExamResultById(recordId)


if __name__ == '__main__':
    app.run(debug=data.config.DEBUG, host=data.config.HOST, port=data.config.PORT)
