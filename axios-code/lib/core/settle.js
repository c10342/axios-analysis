'use strict';

var createError = require('./createError');

/**
 * 根据响应状态码，调用resolve或者reject
 * 
 * 在获得响应请求的基础上,决定返回成功或者失败的Promise态,当失败的时候会建立自定义错误
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  // 使用validateStatus函数校验是否为成功状态
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    // 失败就返回一个经过处理的error对象
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};
