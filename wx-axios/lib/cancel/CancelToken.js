import { isFunction } from "../utils";
import Cancel from "./Cancel";

class CancelToken {
  // 工厂函数
  static source() {
    let cancel;
    const token = new CancelToken((c) => {
      cancel = c;
    });
    return {
      token,
      cancel,
    };
  }
  constructor(executor) {
    if (!isFunction(executor)) {
      throw new TypeError("请传入一个函数");
    }
    let resolveFn;
    this.promise = new Promise((resolve) => {
      resolveFn = resolve;
    });
    executor((message) => {
      if (this.reason) {
        return;
      }
      this.reason = new Cancel(message);
      resolveFn(this.reason);
    });
  }
  // 检查是否已经取消了请求
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }
}

export default CancelToken;
