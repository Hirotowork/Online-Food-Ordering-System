const auth = require('../../utils/auth')
const { request } = require('../../utils/request')
const { requestWithFallback } = require('../../utils/api')

function mapStatusClass(status) {
  if (status === '待结算') {
    return 'status-pending'
  }
  if (status === '已完成') {
    return 'status-finished'
  }
  return 'status-preparing'
}

Page({
  data: {
    user: null,
    loading: true,
    settlingId: null,
    orders: []
  },

  onShow() {
    const user = auth.requireLogin()
    if (!user) {
      return
    }

    this.setData({ user })
    this.loadOrders()
  },

  onPullDownRefresh() {
    this.loadOrders().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadOrders() {
    this.setData({ loading: true })

    try {
      const res = await requestWithFallback(
        {
          url: '/orders/my'
        },
        {
          url: `/orders/selectAll?userId=${this.data.user.id}`
        }
      )

      const orders = (res.data || []).map(item => ({
        ...item,
        totalText: Number(item.total || 0).toFixed(2),
        statusClass: mapStatusClass(item.status)
      }))

      this.setData({ orders })
    } finally {
      this.setData({ loading: false })
    }
  },

  async settleOrder(event) {
    const index = event.currentTarget.dataset.index
    const order = this.data.orders[index]
    if (!order) {
      return
    }

    const confirmRes = await new Promise(resolve => {
      wx.showModal({
        title: '确认结算',
        content: `将从余额扣除 ￥${order.totalText}，是否继续？`,
        success: resolve
      })
    })

    if (!confirmRes.confirm) {
      return
    }

    this.setData({
      settlingId: order.id
    })

    try {
      await requestWithFallback(
        {
          url: `/orders/${order.id}/settle`,
          method: 'POST'
        },
        {
          url: '/orders/update',
          method: 'PUT',
          data: {
            id: order.id,
            userId: order.userId,
            total: order.total,
            status: '已完成'
          }
        }
      )

      const latestUserRes = await requestWithFallback(
        {
          url: '/user/me',
          showError: false
        },
        {
          url: `/user/selectById/${this.data.user.id}`,
          showError: false
        }
      )
      if (latestUserRes && latestUserRes.data) {
        auth.saveSession({
          user: latestUserRes.data
        })
        this.setData({
          user: latestUserRes.data
        })
      }

      wx.showToast({
        title: '结算成功',
        icon: 'success'
      })

      await this.loadOrders()
    } finally {
      this.setData({
        settlingId: null
      })
    }
  }
})
