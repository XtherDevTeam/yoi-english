import typing
from dataProvider import DataProvider
import flask_cors
import flask
import data.config

app = flask.Flask(__name__)
flask_cors.CORS(app)

@app.route('/v1/service/info', methods=['GET'])
def service_status():
    return {
        'status': 'running',
        'version': data.config.VERSION,
        'buildNumber': data.config.BUILD_NUMBER,
        'authenticated_session': flask.session.get('userAuth') if 'userAuth' in flask.session else '-1'
    }
    
@app.route("/v1/initialize", methods=['GET'])
def initialize():
    form: dict[str, typing.Any] = flask.request.json
    username = form.get('username')
    password = form.get('password')
    email = form.get('email')
    google_api_key = form.get('google_api_key')
    if not username or not password or not email or not google_api_key:
        return DataProvider.makeResult(False, 'Username, password, email and Google API key are required to initialize the server.')
    return DataProvider.initialize(username, password, email, "", "", google_api_key)
    
@app.route('/v1/user/<int:userId>/info')
def get_user_info(userId):
    return DataProvider.getUserInfoByID(userId)

@app.route('/v1/user/info')
def get_current_user_info():
    if 'userAuth' not in flask.session:
        return DataProvider.makeResult(False, 'Please login first.')
    userId = flask.session['userAuth']
    return DataProvider.getUserInfoByID(userId)

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

@app.route("/v1/user/login")
def login():
    form: dict[str, typing.Any] = flask.request.json
    username = form.get('username')
    password = form.get('password')
    if not username or not password:
        return DataProvider.makeResult(False, 'Username and password are required.')
    else:
        result = DataProvider.checkUserIdentity(username, password)
        if result['status']:
            flask.session['userAuth'] = result['data']['id']
        return result


@app.route('/v1/user/logout')
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


if __name__ == '__main__':
    app.run(debug=data.config.DEBUG, host=data.config.HOST, port=data.config.PORT)
