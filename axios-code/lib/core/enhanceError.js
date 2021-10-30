'use strict';

/**
 * 给error对象添加额外的属性.
 *
 * @param {Error} error error对象
 * @param {Object} config 请求配置项
 * @param {string} [code] 错误码
 * @param {Object} [request] 请求对象
 * @param {Object} [response] 响应对象
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
  // 添加`config`请求配置项属性
  error.config = config;
  if (code) {
    // 添加错误码
    error.code = code;
  }
  // 添加请求实例
  error.request = request;
  // 添加响应数据对象
  error.response = response;
  // 标识这是一个经过axios封装过的错误对象
  error.isAxiosError = true;
  // JSON.stringify函数将对象转为字符串就是调用对象上的`toJSON`函数获取需要转化为字符串的key-value字段
  // 改写`error`对象身上的`toJSON`函数
  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code
    };
  };
  return error;
};
