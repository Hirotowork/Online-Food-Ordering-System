const auth = require('../../utils/auth')
const { request, uploadFile } = require('../../utils/request')
const { requestWithFallback } = require('../../utils/api')
const { normalizeAssetUrl } = require('../../utils/url')

Page({
  data: {
    user: {},
    form: {
      name: '',
      phone: '',
      sex: '男'
    },
    accountText: '0.00',
    avatarText: 'U',
    loading: false,
    saving: false
  },

  async onShow() {
    await this.reloadProfile()
  },

  async reloadProfile() {
    const user = auth.requireLogin()
    if (!user) {
      return
    }

    this.setData({
      user,
      loading: true
    })

    try {
      const res = await requestWithFallback(
        {
          url: '/user/me',
          showError: false
        },
        {
          url: `/user/selectById/${user.id}`,
          showError: false
        }
      )
      if (res && res.data) {
        const latestUser = Object.assign({}, res.data, {
          avatar: normalizeAssetUrl(res.data.avatar)
        })
        auth.saveSession({
          user: latestUser
        })
        this.setData({
          user: latestUser
        })
        this.syncForm(latestUser)
      } else {
        this.syncForm(user)
      }
    } finally {
      this.setData({
        loading: false
      })
    }
  },

  syncForm(user) {
    const safeUser = user || {}
    const name = safeUser.name || ''
    this.setData({
      form: {
        name,
        phone: safeUser.phone || '',
        sex: safeUser.sex || '男'
      },
      accountText: Number(safeUser.account || 0).toFixed(2),
      avatarText: (name || safeUser.username || 'U').slice(0, 1).toUpperCase()
    })
  },

  onNameInput(event) {
    this.setData({
      'form.name': event.detail.value
    })
  },

  onPhoneInput(event) {
    this.setData({
      'form.phone': event.detail.value
    })
  },

  selectSex(event) {
    this.setData({
      'form.sex': event.currentTarget.dataset.value
    })
  },

  async chooseAvatar() {
    const user = this.data.user
    if (!user || !user.id) {
      return
    }

    const chooseRes = await new Promise((resolve, reject) => {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['compressed'],
        success: resolve,
        fail: reject
      })
    }).catch(() => null)

    if (!chooseRes || !chooseRes.tempFiles || !chooseRes.tempFiles.length) {
      return
    }

    wx.showLoading({
      title: '上传中'
    })

    try {
      const uploadRes = await uploadFile({
        url: '/files/upload',
        filePath: chooseRes.tempFiles[0].tempFilePath,
        name: 'file'
      })

      const avatarUrl = normalizeAssetUrl(uploadRes.data)
      const nextUser = Object.assign({}, this.data.user, {
        avatar: avatarUrl
      })
      auth.saveSession({
        user: nextUser
      })
      this.setData({
        user: nextUser
      })
    } finally {
      wx.hideLoading()
    }
  },

  async saveProfile() {
    const user = this.data.user
    const form = this.data.form

    if (!form.name.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    if (form.phone && !/^1\d{10}$/.test(form.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }

    this.setData({
      saving: true
    })

    try {
      const payload = Object.assign({}, user, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        sex: form.sex
      })

      const savePayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        sex: form.sex,
        avatar: user.avatar || ''
      }
      await requestWithFallback(
        {
          url: '/user/me',
          method: 'PUT',
          data: savePayload
        },
        {
          url: '/user/update',
          method: 'PUT',
          data: Object.assign({}, user, savePayload)
        }
      )

      const nextUser = Object.assign({}, payload, {
        avatar: normalizeAssetUrl(payload.avatar)
      })
      auth.saveSession({
        user: nextUser
      })
      this.setData({
        user: nextUser
      })
      this.syncForm(nextUser)

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } finally {
      this.setData({
        saving: false
      })
    }
  },

  logout() {
    auth.clearSession()
    wx.reLaunch({
      url: '/pages/login/index'
    })
  }
})
