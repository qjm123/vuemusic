/**
 * Created by Administrator on 2018-3-26.
 */
function getRandomInt (min, max) { // 获得 max 和 min 中间的某个数
  return Math.floor(Math.random() * (max - min + 1) + min)
}

// 克隆数组并将数组随机排列表
export function shuffle (arr) {
  let songArr = arr.concat() // 克隆原始可取数组
  for (let i = 0; i < songArr.length; i++) {
    let j = getRandomInt(0, i)
    let t = songArr[i]
    songArr[i] = songArr[j]
    songArr[j] = t
  }
  return songArr
}

// 截留方法
export function debounce (func, delay) {
  let timer
  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}
