const config = require('../config/index')

function getToken() {
  return wx.getStorageSync(config.storageKeys.token) || ''
}

function getUser() {
  return wx.getStorageSync(config.storageKeys.user) || null
}

function saveSession(payload) {
  const hasToken = payload && Object.prototype.hasOwnProperty.call(payload, 'token')
  let token = hasToken ? payload.token : getToken()
  const user = payload && payload.user ? payload.user : null

  if (config.apiMode === 'legacy' && !token && user) {
    token = 'legacy-session'
  }

  if (typeof token === 'string') {
    wx.setStorageSync(config.storageKeys.token, token)
  }
  if (user) {
    wx.setStorageSync(config.storageKeys.user, user)
  }
}

function clearSession() {
  wx.removeStorageSync(config.storageKeys.token)
  wx.removeStorageSync(config.storageKeys.user)
}

function isLoggedIn() {
  const user = getUser()
  const token = getToken()
  if (config.apiMode === 'legacy') {
    return !!user
  }
  return !!user && !!token
}

function requireLogin() {
  const user = getUser()
  const token = getToken()
  const hasSession = config.apiMode === 'legacy' ? !!user : (!!user && !!token)
  if (!hasSession) {
    clearSession()
    wx.reLaunch({
      url: '/pages/login/index'
    })
    return null
  }
  return user
}

module.exports = {
  getToken,
  getUser,
  saveSession,
  clearSession,
  isLoggedIn,
  requireLogin
}
