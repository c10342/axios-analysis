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
