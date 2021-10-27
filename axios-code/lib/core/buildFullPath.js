'use strict';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * 通过组合baseURL和RequesteURL来创建新URL，
 * 只有当`requestedURL`不是绝对地址的时候，才会将`baseURL`和`requestedURL`进行合并。
 *
 * @param {string} baseURL 前缀地址
 * @param {string} requestedURL 相对地址或者是绝对地址
 * @returns {string} 处理后的url地址
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  // baseURL存在并且requestedURL是一个相对地址，才会将`baseURL`和`requestedURL`进行合并
  // 一般来说，以http开头或者https开头的都是绝对地址
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    // 拼接`baseURL`和`requestedURL`成为一个完整的url地址
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};
