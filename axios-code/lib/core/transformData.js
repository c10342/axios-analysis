'use strict';

var utils = require('./../utils');

/**
 * 对请求/响应数据进行转化处理
 *
 * @param {Object|String} data 数据
 * @param {Array} headers 请求头
 * @param {Array|Function} fns 数组函数或者函数
 * @returns {*} 转换之后的数据
 */
module.exports = function transformData(data, headers, fns) {
  utils.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });

  return data;
};
