import isCancel from "../cancel/isCancel";
import defaults from "../defaults";
import { forEach, merge, methods } from "../utils";
import transformData from "./transformData";

function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  config.headers = config.headers || {};

  config.data = transformData(
    config.data,
    config.headers,
    config.method,
    config.transformRequest
  );

  config.headers = merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  forEach([...methods, "common"], (method) => {
    delete config.headers[method];
  });

  const adapter = config.adapter || defaults.adapter;
  const requestFn = adapter(config);

  return requestFn(config).then(
    (response) => {
      throwIfCancellationRequested(config);

      response.data = transformData(
        response.data,
        response.headers,
        response.config.method,
        config.transformResponse
      );

      return response;
    },
    (error) => {
      if (!isCancel(error)) {
        throwIfCancellationRequested(config);
        if (error && error.response) {
          response.data = transformData(
            response.data,
            response.headers,
            response.config.method,
            config.transformResponse
          );
        }
      }
      return Promise.reject(error);
    }
  );
}


export default dispatchRequest