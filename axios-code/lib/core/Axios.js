'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');
var validator = require('../helpers/validator');

var validators = validator.validators;

// Axios构造器
function Axios(instanceConfig) {
  // 默认配置
  this.defaults = instanceConfig;
  // 请求拦截器/响应拦截器
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

// request请求函数
Axios.prototype.request = function request(config) {
  if (typeof config === 'string') {
    // 使用形式一：axios('example/url'[, config])
    // 如果config是一个字符串，说明是一个url地址，需要进行处理
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    // 使用形式二：axios(config)
    config = config || {};
  }

  // 将默认的配置跟传入的配置进行合并
  config = mergeConfig(this.defaults, config);

  // 将method统一转化为小写
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    // 这个判定条件好像是多余的，因为如果this.defaults.method存在值，那么通过mergeConfig之后config也一定会存在值
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  var transitional = config.transitional;

  if (transitional !== undefined) {
    validator.assertOptions(transitional, {
      silentJSONParsing: validators.transitional(validators.boolean),
      forcedJSONParsing: validators.transitional(validators.boolean),
      clarifyTimeoutError: validators.transitional(validators.boolean)
    }, false);
  }

  // 将请求拦截器存放进数组
  var requestInterceptorChain = [];
  // 同步请求拦截器标志位，true表示是同步,false为异步
  var synchronousRequestInterceptors = true;
  // 遍历请求拦截器
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
      return;
    }
    // interceptor.synchronous有一个为false，synchronousRequestInterceptors即为false
    synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
    // 放到数组的第一位，这也是为什么请求拦截器后面的先执行
    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });
  // 将响应拦截器存放数组
  var responseInterceptorChain = [];
  // 遍历响应拦截器
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    // 放到数组最后一位，这也是为什么响应拦截器前面的先执行
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });

  var promise;

  // 如果是异步请求拦截器的情况
  if (!synchronousRequestInterceptors) {
    // promise调用链，dispatchRequest是负责派发请求的
    // dispatchRequest函数暂时不用关心这个函数的实现，只需要知道他返回的是一个promise即可
    // promise调用链每2个为一对的，一个是成功回调方法，一个是失败回调方法
    // dispatchRequest, undefined为一对，
    // dispatchRequest是成功回调方法，
    // 失败回调方法可有可无，我们这里不需要，所以给undefined即可
    var chain = [dispatchRequest, undefined];
    // 将请求拦截器添加到promise调用链前面
    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    // 将响应拦截器添加到promise调用链后面
    chain = chain.concat(responseInterceptorChain);

    // 初始化一个promise
    promise = Promise.resolve(config);
    // 开始执行promise调用链
    while (chain.length) {
      // 在这里就可以看出promise调用链中，每2个就是一对的
      // 第一个chain.shift()是成功回调函数
      // 第二个chain.shift()是失败回调函数
      promise = promise.then(chain.shift(), chain.shift());
    }
    // 最终返回一个promise
    return promise;
  }

  // 从这里开始，就是开始是同步请求拦截器的逻辑
  // 现在基本都是使用异步请求拦截器，很少会使用同步的，后面的代码可以选择性阅读

  // 同步请求拦截器的情况
  var newConfig = config;
  while (requestInterceptorChain.length) {
    // 开始循环执行同步请求拦截器
    // 成功的
    var onFulfilled = requestInterceptorChain.shift();
    // 失败的
    var onRejected = requestInterceptorChain.shift();
    try {
      newConfig = onFulfilled(newConfig);
    } catch (error) {
      onRejected(error);
      break;
    }
  }

  try {
    // 同步请求拦截器执行完毕就会派发请求
    promise = dispatchRequest(newConfig);
  } catch (error) {
    return Promise.reject(error);
  }

  // 响应拦截器，响应拦截器没有同步的情况，只有异步的情况
  while (responseInterceptorChain.length) {
    promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// 添加请求方法别名
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  Axios.prototype[method] = function (url, config) {
    // 实际上是调用了`request`函数
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

// 添加请求方法别名
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  // 实际上是调用了`request`函数
  Axios.prototype[method] = function(url, data, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;
