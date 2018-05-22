/**
 * Created by Administrator on 2018/3/20.
 */
/**
 * 多次执行mutations时，需要进行封装
 * **/
import * as types from './mutation-types'
import {playMode} from 'common/js/config'
import {getSingerPlay} from 'api/singer'
import {ERR_OK} from 'api/config'
import {saveSearch, deleteSearch, clearSearch, savePlay, saveFavorite, deleteFavorite} from 'common/js/catch'

// 通过findIndex比对id来查找列表中是否有这首歌曲 ，并返回索引
function findIndex (list, song) {
  return list.findIndex((item) => {
    return item.id === song.id
  })
}

// 选择播放
export const selectPlay = function ({commit, state}, {list, index, currentUrl}) {
  let hasInitPlay = state.hasInitPlay
  commit(types.SET_SEQUENCE_LIST, list)
  commit(types.SET_PLAYLIST, list)
  commit(types.SET_CURRENT_INDEX, index)
  commit(types.SET_FULL_SCREEN, true)
  commit(types.SET_PLAYING_STATE, hasInitPlay)
  commit(types.SET_CURRENT_URL, currentUrl)
  commit(types.SET_CURRENT_URL_STATE, false)
}
// 随机播放
export const randomPlay = function ({commit}, {oldlist, newlist, index, currentUrl}) {
  commit(types.SET_PLAY_MODE, playMode.random)
  commit(types.SET_SEQUENCE_LIST, oldlist)
  commit(types.SET_PLAYLIST, newlist)
  commit(types.SET_CURRENT_INDEX, index)
  commit(types.SET_FULL_SCREEN, true)
  commit(types.SET_PLAYING_STATE, true)
  commit(types.SET_CURRENT_URL, currentUrl)
}

// 添加一首歌
export const insertSong = function ({commit, state}, song) {
  let playlist = state.playlist.slice() // 拷贝一下，避免在mutations之外操作
  let sequenceList = state.sequenceList.slice() // 拷贝一下，避免在mutations之外操作
  let currentIndex = state.currentIndex

  // 记录当前歌曲
  let currentSong = playlist[currentIndex]
  // 1.1 查找列表中是否有传入的歌曲并返回其索引
  let fpIndex = findIndex(playlist, song)
  // 1.2 插入歌曲位置为当前播放的下一首
  if (playlist.length === 0) {
    currentIndex = 0
  } else {
    currentIndex++
  }
  // 1.3插入这首歌到当前索引位置
  playlist.splice(currentIndex, 0, song)
  // 1.4 如果已经包含了这首歌
  if (fpIndex > -1) {
    // 如果当前插入的序号大于列表中歌曲的序号,插入歌曲在已有歌曲后面
    if (currentIndex > fpIndex) {
      playlist.splice(fpIndex, 1)
      currentIndex--
      // 此时，currentIndex 不会发生变化，所以需要请求新的currentUrl
      getSingerPlay(song).then((res) => {
        if (res.code === ERR_OK) {
          this.urlParams = res.data.items[0] // 定义返回url各项拼接参数
          let currentSongUrl = `http://dl.stream.qqmusic.qq.com/${this.urlParams.filename}?vkey=${this.urlParams.vkey}&guid=5049378792&uin=0&fromtag=66`
          // 调用action封装的mutations方法
          commit(types.SET_CURRENT_URL, currentSongUrl)
        }
      })
    } else {
      // 否则，当前插入序号小于列表中歌曲的序号， 插入歌曲在已有歌曲前面
      playlist.splice(fpIndex + 1, 1)
    }
  }

  // 2.1sequence列表应该插入歌曲的位置
  let currentSIndex = findIndex(sequenceList, currentSong) + 1
  // 2.2 查找sequence列表有没有插入的这首歌曲
  let fsIndex = findIndex(sequenceList, song)
  // 2.3 讲歌曲 插入 sequence列表中
  sequenceList.splice(currentSIndex, 0, song)
  // 2.4 如果已经包含了这首歌
  if (fsIndex > -1) {
    // 如果当前序号大于列表中歌曲的序号， 插入歌曲在已有歌曲后面
    if (currentSIndex > fsIndex) {
      sequenceList.splice(fpIndex, 1)
    } else {
      // 否则，当前插入序号小于列表中歌曲的序号， 插入歌曲在已有歌曲前面
      sequenceList.splice(fpIndex + 1, 1)
    }
  }

  commit(types.SET_PLAYLIST, playlist)
  commit(types.SET_SEQUENCE_LIST, sequenceList)
  commit(types.SET_CURRENT_INDEX, currentIndex)
  commit(types.SET_FULL_SCREEN, true)
  commit(types.SET_CURRENT_URL_STATE, true)
}

