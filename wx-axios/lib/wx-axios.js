import WxAxios from "./core/WxAxios";
import { forEach, isFunction } from "./utils";
import mergeConfig from "./core/mergeConfig";
import defaults from "./defaults";
import CancelToken from "./cancel/CancelToken";
import Cancel from "./cancel/Cancel";
import isCancel from "./cancel/isCancel";

function createInstance(defaultConfig) {
  const context = new WxAxios(defaultConfig);
  const instance = WxAxios.prototype.request.bind(context);

  forEach(WxAxios.prototype, (value, key) => {
    if (isFunction(value)) {
      instance[key] = value.bind(context);
    } else {
      instance[key] = value;
    }
  });

  forEach(context, (value, key) => {
    instance[key] = value;
  });
}

const wxAxios = createInstance(defaults);

wxAxios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(wxAxios.defaults, instanceConfig));
};

wxAxios.WxAxios = WxAxios;

wxAxios.CancelToken = CancelToken;

wxAxios.Cancel = Cancel;

wxAxios.isCancel = isCancel;

export default wxAxios;
