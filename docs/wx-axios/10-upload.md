# upload 上传函数

本章节，我们主要实现`upload上传文件`的功能

## 代码

我们先来看一下代码的实现，代码在`wx-axios/lib/adapters/upload.js`

```javascript
function uploadAdapter(config) {
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
      success: successFn,
      fail: failFn,
    };
    if (config.data) {
      options.formData = config.data;
    }
    forEach(["filePath", "name", "timeout"], (key) => {
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
    request = wx.uploadFile(options);
    if (config.onUploadProgress) {
      request.onProgressUpdate(config.onUploadProgress);
    }
  });
}

export default uploadAdapter;
```

## 分析

我们可以看见`upload上传文件`执行流程如下：

- 根据`auth`配置项是否开启，添加自定义请求头`Authorization`

- 根据`xsrfStorageName`和`xsrfHeaderName`配置项添加自定义请求头，实现`xsrf`防御

- 根据`baseURL`和`url`配置项构建完整的请求地址

- 构建`wx.uploadFile`上传参数

- 将`config`配置项的`data`字段映射到`wx.uploadFile`上传参数的`formData`字段

- 通过循环将`upload上传文件`特有的配置项和通用配置项添加进`wx.uploadFile`上传参数中

- 监听外部取消上传文件事件

- 使用`wx.uploadFile`API 上传文件，并获得对应的实例

- 监听文件上传事件

由于微信小程序上传文件是使用了单独的 API，所以我们要对文件上传进行单独的封装

`wx.uploadFile`上传参数中，`success`为上传成功处理事件，`fail`为上传失败处理事件

在`success`处理函数中，响应头微信小程序已经返回来给我们，是一个 json 对象，我们也无需进行格式化。最后通过调用`settle`函数根据自定义`请求/上传/下载校验函数`来决定，上传是成功状态还是失败状态

在`fail`处理函数中，使用`enhanceError`函数对`error`错误对象添加额外的属性，并返回该错误对象

对于取消上传文件，`wx.uploadFile`返回的对象提供了`abort`方法来取消上传文件

对于监听文件上传进度事件，`wx.uploadFile`返回的对象提供了`onProgressUpdate`方法来进行监听

## 总结

文件上传的实现比较简单，通过对`wx.uploadFile`的封装，我们也实现了跟`axios`上传文件一样的功能，比如监听文件上传等功能

通过本章节的学习，相信大家对微信小程序是如何上传文件已经有了一定的了解了
