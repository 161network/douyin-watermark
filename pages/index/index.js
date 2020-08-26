//获取应用实例
const app = getApp()
const redis = require('../../utils/redis.js')

// 在页面中定义激励视频广告
let videoAd = null
let videoAdError = false;

// 在页面中定义插屏广告
let interstitialAd_obj = null

Page({
  data: {
    promotion_video: false,
    promotion_video_delay_hours: 12,
    interstitialAd: false,
    interstitialAd_delay_minutes: 30,
    url: '',
    url_video: '',
    show_video: false,
  },
  setUrlInput: function(e) {
    this.setData({
      url: e.detail.value,
    })
  },

  copyWx: function(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.wx
    })
    wx.showToast({
      title: '复制成功',
    })
  },

  getWaterMarkSettings() {
    let that = this;
    let httpHost = app.globalData.httpHost;
    wx.request({
      url: httpHost + '/mp-7/watermark/settings/',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success(res) {
        console.log(res);
        that.promotion_video = res.data.promotion_video;
        that.promotion_video_delay_hours = res.data.promotion_video_delay_hours;
        that.interstitialAd = res.data.interstitialAd;
        that.interstitialAd_delay_minutes = res.data.interstitialAd_delay_minutes;
        // 默认开启
        // that.promotion_video = 1;
      }
    });
  },

  downloadVideo: function() {
    let that = this;
    let url_video = that.data.url_video;
    url_video = url_video.replace("http://", "https://")
    let httpHost = app.globalData.httpHost;
    let task = wx.downloadFile({
      url: url_video, //仅为示例，并非真实的资源
      success(res) {
        // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
        if (res.statusCode === 200) {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success(res) {
              console.log(res.errMsg)
              wx.showToast({
                title: '保存成功',
              })
            },
          })
        }
      },
      fail(res){
        wx.showModal({
          title: '提示',
          content: '下载失败，尝试重新解析',
          showCancel: true,
          confirmText: '重新解析',
          success(res) {
            if (res.confirm){
              that.rmwater()
            }
          }
        })
      }
    })

    // 下载进度条
    task.onProgressUpdate(res => {
      wx.showToast({
        title: '正在下载' + res.progress + '%',
      })
    })
  },

  // 下载视频链接
  btnDownUrl: function(e) {
    let that = this;
    let url_video = that.data.url_video;
    if (!url_video) {
      wx.showToast({
        title: '请先解析视频',
      })
      return false;
    }

    // 获取观看广告缓存，如果存在了，那么直接下载
    let ad_redis = redis.get('ad')

    // 如果激励视频广告发生问题，则直接下载
    if (videoAdError || !that.promotion_video || (that.promotion_video && ad_redis)) {
      that.downloadVideo()
      return false;
    }

    // 用户触发广告后，显示激励视频广告
    if (videoAd) {
      videoAd.show().catch(() => {
        // 失败重试
        videoAd.load()
          .then(() => videoAd.show())
          .catch(err => {
            console.log('激励视频 广告显示失败')
          })
      })
    }
  },

  // 复制视频链接
  btnCopyUrl: function(e) {
    let that = this;
    let url_video = that.data.url_video;
    if (!url_video) {
      wx.showToast({
        title: '请先解析视频',
      })
      return false;
    }

    wx.setClipboardData({
      data: that.data.url_video
    })
  },

  rmurl: function(e) {
    this.setData({
      url: '',
    })
  },

  //事件处理函数
  rmwater: function(e) {
    let that = this;

    // 判断是否为空
    if (!this.data.url) {
      wx.showToast({
        title: '链接不能为空',
      })
      return false;
    }

    // 解析链接地址
    var Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    var objExp = new RegExp(Expression);
    if (objExp.test(this.data.url)) {
      let resArray = this.data.url.match(objExp);
      this.data.url = resArray[0];
      this.data.url = this.data.url.trim()
    }

    // 判断是否为正确的url地址
    var str = this.data.url;
    var Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    var objExp = new RegExp(Expression);
    if (!objExp.test(str)) {
      wx.showToast({
        title: '链接格式不正确',
      })
      return false;
    }

    wx.showLoading({
      title: '正在解析'
    })

    let httpHost = app.globalData.httpHost;
    wx.request({
      url: httpHost + '/mp-7/watermark/dy/',
      method: 'POST',
      data: {
        url: str,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success(res) {
        if (res.statusCode == 200) {
          if (res.data.item_list && res.data.item_list.length == 0) {
            wx.showModal({
              title: '提示',
              content: '原视频已删除，解析失败',
              showCancel: false,
              confirmText: '关闭',
              success(res) {}
            })
          } else {
            // 开始解析地址
            that.data.url_video = res.data.mp4
            that.setData({
              url_video: res.data.mp4,
              show_video: true,
            })
          }
        } else {
          wx.showModal({
            title: '解析失败',
            content: '请检查输入链接是否正确',
            showCancel: false,
            confirmText: '关闭',
            success(res) {}
          })
        }
        wx.hideLoading()
      },
      fail(res) {
        wx.showModal({
          title: '提示',
          content: '解析失败,请检查链接',
          showCancel: false,
          confirmText: '关闭',
          success(res) {}
        })
        wx.hideLoading()
      }
    })
  },
  onLoad: function() {
    let that = this;

    // 获取水印广告配置
    that.getWaterMarkSettings();

    // 在页面onLoad回调事件中创建激励视频广告实例
    if (wx.createRewardedVideoAd) {
      videoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-e7b556e6ce8cafa1'
      })
      videoAd.onLoad(() => {
        console.log('激励视频加载完毕')
      })
      videoAd.onError((err) => {
        console.log(err)
        console.log('视频加载发生错误')
        videoAdError = true;
      })
      videoAd.onClose((res) => {
        // 用户点击了【关闭广告】按钮

        let hours = that.promotion_video_delay_hours;
        if (res && res.isEnded) {
          // 正常播放结束，可以下发游戏奖励
          redis.put('ad', '1', 60 * 60 * hours)
          that.downloadVideo()
        } else {
          // 播放中途退出，不下发游戏奖励
          wx.showModal({
            title: '提示',
            content: '还没有看完广告！看一次,' + hours + '小时内免广告',
            showCancel: false,
            confirmText: '关闭',
            success(res) {}
          })
        }
        console.log('关闭广告...')
        console.log(res)
      })
    }

    // 在页面onLoad回调事件中创建插屏广告实例
    if (wx.createInterstitialAd) {
      interstitialAd_obj = wx.createInterstitialAd({
        adUnitId: 'adunit-5c1103e2e9bb0b2c'
      })
      interstitialAd_obj.onLoad(() => { })
      interstitialAd_obj.onError((err) => { })
      interstitialAd_obj.onClose(() => { })
    }
  },

  onShow() {
    console.log('onShow')
    let that = this;
    wx.getClipboardData({
      success(res) {
        let content = res.data;
        console.log(content)
        var Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
        var objExp = new RegExp(Expression);
        if (objExp.test(content)) {
          let resArray = content.match(objExp);
          wx.showModal({
            title: '提示',
            content: '检测短视频链接，是否去水印',
            success(res) {
              if (res.confirm) {
                that.setData({
                  url: resArray[0]
                })
              } else if (res.cancel) {}
            }
          })
        }
      }
    })

    // 在适合的场景显示插屏广告
    setTimeout(function(){

      // 缓存插屏广告
      let ad_redis = redis.get('ad_chaping')
      console.log('interstitialAd_obj', interstitialAd_obj)
      console.log('interstitialAd', that.interstitialAd)
      console.log('redis', ad_redis)

      if (interstitialAd_obj && that.interstitialAd && !ad_redis) {
        interstitialAd_obj.show().catch((err) => {
          console.error(err)
        })

        // 正常展示后设置缓存
        redis.put('ad_chaping', '1', 60 * that.interstitialAd_delay_minutes)
      }
    }, 2000);
  },

  // 页面被用户分享时执行
  onShareAppMessage: function() {},
})