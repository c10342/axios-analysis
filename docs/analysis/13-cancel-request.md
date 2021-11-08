# 取消请求

在前面的章节[xhr 请求处理函数](/analysis/09-xhr)学习中，我们得知 axios 有一个`取消请求` 的功能。那么，本章节，我们将会分析 `取消请求` 的实现和原理

## 使用

我们先来看一下是怎么取消请求的

方式一：使用`CancelToken.source`工厂函数，创建取消令牌

```javascript
import axios from "axios";

const CancelToken = axios.CancelToken;
// 通过`CancelToken.source`创建令牌
const source = CancelToken.source();

axios
  .get("/user/12345", {
    cancelToken: source.token,
  })
  .catch(function(thrown) {
    if (axios.isCancel(thrown)) {
      console.log("Request canceled", thrown.message);
    } else {
      // handle error
    }
  });

axios.post(
  "/user/12345",
  {
    name: "new name",
  },
  {
    cancelToken: source.token,
  }
);

// `source.cancel`函数是用来取消请求的
source.cancel("取消请求");
```

方式二：使用执行器函数传递给`CancelToken`构造函数来创建取消令牌

```javascript
import axios from "axios";

const CancelToken = axios.CancelToken;
let cancel;

axios.get("/user/12345", {
  cancelToken: new CancelToken(function executor(c) {
    // executor函数接收cancel函数作为参数
    cancel = c;
  }),
});

// 取消请求
cancel();
```

## 源码分析

我们先来看一下源码，跟`CancelToken`相关的功能，都放在了`/lib/cancel`文件夹下，一共有三个文件，我们逐一来看。

`CancelToken`构造函数，源码在`/lib/cancel/CancelToken.js`

```javascript
var Cancel = require("./Cancel");

/**
 * 用来创建取消请求的实例的类
 *
 * @class
 * @param {Function} executor 执行函数
 */
function CancelToken(executor) {
  if (typeof executor !== "function") {
    // executor必须是一个函数
    throw new TypeError("executor must be a function.");
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
 * 工厂函数，返回一个`CancelToken`实例和`cancel`函数，`cancel`就是用来取消请求的
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
    cancel: cancel,
  };
};

module.exports = CancelToken;
```

`Cancel`构造函数，源码在`/lib/cancel/Cancel.js`文件

```javascript
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
  return "Cancel" + (this.message ? ": " + this.message : "");
};

// 取消请求标志位
Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;
```

`isCancel`函数，源码在`/lib/cancel/isCancel.js`文件

```javascript
// 判断是否已经被取消了请求
module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};
```

我们再来看 `xhr 请求处理函数` 是怎么监听请求被外部中断了，源码在`/lib/adapters/xhr.js`，第 211 行

```javascript
if (config.cancelToken) {
  // cancelToken对象，该对象上面会存在一个promise实例
  // 一旦promise实例变成成功状态，就会来到`then`函数这里
  config.cancelToken.promise.then(function onCanceled(cancel) {
    if (!request) {
      return;
    }
    // 中断请求
    request.abort();
    reject(cancel);
    request = null;
  });
}
```

## CancelToken,Cancel,isCancel

`CancelToken`构造函数是用来创建取消请求令牌的

`Cancel`构造函数是请求取消之后的返回的错误对象

`isCancel`函数是用来判断返回来的错误对象是否为`Cancel`实例，也就是可以通过返回来的错误对象判断是否由外部取消请求引起的错误

通过分析，`CancelToken`构造函数是我们重点分析的部分

## Cancel 构造函数分析

通过源码，我们可以分析得知，`Cancel`构造函数组成如下：

- `message`属性，即错误消息

- `toString`函数，对象转化为字符串

- `__CANCEL__`属性，取消请求标志位

## isCancel 函数分析

通过源码，我们可以分析得知，`isCancel`函数内部是通过判断该对象上面是否存在`__CANCEL__`属性，存在说明该对象是一个`Cancel`实例，也就是说请求已经被取消了

## CancelToken 构造函数分析

通过源码，我们可以分析得知，`CancelToken`构造函数组成如下：

- `CancelToken`构造函数需要传入一个`executor`执行函数，`executor`函数会被执行，参数是一个函数，该函数就是用来取消请求的

- `promise`实例属性。通过`new Promise`创建一个`promise`实例，并将`resolve`函数（也就是将`promise`实例的状态改成成功状态的函数）保存起来。`resolve`函数将会在`executor`执行函数中的入参（参数是函数）中被执行。外部取消请求之后，`promise`实例状态将会变成成功状态

- `throwIfRequested`函数，该函数是用来判断请求是否已经被取消了。如果已经被取消了请求，就会抛出错误对象，错误对象为`Cancel`类型

- `source`静态函数，该静态函数是一个工厂函数，返回一个`CancelToken`实例和`cancel`函数，`cancel`就是用来取消请求的。实际上就是对上面的使用方式二进行了封装

## 监听外部取消请求

通过调用`CancelToken`实例的`then`方法，即可监听外部取消了请求。

```javascript
config.cancelToken.promise.then(function onCanceled(cancel) {
  // ...
});
```

因为外部取消请求是通过调用`executor`执行函数的参数，

```javascript
import axios from "axios";

const CancelToken = axios.CancelToken;
let cancel;

axios.get("/user/12345", {
  cancelToken: new CancelToken(function executor(c) {
    cancel = c;
  }),
});

// 取消请求
cancel();
```

`c`参数实现如下：

```javascript
function cancel(message) {
  // ...
  resolvePromise(token.reason);
}
```

其中`resolvePromise`就是`new Promise`中的`reslove`函数，

```javascript
function CancelToken(executor) {
  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  executor(function cancel(message) {
    // ...
    resolvePromise();
  });
}
```

一旦`resolvePromise`函数被调用了，`promise`实例的状态将会变成成功状态，也就是说会执行`then`方法，从而触发了监听，然后调用请求实例的`abort`函数即可取消请求

## 简单代码实现

我们通过自己编写一个简单代码来实现取消请求的功能，加深印象

```javascript
class CancelToken {
  constructor(executor) {
    let resolvePromise;
    this.promise = new Prmoise((resolve) => {
      resolvePromise = resolve;
    });

    executor(resolvePromise);
  }
}

function xhr(config = {}) {
  const xhr = new XMLHttpRequest();

  if (config.cancelToken) {
    // 监听外部取消请求
    config.cancelToken.then(() => {
      xhr.abort();
    });
  }

  xhr.open();

  xhr.send();
}

let cancel;
const cancelToken = new CancelToken(function(c) {
  cancel = c;
});

xhr({
  cancelToken,
});

// 取消请求
cancel();
```

## 总结

通过本章节的学习，相信你已经知道了 axios 取消请求的实现过程以及原理了。而且通过我们的简单代码实现，应该会有了更加深刻的理解

下一章节，我们将会分析 `http 请求处理函数` 的实现
