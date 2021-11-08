#  转换请求/响应数据




原版`axios`在转化数据的时候，也就是`transformRequest`和`transformResponse`函数接收到的参数只有`data`和`headers`，因为我们`WxAxios`是对`wx.request`,`wx.downloadFile`和`wx.uploadFile`进行封装的，所以请求数据或者响应数据可能会需要根据不同的请求方法进行转换，所以在`转换请求/响应数据`的时候，除了传入`data`和`headers`，我们还会多传入一个`method`参数，用来区分是使用了那底层API