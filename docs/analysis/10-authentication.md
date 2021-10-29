# auth 身份验证

在上一个章节中，我们分析了`xhr 请求处理函数`，发现有一个 `auth 身份验证` 的功能。那么，本章节，我们就来分析 `auth 身份验证` 的实现和原理

## 源码分析

我们先来分析一下源码，源码是在`lib/adapters/xhr.js`文件，第 28 行开始

```javascript
module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    // http身份验证，采用的是 基本认证（Basic access authentication）
    // 只适用于`HTTP Basic auth`，`Bearer`需要自己去定义`Authorization`请求头
    if (config.auth) {
      // 开启之后，会设置`Authorization`请求头，如果已经存在，会被覆盖
      // 用户名
      var username = config.auth.username || "";
      // 密码
      var password = config.auth.password
        ? unescape(encodeURIComponent(config.auth.password))
        : "";
      // 加密策略：用户名和密码用`:`合并，将合并后的字符串使用BASE64加密为密文，然后在前面添加`Basic `
      requestHeaders.Authorization = "Basic " + btoa(username + ":" + password);
    }
  }
};
```

## 实现流程

1、获取用户名

2、获取密码，然后对密码先进行编码，然后在进行解码

3、将用户名和密码按照`${username}:${password}`格式拼接起来，然后进行 base64 编码

4、在 base64 编码后的字符串前面添加`Basic`字符串，注意是有空格的

5、设置`Authorization`自定义请求头，值为第四步拼接出来的字符串

## unescape , encodeURIComponent , btoa

`unescape` 函数对编码的字符串进行解码。但是该函数在`JavaScript 1.5` 版中已弃用，可使用`decodeURI` 或 `decodeURIComponent` 代替。与之对应的是`escape`函数，用来进行编码的

`encodeURIComponent` 函数可以把字符串作为 URI 组件进行编码，但是该方法不会对 ASCII 字母和数字进行编码，也不会对这些 ASCII 标点符号进行编码： - \_ . ! ~ \* ' ( ) 。与之对应的是`decodeURIComponent`函数，用来进行解码的

`btoa` 函数用于创建一个 base-64 编码的字符串。与之对应的是`atob`函数用来解码 base-64 编码的字符串

## Basic 认证

axios 采用的 HTTP 身份认证是基于 `Basic 认证` 的。`Basic 认证`是一种很简单的技术，主要是使用了 HTTP 请求头字段。在进行基本验证的过程中，请求头的字段必须包含`Authorization`字段，形式如下：`Authorization: Basic <凭证>`，凭证就是 `用户名和密码的组合的base64编码`，格式为`用户名:密码`，中间是有个`:`的。

`base64编码`并不是加密算法，无法保证安全和隐私。进行`base64编码`是为了将用户名和密码中的不兼容的字符转换为均与 HTTP 协议兼容的字符集

## Basic 认证过程

1、客户端向服务器请求数据，请求的数据是需要进行认证才能看见的，并且用户没用进行认证

2、服务器会返回`401 unauthorized`状态码，要求进行验证

3、客户端会弹出验证窗口，等待用户输入用户名和密码，点击确定之后就会自动完成编码发送请求

## 优缺点

- 优点：对客户端身份进行了识别

- 缺点：没有为凭证提供任何有效的保护，仅仅是使用了 base64 编码。因此，一般是结合`HTTPS`一起使用，以提供机密性

## 总结

经过本章的学习，相信大家对`Basic 认证`已经有了一定的了解了

在下一个章节，我们将会讲解 `客户端防御 XSRF`
