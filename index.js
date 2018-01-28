'use strict'

const getStatusCode = require('url-code-status')
const getUrlsFromHtml = require('html-urls')
const aigle = require('aigle')
const mitt = require('mitt')
const got = require('got')

const getHtml = async url => {
  const { body } = await got(url)
  return body
}

const getStatus = statusCode => `${String(statusCode).charAt(0)}xx`

const getUrls = async ({url, whitelist}) => {
  const html = await getHtml(url)
  const urls = await getUrlsFromHtml({ url, html, whitelist })
  return urls
}

module.exports = async (url, {whitelist, ...opts} = {}) => {
  const urls = await getUrls({url, whitelist})
  const emitter = mitt()

  const iterator = async (acc, link) => {
    const { normalizeUrl } = link
    const statusCode = await getStatusCode(normalizeUrl, opts)
    const status = getStatus(statusCode)
    const data = { statusCode, ...link }

    if (!acc[status]) acc[status] = [data]
    else acc[status].push(data)
    emitter.emit(status, data)
  }

  aigle.transform(urls, iterator, {}).then(data => emitter.emit('end', data))

  return emitter
}
