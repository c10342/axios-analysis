# buildURL函数分析

通过上一章节的学习，我们了解到了`Axios`构造函数有一个`getUri`函数，该函数内部使用了`buildURL`这个函数。本章节，我们将会来分析这个`buildURL`函数


## 源码分析

我们先来分析一下源码，源码是在`lib/helpers/buildURL.js`文件

```javascript
var utils = require('./../utils');

// 编码
// encodeURIComponent会把一些特殊字符也进行编码，比如$，+等
// 所以encodeURIComponent编码完成之后需要把一些特殊字符给转义回来
function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * 构建一个带查询参数的url地址
 *
 * @param {string} url url地址
 * @param {object} [params] 参数
 * @param {Function} [paramsSerializer] 自定义序列化参数函数
 * @returns {string} 构建好的url
 * 
 * eg：buildURL('http://xxx.xx.x', {age:10,name:'张三',hobby:['学习','睡觉']})
 *  
 * ==> http://xxx.xx.x?age=10&name='张三'&hobby[]='学习'&hobby[]='睡觉'
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  // 不存在参数的情况下，不做任何处理，直接返回url
  if (!params) {
    return url;
  }

  // 序列化参数
  var serializedParams;
  if (paramsSerializer) {
    // 如果存在自定义序列化参数的函数，就是用自定义的
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    // 如果传入的参数是 `URLSearchParams` 类型的，则可以直接调用`toString`方法进行序列化
    // 可参考 https://developer.mozilla.org/zh-CN/docs/Web/API/URLSearchParams
    serializedParams = params.toString();
  } else {
    // url查询参数数组，最终存储的是这种形式：
    // `['name=张三','age=10','hobby[]=学习','hobby[]=睡觉']`
    var parts = [];
    // 遍历params参数
    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        // 跳过值为`null`和`undefined`的参数
        return;
      }
      // 从上面的例子中可以看见，参数可能会是一个数组（hobby:['学习','睡觉']）。
      // 所以统一转化为数组进行处理
      if (utils.isArray(val)) {
        // 值是数组的情况下，key需要添加[]。
        // hobby:['学习','睡觉'] ==>  hobby[]='学习'&hobby[]='睡觉'
        key = key + '[]';
      } else {
        // 值不是数组的情况下，需要转化为数组
        val = [val];
      }

      // 对值进行遍历
      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          // 值是`Date`类型的，需要使用`toISOString`转化为字符串
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          // 值是对象的情况下，使用JSON.stringify转化为字符串
          v = JSON.stringify(v);
        }
        // 拼接key和val值，同时还需要对key和val进行编码
        parts.push(encode(key) + '=' + encode(v));
      });
    });
    // 将数组拼接成查询参数，eg：age=10&name='张三'&hobby[]='学习'&hobby[]='睡觉'
    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    // 序列化参数存在的情况
    // 查找是否存在hash
    var hashmarkIndex = url.indexOf('#');
    // 存在hash就需要去掉，否则请求地址是无效的
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    // 将序列化参数拼接到url中
    // 如果存在`?`这说明url地址已经存在参数（eg：http://xxx.xx.xx?name='张三'），
    // 否则就是不存在（http://xxx.xx.xx）
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};
```

## 重点逻辑

我们重点关心`else`部分的内容，因为涉及到一些参数序列化的知识

参数序列化关键点如下:

- 值为null或者undefined的不需要进行序列化

- 参数类型为`URLSearchParams`的直接使用`toString`方法进行序列化

- 值为数组的参数，查询参数的key值需要添加`[]`标识为一个数组

- 值为`Date`类型的需要使用`toISOString`转化为字符串

- 值是对象的情况下，使用JSON.stringify转化为字符串

- 其余情况，直接对key，val进行拼接即可

## 设计的巧妙之处

在这部分，我认为有2点的设计是比较巧妙的。

1、首先是`var parts = []`，存储的是每一部分的参数（eg：`['name=张三','age=10','hobby[]=学习','hobby[]=睡觉']`），最终通过`parts.join('&')`拼接成完整的字符串。减少了字符串拼接的繁琐工作

2、在处理 key-val 拼接的时候，考虑到会存在数组的参数，所以在遍历参数的时候，将所有val统一转化为数组进行处理，然后在对val数组进行遍历拼接。统一了处理的方式，这样子就可以不用通过if-else分别对数组和非数组进行分别处理。

## 总结

`buildURL`函数的代码行数虽然不是很多，但是里面涉及的知识点和设计思路却是非常值得我们学习的。相信通过本章节的学习，你对参数序列化已经有了一定的了解，并且对于一些字符串的拼接（比如拼接样式字符串）应该也有了一些新的思路。

在下一个章节，我将带领大家分析`Axios.prototype.request`函数内部的执行流程