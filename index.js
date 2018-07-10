// 检测图片方向
// http://stackoverflow.com/a/32490603
// callback: function (orientation) {}
// orientation取值:
// -2: not jpeg
// -1: not defined
// 1: 方向不变
// 8: 顺时针90度
// 3: 顺时针180度
// 6: 顺时针270度
// 2: 水平翻转
// 7: 水平翻转后90度
// 4: 水平翻转后180度
// 5: 水平翻转后270度
export const getImageOrientation = (file, callback) => {
  const reader = new FileReader()

  reader.onload = function (e) {
      var view = new DataView(e.target.result)
      if (view.getUint16(0, false) != 0xFFD8) return callback(-2)
      var length = view.byteLength
      var offset = 2

      while (offset < length) {
          var marker = view.getUint16(offset, false)
          offset += 2

          if (marker == 0xFFE1) {
              if (view.getUint32(offset += 2, false) != 0x45786966) return callback(-1)

              var little = view.getUint16(offset += 6, false) == 0x4949

              offset += view.getUint32(offset + 4, little)

              var tags = view.getUint16(offset, little)

              offset += 2

              for (var i = 0; i < tags; i++) {
                  if (view.getUint16(offset + (i * 12), little) == 0x0112) {
                      return callback(view.getUint16(offset + (i * 12) + 8, little))
                  }   
              }
          } else if ((marker & 0xFF00) != 0xFF00) {
              break
          } else {
              offset += view.getUint16(offset, false)
          }
      }
      return callback(-1)
  }

  reader.readAsArrayBuffer(file.slice(0, 64 * 1024))
}



/**
* @param {File} file input 控件的文件
* @param {Function | Number} inputQuality 图像使用什么质量读入，0 ~ 1，或函数返回数字，函数参数是图像宽高
* @param {Function} callback 最终结果dataUrl 作为回调函数的参数
*/
export const imageToUrl = function(file, inputQuality, callback) {
  var fileReader = new FileReader()
  var orientation // 图片的旋转信息

  fileReader.addEventListener('load', function (e) {
      // 用canvas旋转到正确的方向
      var imgEl = document.createElement('img')
      imgEl.onload = function () {
          var canvas = document.createElement('canvas')
          var context = canvas.getContext('2d')
          var naturalWidth = imgEl.naturalWidth
          var naturalHeight = imgEl.naturalHeight
          var quality = 1

          if (!callback && typeof inputQuality !== 'function') return
          if (!callback && typeof inputQuality === 'function') {
              callback = inputQuality
              inputQuality = 1
          }
          if (typeof inputQuality === 'function') {
              quality = inputQuality(naturalWidth, naturalHeight)
          } else if (typeof inputQuality === 'number') {
              quality = inputQuality
          }

          switch (orientation) {
              case 8: // 90deg
                  canvas.width = naturalHeight * quality
                  canvas.height = naturalWidth * quality
                  context.translate(0, naturalWidth * quality)
                  context.rotate(-90 * Math.PI / 180)
                  break
              case 3: // 180deg
                  canvas.width = naturalWidth * quality
                  canvas.height = naturalHeight * quality
                  context.translate(naturalWidth * quality, naturalHeight * quality)
                  context.rotate(180 * Math.PI / 180)
                  break
              case 6: // 270deg
                  canvas.width = naturalHeight * quality
                  canvas.height = naturalWidth * quality
                  context.translate(naturalHeight * quality, 0)
                  context.rotate(90 * Math.PI / 180)
                  break
              default:
                  canvas.width = naturalWidth * quality
                  canvas.height = naturalHeight * quality
          }
          context.drawImage(imgEl, 0, 0, naturalWidth, naturalHeight, 0, 0, naturalWidth * quality, naturalHeight * quality)

          // 将旋转方向调整后的结果传给回调函数
          callback(canvas.toDataURL())
      }
      imgEl.src = fileReader.result
  }, false)

  // 读取图片文件，获得旋转信息
  getImageOrientation(file, function (o) {
      orientation = o
      fileReader.readAsDataURL(file)
  })
}

export default {
  getImageOrientation,
  imageToUrl
}
