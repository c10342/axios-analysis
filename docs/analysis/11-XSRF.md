# 客户端防御 XSRF

在前面的章节[xhr 请求处理函数](/analysis/09-xhr)学习中，我们得知 axios 有一个`客户端防御 XSRF` 的功能。那么，本章节，我们将会分析 `客户端防御 XSRF`的实现和原理

## XSRF 攻击原理和过程

XSRF(CSRF)跨站请求伪造，是指跨站伪造用户的请求，模拟用户操作。其根本原因就在于用户的信息存储在 cookie 中，请求的时候浏览器会自动吧 cookie 带上，而且后台也没有对请求的真实性做校验，导致用户的信息被伪造利用了

XSRF 攻击原理及过程如下：

1、用户打开浏览器，访问网站 A，并输入了用户名和密码进行了登录

2、用户登录成功之后，网站 A 会把 cookie 信息返回给浏览器，此时浏览器会保存 cookie

3、用户在没有退出登录网站 A 之前，在同一浏览器中，新开了一个 TAB 页访问网站 B

4、网站 B 接收到用户请求之后，返回一些攻击性的代码，并发出一个请求要访问网站 A

5、浏览器在接收到这些攻击性代码之后，会根据网站 B 的请求，在用户不知情的情况下携带 cookie 信息，向网站 A 发出请求。

6、网站 A 并不知道这个请求是由网站 B 发起的。所以会接收并处理这条请求，导致来自网站 B 的恶意代码被执行了

## XSRF 防御

XSRF 防御 有三种防御方案，分别如下：

1、验证 HTTP Referer 字段。该字段记录了 http 请求的来源地址，但是 Referer 字段是由浏览器提供的，每个浏览器对于 Referer 字段的实现可能会有所差异。而且 Referer 字段是可以被篡改的

2、在请求地址中添加 token 并验证。这种做法要比验证 HTTP Referer 字段要好一些，但是这种做法会导致请求地址边长，很有可能会超出 get 请求地址长度的限制。

3、在 HTTP 请求头中自定义属性并验证。比如添加 token 并验证。我们可以在请求头中添加 token 信息，后端通过验证这个 token 信息，来判断是否为 csrf 攻击。axios 就是基于这种方式去做 csrf 防御的

## 源码分析

我们先来分析一下源码，源码是在`lib/adapters/xhr.js`文件，第 155 行开始

```javascript
module.exports = function xhrAdapter(config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
     /**
     * CSRF跨站点请求伪造
     * CSRF攻击攻击原理及过程如下
     * 1、用户打开浏览器，访问网站A，并输入了用户名和密码进行了登录
     * 2、用户登录成功之后，网站A会把cookie信息返回给浏览器，此时浏览器会保存cookie
     * 3、用户在没有退出登录网站A之前，在同一浏览器中，新开了一个TAB页访问网站B
     * 4、网站B接收到用户请求之后，返回一些攻击性的代码，并发出一个请求要访问网站A
     * 5、浏览器在接收到这些攻击性代码之后，会根据网站B的请求，在用户不知情的情况下携带cookie信息，向网站A发出请求。
     * 6、网站A并不知道这个请求是由网站B发起的。所以会接收并处理这条请求，导致来自网站B的恶意代码被执行了
     *
     * 解决方案：
     * 1、验证 HTTP Referer 字段。该字段记录了http请求的来源地址，但是Referer字段是由浏览器提供的，每个浏览器对于Referer字段的实现可能会有所差异。而且Referer字段是可以被篡改的
     * 2、在 HTTP 请求头中自定义属性并验证。比如添加token并验证。我们可以在请求头中添加token信息，后端通过验证这个token信息，来判断是否为csrf攻击。axios就是基于这种方式去做csrf防御的
     * 3、在请求地址中添加 token 并验证。这种做法要比验证 HTTP Referer 字段要好一些，但是这种做法会导致请求地址边长，很有可能会超出get请求地址长度的限制。
     */
    // 防御 xsrf
    // 需要在标准浏览器中才能使用，如果是在react-native中就不能使用了
    if (utils.isStandardBrowserEnv()) {
      // 默认值
      // {
      //   xsrfCookieName: 'XSRF-TOKEN',
      //   xsrfHeaderName: 'X-XSRF-TOKEN',
      // }
      // 这段代码的逻辑很简单。如果 cookie 中包含 XSRF-TOKEN 这个字段，就把 header 中 X-XSRF-TOKEN 字段的值设为 XSRF-TOKEN 对应的值

      // `withCredentials`配置参数为`true`并且是同源请求
      // isURLSameOrigin涉及到一些知识点，需要重点分析
      var xsrfValue =
        (config.withCredentials || isURLSameOrigin(fullPath)) &&
        config.xsrfCookieName
          ? cookies.read(config.xsrfCookieName)
          : undefined;

      if (xsrfValue) {
        // 设置请求头
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }
    }
}
```


## 实现流程

我们通过上面的代码可以看见 axios 的 `客户端防御 XSRF` 实现起来是非常简单的。流程如下：

1、首先判断当前环境是否为标准的浏览器环境，因为是要结合cookie来使用的。非标准浏览器环境（比如react-native）或者node环境是不能使用的，因为没有cookie这种概念

2、如果是开启了跨域请求携带cookie或者是同源请求，并且config配置项中存在`xsrfCookieName`，就会根据`xsrfCookieName`字段的值去读取cookie

3、如果cookie值存在，就会根据`xsrfHeaderName`配置项设置对应的请求头

## 总结

通过本章节的学习，我们了解到了XSRF(CSRF)的攻击原理和过程，也了解到了一些防御的手段。但是需要注意的是axios的XSRF防御只能在标准浏览器中才能使用，因为需要读取到cookie，非标准浏览器或者node是没有cookie这种概念的


在下一个章节，我们将会分析 `isURLSameOrigin 函数` 的实现