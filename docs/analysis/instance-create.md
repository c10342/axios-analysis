# axios 对象创建过程

我们平常在使用的时候，会直接通过`import axios from 'axios'`引入`axios`对象，然后使用。那么这个`axios`对象到底是怎么来的呢？

本章节将会讲述 `axios` 对象创建的详细过程

## 源码分析

我们先来分析一下源码，源码是在`lib/axios.js`文件

```javascript
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

  // 遍历`Axios.prototype`原型上面的属性和方法，然后挂载到`instance`上面。
  // 如果是方法就需要将`this`绑定为`context`
  utils.extend(instance, Axios.prototype, context);

  // 循坏`context`实例上面的属性，并挂载到`instance`上面
  // 实际`context`实例上面就只有`defaults`和`interceptors`2个属性
  utils.extend(instance, context);

  // 挂载`create`方法，用来创建新的axios对象
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// 创建一个默认的axios对象，并将其导出
var axios = createInstance(defaults);

// 挂载`Axios`类
axios.Axios = Axios;

// 挂载取消请求的相关东西
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');
// 版本号
axios.VERSION = require('./env/data').version;

// 添加all和spread方法
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// 添加isAxiosError函数，这个函数是用来判断请求错误时，是否为axios封装过的
axios.isAxiosError = require('./helpers/isAxiosError');

// 导出axios
module.exports = axios;

module.exports.default = axios;

```

## 创建流程

我们把注意力集中在`createInstance`这个函数当中，`axios`对象的创建流程如下：

1、 通过`new Axios`得到一个`context`上下文实例

2、 获取`Axios.prototype.request`函数，并将函数的`this`绑定为`context`，得到一个`instance`函数

3、将`Axios.prototype`对象上面的属性和方法逐一挂载到`instance`函数上面，如果挂载的是一个函数，还需要把该函数的`this`绑定为`context`

4、将`context`实例上面的属性逐一挂载`instance`函数上面

5、挂载`create`函数到`instance`函数上面

6、调用`createInstance`函数创建一个默认的`axios`对象，并导出

## 其他

现在我们把注意力集中在 `var axios = createInstance(defaults);` 这行代码后面的代码当中。

我们可以发现，`Axios`，`Cancel`，`CancelToken`，`isCancel`，`VERSION`，`all`，`spread`，`isAxiosError`这些类，函数，属性只有在默认导出的`axios`对象上面才存在的，通过`axios.create`创建的对象上面是不存在的。所以我们在使用这些函数或者属性的时候，要特别注意我们当前使用的是默认导出的对象还是使用`axios.create`创建的对象

## 注意点

细心的小伙伴可能会发现源码当中有这么2行代码：

```javascript
  utils.extend(instance, Axios.prototype, context);

  utils.extend(instance, context);
```

其中 `utils.extend(A,B)` 函数是把`B`的属性或者方法挂在到`A`中

有人可能会有疑问，`context`实例上已经存在了`Axios.prototype`上面的属性和方法，比方说`Axios.prototype`上面存在一个`request`方法，那么我们可以通过`context.request`去访问这个方法。为什么需要`utils.extend(instance, Axios.prototype, context)`这一行代码呢。

其实，在js中遍历一个对象的时候，是不能遍历到该对象所指向的`prototype`原型链上面的属性和方法，只能遍历到对象上本身的属性和方法。下面举个例子：

```javascript
function People(){
  this.defaults = {}
  this.say = ()=>{}
}

People.prototype.sleep = function(){}

const demo = new People()

for(const key in axios){
  console.log(key)
}

//  defaults,say
```

上面代码示例中输出的结果是`defaults,say`，虽然`sleep`方法可以通过`demo.sleep`去访问，但是却不能通过遍历去访问。所以才会需要以上2行代码，分别遍历挂载`Axios.prototype`和`context`上面的属性和方法到`instance`函数上。

还有人可能会发现，`utils.extend(instance, Axios.prototype, context)`是传入了三个参数，`utils.extend(instance, context)`指传了两个参数。

`Axios.prototype`上面存在了一些函数，我们在挂载这些函数到`instance`函数上面的时候，需要修改`this`的指向为`context`，所以传了第三个参数。但是`context`实例遍历的时候，只存在属性，不会存在函数（跟`Axios`构造函数的组成有关），属性是不需要修改`this`的指向，所以不需要传入第三个参数（就算传了也没关系）。关于`Axios`构造函数是如何组成的，我们将会在下一个章节中讲解到，了解到`Axios`构造函数的内部组成之后，你就会更加清晰为什么`context`实例再遍历的时候，只会存在属性了。

## 简单代码实现

经过上述的学习，我们应该了解到了`axios`对象的创建过程了，下面，我们根据自己的理解去现实一个简单的代码，来加深印象。

```javascript
function Axios(defaultConfig) {
  this.defaultConfig = defaultConfig;
}

Axios.prototype.request = function(config = {}) {};
Axios.prototype.get = function(config = {}) {};

function createInstance(config) {
  const context = new Axios(config);
  // 创建请求函数
  const instance = Axios.prototype.request.bind(context);

  // 将Axios.prototype中的request，post等方法挂载到instance请求函数中
  Object.keys(Axios.prototype).forEach(key => {
    instance[key] = Axios.prototype[key].bind(context);
  });
  // 将context中的defaultConfig挂载到instance请求函数中
  Object.keys(context).forEach(key => {
    instance[key] = context[key];
  });
  return instance;
}

const axios = createInstance();
```

## 总结

- `axios`对象实际上是通过`Axios.prototype.request`函数通过`bind(context)`创建出来的（并不是通过 `new Axios`创建出来的），只是`this`的指向发生了变化。

- `Axios`构造函数上面存在的属性和方法，`axios`对象都有。

- `axios`对象实际上就是`Axios.prototype.request`函数，只是添加一系列属性和方法在这个函数上面

在本章中，我们看见`Axios`构造函数，在下一个章节中，我们将会分析`Axios`构造函数的内部组成
