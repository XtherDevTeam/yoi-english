import axios from 'axios';

import * as storage from './storage';

let serverUrl = ""

function refreshServerUrl() {
  storage.inquireItem("serverAddress", (r, v) => {
    if (!r) {
      serverUrl = null
    } else {
      serverUrl = v
    }
  })
}

refreshServerUrl()

// modify axios default config, such as content type
console.log(axios.defaults.headers)
// use fetch as backend
axios.defaults.adapter = 'fetch';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.post['Accept'] = 'application/json';

function checkIfLoggedIn() {
  return axios.get(`${serverUrl}/api/v1/service/info`).then(r => {
    if (r.data.authenticated_session === -1) {
      storage.removeItem('loginStatus', r => { })
    }
    return r.data.authenticated_session
  }).catch(r => {
    console.log(Object.keys(r), r.code, r.name, r.config, r.cause)
    return false;
  })
}

function getUserName() {
  return axios.get(`${serverUrl}/api/v1/service/info`).then(r => {
    return r.data.session_username
  }).catch(r => {
    return 'guest'
  })
}

function checkIfInitialized() {
  return axios.get(`${serverUrl}/api/v1/service/info`).then(r => {
    return r.data.initialized
  }).catch(r => { throw r })
}

function signIn(email, password) {
  return axios.post(`${serverUrl}/api/v1/user/login`, {
    email,
    password
  }, { withCredentials: true }).then(r => {
    if (r.data.status) {
      storage.setItem('loginStatus', true, r => { })
    }
    return r.data
  })
}

function getServiceInfo() {
  return axios.get(`${serverUrl}/api/v1/service/info`).then(r => {
    return r.data
  })
}

function getUserInfo(userId) {
  return axios.post(`${serverUrl}/api/v1/user/${userId}/info`).then(r => {
    return r.data
  })
}

function userAvatar(userId) {
  return `${serverUrl}/api/v1/user/${userId}/avatar`
}

function myAvatar() {
  return `${serverUrl}/api/v1/user/avatar`
}

function myInfo() {
  return axios.post(`${serverUrl}/api/v1/user/info`).then(r => {
    return r.data
  })
}

function recentResults() {
  return axios.post(`${serverUrl}/api/v1/user/recent_results`).then(r => {
    return r.data
  })
}

function getReadingExamList() {
  return axios.post(`${serverUrl}/api/v1/exam/reading/list`).then(r => {
    return r.data
  })
}

function getWritingExamList() {
  return axios.post(`${serverUrl}/api/v1/exam/writing/list`).then(r => {
    return r.data
  })
}

function getOralExamList() {
  return axios.post(`${serverUrl}/api/v1/exam/oral/list`).then(r => {
    return r.data
  })
}

function establishOralExamSession(examId) {
  return axios.post(`${serverUrl}/api/v1/exam/session/oral/establish`, {
    examId
  }).then(r => {
    return r.data
  })
}

function getOngoingSession() {
  return axios.post(`${serverUrl}/api/v1/exam/session/ongoing`).then(r => {
    return r.data
  })
}

function establishReadingExamSession(examId) {
  return axios.post(`${serverUrl}/api/v1/exam/session/reading/establish`, {
    examId
  }).then(r => {
    return r.data
  })
}


function establishWritingExamSession(examId) {
  return axios.post(`${serverUrl}/api/v1/exam/session/writing/establish`, {
    examId
  }).then(r => {
    return r.data
  })
}

function getSessionDetails(type, sessionId) {
  return axios.post(`${serverUrl}/api/v1/exam/session/${type}/get_details`, {
    sessionId
  }).then(r => {
    return r.data
  })
}

function updateWritingExamSessionAnswer(sessionId, answer) {
  return axios.post(`${serverUrl}/api/v1/exam/session/writing/update_answer`, {
    sessionId,
    answer
  }).then(r => {
    return r.data
  })
}

function updateReadingExamSessionAnswer(sessionId, answers) {
  return axios.post(`${serverUrl}/api/v1/exam/session/reading/update_answer`, {
    sessionId,
    answer: answers
  }).then(r => {
    return r.data
  })
}

function finalizeWritingExamSession(sessionId, answer = undefined) {
  return axios.post(`${serverUrl}/api/v1/exam/session/writing/finalize`, {
    sessionId,
    answer
  }).then(r => {
    return r.data
  })
}

function finalizeReadingExamSession(sessionId, answer = undefined) {
  return axios.post(`${serverUrl}/api/v1/exam/session/reading/finalize`, {
    sessionId,
    answer
  }).then(r => {
    return r.data
  })
}

function getWritingExamResult(id) {
  return axios.post(`${serverUrl}/api/v1/exam_result/writing/get`, {
    id
  }).then(r => {
    return r.data
  })
}

function getReadingExamResult(id) {
  return axios.post(`${serverUrl}/api/v1/exam_result/reading/get`, {
    id
  }).then(r => {
    return r.data
  })
}

// /v1/exam_result/reading/list
function getReadingExamResultList() {
  return axios.post(`${serverUrl}/api/v1/exam_result/reading/list`).then(r => {
    return r.data
  })
}

// /v1/exam_result/writing/list
function getWritingExamResultList() {
  return axios.post(`${serverUrl}/api/v1/exam_result/writing/list`).then(r => {
    return r.data
  })
}

function signOut() {
  return axios.post(`${serverUrl}/api/v1/user/logout`, { withCredentials: true }).then(r => {
    storage.removeItem('loginStatus', r => { })
    return r.data
  })
}

export {
  checkIfLoggedIn,
  getUserName,
  checkIfInitialized,
  signIn,
  getServiceInfo,
  refreshServerUrl,
  getUserInfo,
  userAvatar,
  myAvatar,
  myInfo,
  recentResults,
  getReadingExamList,
  getWritingExamList,
  getOralExamList,
  getOngoingSession,
  establishReadingExamSession,
  establishWritingExamSession,
  getSessionDetails,
  updateWritingExamSessionAnswer,
  updateReadingExamSessionAnswer,
  finalizeWritingExamSession,
  finalizeReadingExamSession,
  getWritingExamResult,
  getReadingExamResult,
  getReadingExamResultList,
  getWritingExamResultList,
  signOut,
  establishOralExamSession,
};