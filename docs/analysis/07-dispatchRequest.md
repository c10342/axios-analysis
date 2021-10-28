# dispatchRequest 函数分析

通过的上一章节的学习，我们了解到了请求/响应拦截器的实现，并且在分析的过程中，我们发现了`dispatchRequest`这个函数。那么，本章节，我们将会分析`dispatchRequest`函数的实现

## 源码分析

我们先来分析一下源码，源码是在`lib/core/dispatchRequest.js`文件

```javascript
var utils = require("./../utils");
var transformData = require("./transformData");
var isCancel = require("../cancel/isCancel");
var defaults = require("../defaults");

/**
 * 判断请求是否已经被取消了，已经被取消的请求，再次发送请求是没有意义的
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    // 检查是否存在cancelToken对象
    // 存在，就判断是否cancelToken对象中的`reason`属性是否存在
    // 存在就说明该请求已经是被取消过的
    config.cancelToken.throwIfRequested();
  }
}

/**
 * 分发请求，根据不同的环境选择不同的适配器
 *
 * @param {object} config 请求配置
 * @returns {Promise} 返回的是一个promise对象
 */
module.exports = function dispatchRequest(config) {
  // 根据配置检查请求是否已经被取消了
  throwIfCancellationRequested(config);

  // 确保headers是存在的
  config.headers = config.headers || {};

  // 转换请求数据。
  // `transformData`函数的作用就是循环`config.transformRequest`数组
  // 如果`config.transformRequest`是一个函数会先转化为数组函数
  // 然后调用数组中的每一个函数对请求数据进行转换
  // 上一个函数的处理结果会作为下一个函数的参数
  // `config.transformRequest`需要重点分析
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // 对headers进行扁平化
  // headers可能会存在的形式：
  // {
  //   headers:{
  //     common:{a:1},
  //     get:{b:2},
  //     post:{c:3}
  //   }
  // }
  // 以get请求为例，合并之后就变成了：
  // {
  //   headers:{
  //     common:{a:1},
  //     get:{b:2},
  //     post:{c:3},
  //     a:1,
  //     b:2
  //   }
  // }
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );
  // 删除无关请求的headers
  // `headers.common`：所有请求的headers都会带上，`headers.get`：只有get请求的headers才会带上，诸如次推
  // 以post请求为例，config的headers如下
  // {
  //   headers:{
  //     common:{a:1},
  //     get:{b:2},
  //     post:{c:3}
  //   }
  // }
  // 经过处理之后，post请求真正带上的header值如下:
  // {
  //   headers:{
  //     a:1,
  //     c:3
  //   }
  // }
  utils.forEach(
    ["delete", "get", "head", "post", "put", "patch", "common"],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  // 适配器，根据不同环境返回不同的处理请求函数
  // 如果用户传入的`adapter`为空值，则采用默认的适配器
  // `defaults.adapter`需要重点分析
  var adapter = config.adapter || defaults.adapter;

  // 发起请求
  return adapter(config).then(
    function onAdapterResolution(response) {
      // 再次检查请求是否被取消了
      throwIfCancellationRequested(config);

      // 转换响应数据
      // `transformData`函数的作用就是循环`config.transformResponse`数组
      // 如果`config.transformResponse`是一个函数会先转化为数组函数
      // 然后调用数组中的每一个函数对响应数据进行转换
      // 上一个函数的处理结果会作为下一个函数的参数
      // `config.transformResponse`需要重点分析
      response.data = transformData(
        response.data,
        response.headers,
        config.transformResponse
      );

      return response;
    },
    function onAdapterRejection(reason) {
      // 请求出错，就会来到这个函数
      if (!isCancel(reason)) {
        // 请求没有被取消

        throwIfCancellationRequested(config);

        // 对响应数据进行处理，跟上面第101行的方式一样
        if (reason && reason.response) {
          reason.response.data = transformData(
            reason.response.data,
            reason.response.headers,
            config.transformResponse
          );
        }
      }

      return Promise.reject(reason);
    }
  );
};
```

