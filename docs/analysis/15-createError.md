# createError 函数分析

经过前面的章节学习，相信大家在很多地方都会看见通过 `createError` 这个函数创建一个错误对象。那么本章节，我们就来讲解 `createError` 的实现

## 源码分析

我们先来看看源码，源码在`/lib/core/createError.js`文件

```javascript
var enhanceError = require("./enhanceError");

/**
 * 给error对象添加一些属性，然后返回
 *
 * @param {string} message 错误消息
 * @param {Object} config 配置项
 * @param {string} [code] 错误码
 * @param {Object} [request] 请求实例
 * @param {Object} [response] 响应数据对象
 * @returns {Error} 返回一个error对象
 */
module.exports = function createError(
  message,
  config,
  code,
  request,
  response
) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};
```

`enhanceError`函数源码在`/lib/core/enhanceError.js`文件

```javascript
/**
 * 给error对象添加额外的属性.
 *
 * @param {Error} error error对象
 * @param {Object} config 请求配置项
 * @param {string} [code] 错误码
 * @param {Object} [request] 请求对象
 * @param {Object} [response] 响应对象
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
  // 添加`config`请求配置项属性
  error.config = config;
  if (code) {
    // 添加错误码
    error.code = code;
  }
  // 添加请求实例
  error.request = request;
  // 添加响应数据对象
  error.response = response;
  // 标识这是一个经过axios封装过的错误对象
  error.isAxiosError = true;
  // JSON.stringify函数将对象转为字符串就是调用对象上的`toJSON`函数获取需要转化为字符串的key-value字段
  // 改写`error`对象身上的`toJSON`函数
  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
    };
  };
  return error;
};
```

## 函数功能

通过上面的源码分析，我们可以看见`createError`函数内部创建了一个`Error`实例，然后调用了`enhanceError`函数，并把`Error`实例，`config`配置项等信息传给`enhanceError`函数。最终返回`enhanceError`函数的返回结果。

通过对`enhanceError`函数的分析，我们也不难发现，`enhanceError`函数实际上就是给`Error`对象实例添加一些额外属性，比如`config`，`request`等属性，并且改写`Error`实例的`toJSON`函数

## 扩展

- toJSON

在`enhanceError`函数中，我们发现`Error`实例的`toJSON`函数被改写了，那么，`toJSON`函数的作用是什么呢？

其实，在我们调用`JSON.stringify`的时候，实际上就是调用了`toJSON`函数来获取该对象上面的属性。下面以几个简单的代码示例说明一下，这样子会更加直观

示例代码一：

```javascript
const obj = {
  age: 1,
  toJSON() {
    return {
      name: "张三",
    };
  },
};
console.log(JSON.stringify(obj)); // ==>  {"name":"张三"}
```

实例代码二：

```javascript
var obj = {
  age: 1,
  toJSON() {
    return "bar";
  },
};
console.log(JSON.stringify(obj)); // ==>  "bar"
```

- valueOf 和 toString

`valueOf` 和 `toString` 函数会在对象进行运算的时候执行，而且`valueOf`优先级比`toString`高

当对象参与运算时，

如果`valueOf`能返回原始类型的值，会调用 `valueOf`方法,不调用`toString`方法，用`valueOf`的返回值参与运算

如果`valueOf`不能返回上述三类（字符串，数字，布尔）原始值的话，`valueOf` 与 `toString` 都会调用。此时会看`toString` 的返回值。如果`toString`能返回三类（字符串，数字，布尔）原始值，会利用`toString`的返回值。

如果`toString` 与 `valueOf`都不能返回上述三类（字符串，数字，布尔）原始类型的话，`toString` 与 `valueOf` 都会调用，但是对应的返回值不用调用。同时会报错`Cannot convert object to primitive value`

下面以几个简单的代码示例说明一下，这样子会更加直观

示例代码一：

```javascript
var obj = {
  age: 1,
  valueOf() {
    return "1";
  },
};
console.log(obj == 1); // ==> true
```

示例代码二：

```javascript
var obj = {
  age: 1,
  toString() {
    return "2";
  },
};
console.log(obj == 2); // ==> true
```

示例代码三：

```javascript
var obj = {
  age: 1,
  valueOf() {
    return {};
  },
  toString() {
    return "1";
  },
};
console.log(obj == 1); // ==> true
```

## 总结

通过本章的学习，相信你对`createError`函数的功能作用是什么应该有了一定的了解了。并且我们通过扩展，讲解了对象上面`toJSON`，`valueOf`，`toString`函数的作用

在下一个章节，我们将会讲解 axios 的请求配置项有什么
