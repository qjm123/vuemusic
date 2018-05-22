import storage from 'good-storage'

const SEARCH_KEY = '__search__' // 定义搜索key
const SEARCH_MAX_LENGTH = 15 // 定义搜索最大数

const PLAY_KEY = '__play__' // 定义歌曲播放历史
const PLAY_MAX_LENGTH = 200 // 定义歌曲历史最大歌曲书

const FAVORITY_KEY = '__favority__' // 定义收藏歌曲
const FAVORITY_MAX_LENGTH = 200 // 定义收藏歌曲最大数

// 插入数组封装方法    存储数组，值，定义一个比较函数，数组最大长度
function insertArray (arr, val, compare, maxLen) {
  const index = arr.findIndex(compare)
  // 如果是第一条数据
  console.log('index:' + index)
  if (index === 0) {
    return
  }
  // 如果不是第一条，则删除掉这一条匹配数据
  if (index > 0) {
    arr.splice(index, 1)
  }
  // 将数据加到数组第一个位置
  arr.unshift(val)
  // 如果最大值存在，并且数组长度超过最大值，则去掉最后一条
  if (maxLen && arr.length > maxLen) {
    arr.pop()
  }
}

// 删除搜索历史内部调用方法
function deleteFromArray (arr, compare) {
  const index = arr.findIndex(compare)
  if (index > -1) {
    arr.splice(index, 1)
  }
}

// 保存 搜索输入至本地
export function saveSearch (query) {
  let searches = storage.get(SEARCH_KEY, [])
  // 处理数组
  insertArray(searches, query, (item) => {
    console.log(item)
    return item === query
  }, SEARCH_MAX_LENGTH)
  // 存入storage
  storage.set(SEARCH_KEY, searches)
  return searches
}

// 读取本地存储搜索数据
export function loadSearch () {
  return storage.get(SEARCH_KEY, [])
}

// 删除搜索历史方法
export function deleteSearch (query) {
  let searches = storage.get(SEARCH_KEY, [])
  deleteFromArray(searches, (item) => {
    return item === query
  })
  // 存入storage
  storage.set(SEARCH_KEY, searches)
  return searches
}

// 删除所有历史数据
export function clearSearch () {
  storage.remove(SEARCH_KEY)
  return []
}

// 歌曲播放历史
export function savePlay (song) {
  console.log(song)
  let songs = storage.get(PLAY_KEY, [])
  insertArray(songs, song, (item) => {
    return item.id === song.id
  }, PLAY_MAX_LENGTH)
  storage.set(PLAY_KEY, songs)
  return songs
}
// 读取歌曲播放历史
export function loadPlay () {
  return storage.get(PLAY_KEY, [])
}

// 添加收藏歌曲
export function saveFavorite (song) {
  let songs = storage.get(FAVORITY_KEY, [])
  insertArray(songs, song, (item) => {
    return song.id === item.id
  }, FAVORITY_MAX_LENGTH)
  storage.set(FAVORITY_KEY, songs)
  return songs
}
// 删除收藏歌曲
export function deleteFavorite (song) {
  let songs = storage.get(FAVORITY_KEY, [])
  deleteFromArray(songs, (item) => {
    return song.id === item.id
  })
  storage.set(FAVORITY_KEY, songs)
  return songs
}
// 获取收藏歌曲
export function loadFavorite () {
  return storage.get(FAVORITY_KEY, [])
}