## 函数执行流程

1、首先检查请求是否已经是被取消了的，已经取消的请求再次请求是没意义的，会直接抛出错误

2、对`config.headers`进行判空赋值，需要确保`headers`是存在的

3、调用`config.transformRequest`数组的每一项（函数）对请求参数进行转换

4、对`config.headers`的字段进行合并处理，并删除跟请求无关的字段，如`common`，`get`等等

5、根据适配器获取对应的处理请求函数

6、发送请求，调用`transformResponse`数组的每一项（函数）对请求响应数据进行处理

7、返回结果

## headers 字段的合并策略

`headers`的`common`字段中的 key-value 字段所有请求的请求头都会带上，`get`字段中的 key-value 字段只有 get 请求的请求头才会带上，`post`字段中的 key-value 字段只有 post 请求的请求头才会带上，其他请求别名字段如此类推。

`header` 中的字段完成合并之后，就会删除`common`，`get`，`post`等跟请求无关的字段，最后剩下来的就是本次请求需要携带请求头字段。

下面以 post 请求为例：

默认配置项：

```javascript
const defaults = {
  headers: {
    common: { a: 1 },
    get: { b: 2 },
    post: { c: 3 },
  },
};
```

使用：

```javascript
axios.post(
  "xxx",
  {},
  {
    headers: {
      d: 4,
    },
  }
);
```

默认配置跟用户传入的配置经过合并之后，`headers`结构如下：

```javascript
const config = {
  headers: {
    common: { a: 1 },
    get: { b: 2 },
    post: { c: 3 },
    d: 4,
  },
};
```

然后对`headers`的`common`字段和`post`字段进行合并，扁平，`headers`结构变成如下：

```javascript
const config = {
  headers: {
    common: { a: 1 },
    get: { b: 2 },
    post: { c: 3 },
    a: 1,
    b: 2,
    c: 3,
    d: 4,
  },
};
```

合并完成之后，删除跟`common`，`get`，`post`等跟请求无关的字段，`headers`结构变成如下：

```javascript
const config = {
  headers: {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
  },
};
```

## adapter 适配器

我们在`dispatchRequest`函数中可以看见使用了`adapter`适配器。`adapter`适配器的作用是在发送请求的时候，会根据当前环境选择不同的请求处理函数去发送请求。

我们先看看默认的`adapter`是怎么实现的，源码在`lib/defaults.js`，第 31 行开始

```javascript
// 获取默认的适配器,浏览器或者node端的
function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== "undefined") {
    // 浏览器环境下的
    adapter = require("./adapters/xhr");
  } else if (
    typeof process !== "undefined" &&
    Object.prototype.toString.call(process) === "[object process]"
  ) {
    // node环境
    adapter = require("./adapters/http");
  }
  return adapter;
}

var defaults = {
  // 根据不同环境获取不同的请求处理函数，web端或者是node端的
  adapter: getDefaultAdapter(),
};
```

我们把关注点放在`getDefaultAdapter`函数上面，`getDefaultAdapter`函数通过判断`XMLHttpRequest`和`process`是否存在来区分是`浏览器环境`还是`node环境`。`XMLHttpRequest`是`浏览器环境`特有的，`process`是`node环境`特有的。同时我们也看见不同环境对应着不同的请求处理函数，`./adapters/xhr`请求处理函数和`./adapters/http`请求处理函数将会在后面的章节进行讲解，本章不详细讲。

## 总结

通过上面的分析，我们已经了解到了`dispatchRequest`函数的执行流程，并且也知道了`headers`配置项的合并规则，还有`adapter`适配器的实现。而且我们还看见了`transformRequest`请求数据处理和`transformResponse`响应数据处理。`转换请求/响应数据`我们将会在下一个章节中讲解

在下一个章节中，我们将会讲解`转换请求/响应数据`
