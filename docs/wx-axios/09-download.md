# download 下载函数

本章节，我们主要实现`download下载文件`的功能

## 代码

我们先来看一下代码的实现，代码在`wx-axios/lib/adapters/download.js`

```javascript
import buildFullPath from "../core/buildFullPath";
import buildURL from "../helpers/buildURL";
import enhanceError from "../core/enhanceError";
import settle from "../core/settle";
import Base64 from "../helpers/base64";
import { forEach } from "../utils";

function downloadAdapter(config) {
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
        data: {
          tempFilePath: res.tempFilePath,
          filePath: res.filePath,
        },
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
      success: successFn,
      fail: failFn,
    };
    forEach(["timeout", "filePath"], (key) => {
      if (key in config) {
        options[key] = config[key];
      }
    });
    if (config.cancelToken) {
      config.cancelToken.then((cancel) => {
        if (!request) {
          return;
        }
        request.abort();
        reject(cancel);
      });
    }
    request = wx.downloadFile(options);
    if (config.onDownloadProgress) {
      request.onProgressUpdate(config.onDownloadProgress);
    }
  });
}

export default downloadAdapter;
```

## 分析

我们可以看见`download下载文件`执行流程如下：

- 根据`auth`配置项是否开启，添加自定义请求头`Authorization`

- 根据`xsrfStorageName`和`xsrfHeaderName`配置项添加自定义请求头，实现`xsrf`防御

- 根据`baseURL`和`url`配置项构建完整的请求地址

- 构建`wx.downloadFile`下载参数

- 通过循环将`download下载文件`特有的配置项和通用配置项添加进`wx.downloadFile`下载参数中

- 监听外部取消下载文件事件

- 使用`wx.downloadFile`API 下载文件，并获得对应的实例

- 监听文件下载事件

由于微信小程序下载文件是使用了单独的 API，所以我们要对下载文件进行单独的封装

`wx.downloadFile`下载参数中，`success`为下载成功处理事件，`fail`为下载失败处理事件

在`success`处理函数中，响应头微信小程序已经返回来给我们，是一个 json 对象，我们也无需进行格式化。最后通过调用`settle`函数根据自定义`请求/上传/下载校验函数`来决定，下载是成功状态还是失败状态

在`fail`处理函数中，使用`enhanceError`函数对`error`错误对象添加额外的属性，并返回该错误对象

对于取消下载文件，`wx.downloadFile`返回的对象提供了`abort`方法来取消下载文件

对于监听文件下载进度事件，`wx.downloadFile`返回的对象提供了`onProgressUpdate`方法来进行监听

## 总结

文件下载的实现比较简单，通过对`wx.downloadFile`的封装，我们也实现了跟`axios`下载文件一样的功能，比如监听文件下载等功能

通过本章节的学习，相信大家对微信小程序是如何下载文件已经有了一定的了解了
