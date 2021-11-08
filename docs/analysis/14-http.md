# http 请求处理函数

在前面的章节中，我们已经分析过 `xhr 请求处理函数` 的实现。那么，本章节我们就来分析 `http 请求处理函数` 的实现

## 源码分析

我们先来看一下源码，在`/lib/adapters/http.js`文件

```javascript
var utils = require("./../utils");
var settle = require("./../core/settle");
var buildFullPath = require("../core/buildFullPath");
var buildURL = require("./../helpers/buildURL");
// http请求库
var http = require("http");
// https请求库
var https = require("https");
// 替代nodejs的http和https模块，自动跟随重定向。
var httpFollow = require("follow-redirects").http;
var httpsFollow = require("follow-redirects").https;
// 解析和格式化url
var url = require("url");
// 同步压缩或解压node.js buffers.
var zlib = require("zlib");
var pkg = require("./../../package.json");
var createError = require("../core/createError");
var enhanceError = require("../core/enhanceError");

var isHttps = /https:?/;

module.exports = function httpAdapter(config) {
  return new Promise(function dispatchHttpRequest(
    resolvePromise,
    rejectPromise
  ) {
    var resolve = function resolve(value) {
      resolvePromise(value);
    };
    var reject = function reject(value) {
      rejectPromise(value);
    };
    // 请求数据
    var data = config.data;
    // 请求头
    var headers = config.headers;

    // 如果开发者没有设置的`user-agent`，那么就给一个默认的
    if (!headers["User-Agent"] && !headers["user-agent"]) {
      headers["User-Agent"] = "axios/" + pkg.version;
    }
    if (data && !utils.isStream(data)) {
      // 在有data数据而且不为流的状况下
      // 需要对数据进行进一步转换
      if (Buffer.isBuffer(data)) {
        // Nothing to do...
      } else if (utils.isArrayBuffer(data)) {
        data = Buffer.from(new Uint8Array(data));
      } else if (utils.isString(data)) {
        data = Buffer.from(data, "utf-8");
      } else {
        return reject(
          createError(
            "Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream",
            config
          )
        );
      }

      // 添加Content-Length请求头，告诉后台数据的长度
      headers["Content-Length"] = data.length;
    }

    // http身份验证
    var auth = undefined;
    if (config.auth) {
      // 若是配置含有auth,则拼接用户名和密码
      var username = config.auth.username || "";
      var password = config.auth.password || "";
      auth = username + ":" + password;
    }

    // 拼装完整的请求地址
    var fullPath = buildFullPath(config.baseURL, config.url);
    // 解析地址
    var parsed = url.parse(fullPath);
    // 获取协议
    var protocol = parsed.protocol || "http:";

    if (!auth && parsed.auth) {
      // 验证信息不包含在配置而在请求地址上须要作兼容处理;
      var urlAuth = parsed.auth.split(":");
      var urlUsername = urlAuth[0] || "";
      var urlPassword = urlAuth[1] || "";
      auth = urlUsername + ":" + urlPassword;
    }

    if (auth) {
      // 若是有auth信息的状况下要删除Authorization头
      delete headers.Authorization;
    }

    // 判断是否为https请求
    var isHttpsRequest = isHttps.test(protocol);
    // 若是是https协议下获取配置的httpsAgent信息,否则拿httpAgent信息
    var agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;

    var options = {
      // 请求的url
      path: buildURL(
        parsed.path,
        config.params,
        config.paramsSerializer
      ).replace(/^\?/, ""),
      // 请求方法
      method: config.method.toUpperCase(),
      // 请求头
      headers: headers,
      // 控制 Agent 的行为。 可能的值：
      // undefined（默认）: 为此主机和端口使用 http.globalAgent。
      // Agent 对象: 显式使用传入的 Agent。
      // false: 使用具有默认值的新 Agent。
      agent: agent,
      agents: { http: config.httpAgent, https: config.httpsAgent },
      // 基本身份验证，即 'user:password' 计算授权标头。
      auth: auth,
    };

    if (config.socketPath) {
      // Unix 域套接字（如果指定了 host 或 port 之一，则不能使用，因为其指定了 TCP 套接字）
      options.socketPath = config.socketPath;
    } else {
      // host 的别名。 为了支持 url.parse()，如果同时指定了 host 和 hostname，则将使用 hostname。
      options.hostname = parsed.hostname;
      // 远程服务器的端口。 默认值: 如果有设置则为 defaultPort，否则为 80。
      options.port = parsed.port;
    }

    var proxy = config.proxy;
    // 若是没有传递代理参数的话会默认配置
    if (!proxy && proxy !== false) {
      // 协议名后拼接字符串,表明代理的环境变量名
      var proxyEnv = protocol.slice(0, -1) + "_proxy";
      // 代理地址
      var proxyUrl =
        process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()];
      if (proxyUrl) {
        // 解析代理地址
        var parsedProxyUrl = url.parse(proxyUrl);
        // no_proxy环境变量
        var noProxyEnv = process.env.no_proxy || process.env.NO_PROXY;
        var shouldProxy = true;

        if (noProxyEnv) {
          // 返回分割而且清除空格后的数组
          var noProxy = noProxyEnv.split(",").map(function trim(s) {
            return s.trim();
          });
          // 是否应该代理
          shouldProxy = !noProxy.some(function proxyMatch(proxyElement) {
            // 不存在返回false
            if (!proxyElement) {
              return false;
            }
            // 通配符返回true
            if (proxyElement === "*") {
              return true;
            }
            // 判断proxyElement与请求url的域名是否相等
            if (
              proxyElement[0] === "." &&
              parsed.hostname.substr(
                parsed.hostname.length - proxyElement.length
              ) === proxyElement
            ) {
              return true;
            }

            return parsed.hostname === proxyElement;
          });
        }

        if (shouldProxy) {
          // 拼装代理配置
          proxy = {
            host: parsedProxyUrl.hostname,
            port: parsedProxyUrl.port,
          };

          if (parsedProxyUrl.auth) {
            var proxyUrlAuth = parsedProxyUrl.auth.split(":");
            proxy.auth = {
              username: proxyUrlAuth[0],
              password: proxyUrlAuth[1],
            };
          }
        }
      }
    }

    if (proxy) {
      // 若是有代理配置,添加到options
      options.hostname = proxy.host;
      options.host = proxy.host;
      options.headers.host =
        parsed.hostname + (parsed.port ? ":" + parsed.port : "");
      options.port = proxy.port;
      options.path =
        protocol +
        "//" +
        parsed.hostname +
        (parsed.port ? ":" + parsed.port : "") +
        options.path;

      // Basic 认证
      if (proxy.auth) {
        var base64 = Buffer.from(
          proxy.auth.username + ":" + proxy.auth.password,
          "utf8"
        ).toString("base64");
        options.headers["Proxy-Authorization"] = "Basic " + base64;
      }
    }

    var transport;
    // 是否https代理
    var isHttpsProxy =
      isHttpsRequest && (proxy ? isHttps.test(proxy.protocol) : true);
    if (config.transport) {
      // 配置项存在则使用配置项的
      transport = config.transport;
    } else if (config.maxRedirects === 0) {
      // 最大重定向次数为0
      // 判断使用https模块还是http模块
      transport = isHttpsProxy ? https : http;
    } else {
      // 允许重定向
      if (config.maxRedirects) {
        options.maxRedirects = config.maxRedirects;
      }
      // 判断使用https重定向模块还是http重定模块
      transport = isHttpsProxy ? httpsFollow : httpFollow;
    }

    // 若是设置了长度而且大于-1则添加到options上
    if (config.maxBodyLength > -1) {
      options.maxBodyLength = config.maxBodyLength;
    }

    // 以上的代码就是 根据协议决定使用对应的请求库,而且设定最大重定向次数和请求内容长度

    // 创建一个请求
    var req = transport.request(options, function handleResponse(res) {
      // 中断了请求
      if (req.aborted) return;

      // uncompress the response body transparently if required
      var stream = res;

      // return the last request in case of redirects
      var lastRequest = res.req || req;

      // 根据状态码是否为`204`决定需不需要须要进行压缩
      // 带有压缩的`content-encoding`
      // HTTP协议中 204 No Content 成功状态响应码表示目前请求成功，但客户端不须要更新其现有页面
      if (
        res.statusCode !== 204 &&
        lastRequest.method !== "HEAD" &&
        config.decompress !== false
      ) {
        switch (res.headers["content-encoding"]) {
          /*eslint default-case:0*/
          case "gzip":
          case "compress":
          case "deflate":
            // 解压管道
            stream = stream.pipe(zlib.createUnzip());

            // 删除头避免混淆后续操做
            delete res.headers["content-encoding"];
            break;
        }
      }
      // 拼装响应对象
      var response = {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        config: config,
        request: lastRequest,
      };
      // 根据responseType决定怎么解析响应数据
      if (config.responseType === "stream") {
        // stream则直接赋值
        response.data = stream;
        settle(resolve, reject, response);
      } else {
        var responseBuffer = [];
        // 利用`stream`事件解析
        stream.on("data", function handleStreamData(chunk) {
          responseBuffer.push(chunk);

          // 保证内容长度不超过`maxContentLength`配置设置的
          if (
            config.maxContentLength > -1 &&
            Buffer.concat(responseBuffer).length > config.maxContentLength
          ) {
            // 销毁流
            stream.destroy();
            reject(
              createError(
                "maxContentLength size of " +
                  config.maxContentLength +
                  " exceeded",
                config,
                null,
                lastRequest
              )
            );
          }
        });
        // 流错误
        stream.on("error", function handleStreamError(err) {
          if (req.aborted) return;
          reject(enhanceError(err, config, null, lastRequest));
        });
        // 流结束
        stream.on("end", function handleStreamEnd() {
          var responseData = Buffer.concat(responseBuffer);
          if (config.responseType !== "arraybuffer") {
            responseData = responseData.toString(config.responseEncoding);
            if (
              !config.responseEncoding ||
              config.responseEncoding === "utf8"
            ) {
              responseData = utils.stripBOM(responseData);
            }
          }

          response.data = responseData;
          settle(resolve, reject, response);
        });
      }
    });

    // 请求错误
    req.on("error", function handleRequestError(err) {
      if (req.aborted && err.code !== "ERR_FR_TOO_MANY_REDIRECTS") return;
      reject(enhanceError(err, config, null, req));
    });

    // 超时
    if (config.timeout) {
      // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.
      // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.
      // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.
      // And then these socket which be hang up will devoring CPU little by little.
      // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.
      req.setTimeout(config.timeout, function handleRequestTimeout() {
        req.abort();
        reject(
          createError(
            "timeout of " + config.timeout + "ms exceeded",
            config,
            "ECONNABORTED",
            req
          )
        );
      });
    }

    if (config.cancelToken) {
      // 监听外部取消请求事件，前面已经有详细讲解了
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (req.aborted) return;

        req.abort();
        reject(cancel);
      });
    }

    // Send the request
    if (utils.isStream(data)) {
      // 发送流数据请求
      data
        .on("error", function handleStreamError(err) {
          reject(enhanceError(err, config, null, req));
        })
        .pipe(req);
    } else {
      // 发送请求
      req.end(data);
    }
  });
};
```

