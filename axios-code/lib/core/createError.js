'use strict';

var enhanceError = require('./enhanceError');

/**
 * 给error对象添加一些属性，然后返回
 *
 * @param {string} message 错误消息
 * @param {Object} config 配置项
 * @param {string} [code] 错误码
 * @param {Object} [request] 请求实例
 * @param {Object} [response] 响应数据对象
 * @returns {Error} 返回一个error对象
 */
module.exports = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};
