# 请求/响应拦截器的实现

通过上一章节`request`函数的分析，我们发现`request`函数内部使用了`请求/响应拦截器`。那么，本章节，我们就来分析`请求/响应拦截器`是怎么实现的

## 使用

首先，我们来看一下`请求/响应拦截器`是怎么使用的

```javascript
axios.interceptors.request.use(
  (config) => {
    // 在发送http请求之前做些什么
    // 必须返回config对象
    // 或者返回一个promise对象，该promise对象resolve的参数必须是config对象，
    // 否则下一个请求拦截器无法获取config对象
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    // 必须返回response对象
    // 或者返回一个promise对象，该promise对象resolve的参数必须是response对象，
    // 否则下一个响应拦截器无法获取response对象
    return response;
  },
  (error) => {
    // 对响应错误做点什么
    return Promise.reject(error);
  }
);
```


## 源码分析

我们先来分析一下源码，拦截器实现类的源码是在`lib/core/InterceptorManager.js`文件

```javascript
var utils = require('./../utils');

// 拦截器造函数
function InterceptorManager() {
  // 存放拦截器方法，数组内每一项都是有两个属性的对象，两个属性分别对应成功和失败后执行的函数
  this.handlers = [];
}

/**
 * 往拦截器里添加拦截方法
 *
 * @param {Function} fulfilled 成功回调函数
 * @param {Function} rejected 失败回调函数
 *
 * @return {Number} 返回拦截器ID
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * 根据ID注销指定的拦截器
 *
 * @param {Number} id 截器ID
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    // 直接把拦截器置位null
    this.handlers[id] = null;
  }
};


// 遍历this.handlers，并将this.handlers里的每一项作为参数传给fn执行
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

```

使用拦截器的源码是在`lib/core/Axios.js`文件

```javascript
var InterceptorManager = require("./InterceptorManager");
var dispatchRequest = require("./dispatchRequest");

// Axios构造器
function Axios(instanceConfig) {
  // ...
  // 请求拦截器/响应拦截器
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager(),
  };
}

// request请求函数
Axios.prototype.request = function request(config) {
  // ...

  // promise调用链（chain数组），dispatchRequest是负责派发请求的
  // dispatchRequest函数暂时不用关心这个函数的实现，只需要知道他返回的是一个promise即可
  // promise调用链（chain数组）每2个为一对的，一个是成功回调方法，一个是失败回调方法
  // dispatchRequest, undefined为一对，
  // dispatchRequest是成功回调方法，
  // 失败回调方法可有可无，我们这里不需要，所以给undefined即可
  var chain = [dispatchRequest, undefined];
  // 初始化一个promise
  var promise = Promise.resolve(config);
  // 遍历请求拦截器
  this.interceptors.request.forEach(function unshiftRequestInterceptors(
    interceptor
  ) {
    // 对于请求拦截器，是通过unshift方法往chain数组前面添加的
    // 在执行拦截器的时候，通过shift方法从chain数组里取出的
    // 所以，请求拦截器先添加的后执行
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });
  // 遍历响应拦截器
  this.interceptors.response.forEach(function pushResponseInterceptors(
    interceptor
  ) {
    // 对于响应拦截器，是通过push方法往chain数组后面添加的
    // 在执行拦截器的时候，通过shift方法从chain数组里取出的
    // 所以：响应拦截器后添加的先执行
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  // 添加了请求。响应拦截器后的chain数组如下，请求拦截器在前，dispatchRequest请求处理函数在中间，响应拦截器在后
  // [
  //   requestFulfilledFn, requestRejectedFn, ...,
  //   dispatchRequest, undefined,
  //   responseFulfilledFn, responseRejectedFn, ....,
  // ]

  // 开始执行promise调用链（chain数组）
  while (chain.length) {
    // 数组的 shift() 方法用于把数组的第一个元素从其中删除，并返回第一个元素的值
    // 每次执行while循环，从chain数组里按序取出两项，并分别作为promise.then方法的第一个和第二个参数
    // 在这里就可以看出promise调用链（chain数组）中，每2个就是一对的
    // 第一个chain.shift()是成功回调函数
    // 第二个chain.shift()是失败回调函数
    // 第一个请求拦截器的fulfilled函数会接收到promise对象初始化时传入的config对象，而请求拦截器又规定用户写的fulfilled函数必须返回一个config对象，所以通过promise实现链式调用时，每个请求拦截器的fulfilled函数都会接收到一个config对象
    // 第一个响应拦截器的fulfilled函数会接受到dispatchRequest请求处理函数返回的数据,而响应拦截器又规定用户写的fulfilled函数必须返回一个response对象，所以通过promise实现链式调用时，每个响应拦截器的fulfilled函数都会接收到一个response对象
    // 根据promise的特性，任何一个拦截器的抛出的错误，都会被下一个拦截器的rejected函数收到，所以dispatchRequest抛出的错误才会被响应拦截器接收到。
    // 因为采用的是promise调用的形式，所以我们可以再拦截器中执行异步操作，而拦截器的执行顺序还是会按照我们上面说的顺序执行，也就是 dispatchRequest 方法一定会等待所有的请求拦截器执行完后再开始执行，响应拦截器一定会等待 dispatchRequest 执行完后再开始执行。
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

module.exports = Axios;

```

## InterceptorManager构造函数分析

从上面的源码分析中，我们可以了解到`InterceptorManager`这个构造函数其实是非常简单的。它是由一个`handlers`属性和三个方法组成的

- `handlers`是一个数组，用来存放拦截器的。数组的每一项都是一个对象，对象必须包含`fulfilled`和`rejected`字段。其中`fulfilled`字段是成功回调函数，必须填写（其实不填也没关系，因为使用promise链式调用，promise会自动跳过，但是这样子没有任何意义）；`rejected`字段是失败回调函数，选填

- `use`函数。往`handlers`数组中添加拦截器。该函数接收2个参数，第一个参数是`fulfilled`成功回调函数，必填。第二个参数是`rejected`失败回调函数，选填。函数返回拦截器在`handlers`数组的索引下标

- `eject`函数。根据`use`函数返回的数组索引下表（即id），置空拦截器（并没有删除该数组项，只是把它变成`null`了）。这个方法实际应用中用的很少

- `forEach`函数。用来循环`handlers`数组，并将`handlers`数组里的每一项作为参数传给fn执行


## 拦截器的执行过程



