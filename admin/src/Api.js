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
  }).catch(r => {
    return ""
  })
}

function initialize(username, password, email, google_api_key, chatbot_name, chatbot_persona) {
  return axios.post(`${serverUrl}/api/v1/admin/initialize`, {
    username, password, email, google_api_key, chatbot_name, chatbot_persona
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
  return axios.get(`${serverUrl}/api/v1/user${uid ? `/${uid}` : ''}/info`).then(r => {
    return r.data
  })
}

function avatar(uid = null) {
  return `${serverUrl}/api/v1/user${uid ? `/${uid}` : ''}/avatar`
}

function getUsers(filters = {}) {
  return axios.post(`${serverUrl}/api/v1/admin/users/list`, {"filters": filters}).then(r => {
    return r.data
  })
}

export default {
  checkIfLoggedIn, checkIfInitialized, refreshServerUrl, ask_ai, initialize, signin,
  userInfo, avatar, getUsers
}