'use strict';

var Cancel = require('./Cancel');

/**
 * 用来创建取消请求的实例的类
 *
 * @class
 * @param {Function} executor 执行函数
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    // executor必须是一个函数
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  // 创建一个promise实例
  this.promise = new Promise(function promiseExecutor(resolve) {
    // 将resolve函数保存起来
    resolvePromise = resolve;
  });

  var token = this;
  // `executor`是一个函数，该函数的参数是`cancel`函数
  // 外部需要将`cancel`函数保存起来，在需要取消请求的时候，调用`cancel`函数
  executor(function cancel(message) {
    if (token.reason) {
      // 请求已经被取消了
      return;
    }
    // 取消消息
    token.reason = new Cancel(message);
    // promise实例将会变成成功状态,实际上就是调用了resolve函数
    resolvePromise(token.reason);

    // 我们查看`lib/adapters/xhr.js`中又如下几行代码：
    // if (config.cancelToken) {
    //   // cancelToken对象，该对象上面会存在一个promise实例
    //   // 一旦promise实例变成成功状态，就会来到`then`函数这里
    //   config.cancelToken.promise.then(function onCanceled(cancel) {
    //     if (!request) {
    //       return;
    //     }
    //     // 中断请求
    //     request.abort();
    //     reject(cancel);
    //     request = null;
    //   });
    // }
  });
}

/**
 * 如果已经被取消了请求，就会抛出错误对象，错误对象为`Cancel`类型
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * 静态属性，返回一个`CancelToken`实例和`cancel`函数，`cancel`就是用来取消请求的
 * 
 * axios提供2种方式给开发者取消请求
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;
