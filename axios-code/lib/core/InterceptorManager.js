'use strict';

var utils = require('./../utils');

// 拦截器造函数
function InterceptorManager() {
  // 存放拦截器方法，数组内每一项都是有两个属性的对象，两个属性分别对应成功和失败后执行的函数
  this.handlers = [];
}

/**
 * 往拦截器里添加拦截方法
 *
 * @param {Function} fulfilled 成功回调函数
 * @param {Function} rejected 失败回调函数
 *
 * @return {Number} 返回拦截器ID
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * 根据ID注销指定的拦截器
 *
 * @param {Number} id 截器ID
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    // 直接把拦截器置位null
    this.handlers[id] = null;
  }
};


// 遍历this.handlers，并将this.handlers里的每一项作为参数传给fn执行
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;
