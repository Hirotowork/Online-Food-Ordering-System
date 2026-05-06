const config = {
  // 开发期可配为本机服务地址。真机联调和上线时必须替换为微信后台已配置的 HTTPS 域名。
  baseUrl: 'http://127.0.0.1:9090',
  assetBaseUrl: 'http://127.0.0.1:9090',
  // legacy: 直接使用旧接口；modern: 直接使用新接口；auto: 先新后旧
  apiMode: 'legacy',
  requestTimeout: 15000,
  storageKeys: {
    token: 'canteen-token',
    user: 'canteen-user'
  }
}

module.exports = config
