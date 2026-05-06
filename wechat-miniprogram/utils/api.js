const config = require('../config/index')
const { request } = require('./request')

async function requestWithFallback(primaryOptions, fallbackOptions, isFallbackError) {
  if (config.apiMode === 'legacy' && fallbackOptions) {
    return request(fallbackOptions)
  }

  if (config.apiMode === 'modern' || !fallbackOptions) {
    return request(primaryOptions)
  }

  try {
    return await request(primaryOptions)
  } catch (error) {
    const shouldFallback = typeof isFallbackError === 'function'
      ? isFallbackError(error)
      : isNotFoundError(error)

    if (!shouldFallback || !fallbackOptions) {
      throw error
    }
    return request(fallbackOptions)
  }
}

function isNotFoundError(error) {
  if (!error) {
    return false
  }
  if (error.statusCode === 404) {
    return true
  }
  return error.data && error.data.status === 404
}

module.exports = {
  requestWithFallback,
  isNotFoundError
}
