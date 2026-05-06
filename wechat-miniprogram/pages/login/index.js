const auth = require('../../utils/auth')
const { requestWithFallback } = require('../../utils/api')
const { normalizeAssetUrl } = require('../../utils/url')

Page({
  data: {
    loading: false,
    mode: 'login',
    form: {
      username: '',
      password: '',
      confirmPassword: '',
      name: ''
    }
  },

  onShow() {
    if (auth.isLoggedIn()) {
      wx.switchTab({
        url: '/pages/table/index'
      })
    }
  },

  switchMode() {
    this.setData({
      mode: this.data.mode === 'login' ? 'register' : 'login',
      loading: false
    })
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

  onConfirmPasswordInput(event) {
    this.setData({
      'form.confirmPassword': event.detail.value
    })
  },

  onNameInput(event) {
    this.setData({
      'form.name': event.detail.value
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
  },

  async submitRegister() {
    const { username, password, confirmPassword, name } = this.data.form

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

    if (!confirmPassword.trim()) {
      wx.showToast({
        title: '请确认密码',
        icon: 'none'
      })
      return
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码不一致',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      await requestWithFallback({
        url: '/auth/register',
        method: 'POST',
        data: {
          username: username.trim(),
          password,
          name: name.trim(),
          role: 'USER'
        }
      })

      wx.showToast({
        title: '注册成功',
        icon: 'success'
      })

      this.setData({
        mode: 'login',
        'form.password': '',
        'form.confirmPassword': ''
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})
