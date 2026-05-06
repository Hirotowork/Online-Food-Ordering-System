const auth = require('../../utils/auth')
const { request } = require('../../utils/request')
const { requestWithFallback } = require('../../utils/api')
const { normalizeAssetUrl } = require('../../utils/url')

const fallbackImage = '/assets/food-placeholder.png'

Page({
  data: {
    user: null,
    loading: true,
    submitLoading: false,
    cartVisible: false,
    currentTable: null,
    foods: [],
    cartItems: [],
    cartCount: 0,
    cartTotal: 0,
    cartTotalText: '0.00',
    fallbackImage
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
      const [tableRes, foodsRes] = await Promise.all([
        requestWithFallback(
          {
            url: '/tables/current'
          },
          {
            url: `/tables/selectByUserId/${this.data.user.id}`
          }
        ),
        request({
          url: '/foods/selectAll'
        })
      ])

      const currentTable = tableRes.data || null
      const foods = (foodsRes.data || []).map(item =>
        Object.assign({}, item, {
          img: normalizeAssetUrl(item.img),
          draftCount: item.draftCount || 1
        })
      )

      this.setData({
        currentTable,
        foods
      })
      this.syncCartState(this.data.cartItems)
    } finally {
      this.setData({ loading: false })
    }
  },

  increaseDraftCount(event) {
    const index = event.currentTarget.dataset.index
    const current = this.data.foods[index]
    if (!current) {
      return
    }
    this.setData({
      [`foods[${index}].draftCount`]: (current.draftCount || 1) + 1
    })
  },

  decreaseDraftCount(event) {
    const index = event.currentTarget.dataset.index
    const current = this.data.foods[index]
    if (!current) {
      return
    }
    const next = Math.max(1, (current.draftCount || 1) - 1)
    this.setData({
      [`foods[${index}].draftCount`]: next
    })
  },

  addToCart(event) {
    if (!this.data.currentTable) {
      wx.showToast({
        title: '请先选择餐桌',
        icon: 'none'
      })
      return
    }

    const index = event.currentTarget.dataset.index
    const food = this.data.foods[index]
    if (!food) {
      return
    }

    const draftCount = Math.max(1, Number(food.draftCount || 1))
    const cartItems = [...this.data.cartItems]
    const existing = cartItems.find(item => item.id === food.id)

    if (existing) {
      existing.num += draftCount
    } else {
      cartItems.push({
        id: food.id,
        name: food.name,
        price: Number(food.price || 0),
        img: food.img,
        num: draftCount
      })
    }

    this.setData({
      [`foods[${index}].draftCount`]: 1
    })
    this.syncCartState(cartItems)

    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
  },

  increaseCartCount(event) {
    const index = event.currentTarget.dataset.index
    const cartItems = [...this.data.cartItems]
    const item = cartItems[index]
    if (!item) {
      return
    }
    item.num += 1
    this.syncCartState(cartItems)
  },

  decreaseCartCount(event) {
    const index = event.currentTarget.dataset.index
    const cartItems = [...this.data.cartItems]
    const item = cartItems[index]
    if (!item) {
      return
    }

    item.num -= 1
    const nextItems = cartItems.filter(cartItem => cartItem.num > 0)
    this.syncCartState(nextItems)
  },

  syncCartState(cartItems) {
    const normalized = cartItems.map(item => {
      const price = Number(item.price || 0)
      const num = Number(item.num || 0)
      return Object.assign({}, item, {
        price,
        num,
        subtotal: price * num,
        subtotalText: (price * num).toFixed(2)
      })
    })

    const cartCount = normalized.reduce((sum, item) => sum + item.num, 0)
    const cartTotal = normalized.reduce((sum, item) => sum + item.subtotal, 0)

    this.setData({
      cartItems: normalized,
      cartCount,
      cartTotal,
      cartTotalText: cartTotal.toFixed(2),
      cartVisible: cartCount > 0 ? this.data.cartVisible : false
    })
  },

  openCart() {
    this.setData({
      cartVisible: true
    })
  },

  closeCart() {
    this.setData({
      cartVisible: false
    })
  },

  clearCart() {
    this.syncCartState([])
  },

  async removeTable() {
    if (!this.data.currentTable) {
      return
    }

    const confirmRes = await new Promise(resolve => {
      wx.showModal({
        title: '退桌确认',
        content: '退桌后当前购物车不会自动提交，是否继续？',
        success: resolve
      })
    })

    if (!confirmRes.confirm) {
      return
    }

    await requestWithFallback(
      {
        url: '/tables/current',
        method: 'DELETE'
      },
      {
        url: '/tables/removeOrder',
        method: 'PUT',
        data: this.data.currentTable
      }
    )

    this.syncCartState([])
    this.setData({
      currentTable: null
    })

    wx.showToast({
      title: '退桌成功',
      icon: 'success'
    })
  },

  goTablePage() {
    wx.switchTab({
      url: '/pages/table/index'
    })
  },

  async submitOrder() {
    if (!this.data.currentTable) {
      wx.showToast({
        title: '请先选择餐桌',
        icon: 'none'
      })
      return
    }

    if (this.data.cartItems.length === 0) {
      wx.showToast({
        title: '请先选择菜品',
        icon: 'none'
      })
      return
    }

    this.setData({
      submitLoading: true
    })

    try {
      const content = this.data.cartItems
        .map(item => `${item.name}x${item.num}`)
        .join(', ')

      const payload = {
        content,
        total: Number(this.data.cartTotal.toFixed(2)),
        status: '待出餐'
      }

      await requestWithFallback(
        {
          url: '/orders',
          method: 'POST',
          data: payload
        },
        {
          url: '/orders/add',
          method: 'POST',
          data: Object.assign({}, payload, {
            userId: this.data.user.id
          })
        }
      )

      this.syncCartState([])
      this.closeCart()

      wx.showToast({
        title: '下单成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/orders/index'
        })
      }, 220)
    } finally {
      this.setData({
        submitLoading: false
      })
    }
  }
})
