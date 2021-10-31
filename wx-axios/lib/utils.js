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
