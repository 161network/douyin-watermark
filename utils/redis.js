var redis = "redis"

/**
 * 设置
 * k 键key
 * v 值value
 * t 秒
 */
function put(k, v, t) {
  wx.setStorageSync(k, v)
  var seconds = parseInt(t)
  if (seconds > 0) {
    var newtime = Date.parse(new Date())
    newtime = newtime / 1000 + seconds;
    wx.setStorageSync(k + redis, newtime + "")
  } else {
    wx.removeStorageSync(k + redis)
  }
}

/**
 * 获取
 * k 键key
 */
function get(k) {
  var deadtime = parseInt(wx.getStorageSync(k + redis))
  if (deadtime) {
    if (parseInt(deadtime) < Date.parse(new Date()) / 1000) {
      wx.removeStorageSync(k);
      console.log("过期了")
      return null
    }
  }
  var res = wx.getStorageSync(k)
  if (res) {
    return res
  } else {
    return null
  }
}

/**
 * 删除
 */
function remove(k) {
  wx.removeStorageSync(k);
  wx.removeStorageSync(k + redis);
}

/**
 * 清除所有key
 */
function clear() {
  wx.clearStorageSync();
}

module.exports = {
  put,
  get,
  remove,
  clear
}