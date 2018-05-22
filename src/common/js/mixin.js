import {mapGetters, mapMutations, mapActions} from 'vuex'
import {playMode} from 'common/js/config'
import {shuffle} from 'common/js/util'

// 搜索页面 检测是否有歌曲，如果有，则bottom增加，留出迷你歌曲位置
export const playlistMixin = {
  computed: {
    ...mapGetters([
      'playlist'
    ])
  },
  // 组件domready 时，触发
  mounted () {
    this.handlePlaylist(this.playlist)
  },
  // keep-alive 组件切换过来的时候触发
  activated () {
    this.handlePlaylist(this.playlist)
  },
  watch: {
    playlist (newVal) {
      this.handlePlaylist(newVal)
    }
  },
  methods: {
    // 处理playlist
    handlePlaylist () {
      // 抛出错误， 组件必须执行handleList方法
      throw new Error('component must implement handlePlaylist method')
    }
  }
}

// 歌曲页面和歌曲列表页面通用mixin
export const playerMixin = {
  computed: {
    iconMode () {
      return this.mode === playMode.sequence ? 'icon-sequence' : this.mode === playMode.loop ? 'icon-loop' : 'icon-random'
    },
    ...mapGetters([
      'sequenceList',
      'currentSong',
      'mode',
      'playlist',
      'playing',
      'favoriteList'
    ])
  },
  methods: {
    // 获取收藏图标 class样式
    getFavoriteIcon (song) {
      if (this.isFavorite(song)) {
        return 'icon-favorite'
      } else {
        return 'icon-not-favorite'
      }
    },
    // 切换收藏图标 状态
    toggleFavorite (song) {
      if (this.isFavorite(song)) {
        this.deleteFavoriteList(song)
      } else {
        this.saveFavoriteList(song)
      }
    },
    // 判断当前歌曲是否 在收藏列表中
    isFavorite (song) {
      const index = this.favoriteList.findIndex((item) => {
        return item.id === song.id
      })
      return index > -1
    },
    // 切换播放模式点击方法
    changeMode () { // 每点击此，mode+1 同时对3取余数，获取当前是三种模式中的第几种
      const mode = (this.mode + 1) % 3
      this.setPlayMode(mode) // 改变state中的状态
      // 改变列表排列
      let list = null
      if (parseInt(mode) === playMode.random) { // 将初始列表随机排列
        list = shuffle(this.sequenceList)
        console.log('随机')
      } else { // 顺序或循环排列
        console.log('循环')
        list = this.sequenceList
      }
      // 变更歌曲url初始状态为 false ，使得停止检测currentIndex变化，防止重复获取数据
      this.setCurrentUrlInitial(false)
      // 调用重新处理index方法
      this.resetCurrentIndex(list)
      // 改变state 的 playlist状态
      this.setPlayList(list)
    },
    // 重新处理 currentIndex
    resetCurrentIndex (list) {
      let index = list.findIndex((item) => {
        return item.id === this.currentSong.id
      })
      this.setCurrentIndex(index)
    },
    ...mapMutations({
      setPlayList: 'SET_PLAYLIST',
      setPlayMode: 'SET_PLAY_MODE',
      setCurrentIndex: 'SET_CURRENT_INDEX',
      setCurrentUrlInitial: 'SET_CURRENT_URL_STATE'
    }),
    ...mapActions([
      'saveFavoriteList',
      'deleteFavoriteList'
    ])
  }
}

// 歌曲列表点击添加歌曲搜索页面 和 搜索页面公用方法
export const searchMixin = {
  data () {
    return {
      query: ''
    }
  },
  computed: {
    ...mapGetters([
      'searchHistory'
    ])
  },
  methods: {
    // 滚动式取消 手机键盘输入框
    blurInput () {
      this.$refs.searchBox.blur()
    },
    // 点击热门搜索关键字，将该关键字传到 searchBox组件中的搜索输入框内
    addQuery (query) {
      this.$refs.searchBox.setQuery(query)
    },
    // 保存当前搜索历史
    saveSearch () {
      this.saveSearchHistory(this.query)
    },
    onQueryChange (query) {
      this.query = query
    },
    ...mapActions([
      'saveSearchHistory',
      'deleteSearchHistory',
      'clearSearchHistory'
    ])
  }
}
