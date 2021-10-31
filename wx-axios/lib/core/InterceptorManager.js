import { forEach } from "../utils";

class InterceptorManager {
  constructor() {
    this.handlers = [];
  }
    // 添加拦截器，
    // 与axios不同的是，axios是使用拦截器的下表索引做的id，这里是生成一个随机数作为id
  use(fulfilled, rejected) {
    //   拦截器的唯一id
    const id = Math.random().toString(16).slice(-6);
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
