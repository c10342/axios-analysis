# InterceptorManager 类实现

本章节，我们来实现`InterceptorManager`拦截器类

## 代码

我们先来看一下代码的实现，代码在`wx-axios/lib/core/InterceptorManager.js`

```javascript
import { forEach } from "../utils";

class InterceptorManager {
  constructor() {
    this.handlers = [];
  }
  // 添加拦截器，
  // 与axios不同的是，axios是使用拦截器的下表索引做的id，这里是生成一个随机数作为id
  use(fulfilled, rejected) {
    //   拦截器的唯一id
    const id = Math.random()
      .toString(16)
      .slice(-6);
    this.handlers.push({
      fulfilled,
      rejected,
      id,
    });
    return this;
  }

  // 根据拦截器的id移除拦截器
  // 与axios不同的是，axios是直接根据下表索引把指定索引的值置为null，这里是直接删除
  remove(id) {
    const index = this.handlers.findIndex((item) => item.id === id);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
    return this;
  }
  // 遍历拦截器
  forEach(callback) {
    forEach(this.handlers, (item) => {
      if (item) {
        callback(item);
      }
    });
  }
}

export default InterceptorManager;
```

## 分析

对比`axios`源码的`InterceptorManager`，我们不难发现，`axios`的`InterceptorManager`是使用构造函数来实现的，这里是使用`es6`的`class`来实现的。

在`use`方法中，我们使用随机数生成了一个`id`，该`id`作为拦截器的唯一标识，并返回。在`axios`源码中，是直接返回数组的下表索引作为拦截器的唯一标识的

在`remove`方法中，该方法接收拦截器的`id`作为参数，然后通过`id`找出对应的拦截器，从数组中删除。在`axios`源码中，是通过数组下标直接把数组的某一项置位`null`，而不是从数组删除

## 总结

`InterceptorManager`拦截器类，实现跟`axios`源码的基本上一样的，只是一些代码层面的优化和修改。功能那些不变

本章节一些相关的东西可查看`axios`源码分析的[请求/响应拦截器的实现](/analysis/06-interceptors)章节
