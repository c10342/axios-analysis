import { forEach, isArray, isDate, isPlainObject, isUndef } from "../utils";

function encode(val) {
  return encodeURIComponent(val)
    .replace(/%3A/gi, ":")
    .replace(/%24/g, "$")
    .replace(/%2C/gi, ",")
    .replace(/%20/g, "+")
    .replace(/%5B/gi, "[")
    .replace(/%5D/gi, "]");
}

function buildURL(url, params, paramsSerializer) {
  if (!params) {
    return url;
  }
  let serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else {
    const parts = [];
    forEach(params, (val, key) => {
      if (isUndef(val)) {
        return;
      }
      if (isArray(val)) {
        key = `${key}[]`;
      } else {
        val = [val];
      }
      forEach(val, (v) => {
        if (isDate(v)) {
          v = v.toISOString();
        } else if (isPlainObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + "=" + encode(v));
      });
    });
    serializedParams = parts.join("&");
  }

  if (serializedParams) {
    var hashIndex = url.indexOf("#");
    if (hashIndex > -1) {
      url = url.slice(0, hashIndex);
    }

    if (url.indexOf("?") > -1) {
      url += `&${serializedParams}`;
    } else {
      url += `?${serializedParams}`;
    }
  }
  return url;
}

export default buildURL;
