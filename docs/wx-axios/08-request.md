# request 请求函数

本章节，我们主要实现`request请求处理函数`的功能

## 代码

我们先来看一下代码的实现，代码在`wx-axios/lib/adapters/request.js`

```javascript
import buildFullPath from "../core/buildFullPath";
import Base64 from "../helpers/base64";
import buildURL from "../helpers/buildURL";
import { forEach } from "../utils";
import settle from "../core/settle";
import enhanceError from "../core/enhanceError";

function requestAdapter(config) {
  return new Promise((resolve, reject) => {
    let request;
    const requestHeaders = config.headers;
    // http basic 认证
    if (config.auth) {
      var username = config.auth.username || "";
      // 密码
      var password = config.auth.password
        ? decodeURI(encodeURIComponent(config.auth.password))
        : "";
      requestHeaders.Authorization =
        "Basic " + Base64.decode(username + ":" + password);
    }
    // xsrf改成从wx.getStorageSync中读取
    const xsrfValue = config.xsrfStorageName
      ? wx.getStorageSync(config.xsrfStorageName)
      : undefined;
    if (xsrfValue) {
      requestHeaders[config.xsrfHeaderName] = xsrfValue;
    }
    const fullPath = buildFullPath(config.baseURL, config.url);

    const successFn = (res) => {
      const response = {
        data: res.data,
        status: res.statusCode,
        statusText: res.errMsg,
        headers: res.header,
        config,
        request: request,
      };
      settle(resolve, reject, response);
    };

    const failFn = (error) => {
      reject(enhanceError(error, config, null, request, null));
    };

    const options = {
      url: buildURL(fullPath, config.params, config.paramsSerializer),
      header: requestHeaders,
      method: config.method.toUpperCase(),
      success: successFn,
      fail: failFn,
    };
    forEach(
      [
        "data",
        "timeout",
        "dataType",
        "responseType",
        "enableHttp2",
        "enableQuic",
        "enableCache",
        "enableHttpDNS",
        "httpDNSServiceId",
      ],
      (key) => {
        if (key in config) {
          options[key] = config[key];
        }
      }
    );
    if (config.cancelToken) {
      config.cancelToken.then((cancel) => {
        if (!request) {
          return;
        }
        request.abort();
        reject(cancel);
      });
    }

    request = wx.request(options);
  });
}

export default requestAdapter;
```

## 分析

我们可以看见`request请求处理函数`执行流程如下：

- 根据`auth`配置项是否开启，添加自定义请求头`Authorization`

- 根据`xsrfStorageName`和`xsrfHeaderName`配置项添加自定义请求头，实现`xsrf`防御

- 根据`baseURL`和`url`配置项构建完整的请求地址

- 构建`wx.request`请求参数

- 通过循环将`request请求处理函数`特有的配置项和通用配置项添加进`wx.request`请求参数中

- 监听外部取消请求事件

- 使用`wx.request`API 发送请求

相比于`axios`的请求处理函数，我们的这个`request请求处理函数`流程要简单很多，实现起来也是很简单，无需监听一大堆事件。

在`wx.request`请求参数中，`success`为请求成功处理事件，`fail`为请求失败处理事件

在`success`处理函数中，响应头微信小程序也已经返回来给我们，是一个 json 对象，我们也无需进行格式化。最后通过调用`settle`函数根据自定义`请求/上传/下载校验函数`来决定，请求是成功状态还是失败状态

在`fail`处理函数中，使用`enhanceError`函数对`error`错误对象添加额外的属性，并返回该错误对象

对于取消请求，`wx.request`返回的对象也提供了`abort`方法来取消请求

## 总结

因为`wx.request`已经是封装好的一个请求 API，我们算是对他进行了二次封装，所以实现起来相对比较简单。

通过本章节的学习，相信大家对微信小程序是如何发送一个请求已经有了一定的了解了
