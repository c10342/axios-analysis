'use strict';

// 判断是否已经被取消了请求
module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};
