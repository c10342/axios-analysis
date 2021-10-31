# 请求配置项

经过前面的章节学习，相信大家也看见了`config`这个请求配置项贯穿了整个流程。那么本章节，我们就来总结一下 axios 的请求配置项到底有什么

## 默认配置项

axios 为我们提供了一些默认的配置项，这些默认的配置项在`/lib/defaults.js`文件，我们先来看一下源码

```javascript
var utils = require("./utils");
var normalizeHeaderName = require("./helpers/normalizeHeaderName");

var DEFAULT_CONTENT_TYPE = {
  "Content-Type": "application/x-www-form-urlencoded",
};

function setContentTypeIfUnset(headers, value) {
  if (
    !utils.isUndefined(headers) &&
    utils.isUndefined(headers["Content-Type"])
  ) {
    headers["Content-Type"] = value;
  }
}

// 获取默认的适配器,浏览器或者node端的
function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== "undefined") {
    // 浏览器环境下的
    adapter = require("./adapters/xhr");
  } else if (
    typeof process !== "undefined" &&
    Object.prototype.toString.call(process) === "[object process]"
  ) {
    // node环境
    adapter = require("./adapters/http");
  }
  return adapter;
}

var defaults = {
  // 获取根据不同环境获取不同的请求处理函数，web端或者是node端的
  adapter: getDefaultAdapter(),

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

      // 自动转换 JSON 数据
      if (utils.isObject(data)) {
        // 参数是对象类型的，或者`Content-Type`请求头值为`application/json`的情况
        // 如果`Content-Type`请求头没有设置，就将`Content-Type`请求头设置为`application/json`
        setContentTypeIfUnset(headers, "application/json;charset=utf-8");
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
    },
  ],

  transformResponse: [
    function transformResponse(data) {
      // 将字符串转为对象，如果成功就返回对象，如果失败就原样返回
      if (typeof data === "string") {
        try {
          // 自动转换 JSON 数据
          data = JSON.parse(data);
        } catch (e) {
          /* Ignore */
        }
      }
      return data;
      /**
       * 总结：
       *
       * 响应数据处理比较简单，如果是字符串，就尝试吧字符串转化为json对象，如果成功就返回对象，如果失败就原样返回
       *
       */
    },
  ],

  // 请求超时时间
  timeout: 0,

  // xsrf 防御，原理是通过读取cookie的字段值，然后设置对应的自定义请求头
  // cookie字段的key值，通过该字段读取cookie值
  xsrfCookieName: "XSRF-TOKEN",
  // 请求头header的key值
  xsrfHeaderName: "X-XSRF-TOKEN",

  maxContentLength: -1,
  maxBodyLength: -1,

  // 请求成功或者失败的校验函数，传入的参数是状态码
  validateStatus: function validateStatus(status) {
    // 大于等于200小于300就是成功
    return status >= 200 && status < 300;
  },
};

defaults.headers = {
  common: {
    Accept: "application/json, text/plain, */*",
  },
};

utils.forEach(["delete", "get", "head"], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;
```

通过上面的源码查看，我们可以看见，默认配置项都是在`default`对象中，最后还通过循环给不同请求方法添加对应的请求头。我们对这个文件进行输出，最终`default`对象的结构如下：

```javascript
var defaults = {
  // 请求适配器
  adapter: getDefaultAdapter(),
  //   请求数据转换
  transformRequest: [function transformRequest(data, header) {}],
  //   响应数据转换
  transformResponse: [function transformResponse(data) {}],
  //   请求超时事件
  timeout: 0,
  //   xsrf防御，cookie存储的字段，这个选项只能用在web端浏览器环境的请求
  xsrfCookieName: "XSRF-TOKEN",
  //   xsrf防御，请求头key字段
  xsrfHeaderName: "X-XSRF-TOKEN",
  //   最大响应内容长度，-1表示没有限制，这个选项只能用在web端浏览器环境的请求
  maxContentLength: -1,
  //   最大请求体长度，-1标识没有限制，这个选项只能用在`node`环境的请求
  maxBodyLength: -1,
  //   请求状态码校验器，返回true说明请求是成功的
  validateStatus: function validateStatus(status) {},
  //   请求头
  headers: {
    //   默认给所有请求都添加一个`Accept`请求头
    common: {
      Accept: "application/json, text/plain, */*",
    },
    delete: {},
    get: {},
    head: {},
    post: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    put: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    patch: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  },
};
```

