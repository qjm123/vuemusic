/**
 * Created by Administrator on 2018/3/14.
 */
export function addClass (el, className) {
  if (hasClass(el, className)) {
    return
  }
  let newClass = el.className.split(' ')
  newClass.push(className)
  el.className = newClass.join(' ')
}

// 判断当前元素有没有传入的class，有则返回 true
export function hasClass (el, className) {
  let reg = new RegExp('(^|\\s)' + className + '(\\s|&)')
  return reg.test(el.className)
}

// 获取当前元素的data-属性，如果传入val，则赋值，如果无val，则获取
export function getData (el, name, val) {
  const prefix = 'data-'
  name = prefix + name
  if (val) {
    return el.setAttribute(name, val)
  } else {
    return el.getAttribute(name)
  }
}

// 获取创建div的stlye
let elementStyle = document.createElement('div').style

// 创建浏览器版本
let vendor = (() => { // 立即执行函数
  let transformNames = {
    webkit: 'webkitTransform',
    Moz: 'MozTransform',
    O: 'Otransform',
    ms: 'msTransform',
    standard: 'transform'
  }
  // 遍历属性，当前元素样式对象数组中有没有属性值，如果有表明浏览器支持，则返回key
  for (let key in transformNames) {
    if (elementStyle[transformNames[key]] !== undefined) {
      return key
    }
  }
  return false
})()

export function prefixStyle (style) {
  // 如果浏览器版本为false，则有问题
  if (vendor === false) {
    return false
  }
  // 如果浏览器版本为standard，则没有前缀
  if (vendor === 'standard') {
    return style
  }
  // 否则返回样式 = 浏览器前缀 + 样式首字母大写 + 样式除了首字母
  return vendor + style.charAt(0).toUpperCase() + style.substr(1)
}
