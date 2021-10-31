import { forEach, isString } from "../utils";
import InterceptorManager from "./InterceptorManager";
import mergeConfig from "./mergeConfig";
import dispatchRequest from "./dispatchRequest";

function WxAxios(defaultConfig) {
  this.defaults = defaultConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager(),
  };
}

WxAxios.prototype.request = function (url, config = {}) {
  // 函数重载
  if (isString(url)) {
    config.url = url;
  } else {
    config = url;
  }
  // 将默认的配置跟传入的配置进行合并
  config = mergeConfig(this.defaults, config);
  //   将method统一转化为小写
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else {
    //   默认是get请求
    config.method = "get";
  }

  // promise调用链数组
  const chain = [dispatchRequest, null];
  // 初始化promsie实例
  let promise = Promise.resolve(config);
  // 添加请求拦截器
  this.interceptors.request.forEach((interceptor) => {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });
  // 添加响应拦截器
  this.interceptors.response.forEach((interceptor) => {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });
  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

// 下载文件
WxAxios.prototype.download = function (url, config) {
  config = config || {};
  return this.request(
    mergeConfig(config, {
      method: "download",
      url,
    })
  );
};

// 上传文件
WxAxios.prototype.upload = function (url, config) {
  config = config || {};
  return this.request(
    mergeConfig(config, {
      method: "upload",
      url,
    })
  );
};

// wx.request method 的合法值
const requestMethods = [
  "options",
  "get",
  "head",
  "post",
  "put",
  "delete",
  "trace",
  "connect",
];

forEach(requestMethods, (method) => {
  WxAxios.prototype[method] = function (url, config) {
    config = config || {};
    return this.request(
      mergeConfig(config, {
        method,
        url,
      })
    );
  };
});

export default WxAxios;
