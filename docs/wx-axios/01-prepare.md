# 准备工作

通过`axios`源码分析这部分的学习，相信大家对`axios`的源码已经有了一定的了解，以及对`axios`的设计思想也有一定的了解。所以这部分，我将会带带领大家实现一个微信小程序版的`axios`，来加深大家对`axios`源码的理解。我们将这个库称之为`wxAxios`。`wxAxios`源代码目录是放在该电子文档仓库根目录下的`wx-axios`，有需要的可自行下载使用。

## 需求分析

首先我们先来分析一下我们需要实现什么样的功能

- 基于`wx.request`,`wx.downloadFile`和`wx.uploadFile`封装的 Http 请求库

- 支持 `Promise` API

- 请求/响应拦截器

- 转换请求数据和响应数据

- 取消请求

- 自动转换 JSON 数据

- `XSRF`防御

- auth 身份验证

上面的功能实际上跟原版的`axios`功能差不多，但是代码实现起来会有点差异，毕竟运行的环境都不一样了

## 概要设计

我们将会参考`axios`的实现过程，来实现`wxAxios`，其中项目结构，文件目录，等都是参考原版 axios 的。部分的代码跟原版的 axios 基本是一样的，有些功能的实现代码基本跟原版 axios 一样，比如`请求/响应拦截器`，`取消请求`等代码基本不变，但是由于支持的端不一样，底层适配器不一样，所以，有些功能是一样的，但是代码会是不一样。我们主要针对这些不一样的代码进行讲解，分析。重复的，一样的代码将不会讲解，大家可自行去查看`axios`源码分析对应的章节

## 详细设计

在`wxAxios`的实现过程中，我们将会全面采用`es6`的写法，比如，原版 axios 是通过构造函数实现类的，我们将使用`es6`的`class`来实现类。模块方面也是使用`es module`。因为微信小程序对`es6`的语法已经做了很好的支持了，所以我们不需要担心兼容性的问题。同时我们还会做一些优化。在实现的过程中，我们将会采用自顶向下的方式，从抽象到具体，一步一步实现我们的功能

## API

API 跟原版 axios 基本一致，主要是多了几个请求方法，同时还统一了请求方法别名的使用方式，请求/响应拦截器，取消请求等功能的 API 保持不变。下面列出请求方法别名的 api：

- `axios.request(config)`

- `axios.options(url[, config])`

- `axios.get(url[, config])`

- `axios.head(url[, config])`

- `axios.post(url[, config])`

- `axios.put(url[, config])`

- `axios.delete(url[, config])`

- `axios.trace(url[, config])`

- `axios.connect(url[, config])`

- `axios.download(url[, config])`

- `axios.upload(url[, config])`

与原版 axios 不一样的是，因为微信小程序将普通请求、文件下载、文件上传分开了三个接口去实现，所以我们需要将`wx.request`,`wx.downloadFile`和`wx.uploadFile`封装起来，统一请求、文件下载、文件上传，所以`wxAxios`会多了`download`和`upload`请求方法，分别用于文件下载和文件上传

## 目录章节

代码实现一样的章节，我们不会进行讲解，比如`wxAxios`对象创建过程，`WxAxios`构造函数实现上一样的，详情可查看`axios`源码分析部分。我们只会讲解有改动，或者实现上是不一样的章节

**第一章 InterceptorManager 类实现**

本章节主要是实现`InterceptorManager`拦截器管理类。与原版`axios`的`InterceptorManager`不一样的是，我们是使用`es6`的`class`来实现的，并且进行了一些优化。

**第二章 WxAxios 构造函数实现**

本章节主要是实现`WxAxios`构造函数。跟原版`axios`的`Axios`构造函数不一样的是，`WxAxios`请求别名方法会有所改变，同时我们还会统一请求别名方法的使用方式

**第三章 adapter 适配器函数实现**

本章节主要是实现`adapter`适配器函数。跟原版`axios`的`adapter`适配器不同的是，`dispatchRequest`函数每次调用的时候都会去调用`adapter`适配器动态的获取不同的请求处理函数

**第四章 转换请求/响应数据**

本章节主要是实现`转换请求/响应数据`功能。跟原版`axios`的不同的是，`transformRequest`和`transformResponse`将会多出一个`method`参数

**第五章 XSRF 防御**

本章节主要是实现`XSRF防御`功能，跟原版`axios`的不同的是，`WxAxios`是从`wx.getStorageSync`中读取对应的值

**第六章 auth 身份验证**

本章节主要是实现`auth 身份验证`功能，跟原版`axios`的不同的是，`WxAxios`需要自己去实现`base64`编码的功能

**第七章 request 请求函数**

本章节主要是使用`wx.request`API 封装一个请求函数

**第八章 download 下载函数**

本章节主要是使用`wx.downloadFile`API 封装一个下载文件的函数

**第九章 upload 上传函数**

本章节主要是使用`wx.uploadFile`API 封装一个上传文件的函数

**第十章 请求配置项**

本章主要是说明`WxAxios`有哪些默认的配置项，完整的配置项有什么，以及不同请求方法的特有配置项有什么

**第十一章 总结**

本章主要是对`WxAxios`实现的总结，以及感想和收获
