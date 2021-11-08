# WxAxios 构造函数实现

本章节，我们将会实现`WxAxios`构造函数

## 代码

我们先来看一下代码的实现，代码在`wx-axios/lib/core/WxAxios.js`

```javascript
import { forEach, isString, methods } from "../utils";
import InterceptorManager from "./InterceptorManager";
import mergeConfig from "./mergeConfig";
import dispatchRequest from "./dispatchRequest";

function WxAxios(defaultConfig) {
  this.defaults = defaultConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager(),
  };
}

WxAxios.prototype.request = function(url, config = {}) {
  // 函数重载
  if (isString(url)) {
    config.url = url;
  } else {
    config = url;
  }
  // 将默认的配置跟传入的配置进行合并
  config = mergeConfig(this.defaults, config);
  //   将method统一转化为小写
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else {
    //   默认是get请求
    config.method = "get";
  }

  // promise调用链数组
  const chain = [dispatchRequest, null];
  // 初始化promsie实例
  let promise = Promise.resolve(config);
  // 添加请求拦截器
  this.interceptors.request.forEach((interceptor) => {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });
  // 添加响应拦截器
  this.interceptors.response.forEach((interceptor) => {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });
  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

forEach(methods, (method) => {
  WxAxios.prototype[method] = function(url, config) {
    config = config || {};
    return this.request(
      mergeConfig(config, {
        method,
        url,
      })
    );
  };
});

export default WxAxios;
```

## 分析

代码以及功能层面上跟`axios`基本不变，无论是`promise`的链式调用，还是拦截器的实现，代码都没改变。有变化的只是请求方法别名，因为支持的端不一样，所以请求方法会有所差别。

这里要特别注意的是`upload`和`download`请求方法。`upload`请求方法是用来上传文件的。`download`方法是用来下载文件的，跟 web 端的上传/下载文件会有所差别，微信小程序上传文件是使用`wx.uploadFile`，下载文件是使用`wx.downloadFile`，网路请求是使用`wx.requset`。我们是根据请求方法的不同，来使用不同的底层函数，后面的章节会讲解。这里只需要知道有什么请求方法即可

这里的请求方法如下：

- options：HTTP 请求 OPTIONS

- get：HTTP 请求 GET

- head：HTTP 请求 HEAD

- post：HTTP 请求 POST

- put：HTTP 请求 PUT

- delete：HTTP 请求 DELETE

- trace：HTTP 请求 TRACE

- connect：HTTP 请求 CONNECT

- download：下载文件

- upload：上传文件

同时这里还对请求别名方法的使用进行了统一，都是通过`wxAxios[method](url[,config])`或者`wxAxios[method](config)`的形式使用。`axios`会有`axios.pots(url,data[,config])`这种写法，但是只有个别请求别名方法支持，开发者需要区别不同请求方法的不同写法，使用上不太友好（加大了开发者的记忆负担）

## 总结

`WxAxios`的实现跟`axios`源码的最大区别就是，多了`download`和`upload`这 2 个请求方法，用来下载/上传文件的。同时还有统一了所有请求方法别名的使用形式

本章节一些相关的东西可查看`axios`源码分析的[Axios 构造函数分析](/analysis/03-axios-form)章节