// 搜索历史记录
export const saveSearchHistory = function ({commit}, query) {
  commit(types.SET_SEARCH_HISTORY, saveSearch(query))
}

// 删除一条历史记录
export const deleteSearchHistory = function ({commit}, query) {
  commit(types.SET_SEARCH_HISTORY, deleteSearch(query))
}

// 删除所有历史记录
export const clearSearchHistory = function ({commit}) {
  commit(types.SET_SEARCH_HISTORY, clearSearch())
}

// 删除歌曲列表一条歌曲
export const deleteSong = function ({commit, state}, song) {
  let playlist = state.playlist.slice() // 拷贝一下，避免在mutations之外操作
  let sequenceList = state.sequenceList.slice() // 拷贝一下，避免在mutations之外操作
  let currentIndex = state.currentIndex
  let playing = state.playing

  let playlistIndex = findIndex(playlist, song)
  if (playlistIndex === -1) {
    return
  }
  playlist.splice(playlistIndex, 1)
  let sequenceListIndex = findIndex(sequenceList, song)
  sequenceList.splice(sequenceListIndex, 1)

  // 当前歌曲索引在删除歌曲索引的后面，则当前歌曲索引减1
  console.log(currentIndex === playlistIndex)
  console.log(playlist.length !== 0)
  console.log(currentIndex === playlistIndex && playlist.length !== 0)
  if (currentIndex > playlistIndex) {
    currentIndex--
    commit(types.SET_CURRENT_URL_STATE, false)
  } else if (currentIndex === playlistIndex && playlist.length !== 0) {
    // 此时，currentIndex 不会发生变化，所以需要请求新的currentUrl
    currentIndex = currentIndex >= playlist.length ? currentIndex - 1 : currentIndex
    getSingerPlay(playlist[currentIndex]).then((res) => {
      if (res.code === ERR_OK) {
        this.urlParams = res.data.items[0] // 定义返回url各项拼接参数
        let currentSongUrl = `http://dl.stream.qqmusic.qq.com/${this.urlParams.filename}?vkey=${this.urlParams.vkey}&guid=5049378792&uin=0&fromtag=66`
        // 调用action封装的mutations方法
        commit(types.SET_CURRENT_URL, currentSongUrl)
      }
    })
  }

  commit(types.SET_PLAYLIST, playlist)
  commit(types.SET_SEQUENCE_LIST, sequenceList)
  commit(types.SET_CURRENT_INDEX, currentIndex)
  if (playlist.length === 0) {
    console.log(playlist)
    clearSong({commit})
  } else {
    if (!playing) {
      commit(types.SET_PLAYING_STATE, true)
    }
  }
}
// 清除所有歌曲
export const deleteSongList = function ({commit}) {
  commit(types.SET_PLAYLIST, [])
  commit(types.SET_SEQUENCE_LIST, [])
  clearSong({commit})
}
// 歌曲列表为空时所执行的命令
function clearSong ({commit}) {
  commit(types.SET_PLAYING_STATE, false)
  commit(types.SET_CURRENT_INDEX, -1)
  commit(types.SET_GO_OTHER_SONG, false)
  commit(types.SET_CURRENT_URL_STATE, false)
}

// 歌曲播放历史
export const savePlayHistory = function ({commit}, song) {
  commit(types.SET_PLAY_HISTORY, savePlay(song))
}

// 添加收藏歌曲
export const saveFavoriteList = function ({commit}, song) {
  commit(types.SET_FAVORITE_LIST, saveFavorite(song))
}
// 删除收藏歌曲
export const deleteFavoriteList = function ({commit}, song) {
  commit(types.SET_FAVORITE_LIST, deleteFavorite(song))
}
