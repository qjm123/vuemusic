<template>
  <div class="music-list">
    <div class="back" @click="back">
      <i class="icon-back"></i>
    </div>
    <h1 class="title" v-html="title"></h1>
    <div class="bg-image" :style="bgStyle" ref="bgImage">
      <div class="play-wrapper">
        <div class="play" v-show="songs.length" ref="playBtn" @click="randomBtn">
          <i class="icon-play"></i>
          <span class="text">随机播放全部</span>
        </div>
      </div>
      <div class="filter" ref="filter"></div>
    </div>
    <div class="bg-layer" ref="layer"></div>
    <scroll @scroll="scroll"
            :probeType="probeType"
            :listenScroll="listenScroll"
            :data="songs"
            class="list"
            ref="list">
      <div class="song-list-wrapper">
        <song-list :songs="songs" :rank="rank" @select="selectItem"></song-list>
      </div>
      <div class="loading-container" v-show="!songs.length">
        <loading></loading>
      </div>
    </scroll>
  </div>
</template>

<script type="text/ecmascript-6">
import Scroll from 'base/scroll/scroll'
import SongList from 'base/song-list/song-list'
import {prefixStyle} from 'common/js/dom'
import Loading from 'base/loading/loading'
import {getSingerPlay} from 'api/singer'
import {ERR_OK} from 'api/config'
import {mapActions} from 'vuex' // 调用vuex提供的调用action的语法糖
import {shuffle} from 'common/js/util' // 调用数组打乱方法
import {playlistMixin} from 'common/js/mixin'

const RESERVED_HEIGHT = 40 // 预留的顶部高度
const transform = prefixStyle('transform') // transform通过dom.js来检测添加前缀
const backdrop = prefixStyle('backdrop-filter') // backdrop通过dom.js来检测添加前缀

