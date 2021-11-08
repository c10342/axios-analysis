# 请求配置项

本章节，主要是了解`WxAxios`有什么默认配置项，不同请求处理函数有什么特有配置项，通用配置项以及完整的配置项

## 默认配置项

```javascript
import { forEach, methods } from "./utils";
import requestAdapter from "./adapters/request";
import uploadAdapter from "./adapters/upload";
import downloadAdapter from "./adapters/download";

function getDefaultAdapter(config) {
  let adapter;
  const method = config.method;
  if (!methods.includes(method)) {
    throw new Error(`不支持 ${method} 请求`);
  }
  if (method === "upload") {
    adapter = uploadAdapter;
  } else if (method === "download") {
    adapter = downloadAdapter;
  } else {
    adapter = requestAdapter;
  }
  return adapter;
}

const okErrMsg = ["request:ok", "downloadFile:ok", "uploadFile:ok"];
const defaults = {
  // 请求方法，默认get请求
  method: "get",
  // 请求数据转换
  transformRequest: [
    (data, headers, method) => {
      return data;
    },
  ],
  transformResponse: [
    (data, headers, method) => {
      return data;
    },
  ],
  // 请求头
  headers: {
    common: {},
  },
  // 适配器
  adapter: getDefaultAdapter,
  //   xsrf 防御
  xsrfStorageName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  //   自定义请求/下载/上传校验
  validateStatus: (respond) => {
    return respond.status === 200 && okErrMsg.includes(respond.statusText);
  },
};

forEach(methods, (method) => {
  defaults.headers[method] = {};
});
```

## 通用配置项

- url：请求地址

- cancelToken：取消请求令牌

- data：请求数据

- timeout：请求超时时间

- auth：http basic 认证

- baseURL：请求前缀地址

- params：url 查询参数

- paramsSerializer：自定义 url 查询参数序列化
- transformRequest：请求数据转换

- transformResponse：响应数据转换

- headers：请求头

- xsrfStorageName：`storage`存储的`key`值

- xsrfHeaderName：`xsrf 防御`自定义请求头

- validateStatus：自定义请求/下载/上传校验

## request 请求函数特有配置项

- dataType：返回的数据格式

- responseType：响应的数据类型

- enableHttp2：开启 http2

- enableQuic：开启 quic

- enableCache：开启 cache

- enableHttpDNS：是否开启 HttpDNS 服务

- httpDNSServiceId：HttpDNS 服务商 Id

## download 下载文件特有配置项

- filePath：指定文件下载后存储的路径 (本地路径)

- onDownloadProgress：下载文件事件

## upload 上传文件特有配置项

- filePath：要上传文件资源的路径 (本地路径)

- name：文件对应的 key，开发者在服务端可以通过这个 key 获取文件的二进制内容

- onUploadProgress：上传文件事件

## 完整配置项

```javascript
import { forEach, methods } from "./utils";
import requestAdapter from "./adapters/request";
import uploadAdapter from "./adapters/upload";
import downloadAdapter from "./adapters/download";

function getDefaultAdapter(config) {
  let adapter;
  const method = config.method;
  if (!methods.includes(method)) {
    throw new Error(`不支持 ${method} 请求`);
  }
  if (method === "upload") {
    adapter = uploadAdapter;
  } else if (method === "download") {
    adapter = downloadAdapter;
  } else {
    adapter = requestAdapter;
  }
  return adapter;
}

const okErrMsg = ["request:ok", "downloadFile:ok", "uploadFile:ok"];
const defaults = {
  // 请求方法，默认get请求
  method: "get",
  // 请求数据转换
  transformRequest: [
    (data, headers, method) => {
      return data;
    },
  ],
  transformResponse: [
    (data, headers, method) => {
      return data;
    },
  ],
  // 请求头
  headers: {
    common: {},
  },
  // 适配器
  adapter: getDefaultAdapter,
  // 请求地址
  // url:'',
  // 取消请求令牌
  // cancelToken:''
  // 请求数据
  // data:{}
  // 请求超时时间
  // timeout：0
  // http basic 认证
  // auth:{
  //     username:'',
  //     password:''
  // },
  // 前缀地址
  // baseURL:'',
  // 查询参数
  // params:{},
  // 自定义参数序列化
  // paramsSerializer:(params)=>{}
  xsrfStorageName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  validateStatus: (respond) => {
    return respond.status === 200 && okErrMsg.includes(respond.statusText);
  },

  // wx.request请求特有配置参数
  // 返回的数据格式
  // dataType:'json'
  // 响应的数据类型
  // responseType:'text'
  // 开启 http2
  // enableHttp2:false
  // 开启 quic
  // enableQuic:false
  // 开启 cache
  // enableCache:false
  // 是否开启 HttpDNS 服务
  // enableHttpDNS:false
  // HttpDNS 服务商 Id
  // httpDNSServiceId

  // wx.downloadFile请求特有配置参数
  // 指定文件下载后存储的路径 (本地路径)
  // filePath
  // 下载事件
  // onDownloadProgress

  // wx.uploadFile请求特有配置参数
  // 要上传文件资源的路径 (本地路径)
  // filePath,
  // 文件对应的 key，开发者在服务端可以通过这个 key 获取文件的二进制内容
  // name
  // 上传事件
  // onUploadProgress
};

forEach(methods, (method) => {
  defaults.headers[method] = {};
});

export default defaults;
```

## 总结

`WxAxios`默认配置项和通用配置项跟`axios`源码的差不多。区别只是多了一些请求/下载/上传的特有配置项
