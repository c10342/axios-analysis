const toString = Object.prototype.toString;

export function forEach(obj, fn) {
  if (!obj) {
    return;
  }
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray(obj)) {
    const len = obj.length;
    for (let i = 0; i < len; i++) {
      fn(obj[i], i, obj);
    }
  } else {
    for (const key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        fn(obj[key], key, obj);
      }
    }
  }
}

export function isArray(data) {
  return toString.call(data) === "[object Array]";
}

export function isFunction(data) {
  return toString.call(data) === "[object Function]";
}

export function isString(data) {
  return toString.call(data) === "[object String]";
}

export function isPlainObject(data) {
  return toString.call(data) === "[object Object]";
}

export function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

export function isDate(data) {
  return toString.call(data) === "[object Date]";
}

export function isRegExp(data) {
  return toString.call(data) === "[object RegExp]";
}

export function isNull(data) {
  return toString.call(data) === "[object Null]";
}

export function isUndefined(data) {
  return toString.call(data) === "[object Undefined]";
}

export function isUndef(data) {
  return isUndefined(data) || isNull(data);
}

export function bind(fromTarget, toTarget, thisArg) {
  forEach(fromTarget, (value, key) => {
    if (thisArg && isFunction(value)) {
      toTarget[key] = value.bind(thisArg);
    } else {
      toTarget[key] = value;
    }
  });
}

export function deepClone(obj, weakMap = new WeakMap()) {
  if (!isObject(obj)) {
    return obj;
  }
  let data;
  const Constructor = data.constructor;
  if (isPlainObject(obj) || isArray(obj)) {
    // 数组和普通类型数据
    // 解决循环引用
    if (weakMap.has(obj)) {
      data = weakMap.get(obj);
    } else {
      data = new Constructor();
      forEach(obj, (value, key) => {
        data[key] = deepClone(value);
      });
      weakMap.set(obj, data);
    }
  } else if (isDate(obj)) {
    // Date类型数据
    data = new Constructor(obj.getTime());
  } else if (isRegExp(obj)) {
    // 正则类型数据
    data = new Constructor(obj);
  }
  return data;
}

export function merge(...args) {
  const result = {};
  const mergeObject = (val, key) => {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  };

  forEach(args, (val) => {
    forEach(val, mergeObject);
  });
  return result;
}

export const methods = [
  "options",
  "get",
  "head",
  "post",
  "put",
  "delete",
  "trace",
  "connect",
  "download",
  "upload",
];
