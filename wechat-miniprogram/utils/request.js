const config = require('../config/index')
const auth = require('./auth')

function request(options) {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    showError = true
  } = options

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.baseUrl}${url}`,
      method,
      data,
      timeout: config.requestTimeout,
      header: Object.assign(
        {
          'Content-Type': 'application/json'
        },
        auth.getToken()
          ? {
              Authorization: `Bearer ${auth.getToken()}`
            }
          : {},
        header
      ),
      success(res) {
        const payload = res.data

        if (res.statusCode < 200 || res.statusCode >= 300) {
          if (showError) {
            wx.showToast({
              title: '服务异常',
              icon: 'none'
            })
          }
          reject(res)
          return
        }

        if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'code')) {
          if (payload.code === '200') {
            resolve(payload)
            return
          }

          if (payload.msg && /登录|失效/.test(payload.msg)) {
            auth.clearSession()
            wx.reLaunch({
              url: '/pages/login/index'
            })
          }

          if (showError) {
            wx.showToast({
              title: payload.msg || '请求失败',
              icon: 'none'
            })
          }
          reject(payload)
          return
        }

        resolve(payload)
      },
      fail(error) {
        if (showError) {
          wx.showToast({
            title: '网络连接失败',
            icon: 'none'
          })
        }
        reject(error)
      }
    })
  })
}

function uploadFile(options) {
  const {
    url,
    filePath,
    name = 'file',
    formData,
    header = {},
    showError = true
  } = options

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${config.baseUrl}${url}`,
      filePath,
      name,
      formData,
      header: Object.assign(
        {},
        auth.getToken()
          ? {
              Authorization: `Bearer ${auth.getToken()}`
            }
          : {},
        header
      ),
      success(res) {
        let payload = res.data

        if (typeof payload === 'string') {
          try {
            payload = payload ? JSON.parse(payload) : payload
          } catch (error) {
            payload = {
              code: String(res.statusCode),
              msg: '响应解析失败',
              data: null
            }
          }
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          if (showError) {
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            })
          }
          reject(payload)
          return
        }

        if (payload && payload.code && payload.code !== '200') {
          if (showError) {
            wx.showToast({
              title: payload.msg || '上传失败',
              icon: 'none'
            })
          }
          reject(payload)
          return
        }

        resolve(payload)
      },
      fail(error) {
        if (showError) {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          })
        }
        reject(error)
      }
    })
  })
}

module.exports = {
  request,
  uploadFile
}
