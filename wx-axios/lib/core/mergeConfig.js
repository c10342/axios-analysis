import { deepClone, forEach, isPlainObject } from "../utils";

function mergeConfig(config1, config2) {
  if (!isPlainObject(config1) || !isPlainObject(config2)) {
    return {};
  }
  config1 = deepClone(config1);
  config2 = deepClone(config2);
  const mergeObject = (targetObj,fromObj) => {
    forEach(fromObj, (value, key) => {
      if (
        key in targetObj &&
        isPlainObject(targetObj[key]) &&
        isPlainObject(value)
      ) {
        targetObj[key] = mergeObject(targetObj[key], value);
      } else {
        targetObj[key] = value;
      }
    });
    return targetObj
  };

  mergeObject(config1,config2)

  return config1
}

export default mergeConfig;
