# xhr 请求处理函数

在前面的章节[dispatchRequest 函数分析](/analysis/07-dispatchRequest)中，我们得知`dispatchRequest`函数通过不同的环境来选择不同的请求处理函数去发送请求。那么，本章节，我们就来分析浏览器环境的 xhr 请求处理函数

## 源码分析

我们先来分析一下源码，源码是在`lib/adapters/xhr.js`文件

```javascript
var utils = require("./../utils");
var settle = require("./../core/settle");
var cookies = require("./../helpers/cookies");
var buildURL = require("./../helpers/buildURL");
var buildFullPath = require("../core/buildFullPath");
var parseHeaders = require("./../helpers/parseHeaders");
var isURLSameOrigin = require("./../helpers/isURLSameOrigin");
var createError = require("../core/createError");

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    // 请求数据
    var requestData = config.data;
    // 请求头
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      // 如果请求数据是`FormData`类型的，需要删除`Content-Type`请求头，
      //   否则浏览器会不知道你所发送的数据类型为`FormData`类型
      delete requestHeaders["Content-Type"];
    }
    // 创建`request`对象
    var request = new XMLHttpRequest();

    // http身份验证，采用的是 基本认证（Basic access authentication）
    // 只适用于`HTTP Basic auth`，`Bearer`需要自己去定义`Authorization`请求头
    if (config.auth) {
      // 开启之后，会设置`Authorization`请求头，如果已经存在，会被覆盖
      // 用户名
      var username = config.auth.username || "";
      // 密码
      var password = config.auth.password
        ? unescape(encodeURIComponent(config.auth.password))
        : "";
      // 加密策略：用户名和密码用`:`合并，将合并后的字符串使用BASE64加密为密文，然后在前面添加`Basic `
      requestHeaders.Authorization = "Basic " + btoa(username + ":" + password);
    }

    // 根据`baseURL`和`url`拼接完整的请求地址
    var fullPath = buildFullPath(config.baseURL, config.url);
    // 准备发送请求，`buildURL`函数会构建出一个带有查询参数的完整url地址
    request.open(
      config.method.toUpperCase(),
      buildURL(fullPath, config.params, config.paramsSerializer),
      true
    );

    // 设置请求超时时间
    request.timeout = config.timeout;

    // 监听onreadystatechange事件
    request.onreadystatechange = function handleLoad() {
      // 0：未初始化，还没有调用send()方法；

      // 1：载入，已调用send()方法，正在发送请求；

      // 2：载入完成，send()方法执行完成，已经接收到全部响应内容；

      // 3：交互，正在解析响应内容；

      // 4：完成，响应内容解析完成，可以在客户端进行调用了；

      if (!request || request.readyState !== 4) {
        return;
      }

      // status=0说明还没初始化，就是还没调用send()方法
      // 会在`onerror`和`ontimeout`事件之前变成status=0
      if (
        request.status === 0 &&
        !(request.responseURL && request.responseURL.indexOf("file:") === 0)
      ) {
        return;
      }

      // 获取响应头，并转化为json对象
      var responseHeaders =
        "getAllResponseHeaders" in request
          ? parseHeaders(request.getAllResponseHeaders())
          : null;
      // 获取响应数据
      var responseData =
        !config.responseType || config.responseType === "text"
          ? request.responseText
          : request.response;
      // 构建响应对象
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request,
      };

      // settle函数是根据返回的状态码来判断请求是否成功，
      // 然后调用resolve/reject
      settle(resolve, reject, response);

      // 置空 `request` 对象
      request = null;
    };

    // 监听 `onabort` 事件，即请求取消事件
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      // 返回一个经过处理的error对象
      reject(createError("Request aborted", config, "ECONNABORTED", request));

      // 置空 `request` 对象
      request = null;
    };

    // 网络错误
    request.onerror = function handleError() {
      reject(createError("Network Error", config, null, request));
      request = null;
    };

    // 请求超时
    request.ontimeout = function handleTimeout() {
      // 超时错误信息
      var timeoutErrorMessage = "timeout of " + config.timeout + "ms exceeded";
      if (config.timeoutErrorMessage) {
        // 如果传入了`config.timeoutErrorMessage`，就使用`config.timeoutErrorMessage`的
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(timeoutErrorMessage, config, "ECONNABORTED", request));

      request = null;
    };

    // 防御 xsrf
    // 需要在标准浏览器中才能使用，如果是在react-native等非标准浏览器中就不能使用了
    if (utils.isStandardBrowserEnv()) {
      // 默认值
      // {
      //   xsrfCookieName: 'XSRF-TOKEN',
      //   xsrfHeaderName: 'X-XSRF-TOKEN',
      // }
      // 这段代码的逻辑很简单。如果 cookie 中包含 XSRF-TOKEN 这个字段，
      //   就把 header 中 X-XSRF-TOKEN 字段的值设为 XSRF-TOKEN 对应的值

      // `withCredentials`配置参数为`true`并且是同源请求
      // isURLSameOrigin涉及到一些知识点，需要重点分析
      var xsrfValue =
        (config.withCredentials || isURLSameOrigin(fullPath)) &&
        config.xsrfCookieName
          ? cookies.read(config.xsrfCookieName)
          : undefined;

      if (xsrfValue) {
        // 设置请求头
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // 添加请求头到请求中
    if ("setRequestHeader" in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (
          typeof requestData === "undefined" &&
          key.toLowerCase() === "content-type"
        ) {
          // 空数据需要删除`content-type`请求头
          delete requestHeaders[key];
        } else {
          // 调用`setRequestHeader`设置请求头
          request.setRequestHeader(key, val);
        }
      });
    }

    // 设置跨域的时候是否携带cookie，同域的时候不管设置或者不设置，效果都是一样的
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // 设置响应数据类型
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // 浏览器引发的预期DomeException与XMLHttpRequest级别2不兼容。
        // 但是，对于`json`类型，这可以被限制，因为它可以通过默认的`transformResponse`函数进行解析。
        if (config.responseType !== "json") {
          throw e;
        }
      }
    }

    // 监听下载事件，下载文件的时候
    if (typeof config.onDownloadProgress === "function") {
      request.addEventListener("progress", config.onDownloadProgress);
    }

    // 监听上传事件，上传文件的时候，但是并不是所有浏览器都支持上传事件
    if (typeof config.onUploadProgress === "function" && request.upload) {
      request.upload.addEventListener("progress", config.onUploadProgress);
    }

    if (config.cancelToken) {
      // cancelToken对象，该对象上面会存在一个promise实例
      // 一旦promise实例变成成功状态，就会来到`then`函数这里
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }
        // 中断请求
        request.abort();
        reject(cancel);
        request = null;
      });
    }

    if (!requestData) {
      // 请求数据不存在的情况下，置为null
      requestData = null;
    }

    // 发送请求
    request.send(requestData);
  });
};
```

