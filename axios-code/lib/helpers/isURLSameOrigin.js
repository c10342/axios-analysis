'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // 标准浏览器环境
  // 请求URL是否与当前位置的来源相同
    (function standardBrowserEnv() {
      // IE
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      // 创建一个a标签，通过a标签去解析url的href，protocol，host，hostname等属性
      var urlParsingNode = document.createElement('a');
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
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
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
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // 非标准浏览器环境（web workers、react native）缺少所需的支持
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);
