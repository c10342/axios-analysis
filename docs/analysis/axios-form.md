# Axios 构造函数

通过上一章节的学习，我们了解到了`axios`对象的创建过程。那么在本章节中，我们将会揭开`Axios`构造函数神秘面纱，看看他到底是由什么组成的

## 源码分析

我们先来分析一下源码，源码是在`lib/core/Axios.js`文件

```javascript
var utils = require("./../utils");
var InterceptorManager = require("./InterceptorManager");
var mergeConfig = require("./mergeConfig");
var buildURL = require("../helpers/buildURL");

// Axios构造器
function Axios(instanceConfig) {
  // 默认配置
  this.defaults = instanceConfig;
  // 请求拦截器/响应拦截器
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager(),
  };
}

// request请求函数
Axios.prototype.request = function request(config) {
  // ...
};

// 该方法用于在不发送请求的前提下根据传入的请求配置对象返回一个请求的url
Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(
    /^\?/,
    ""
  );
};

// 添加请求方法别名
utils.forEach(
  ["delete", "get", "head", "options"],
  function forEachMethodNoData(method) {
    Axios.prototype[method] = function (url, config) {
      // 实际上是调用了`request`函数
      return this.request(
        mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data,
        })
      );
    };
  }
);

// 添加请求方法别名
utils.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
  // 实际上是调用了`request`函数
  Axios.prototype[method] = function (url, data, config) {
    return this.request(
      mergeConfig(config || {}, {
        method: method,
        url: url,
        data: data,
      })
    );
  };
});

module.exports = Axios;
```

## 常见使用

我们在平常开发中，经常会使用一些属性和函数的，这些属性和函数都是来自于我们的`Axios`构造函数的

```javascript
// 设置前缀地址
axios.defaults.baseURL = "http://xxx.xx.x";

// 添加请求拦截器
axios.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    return Promise.reject(error);
  }
);

//   发送get请求
axios.get("xxx");
```

## Axios 构造函数组成

通过分析源码，我们发现`Axios`构造函数具备 2 个属性，9 个函数。

**属性：**

- defaults：默认的请求配置

- interceptors：请求拦截器/响应拦截器管理对象，后面的章节也会重点讲解到

**函数：**

- request：请求函数，所有请求别名方法函数都是使用这个函数的，后面需要重点分析这个函数

- getUri：这个方法用于在不发送请求的前提下根据传入的请求配置对象返回一个请求的 url。函数内部使用了`buildURL`函数，`buildURL`函数也需要进行重点分析

- delete，get，head，options，post，put，patch：请求方法别名。每个函数内部都是通过调用`request`函数来时实现的

## 疑问

在上面的源码中，我们可以看见，`get`，`post`等请求别名函数的调用方法是分钟 2 种形式的，一种是传入`url`和`config`的，另外一种是传入`url`，`data`和`config`的。

这里我有一点疑惑就是为什么不把他们统一成一种格式调用，因为他们内部的实现都是一致的。

这里我猜测可能是因为使用习惯的原因吧

## 总结

本章节比较简单，我们了解到了`Axios`构造函数内部有什么属性和函数。然后在发现了几个需要重点关注的地方，一个是`buildURL`函数内部的实现，一个是`request`请求函数的内部流程到底是怎么样的，最后一个就是`interceptors`请求/响应拦截器。在下一个章节中，我会先讲解`buildURL`函数内部的实现。
