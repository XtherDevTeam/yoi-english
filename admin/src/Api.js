import axios from 'axios';

let serverUrl = ""

function refreshServerUrl() {
  let serverAddress = window.localStorage.getItem("serverAddress")
  if (serverAddress) {
    serverUrl = `${serverAddress}`
  } else {
    serverUrl = ``
  }
}

refreshServerUrl()

function checkIfLoggedIn() {
  return axios.get(`${serverUrl}/api/v1/service/info`).then(r => {
    console.log(r.data.authenticated_session)
    if (r.data.authenticated_session === -1) {
      window.localStorage.removeItem("serverAddress")
    }
    return r.data.authenticated_session !== -1
  }).catch(r => {
    return false;
  })
}

function checkIfInitialized() {
  return axios.get(`${serverUrl}/api/v1/service/info`).then(r => {
    console.log(r.data.initialized)
    return r.data.initialized
  }).catch(r => {
    return false;
  })
}

function ask_ai(model, temperature, system_prompt, user_prompt, token) {
  return axios.post(`${serverUrl}/api/v1/admin/ask_ai`, {
    model, temperature, system_prompt, user_prompt, token
  }).then(r => {
    return r.data
  })
}

function ask_ai_only_user_prompt(user_prompt) {
  return axios.post(`${serverUrl}/api/v1/admin/ask_ai`, {
    user_prompt,
    system_prompt: ""
  }).then(r => {
    return r.data
  })
}

function initialize(username, password, email, google_api_key, chatbot_name, chatbot_persona, AIDubEndpoint, AIDubModel) {
  return axios.post(`${serverUrl}/api/v1/admin/initialize`, {
    username, password, email, google_api_key, chatbot_name, chatbot_persona, AIDubEndpoint, AIDubModel
  }).then(r => {
    return r.data
  }).catch(r => {
    throw r
  })
}

function signin(email, password) {
  // vaildate email
  if (email === "" || password === "") {
    return Promise.reject("E-mail or password cannot be empty")
  }
  let email_vaildate = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email_vaildate.test(email)) {
    return Promise.reject("Invalid email format")
  }
  return axios.post(`${serverUrl}/api/v1/user/login`, {
    email, password
  }).then(r => {
    return r.data
  })
}

function userInfo(uid = null) {
  return axios.post(`${serverUrl}/api/v1/user${uid ? `/${uid}` : ''}/info`).then(r => {
    return r.data
  })
}

function avatar(uid = null) {
  return `${serverUrl}/api/v1/user${uid ? `/${uid}` : ''}/avatar`
}

function getUsers(filters = {}) {
  return axios.post(`${serverUrl}/api/v1/admin/users/list`, { "filters": filters }).then(r => {
    return r.data
  })
}

function getArtifacts(filters = {}) {
  return axios.post(`${serverUrl}/api/v1/admin/artifact/list`, { "filters": filters }).then(r => {
    return r.data
  })
}

function deleteArtifact(id) {
  return axios.post(`${serverUrl}/api/v1/admin/artifact/delete`, { artifactId: id }).then(r => {
    return r.data
  })
}

function getArtifactDownloadUrl(id) {
  return `${serverUrl}/api/v1/artifact/get?id=${id}`
}

function artifactCreateUrl(isPrivate = false) {
  return `${serverUrl}/api/v1/artifact/create?isPrivate=${isPrivate}`
}

function getReadingExaminationList(filters = {}) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/reading/list`, { "filters": filters }).then(r => {
    return r.data
  })
}

function getReadingExamination(id) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/reading/get`, { "examId": id }).then(r => {
    return r.data
  })
}

function createReadingExamination(title, passages, answerSheetFormat, duration, availableTime) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/reading/create`, {
    "title": title,
    "passages": passages,
    "answerSheetFormat": answerSheetFormat,
    "duration": duration,
    "availableTime": availableTime
  }).then(r => {
    return r.data
  })
}

function deleteReadingExamination(id) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/reading/delete`, { "examId": id }).then(r => {
    return r.data
  })
}


function getWritingExaminationList(filters = {}) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/writing/list`, { "filters": filters }).then(r => {
    return r.data
  })
}

function getWritingExamination(id) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/writing/get`, { "examId": id }).then(r => {
    return r.data
  })
}

function createWritingExamination(title, availableTime, duration, problemStatement, onePossibleVersion) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/writing/create`, {
    "title": title,
    "availableTime": availableTime,
    "duration": duration,
    "problemStatement": problemStatement,
    "onePossibleVersion": onePossibleVersion
  }).then(r => {
    return r.data
  })
}


function updateWritingExamination(id, title, availableTime, duration, problemStatement, onePossibleVersion) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/writing/update`, {
    "examId": id,
    "title": title,
    "availableTime": availableTime,
    "duration": duration,
    "problemStatement": problemStatement,
    "onePossibleVersion": onePossibleVersion
  }).then(r => {
    return r.data
  })
}

function updateReadingExamination(id, title, passages, answerSheetFormat, duration, availableTime) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/reading/update`, {
    "examId": id,
    "title": title,
    "passages": passages,
    "answerSheetFormat": answerSheetFormat,
    "duration": duration,
    "availableTime": availableTime
  }).then(r => {
    return r.data
  })
}


function deleteWritingExamination(id) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/writing/delete`, { "examId": id }).then(r => {
    return r.data
  })
}

