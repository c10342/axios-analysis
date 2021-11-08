# auth 身份验证

在前面的章节中，我们发现`request请求处理函数`，`upload上传文件`，`download下载文件`都有`http basic 认证`功能。所以本章节我们来了解一下在微信小程序中使如何实现`http basic 认证`功能

## 代码

我们先来看一下代码的实现，代码在`wx-axios/lib/adapters/upload.js`，`wx-axios/lib/adapters/request.js` ，`wx-axios/lib/adapters/download.js`都有

```javascript
if (config.auth) {
  var username = config.auth.username || "";
  // 密码
  var password = config.auth.password
    ? decodeURI(encodeURIComponent(config.auth.password))
    : "";
  requestHeaders.Authorization =
    "Basic " + Base64.decode(username + ":" + password);
}
```

## 分析

`http basic 认证`使用的是`Authorization`自定义请求头，值得格式为`Basic 用户名:密码`。密码需要先编码在译码，主要是为了对一些特殊字符进行编码。

微信小程序并没有提供对应的方法直接把字符串转化为`base64`格式的，所以需要自己准备一个工具函数去转化为`base64`。大家可以参考`wx-axios/lib/helpers/base64.js`文件，这是在网上找的一份代码。微信小程序有提供`atob`方法对`base64`字符串进行译码，但是就是没有提供`btoa`方法把字符串转化为`base64`，这一点我觉得很奇怪。

## 总结

`http basic 认证`无论是在 web 端还是微信小程序端，流程是不变的。`http basic 认证`是一种规范，并不受环境影响。所以在实现上面跟`axios`源码的是一样的，不同的就只有字符串转`base64`需要我们自己去实现，因为微信小程序没有提供原生的方法给我们使用。

`http basic 认证`的原理和过程可查看`axios`源码分析的对应章节

本章节一些相关的东西可查看`axios`源码分析的[auth 身份验证](/analysis/10-authentication)章节
