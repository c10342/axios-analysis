# XSRF 防御

在前面的章节中，我们发现`request请求处理函数`，`upload上传文件`，`download下载文件`都有`xsrf 防御`功能。所以本章节我们来了解一下在微信小程序中使如何实现`xsrf 防御`功能

## 代码

我们先来看一下代码的实现，代码在`wx-axios/lib/adapters/upload.js`，`wx-axios/lib/adapters/request.js` ，`wx-axios/lib/adapters/download.js`都有

```javascript
const xsrfValue = config.xsrfStorageName
  ? wx.getStorageSync(config.xsrfStorageName)
  : undefined;
if (xsrfValue) {
  requestHeaders[config.xsrfHeaderName] = xsrfValue;
}
```

## 分析

跟`axios`不同的是，`axios`是从`cookies`存储中读取值的，但是微信小程序并没有`cookies`存储，只能存储在`storage`中，所以要通过`wx.getStorageSync`读取对应的值。注意，要使用`wx.getStorageSync`，不能使用`wx.getStorage`，`wx.getStorage`是一个异步函数，会导致读出来的值为`undefined`。

`xsrfStorageName`是存储在`storage`中的`key`值，`xsrfHeaderName`是自定义请求头的`key`值，`xsrfHeaderName`的值应该是跟后台一起约定好的。

## 总结

`xsrf 防御`的原理和方案跟所使用的环境是无关的，只是不同的环境在代码上的实现可能会有所不同。

本章节一些相关的东西可查看`axios`源码分析的[客户端防御 XSRF](/analysis/11-XSRF)章节
