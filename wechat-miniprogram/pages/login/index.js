const auth = require('../../utils/auth')
const { requestWithFallback } = require('../../utils/api')
const { normalizeAssetUrl } = require('../../utils/url')

Page({
  data: {
    loading: false,
    form: {
      username: '',
      password: ''
    }
  },

  onShow() {
    if (auth.isLoggedIn()) {
      wx.switchTab({
        url: '/pages/table/index'
      })
    }
  },

  onUsernameInput(event) {
    this.setData({
      'form.username': event.detail.value
    })
  },

  onPasswordInput(event) {
    this.setData({
      'form.password': event.detail.value
    })
  },

  async submitLogin() {
    const { username, password } = this.data.form

    if (!username.trim()) {
      wx.showToast({
        title: '请输入账号',
        icon: 'none'
      })
      return
    }

    if (!password.trim()) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      const payload = {
        username: username.trim(),
        password,
        role: 'USER'
      }
      const res = await requestWithFallback(
        {
          url: '/auth/login',
          method: 'POST',
          data: payload
        },
        {
          url: '/login',
          method: 'POST',
          data: payload
        }
      )

      const user = Object.assign({}, res.data || {}, {
        avatar: normalizeAssetUrl(res.data && res.data.avatar)
      })
      delete user.password

      auth.saveSession({
        token: res.data && res.data.token ? res.data.token : '',
        user
      })

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/table/index'
        })
      }, 200)
    } finally {
      this.setData({ loading: false })
    }
  }
})