## 执行流程

1、传入请求的配置信息，返回新的 Promise，而且将改变状态的触发函数赋值到变量，当请求头不包含`User-Agent`或者`user-agent`的时候默认赋值。

2、在有请求数据而且不为流的情况下，根据请求数据的类型做出对应的转换并设置`Content-Length`请求头的值为请求数据的长度，都不符合的状况下返回错误对象

3、检查`config`配置中是否有`auth`参数，有就拼接用户名和密码

4、根据`baseURL`和`url`配置项拼接出完整请求地址，并使用 node 的`url`模块的`parse`对请求地址进行解析，得到请求协议

5、当配置项中不包含`auth`参数，就检查请求地址上面是否存在对应的`auth`参数，有就拼接用户名和密码。这一步实际为兼容性处理

6、如果存在`auth`信息，就需要删除`Authorization`请求头

7、检查请求地址是否为`https`协议，`https`协议获取`httpsAgent`配置项，`http`协议获取`httpAgent`配置项

8、将全部信息放入`options`中

9、如果存入了`socketPath`配置项，则设置`socketPath`路径，否则就设置`hostname`和`port`

10、如果设置了代理参数就添加代理配置，否则就使用默认的代理配置

11、根据协议决定使用对应的请求库,而且设定最大重定向次数和请求内容长度

12、使用`transport.request`创建一个请求

13、根据状态码，请求方法，以及配置项`decompress`来决定是否需要进行压缩，如果需要，则还需要删除`content-encoding`响应头，避免混淆后续操做

14、拼装`response`响应对象

15、根据`responseType`配置项决定怎么解析响应数据。`stream`则直接赋值，否则利用`stream`事件解析

16、监听请求错误超时等事件，返回对应的错误对象

17、监听外部取消请求事件，返回`Cancel`错误对象

18、对于`stream`数据，数据添加到请求管道流，否则就直接调用`end`方法发送请求

注意：关于`node`如何发送 http 请求，大家可能会有比较陌生，这里建议大家先看一下官网的文档，点击[这里](http://nodejs.cn/api/http.html)查看

## 总结

通过本章节的学习，我们应该了解到了`node`是如何进行发送请求的。关于这部分`node`的知识，会涉及到很多知识盲区，我建议大家观看官网的文档进行学习，点击[这里](http://nodejs.cn/api/http.html)查看

在下一个章节，我们将会讲解 `createError` 函数
