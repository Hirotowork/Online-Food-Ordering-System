const config = require('../config/index')

function trimSlash(value) {
  return value ? value.replace(/\/+$/, '') : ''
}

function normalizeAssetUrl(url) {
  if (!url) {
    return ''
  }

  const baseUrl = trimSlash(config.baseUrl)
  const assetBaseUrl = trimSlash(config.assetBaseUrl || config.baseUrl)
  const value = String(url).trim()

  if (/^https?:\/\//i.test(value)) {
    return value.replace(/^http:\/\/localhost:9090/i, assetBaseUrl)
  }

  if (value.startsWith('/files/download/')) {
    return `${assetBaseUrl}${value}`
  }

  if (value.startsWith('files/download/')) {
    return `${assetBaseUrl}/${value}`
  }

  if (value.startsWith('/')) {
    return `${baseUrl}${value}`
  }

  return `${assetBaseUrl}/files/download/${value}`
}

module.exports = {
  normalizeAssetUrl
}
