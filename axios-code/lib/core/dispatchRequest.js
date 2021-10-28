"use strict";

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
      // `transformData`函数的作用就是循环`config.transformResponse`数组函数
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

        // 对响应数据进行处理，跟上面第108行的方式一样
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

/**
 * 总结：
 * dispatchRequest流程如下：
 * 1、首先检查请求是否已经是被取消了的，已经取消的请求再次请求是没意义的，会直接抛出错误
 * 2、对`headers`进行判空赋值，需要确保`headers`是存在的
 * 3、调用`transformRequest`数组函数对请求参数进行转换
 * 4、对`headers`的字段进行合并处理，并删除跟请求无关的字段，如`common`，`get`等等
 * 5、根据适配器获取对应的处理请求函数
 * 6、发送请求，调用`transformResponse`数组函数对请求响应数据进行处理
 * 7、返回结果
 */

/**
 * 这里重点关注的点有：`transformRequest`请求参数处理数组函数，`adapter`适配器，`transformResponse`响应数据处理数组函数。后面的章节会进行剖析
 */
