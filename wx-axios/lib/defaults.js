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
    (data, headers,method) => {
      return data;
    },
  ],
  transformResponse: [
    (data, headers,method) => {
      return data;
    },
  ],
  // 请求头
  headers: {
    common: {},
  },
  // 适配器
  adapter: (config) => {
    return getDefaultAdapter(config);
  },
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
