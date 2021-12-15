'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

// 获取默认的适配器,浏览器或者node端的
function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // 浏览器环境下的
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // node环境，根据process对象判断是否为node环境
    adapter = require('./adapters/http');
  }
  return adapter;
}

var defaults = {
  // 获取根据不同环境获取不同的请求处理函数，web端或者是node端的
  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    // 将请求头的accept和content-type字段转化为大写
    // eg：{accept:'*','content-type':"&"}==>{Accept:'*','Content-Type':"&"}
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');

    // 原生浏览器的XMLHttpRequest支持直接发送`Blob`，`BufferSource`，`FormData`，`URLSearchParams`，`USVString`类型格式的数据
    // 详情可参考：https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/send
    // node的http模块支持 string，ArrayBuffer，Buffer，Stream
    // 详情可参考：http://nodejs.cn/api/http.html#http_request_end_data_encoding_callback
    // request.end([data[, encoding]][, callback])
    if (utils.isFormData(data) ||
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
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      // 序列化参数（将数据变成字符串）
      return data.toString();
    }

    // 自动转换 JSON 数据
    if (utils.isObject(data)) {
      // 参数是对象类型的，或者`Content-Type`请求头值为`application/json`的情况
      // 如果`Content-Type`请求头没有设置，就将`Content-Type`请求头设置为`application/json`
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      // 将数据转化为字符串
      return JSON.stringify(data);
    }
    return data;
    /**
     * 总结：
     * 1、先把请求头`Accept`和`Content-Type`转化为大写，因为可能会存在小写的情况
     * 2、判断数据是否为一下几种类型之一：`FormData`，`ArrayBuffer`，`Buffer`，`Stream`，`File`，`Blob`，如果是，就不做任何处理
     * 3、判断数据是否为`ArrayBuffer 视图（view）`，是则返回`buffer`字段的值
     * 4、判断数据是否为`URLSearchParams`类型的，是则需要设置`Content-Type`的值为`application/x-www-form-urlencoded;charset=utf-8`（前提是`Content-Type`的值不存在，存在就不用设置），然后将数据序列变成字符串，并返回。
     * 5、判断数据是否为对象类型的或者`Content-Type`的值为`application/json`的，是则需要设置`Content-Type`的值为`application/json`（前提是`Content-Type`的值不存在，存在就不用设置），然后将数据变成字符串，并返回。
     * 6、存在其他情况的。数据不做处理直接返回
     */
  }],

  transformResponse: [function transformResponse(data) {
    // 将字符串转为对象，如果成功就返回对象，如果失败就原样返回
    if (typeof data === 'string') {
      try {
        // 自动转换 JSON 数据
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
    /**
     * 总结：
     * 
     * 响应数据处理比较简单，如果是字符串，就尝试吧字符串转化为json对象，如果成功就返回对象，如果失败就原样返回
     * 
     */
  }],


  // 请求超时时间
  timeout: 0,

  // xsrf 防御，原理是通过读取cookie的字段值，然后设置对应的自定义请求头
  // cookie字段的key值，通过该字段读取cookie值
  xsrfCookieName: 'XSRF-TOKEN',
  // 请求头header的key值
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  // 请求成功或者失败的校验函数，传入的参数是状态码
  validateStatus: function validateStatus(status) {
    // 大于等于200小于300就是成功
    return status >= 200 && status < 300;
  }
};

defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;