export default {
  mixins: [playlistMixin],
  data () {
    return {
      scrollY: -1,
      currentUrl: ''
    }
  },
  created () {
    this.probeType = 3
    this.listenScroll = true
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    bgImage: {
      type: String,
      default: ''
    },
    songs: {
      type: Array,
      default: null
    },
    rank: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    bgStyle () {
      return `background-image:url(${this.bgImage})`
    }
  },
  mounted () {
    this.imageHeight = this.$refs.bgImage.clientHeight // 图像高度
    this.minTranslateY = -(this.imageHeight - RESERVED_HEIGHT) // 最大滚动距离 = 图像高度-预留顶部高度
    this.$refs.list.$el.style.top = `${this.$refs.bgImage.clientHeight}px`
  },
  methods: {
    // 覆盖mixin.js下的handlePlaylist方法
    handlePlaylist (playlist) {
      const bottom = playlist.length > 0 ? '60px' : ''
      this.$refs.list.$el.style.bottom = bottom
      this.$refs.list.refresh()
    },
    scroll (pos) {
      this.scrollY = pos.y
    },
    back () {
      this.$router.back()
    },
    // 获取派发出来的选择点击事件，获取到被点击选取的元素，将当前元素数据请求获取url参数，进行url拼接
    // http://dl.stream.qqmusic.qq.com/C400001Qu4I30eVFYb.m4a?vkey=0&guid=5049378792&uin=0&fromtag=66
    selectItem (song, index) {
      // 获取当前歌曲的url，并赋值给song对象
      getSingerPlay(song).then((res) => {
        if (res.code === ERR_OK) {
          this.urlParams = res.data.items[0] // 定义返回url各项拼接参数
          this.currentUrl = `http://dl.stream.qqmusic.qq.com/${this.urlParams.filename}?vkey=${this.urlParams.vkey}&guid=5049378792&uin=0&fromtag=66`
          // 设置vuex的 playing fullScreen playlist currentlist sequenceList
          // 调用action封装的mutations方法
          this.selectPlay({
            list: this.songs,
            index,
            currentUrl: this.currentUrl
          })
        }
      })
    },
    // 随机播放所有歌曲
    randomBtn () {
      let randomList = shuffle(this.songs)
      // 获取当前歌曲的url，并赋值给song对象
      getSingerPlay(randomList[0]).then((res) => {
        if (res.code === ERR_OK) {
          this.urlParams = res.data.items[0] // 定义返回url各项拼接参数
          this.currentUrl = `http://dl.stream.qqmusic.qq.com/${this.urlParams.filename}?vkey=${this.urlParams.vkey}&guid=5049378792&uin=0&fromtag=66`
          // 设置vuex的 playing fullScreen playlist currentlist sequenceList
          // 调用action封装的mutations方法
          this.randomPlay({
            oldlist: this.songs,
            newlist: randomList,
            index: 0,
            currentUrl: this.currentUrl
          })
        }
      })
    },
    ...mapActions([
      'selectPlay',
      'randomPlay'
    ])
  },
  watch: {
    scrollY (newY) { // 监听scrollY数值变化
      // 比较最大滚动距离和scroll滚动距离，选取大的值
      let translateY = Math.max(this.minTranslateY, newY)
      // 设定初始zIndex
      let zIndex = 0
      // 设定默认缩放比例scale
      let scale = 1
      // 设定初始模糊参数blur
      let blur = 0

      // 设置黑色底层偏移量
      this.$refs.layer.style[transform] = `translate3d(0,${translateY}px,0)`
      // 设置percent 缩放百分数 ,Math.abs,取绝对值
      const percent = Math.abs(newY / this.imageHeight)
      if (newY > 0) { // 如果newY大于0，则从初始状态向下滚动
        // this.imageHeight * scale = this.imageHeight + scale
        scale = 1 + percent
        // 设置zIndex，是的向下滚动时，bgImage 遮盖住 layer 层
        zIndex = 10
      } else {
        // 如果newY < 0 ，则为负数，向上滚动，则赋值给blur，令blur = 20 * percent 最大为 20
        // Math.min取两值中较小的值
        blur = Math.min(20 * percent, 20)
      }
      // 设置bgImage的模糊 backdrop-filter适用于ios手机，安卓不太支持
      this.$refs.filter.style[backdrop] = `blur(${blur}px)`
      this.$refs.filter.style['filter'] = `blur(${blur}px)`
      // 如果滚动距离(负值,例:-300)小于最大滚动距离(负值,例:-233)的话，则证明已经滚动到最顶处，则设置bgImage的高度为顶部预留高度，否则还原，同时改变zindex值
      if (newY < this.minTranslateY) { // 滚动到顶部
        zIndex = 10
        this.$refs.bgImage.style.paddingTop = 0
        this.$refs.bgImage.style.height = `${RESERVED_HEIGHT}px` // bgImage高度变为预留高度
        this.$refs.playBtn.style.display = 'none' // 播放按钮隐藏
      } else {
        this.$refs.bgImage.style.paddingTop = '70%'
        this.$refs.bgImage.style.height = 0
        this.$refs.playBtn.style.display = '' // 播放按钮显示
      }
      // 设定bgImage的zInde
      this.$refs.bgImage.style.zIndex = zIndex
      // 设置黑色底层偏移量
      this.$refs.bgImage.style[transform] = `scale(${scale})`
    }
  },
  components: {
    Scroll,
    SongList,
    Loading
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .music-list
    position: fixed
    z-index: 100
    top: 0
    left: 0
    bottom: 0
    right: 0
    background: $color-background
    .back
      position absolute
      top: 0
      left: 6px
      z-index: 50
      .icon-back
        display: block
        padding: 10px
        font-size: $font-size-large-x
        color: $color-theme
    .title
      position: absolute
      top: 0
      left: 10%
      z-index: 40
      width: 80%
      no-wrap()
      text-align: center
      line-height: 40px
      font-size: $font-size-large
      color: $color-text
    .bg-image
      position: relative
      width: 100%
      height: 0
      padding-top: 70%
      transform-origin: top
      background-size: cover
      .play-wrapper
        position: absolute
        bottom: 20px
        z-index: 50
        width: 100%
        .play
          box-sizing: border-box
          width: 135px
          padding: 7px 0
          margin: 0 auto
          text-align: center
          border: 1px solid $color-theme
          color: $color-theme
          border-radius: 100px
          font-size: 0
          .icon-play
            display: inline-block
            vertical-align: middle
            margin-right: 6px
            font-size: $font-size-medium-x
          .text
            display: inline-block
            vertical-align: middle
            font-size: $font-size-small
      .filter
        position: absolute
        top: 0
        left: 0
        width: 100%
        height: 100%
        background: rgba(7, 17, 27, 0.4)
    .bg-layer
      position: relative
      height: 100%
      background: $color-background
    .list
      position: fixed
      top: 0
      bottom: 0
      width: 100%
      background: $color-background
      .song-list-wrapper
        padding: 20px 30px
      .loading-container
        position: absolute
        width: 100%
        top: 50%
        transform: translateY(-50%)
</style>
