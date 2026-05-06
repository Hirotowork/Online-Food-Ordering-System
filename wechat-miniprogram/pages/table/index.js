const auth = require('../../utils/auth')
const { requestWithFallback } = require('../../utils/api')

Page({
  data: {
    user: null,
    loading: true,
    reserveLoadingId: null,
    currentTable: null,
    tables: [],
    availableCount: 0
  },

  onShow() {
    const user = auth.requireLogin()
    if (!user) {
      return
    }

    this.setData({ user })
    this.loadPageData()
  },

  onPullDownRefresh() {
    this.loadPageData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadPageData() {
    this.setData({ loading: true })

    try {
      const currentTableRes = await requestWithFallback(
        {
          url: '/tables/current'
        },
        {
          url: `/tables/selectByUserId/${this.data.user.id}`
        }
      )

      const tableListRes = await requestWithFallback(
        {
          url: '/tables/selectAll'
        },
        {
          url: '/tables/selectAll'
        }
      )

      const tables = tableListRes.data || []
      const currentTable = currentTableRes.data || null
      const availableCount = tables.filter(item => item.free === '是').length

      this.setData({
        currentTable,
        tables,
        availableCount
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  async reserveTable(event) {
    const index = event.currentTarget.dataset.index
    const item = this.data.tables[index]

    if (!item) {
      return
    }

    this.setData({
      reserveLoadingId: item.id
    })

    try {
      await requestWithFallback(
        {
          url: '/tables/current',
          method: 'POST',
          data: {
            id: item.id
          }
        },
        {
          url: '/tables/addOrder',
          method: 'PUT',
          data: Object.assign({}, item, {
            userId: this.data.user.id
          })
        }
      )

      wx.showToast({
        title: '占桌成功',
        icon: 'success'
      })

      await this.loadPageData()
      wx.switchTab({
        url: '/pages/menu/index'
      })
    } finally {
      this.setData({
        reserveLoadingId: null
      })
    }
  },

  goMenu() {
    wx.switchTab({
      url: '/pages/menu/index'
    })
  }
})
