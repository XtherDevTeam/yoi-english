import typing
from dataProvider import DataProvider
import flask_cors
import flask
import data.config

app = flask.Flask(__name__)
flask_cors.CORS(app)

@app.route('/service_status', methods=['GET'])
def service_status():
    return {
        'status': 'running',
        'version': data.config.VERSION,
        'buildNumber': data.config.BUILD_NUMBER,
    }
    
@app.route('/v1/user/<int:userId>/info')
def get_user_info(userId):
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


if __name__ == '__main__':
    app.run(debug=data.config.DEBUG, host=data.config.HOST, port=data.config.PORT)
