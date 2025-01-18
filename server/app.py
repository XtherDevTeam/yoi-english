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
    
@app.route('/v1/admin/exams/reading/create')
def create_reading_exam():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    
    userId = flask.session['userAuth']
    perm_result = DataProvider.checkIfUserHasPermission(userId, 'new_exam_paper_creat')
    if not perm_result['status']:
        return perm_result
    
    form: dict[str, typing.Any] = flask.request.json
    passages = form.get('passages')
    answerSheetFormat = form.get('answerSheetFormat')
    duration = form.get('duration')
    answers = form.get('answers')
    if not passages or not answerSheetFormat or not duration:
        return DataProvider.makeResult(False, 'Passages, answer sheet format and duration are required.')
    else:
        return DataProvider.createReadingExam(userId, passages, answerSheetFormat, answers, duration)
    
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

if __name__ == '__main__':
    app.run(debug=data.config.DEBUG, host=data.config.HOST, port=data.config.PORT)