function createUser(username, password, email, oralExamQuota, oralExamViewQuota, permissions) {
  return axios.post(`${serverUrl}/api/v1/admin/users/create`, {
    "username": username,
    "password": password,
    "email": email,
    "oralExamQuota": oralExamQuota,
    "oralExamViewQuota": oralExamViewQuota,
    "permissions": permissions
  }).then(r => {
    return r.data
  })
}

function deleteUser(uid) {
  return axios.post(`${serverUrl}/api/v1/admin/users/delete`, { "userId": uid }).then(r => {
    return r.data
  })
}


function updateUsername(username) {
  return axios.post(`${serverUrl}/api/v1/user/update_username`, { "newUsername": username }).then(r => {
    return r.data
  })
}

function updatePassword(oldPassword, newPassword) {
  return axios.post(`${serverUrl}/api/v1/user/update_password`, { "oldPassword": oldPassword, "newPassword": newPassword }).then(r => {
    return r.data
  })
}

function updateEmail(email) {
  return axios.post(`${serverUrl}/api/v1/user/update_email`, { "newEmail": email }).then(r => {
    return r.data
  })
}

// /v1/admin/exam_session/list
function getExamSessionList(filters = {}) {
  return axios.post(`${serverUrl}/api/v1/admin/exam_session/list`, { "filters": filters }).then(r => {
    return r.data
  })
}


// /v1/admin/exam_result/reading/list
function getReadingExamResultList(filters = {}) {
  return axios.post(`${serverUrl}/api/v1/admin/exam_result/reading/list`, { "filters": filters }).then(r => {
    return r.data
  })
}

// /v1/admin/exam_result/writing/list
function getWritingExamResultList(filters = {}) {
  return axios.post(`${serverUrl}/api/v1/admin/exam_result/writing/list`, { "filters": filters }).then(r => {
    return r.data
  })
}

// /v1/admin/exam_result/reading/get
function getReadingExamResult(id) {
  return axios.post(`${serverUrl}/api/v1/admin/exam_result/reading/get`, { id }).then(r => {
    return r.data
  })
}

// /v1/admin/exam_result/writing/get
function getWritingExamResult(id) {
  return axios.post(`${serverUrl}/api/v1/admin/exam_result/writing/get`, { id }).then(r => {
    return r.data
  })
}

function getOralExaminationList(filters = {}) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/oral/list`, { "filters": filters }).then(r => {
    return r.data
  })
}

function createOralExamination(title, availableTime, warmUpTopics, mainTopic) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/oral/create`, {
    "title": title,
    "availableTime": availableTime,
    "warmUpTopics": warmUpTopics,
    "mainTopic": mainTopic
  }).then(r => {
    return r.data
  })
}

function updateOralExamination(id, title, availableTime, warmUpTopics, mainTopic) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/oral/update`, {
    "examId": id,
    "title": title,
    "availableTime": availableTime,
    "warmUpTopics": warmUpTopics,
    "mainTopic": mainTopic
  }).then(r => {
    return r.data
  })
}

function deleteOralExamination(id) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/oral/delete`, { "examId": id }).then(r => {
    return r.data
  })
}

function getOralExamination(id) {
  return axios.post(`${serverUrl}/api/v1/admin/examination/oral/get`, { "examId": id }).then(r => {
    return r.data
  })
}

function signOut() {
  return axios.post(`${serverUrl}/api/v1/user/logout`).then(r => {
    return r.data
  })
}

function getPreferredExamTopics() {
  return axios.get(`${serverUrl}/api/v1/admin/examination/oral/create/get_preferred_topics`).then(r => {
    return r.data
  })
}


function updateConfig(chatbotName, chatbotPersona, AIDubEndpoint, AIDubModel, enableRegister, googleApiKey) {
  return axios.post(`${serverUrl}/api/v1/admin/config/update`, {
    "chatbotName": chatbotName,
    "chatbotPersona": chatbotPersona,
    "AIDubEndpoint": AIDubEndpoint,
    "AIDubModel": AIDubModel,
    "enableRegister": enableRegister,
    "googleApiKey": googleApiKey
  }).then(r => {
    return r.data
  })
}

function getConfig() {
  return axios.post(`${serverUrl}/api/v1/admin/config/get`).then(r => {
    return r.data
  })
}


function answerSheetGeneration(examPaper) {
  return axios.post(`${serverUrl}/api/v1/admin/generate_answer_sheet`, {
    "examPaper": examPaper
  }).then(r => {
    return r.data
  })
}


export default {
  checkIfLoggedIn, checkIfInitialized, refreshServerUrl, ask_ai, initialize, signin,
  userInfo, avatar, getUsers, getArtifacts, deleteArtifact, getArtifactDownloadUrl, artifactCreateUrl,
  getReadingExaminationList, createReadingExamination, getReadingExamination, deleteReadingExamination,
  getWritingExaminationList, createWritingExamination, getWritingExamination, ask_ai_only_user_prompt,
  updateWritingExamination, deleteWritingExamination, updateReadingExamination, createUser, deleteUser,
  updateUsername, updatePassword, updateEmail, getReadingExamResultList, getReadingExamResult,
  getWritingExamResultList, getWritingExamResult, signOut, getExamSessionList, getOralExaminationList, createOralExamination,
  updateOralExamination, deleteOralExamination, getOralExamination, getPreferredExamTopics, updateConfig, getConfig,
  answerSheetGeneration
}