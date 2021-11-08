# adapter 适配器函数实现

本章节，我们将会实现`adapter`适配器

## 代码

我们先来看一下代码的实现，代码在`wx-axios/lib/defaults.js`，第 6 行

```javascript
function getDefaultAdapter(config) {
  let adapter;
  const method = config.method;
  if (!methods.includes(method)) {
    throw new Error(`不支持 ${method} 请求`);
  }
  if (method === "upload") {
    adapter = uploadAdapter;
  } else if (method === "download") {
    adapter = downloadAdapter;
  } else {
    adapter = requestAdapter;
  }
  return adapter;
}

const defaults = {
  adapter: getDefaultAdapter,
};
```

## 分析

首先我们的适配器是需要每次请求的时候都执行一次，动态获取到不同的请求处理函数。与`axios`不同的是，`axios`在一开始的时候就执行了`getDefaultAdapter`函数，并不是在每次请求的时候执行，它根据环境获取到了对应的请求处理函数。

在微信小程序中，我们无需根据环境去获取请求处理函数，而是根据请求方法获取不同的请求处理函数，因为我们的`WxAxios`是对`wx.request`，`wx.uploadFile`，`wx.downloadFile`进行封装的，不同的请求方法对应着使用不同的底层 API。其中`upload`请求方法使用的是`wx.uploadFile`API，`download`请求方法使用的是`wx.downloadFile`API，其他请求方法使用的是`wx.request`API

## 总结

`adapter`适配器是在每次请求的时候根据`method`字段获取不同的请求处理函数，所以`adapter`是一个函数，函数执行的结果就是返回对应的请求处理函数（因为`axios`在一开始的时候就执行了`getDefaultAdapter`，所以`adapter`其实就是对应的请求处理函数）。
