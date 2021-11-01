import WxAxios from "./core/WxAxios";
import { bind } from "./utils";
import mergeConfig from "./core/mergeConfig";
import defaults from "./defaults";
import CancelToken from "./cancel/CancelToken";
import Cancel from "./cancel/Cancel";
import isCancel from "./cancel/isCancel";

function createInstance(defaultConfig) {
  const context = new WxAxios(defaultConfig);

  const instance = WxAxios.prototype.request.bind(context);

  bind(WxAxios.prototype,instance,context)

  bind(context,instance)

  return instance
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