## 执行流程

从上面的源码分析中，我们可以分析出 xhr 请求处理函数的执行过程，如下：

1、判断请求数据是否为`FormData`类型的，如果是，则需要删除`Content-Type`请求头，否则浏览器识别不了你所发送的数据类型为`FormData`类型

2、创建一个`XMLHttpRequest`实例

3、如果开启了 http 身份验证（采用`Basic access authentication`），则根据用户名和密码构建请求头`Authorization`的 value 值

4、根据`baseURL`和`url`拼接完整的请求地址

5、调用`XMLHttpRequest`实例`open`方法，准备发起请求

6、设置请求超时时间（timeout），跨域是否携带 cookie（withCredentials）

7、根据`xsrfCookieName`字段和`xsrfHeaderName`来开启`xsrf`防御

8、遍历`config.headers`字段，调用`XMLHttpRequest`实例的`setRequestHeader`方法设置请求头

9、设置`responseType`数据响应类型

10、监听`onreadystatechange`状态码变化事件，`onabort`请求中断事件，`onerror`网络错误事件，`ontimeout`请求超时事件，`progress`下载文件事件（如果用户传入`onDownloadProgress`配置项才监听），`upload`对象`progress`上传文件事件（如果用户传入`onUploadProgress`配置项并且`upload`对象存在才监听）

11、如果用户传入了`cancelToken`实例（用来取消请求的，后面的章节会讲解），则调用`cancelToken`实例上面的 promise 属性的`then`方法来监听用户是否在外部取消了请求

12、调用`XMLHttpRequest`实例`send`方法，并传入请求数据，发送请求

xhr 请求处理函数的执行过程优有点复杂，但是整体上可以归纳为：

