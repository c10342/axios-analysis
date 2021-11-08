# isURLSameOrigin 函数分析

在上一个章节 `客户端防御 XSRF` 学习中，我们发现了 `isURLSameOrigin` 这个函数，这个函数的作用是用来判断 url 跟当前位置的来源是否同源。本章节，我们将会分析`isURLSameOrigin`函数的实现

## 源码分析

我们先来看一下源码，在`/lib/helpers/isURLSameOrigin.js`文件

```javascript
var utils = require("./../utils");

module.exports = utils.isStandardBrowserEnv()
  ? // 标准浏览器环境
    // 请求URL是否与当前位置的来源相同
    (function standardBrowserEnv() {
      // IE
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      // 创建一个a标签，通过a标签去解析url的href，protocol，host，hostname等属性
      var urlParsingNode = document.createElement("a");
      var originURL;

      /**
       * 解析url
       *
       * @param {String} url The URL to be parsed
       * @returns {Object}
       */
      function resolveURL(url) {
        var href = url;

        if (msie) {
          // ie浏览器需要设置2次setAttribute才生效
          urlParsingNode.setAttribute("href", href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute("href", href);

        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol
            ? urlParsingNode.protocol.replace(/:$/, "")
            : "",
          host: urlParsingNode.host,
          search: urlParsingNode.search
            ? urlParsingNode.search.replace(/^\?/, "")
            : "",
          hash: urlParsingNode.hash
            ? urlParsingNode.hash.replace(/^#/, "")
            : "",
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname:
            urlParsingNode.pathname.charAt(0) === "/"
              ? urlParsingNode.pathname
              : "/" + urlParsingNode.pathname,
        };
      }
      // 当前位置的url
      originURL = resolveURL(window.location.href);
      // 以http://192.168.2.4:8080为例
      // {
      //   hash: ""
      //   host: "192.168.2.4:8080"
      //   hostname: "192.168.2.4"
      //   href: "http://192.168.2.4:8080/"
      //   pathname: "/"
      //   port: "8080"
      //   protocol: "http"
      //   search: ""
      // }

      /**
       * 请求URL是否与当前位置的来源相同
       *
       * 根据协议，IP地址，端口号来判断是否同源
       *
       * @param {String} requestURL 请求URL
       * @returns {boolean} True if URL shares the same origin, otherwise false
       */
      return function isURLSameOrigin(requestURL) {
        var parsed = utils.isString(requestURL)
          ? resolveURL(requestURL)
          : requestURL;
        return (
          parsed.protocol === originURL.protocol &&
          parsed.host === originURL.host
        );
      };
    })()
  : // 非标准浏览器环境（web workers、react native）缺少所需的支持
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })();
```

## 实现原理

我们可以看见 `isURLSameOrigin` 函数是利用 a 标签特性来解析地址。流程如下：

- 创建一个`a`标签

- 通过`setAttribute`方法来设置`a`标签的`href`值，ie 浏览器下有 bug，需要重复设置 2 次才生效

- 最后可通过`a`标签的属性，来获取对应得的端口，协议等信息

- 解析当前位置的来源的 url，通过闭包的形式，将当前位置的来源 url 解析信息进行缓存

- 同源规则是：协议，IP 地址，端口号，都相同

- 判断当前环境是否为标准浏览器环境，如果是，则返回对应的处理函数。如果不是则返回的函数，默认返回`true`。非标准浏览器环境（web workers、react native）缺少所需的支持，所以只能返回`true`了

## 总结

通过本章节的学习，相信大家对`a`标签有了一个新的了解了。在平常的开发中，如果需要解析 url 地址的协议，IP 地址等信息，大家的做法是通过正则或者是字符分割来解析对应的信息。但是，通过本章节的学习，我们就可以充分利用`a`标签的特性来解析 url 地址

在下一个章节中，我们将会分析 axios`取消请求`的实现和原理