## 完整配置项

通过上面对`/lib/defaults.js`文件的分析，我们可以知道 axios 为我们提供了那些默认的配置选项。那么现在我们就来总结一下 axios 的完整请求配置项有什么。

```javascript
{
  // 请求参数，为一个是需要必填的参数
  url: '/user',

  // 请求方法
  method: 'get', // 默认

  // 请求地址前缀
  baseURL: 'https://some-domain.com/api/',

//   请求数据转换，可以是数组，也可以是一个函数
// 默认配置有一个请求数据的，如果是直接赋值会被覆盖，建议可以使用push
  transformRequest: [function (data, headers) {
    return data;
  }],

//   响应数据转换，可以是数组，也可以是一个函数
// 默认配置有一个请求数据的，如果是直接赋值会被覆盖，建议可以使用push
  transformResponse: [function (data) {
    // Do whatever you want to transform the data

    return data;
  }],

  // 请求头
  headers: {'X-Requested-With': 'XMLHttpRequest'},

//   请求地址的查询参数
  params: {
    ID: 12345
  },

//   自定义请求地址查询参数序列化函数
  paramsSerializer: function (params) {
    return Qs.stringify(params, {arrayFormat: 'brackets'})
  },


//   请求体参数，只适用于'PUT', 'POST', 'DELETE , 和 'PATCH'请求
  data: {
    firstName: 'Fred'
  },

//   data配置可以是json对象，也可以是字符串，字符串的形式需要如下
  data: 'Country=Brasil&City=Belo Horizonte',

//   请求超时时间
  timeout: 1000, // 默认是0

//   是否跨域请求携带cookie，true表示携带，该配置只适用于web端的浏览器环境
  withCredentials: false,

//   请求适配器，可根据实际去自定义请求处理函数
  adapter: function (config) {
    /* ... */
  },

//   HTTP Basic auth 认证
  auth: {
    username: 'janedoe',
    password: 's00pers3cret'
  },


//   响应数据类型，
// 可以是 'arraybuffer', 'document', 'json', 'text', 'stream' , 'blob'
// blob仅限浏览器
  responseType: 'json', // 默认

  // 响应数据字符编码，该配置项仅限于node环境
  responseEncoding: 'utf8', // 默认

  // xsrf防御，cookie存储的字段，该配置项仅限于web端浏览器环境
  xsrfCookieName: 'XSRF-TOKEN', // 默认

  // xsrf防御，请求头key字段，该配置项仅限于web端浏览器环境
  xsrfHeaderName: 'X-XSRF-TOKEN', // 默认

  // 上传文件事件，该配置项仅限于web端浏览器环境
  onUploadProgress: function (progressEvent) {},

//   下载文件事件，该配置项仅限于web端浏览器环境
  onDownloadProgress: function (progressEvent) {},

  // 最大响应内容长度，该配置项仅限于node环境
  maxContentLength: 2000,

  // 最大请求内容长度，该配置项仅限于node环境
  maxBodyLength: 2000,

//   自定义状态校验码，返回true说明请求是成功的
  validateStatus: function (status) {
    return status >= 200 && status < 300; // 默认
  },

//   最大重定向次数，该配置项仅限于node环境
  maxRedirects: 5, // 默认

//   socket路径，该配置项仅限于node环境
  socketPath: null, // 默认

  自定义代理，该配置项仅限于node环境
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),

//   http代理，该配置项仅限于node环境
  proxy: {
    host: '127.0.0.1',
    port: 9000,
    auth: {
      username: 'mikeymike',
      password: 'rapunz3l'
    }
  },

//   取消请求的令牌
  cancelToken: new CancelToken(function (cancel) {
  }),

//   是否进行响应数据的压缩，该配置项仅限于node环境
  decompress: true // 默认

```

## 总结

通过本章节的学习，相信大家对axios的请求配置已经有所了解的。比如默认配置项有什么字段，一些配置项的的默认值是什么。以及那些是通用的字段，那些只能用在node环境或者web端浏览器环境