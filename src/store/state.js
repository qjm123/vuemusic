/**
 * Created by Administrator on 2018/3/20.
 */
/**
 * 项目底层的数据状态
 * **/
import {playMode} from 'common/js/config'
import {loadSearch, loadPlay, loadFavorite} from 'common/js/catch'

const state = {
  singer: {}, // 歌手
  playing: false, // 暂停/开始
  fullScreen: false, // 全屏/最小化
  playlist: [], // 播放列表数据(前进后退)
  sequenceList: [], // 播放歌曲原始顺序列表
  mode: playMode.sequence, // 顺序播放
  currentIndex: -1, // 当前播放歌曲索引
  currentUrl: '', // 当前播放歌曲url
  currentUrlInitial: false, // 定义当前url状态，是否被赋值
  goOtherSong: true, // 定义是否切换下一首歌
  disc: {}, // 定义歌单对象
  topList: {}, // 定义当前榜单对象
  searchHistory: loadSearch(), // 定义搜索历史数组 数值是从本地获取搜索历史，如果没有则默认为空
  playHistory: loadPlay(), // 播放历史
  favoriteList: loadFavorite(), // 收藏歌曲列表
  hasInitPlay: false // 移动端禁止播放器自动播放，所以增加 是否初始化播放 状态 ，如果false，则歌曲 不自动播放，需要点击 按钮播放，否则自动播放
}

export default state
