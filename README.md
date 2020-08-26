# douyin-watermark
##### 这个项目为抖音视频去水印微信小程序端，自己写的一个小程序demo，如果体验记得替换你的appid
#### 其中用到了读取剪辑版数据和相册保存
#### download 合法域名设置 [https://mp.weixin.qq.com/s/i6ORVdV9tfRjeG3uOirS1A](https://mp.weixin.qq.com/s/i6ORVdV9tfRjeG3uOirS1A)
> 小程序后台接口需要的联系个人微信,或者自己对接一下就可以了 微信：yigepmin

##### 剪辑版数据
```
    wx.getClipboardData({
      success: res => {
        var str = res.data.trim()
        if (str) {
          that.setData({
            defaultUrl: str
          })
        }
      }
    })
    wx.setClipboardData({
      data: '',
    })
```
##### 保存相册视频
```
wx.saveVideoToPhotosAlbum({
   filePath: file.tempFilePath,
   success: function (o) {
       t.showToast('保存成功', 'success'), setTimeout(function () {
           wx.setClipboardData({
             data: '',
           })
           that.goBack()
       }, 1000)
   },
   fail: function (o) {
       that.showToast('保存失败')
   }
})
```