1、创建`XMLHttpRequest`实例

2、设置请求头

3、监听对应的事件函数

4、发送请求

## 功能点分析

从上面的分析中，我们可以看见 xhr 请求处理函数有几个强大的功能点，分别如下：

1、http 身份验证，只支持`Basic access authentication`

2、客户端防御 XSRF。只能在标准浏览器中使用，`react-native`，`ns`等非标准浏览器中使用不了

3、取消请求，通过`CancelToken`类实现

上面的三个功能点，以及实现原理，过程，我们后面会有专门的章节进行讲解，这里不细讲

## isURLSameOrigin 函数

`isURLSameOrigin`函数是用来判断请求地址是否同源，这个函数我们会单独用一个章节来分析，因为这里面涉及到的知识点比较新颖

## onreadystatechange 事件分析

当请求的状态码发生变化时，就会触发`onreadystatechange`事件。请求的状态码一共分为五种，分别如下：

- 0：未初始化，还没有调用 send()方法；

- 1：载入，已调用 send()方法，正在发送请求；

- 2：载入完成，send()方法执行完成，已经接收到全部响应内容；

- 3：交互，正在解析响应内容；

- 4：完成，响应内容解析完成，可以在客户端进行调用了；

我们只需要关心状态为`4`的情况，其余四种情况不做考虑

当状态为`4`的时候，也就是请求完成了，此时，会构建出一个`response`响应对象，该对象包含`data`响应数据，`status`响应状态码，`statusText`响应状态文本，`headers`响应头，`config`请求配置项，`request`请求实例

最后我们看见调用了`settle`函数，我们来看一下该函数的内部实现，源码在`/lib/core/settle.js`

```javascript
var createError = require("./createError");

/**
 * 根据响应状态码，调用resolve或者reject
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  // 使用validateStatus函数校验是否为成功状态
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    // 失败就返回一个经过处理的error对象
    reject(
      createError(
        "Request failed with status code " + response.status,
        response.config,
        null,
        response.request,
        response
      )
    );
  }
};
```

我们可以看见`settle`函数根据响应状态码，以及`validateStatus`校验状态码来判断请求是否成功。

那么，我们在来看看`validateStatus`函数的默认配置项，源码在`/lib/defaults.js`文件，第 113 行

```javascript
var defaults = {
  // 请求成功或者失败的校验函数，传入的参数是状态码
  validateStatus: function validateStatus(status) {
    // 大于等于200小于300就是成功
    return status >= 200 && status < 300;
  },
};
```

通过`validateStatus`函数的分析，我们可以的出的结论是，如果响应状态码大于等于 200 并且小于 300 的，则请求是成功的，否则，请求是失败的

## 其他事件

其他一些事件，比如`ontimeout`，`onerror`，`onabort`等事件，请求都是被认为是失败的，此时会通过`createError`函数，创建一个`Error`对象实例并返回，该对象实例是经过处理的，添加了一些额外属性

## 注意点

在分析出 xhr 请求处理函数的过程中，我们有些地方需要特别注意一下

1、请求数据是`FormData`类型的，需要删除`Content-Type`请求头，浏览器会自动识别的

2、`withCredentials`属性是用来设置跨域的时候是否携带 cookie，同域的时候不管设置或者不设置，效果都是一样的

3、上传文件事件并不是所有浏览器都支持的，需要判断请求实例中是否有`upload`事件

4、将 `responseType` 设置为特定值时，应确保服务器实际发送的响应与该格式兼容。如果服务器返回的数据与设置的 `responseType` 不兼容，则 `response` 的值将为 `null`

5、xsrf 防御只在客户端有效，也就是标准浏览器环境。其他非标准浏览器环境，比如`react-native`等，或者其他环境，比如 node，是无效的，因为不存在`cookie`这种说法的。

6、上传文件和下载文件监听的事件都是叫`progress`，但是监听的对象是不一样的

## 总结

通过对 xhr 请求处理函数的分析，我们了解到了 axios 的一些常见的功能，比如取消请求、客户端防御 XSRF、http 身份验证。同时也对`XMLHttpRequest`怎么发送请求有了一定的了解。以及一些常见的事件，还有请求状态码等等

在下一个章节，我们将会讲解 `http 身份验证`（auth 身份验证）功能的实现以及原理
