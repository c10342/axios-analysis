# adapter适配器函数实现

跟原版`axios`中`adapter`适配器在一开始初始化的时候就已经根据不同的环境选择了好了不同的请求处理函数。`WxAxios`是运行在微信小程序中的，所以无需根据环境判断使用哪个请求函数，但是我们是对`wx.request`,`wx.downloadFile`和`wx.uploadFile`进行封装的，需要动态去选择不同的请求API，比如使用`axAxios.upload`的时候就是使用`wx.uploadFile`API，使用`wx.downloadFile`的时候就是使用`wx.downloadFile`API，所以`WxAxios`的`adapter`适配器需要是一个函数，函数接受一个`config`配置项，根据配置项，返回对应的请求处理函数