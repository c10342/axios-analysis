# 转换请求/响应数据

本章节，我们将会实现`转换请求/响应数据`功能

## 代码

我们先来看一下代码的实现

`transformData`函数代码在`wx-axios/lib/core/transformData.js`

```javascript
import { forEach } from "../utils";

function transformData(data, headers, method, fns) {
  forEach(fns, (fn) => {
    data = fn(data, headers, method);
  });
  return data;
}

export default transformData;
```

`transformRequest`函数代码在`wx-axios/lib/defaults.js`

```javascript
const defaults = {
  transformRequest: [
    (data, headers, method) => {
      return data;
    },
  ],
};
```

`transformResponse`函数代码在`wx-axios/lib/defaults.js`

```javascript
const defaults = {
  transformResponse: [
    (data, headers, method) => {
      return data;
    },
  ],
};
```

## 分析

`transformData`，`transformRequest`，`transformResponse`函数跟`axios`不一样的是，多了一个`method`参数，这个是因为我们是根据不同的请求方法去调用不同的底层 API，所需要的实现的数据转换功能可能会有所不同，所以添加了一个`method`参数

由于`wx.request`，`wx.downloadFile`，`wx.uploadFile`这三个 API 已经经过微信小程序的封装，对请求/响应数据不需要做任何处理，所以`transformRequest`和`transformResponse`默认的做法是直接原样返回了数据，不做处理。

## 总结

`转换请求/响应数据`这个功能跟`axios`是保持一致的，但是由于微信小程序内部已经是经过封装的，所以在转换数据的时候无需做任何处理，相比于 web 端和 node 端的转化就要简单很多了

本章节一些相关的东西可查看`axios`源码分析的[转换请求/响应数据](/analysis/08-transformData)章节
