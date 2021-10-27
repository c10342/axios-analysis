'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  // 如果`baseURL`末尾存在`/`则去掉
  // 如果`relativeURL`开头存在`/`则去掉
  // 在`baseURL`和`relativeURL`中间添加`/`
  // 这样做可以避免以下的情况:
  // baseURL：http://xx.x/；relativeURL：/api/v1/demo
  // ==> http://xx.x//api/v1/demo  会出现多条 `/`
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};
