# request 函数分析

在前面的章节[Axios 构造函数分析](/analysis/01-axios-form)中，我们发现，`post`，`get`等请求函数别名，内部都是执行`request`函数的。而且，在[axios 对象创建过程](/analysis/01-instance-create)章节中，我们也知道了`axios`对象实际上是通过`Axios.prototype.request`函数构建出来的。那么，本章节我们就来分析一下这个`request`函数

## 源码分析

我们先来分析一下源码，源码是在`lib/core/Axios.js`文件

```javascript
// request请求函数
Axios.prototype.request = function request(config) {
  if (typeof config === "string") {
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
    config.method = "get";
  }

  // promise调用链，dispatchRequest是负责派发请求的
  // dispatchRequest函数暂时不用关心这个函数的实现，只需要知道他返回的是一个promise即可
  // promise调用链每2个为一对的，一个是成功回调方法，一个是失败回调方法
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
    // 放到数组的第一位，这也是为什么请求拦截器后面的先执行
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });
  // 遍历响应拦截器
  this.interceptors.response.forEach(function pushResponseInterceptors(
    interceptor
  ) {
    // 放到数组最后一位，这也是为什么响应拦截器前面的先执行
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  // 开始执行promise调用链
  while (chain.length) {
    // 在这里就可以看出promise调用链中，每2个就是一对的
    // 第一个chain.shift()是成功回调函数
    // 第二个chain.shift()是失败回调函数
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};
```

## 执行流程

1、对`config`参数进行处理，因为`request`函数支持多种调用形式：`axios('example/url'[, config])`，`axios(config)`

2、将默认选项配置和传入的选项配置进行合并，形成一个新的配置

3、判断`method`请求方法是否存在，不存在则默认是`get`。将`method`请求方法转化为小写

4、初始化一个`promise`调用链（数组）

5、通过`Promise.resolve(config)`初始化一个`promise`实例

6、遍历请求拦截器，将请求拦截器放置到`promise`调用链的前面

7、遍历响应拦截器，将响应拦截器放置到`promise`调用链的后面

8、循环`promise`调用链，将`promise`调用链中的每一个项通过`promise = promise.then(xx,xx)`串联起来，然后开始执行

9、返回`promise`实例

## 总结

通过上面的分析，我们了解到了`request`函数内部的执行流程。相信大家通过分析，已经发现了`request`函数存在 2 个重点。一个是请求/响应拦截器的实现（在实际开发中经常使用到），需要重点去分析。一个是`dispatchRequest`函数，是用来派发请求的，请求/响应数据的处理都是在这个函数里面的，也是需要重点分析的

在下一个章节，我们将会讲解请求/响应拦截器的实现
