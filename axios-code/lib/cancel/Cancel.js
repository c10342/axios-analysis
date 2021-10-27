'use strict';

/**
 * 请求被取消之后，reject的是这个Cancel示例
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  // 错误消息
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

// 取消请求标志位
Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;
