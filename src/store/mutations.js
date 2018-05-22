/**
 * Created by Administrator on 2018/3/20.
 */
/**
 * 修改动作
 * **/
import * as types from './mutation-types'

const mutations = {
  [types.SET_SINGER] (state, singer) {
    state.singer = singer
  },
  [types.SET_PLAYING_STATE] (state, flag) {
    state.playing = flag
  },
  [types.SET_FULL_SCREEN] (state, flag) {
    state.fullScreen = flag
  },
  [types.SET_PLAYLIST] (state, list) {
    state.playlist = list
  },
  [types.SET_SEQUENCE_LIST] (state, list) {
    state.sequenceList = list
  },
  [types.SET_PLAY_MODE] (state, mode) {
    state.mode = mode
  },
  [types.SET_CURRENT_INDEX] (state, index) {
    state.currentIndex = index
  },
  [types.SET_CURRENT_URL] (state, url) {
    state.currentUrl = url
  },
  [types.SET_CURRENT_URL_STATE] (state, flag) {
    state.currentUrlInitial = flag
  },
  [types.SET_GO_OTHER_SONG] (state, flag) {
    state.goOtherSong = flag
  },
  [types.SET_DISC] (state, disc) {
    state.disc = disc
  },
  [types.SET_TOP_LIST] (state, topList) {
    state.topList = topList
  },
  [types.SET_SEARCH_HISTORY] (state, list) {
    state.searchHistory = list
  },
  [types.SET_PLAY_HISTORY] (state, list) {
    state.playHistory = list
  },
  [types.SET_FAVORITE_LIST] (state, list) {
    state.favoriteList = list
  },
  [types.SET_HAS_INIT_PLAY] (state, flag) {
    state.hasInitPlay = flag
  }
}

export default mutations
