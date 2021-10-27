'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

// 创建一个axios实例
function createInstance(defaultConfig) {

  // 通过`new`得到一个`Axios`实例，但是最终return的并不是这个实例
  var context = new Axios(defaultConfig);
  
  // 获取`Axios`原型链上面的`request`方法，并将其this绑定为context
  // 这里实际上可以写成`Axios.prototype.request.bind(context)`
  var instance = bind(Axios.prototype.request, context);

  // 遍历`Axios.prototype`原型上面的属性和方法，然后挂载到`instance`上面。如果是方法就需要将`this`绑定为`context`
  utils.extend(instance, Axios.prototype, context);

  // 循坏`context`实例上面的属性，并挂载到`instance`上面
  // 实际`context`实例上面就只有`defaults`和`interceptors`2个属性
  utils.extend(instance, context);

  return instance;
}

// 创建一个默认的axios对象，并将其导出
var axios = createInstance(defaults);

// 挂载`Axios`类
axios.Axios = Axios;

// 挂载`create`方法，用来创建新的axios对象
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// 挂载取消请求的相关东西
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// 添加all和spread方法
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// 导出axios
module.exports = axios;

module.exports.default = axios;


/**
 * 总结：axios对象的创建过程
 * 1、通过`new Axios`得到一个`context`上下文实例
 * 2、获取`Axios.prototype.request`函数，并将函数的`this`绑定为`context`，得到一个`instance`的函数
 * 3、将`Axios.prototype`对象上面的属性和方法逐一挂载到`instance`函数上面，如果挂载的是一个函数，还需要把该函数的`this`绑定为`context`
 * 4、将`context`实例上面的属性逐一挂载`instance`函数上面
 * 
 * 总的来说，axios对象实际上是通过`Axios.prototype.request`函数通过`bind(context)`创建出来的（并不是通过 `new Axios`创建出来的），只是`this`的指向发生了变化。`Axios`构造函数上面存在的属性和方法，axios对象都有
 * 
 */

/**
 * 其他：
 * `Axios`，`Cancel`，`CancelToken`，`isCancel`，`create`，`all`，`spread`这些类，函数，属性只有在默认导出的axios对象上面才存在的，通过`axios.create`创建的对象上面是不存在的
 */

/**
 * 注意：
 * 
 * 因为在循环`context`实例上面的属性和方法的时候，是无法循环`context`实例所指向的`prototype`原型链上面的属性和方法，只能遍历对象本身上面的属性和方法，所以`utils.extend(instance, Axios.prototype, context)`和`utils.extend(instance, context)`会分别循坏挂在`Axios.prototype`和`context`的属性和方法
 */
