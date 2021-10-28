# 转换请求/响应数据

再上一个章节中，我们分析了`dispatchRequest`函数的内部实现，发现其内部使用了`transformRequest`和`transformResponse`来对`请求/响应数据`进行转换。本章节，我们将分析`请求/响应数据`是怎么进行转换的

## transformData 函数分析

在分析`dispatchRequest`函数的时候，我们可以看见在对请求/响应数据进行转化的时候，都是用了`transformData`函数进行处理。我们先来看看`transformData`函数的内部实现

源码在`lib/core/transformData.js`文件

```javascript
var utils = require("./../utils");

/**
 * 对请求/响应数据进行转化处理
 *
 * @param {Object|String} data 数据
 * @param {Array} headers 请求头
 * @param {Array|Function} fns 数组函数或者函数
 * @returns {*} 转换之后的数据
 */
module.exports = function transformData(data, headers, fns) {
  utils.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });

  return data;
};
```

`utils.forEach`函数会先判断`fns`是否为数组，如果不是就会转化为数组，然后再进行遍历。上一个函数的返回结果会作为下一个函数的参数，这样就可以实现多级处理请求/响应数据

## 请求数据转换

### 源码分析

`transformRequest`是负责处理请求数据的，在默认的配置项中会有一个默认的处理函数。

源码在`lib/defaults.js`，第 33 行开始：

```javascript
var defaults = {
  transformRequest: [
    function transformRequest(data, headers) {
      // 将请求头的accept和content-type字段转化为大写
      // eg：{accept:'*','content-type':"&"}==>{Accept:'*','Content-Type':"&"}
      normalizeHeaderName(headers, "Accept");
      normalizeHeaderName(headers, "Content-Type");

      // 原生浏览器的XMLHttpRequest支持直接发送`Blob`，`BufferSource`，`FormData`，`URLSearchParams`，`USVString`类型格式的数据
      // 详情可参考：https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/send
      // node的http模块支持 string，ArrayBuffer，Buffer，Stream
      // 详情可参考：http://nodejs.cn/api/http.html#http_request_end_data_encoding_callback
      // request.end([data[, encoding]][, callback])
      if (
        utils.isFormData(data) ||
        utils.isArrayBuffer(data) ||
        utils.isBuffer(data) ||
        utils.isStream(data) ||
        utils.isFile(data) ||
        utils.isBlob(data)
      ) {
        return data;
      }
      if (utils.isArrayBufferView(data)) {
        // 是一种 ArrayBuffer 视图（view），比如类型化数组对象（typed array objects）或者数据视图（ DataView）
        // 详情可参考：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/isView
        return data.buffer;
      }
      if (utils.isURLSearchParams(data)) {
        // 如果参数是URLSearchParams类型的，并且`Content-Type`请求头没有设置，则需要将`Content-Type`请求头设置为`application/x-www-form-urlencoded;charset=utf-8`
        setContentTypeIfUnset(
          headers,
          "application/x-www-form-urlencoded;charset=utf-8"
        );
        // 序列化参数（将数据变成字符串）
        return data.toString();
      }
      if (utils.isObject(data)) {
        // 参数是对象类型的，或者`Content-Type`请求头值为`application/json`的情况
        // 如果`Content-Type`请求头没有设置，就将`Content-Type`请求头设置为`application/json`
        setContentTypeIfUnset(headers, "application/json;charset=utf-8");
        // 将数据转化为字符串
        return JSON.stringify(data);
      }
      return data;
    },
  ],
};
```

### transformRequest 执行流程

1、先把请求头`accept`和`content-type`转化为大写，因为用户传入的可能会存在小写的情况

2、判断数据是否为一下几种类型之一：`FormData`，`ArrayBuffer`，`Buffer`，`Stream`，`File`，`Blob`，如果是，就不做任何处理，直接返回数据

3、判断数据是否为`ArrayBuffer 视图（view）`，是则直接返回`buffer`字段的值

4、判断数据是否为`URLSearchParams`类型的，是则需要设置`Content-Type`的值为`application/x-www-form-urlencoded;charset=utf-8`（前提是`Content-Type`的值不存在，存在就不用设置），然后将数据序列变成字符串，并返回

5、判断数据是否为对象类型的或者`Content-Type`的值为`application/json`的，是则需要设置`Content-Type`的值为`application/json`（前提是`Content-Type`的值不存在，存在就不用设置），然后将数据变成字符串，并返回

6、存在其他情况的。数据不做处理直接返回

### 其他

原生浏览器的`XMLHttpRequest`支持直接发送`Blob`，`BufferSource`，`FormData`，`URLSearchParams`，`USVString`类型格式的数据。详情可参考[这里](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/send)

node 的`http`模块支持 `String`，`ArrayBuffer`，`Buffer`，`Stream`类型格式的数据。详情可参考[这里](http://nodejs.cn/api/http.html#http_request_end_data_encoding_callback)，对应找到`request.end([data[, encoding]][, callback])`这个方法

`ArrayBuffer 视图（view）`类似类型化数组对象（typed array objects）或者数据视图（ DataView），详情可参考[这里](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/isView)

## 响应数据转换

### 源码分析

`transformResponse`是负责处理响应数据的，在默认的配置项中会有一个默认的处理函数。

源码在`lib/defaults.js`，第 83 行开始：

```javascript
var defaults = {
  transformResponse: [
    function transformResponse(data) {
      // 将字符串转为对象，如果成功就返回对象，如果失败就原样返回
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          /* Ignore */
        }
      }
      return data;
    },
  ],
};
```

### transformRequest 执行流程

响应数据处理比较简单，如果是字符串，就尝试把字符串转化为json对象，如果成功就返回json对象，如果失败就原样返回。如果是其他格式的数据，直接原样返回



## 总结

请求数据转换的流程可能会比较复杂，需要对数据类型进行判断，不同的数据类型的转换方式和`Content-Type`请求头是不一样的。

响应数据转换的流程比较简单。只需要针对字符串做一个转换即可，其他的格式数据无需转换，直接返回。

到这里，相信大家对 axios 的 `转换请求数据和响应数据` 和 `自动转换 JSON 数据` 特性是怎么做到得了

下一个章节，我们将会分析`xhr`请求处理函数的实现