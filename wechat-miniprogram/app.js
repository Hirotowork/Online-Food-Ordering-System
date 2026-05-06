const auth = require('./utils/auth')

App({
  globalData: {
    brandName: 'Canteen 点餐'
  },

  onLaunch() {
    if (!auth.isLoggedIn()) {
      auth.clearSession()
    }
  }
})
