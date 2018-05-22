<template>
  <div class="player" v-show="playlist.length > 0">
    <transition name="normal"
                  @enter="enter"
                  @after-enter="afterEnter"
                  @leave="leave"
                  @after-leave="afterLeave"
      >
      <!--正常展开全屏状态音乐盒-->
      <div class="normal-player" v-show="fullScreen">
        <div class="background">
          <img width="100%" height="100%" :src="currentSong.image"/>
        </div>
        <!--顶部-->
        <div class="top">
          <!--左上角返回-->
          <div class="back" @click="back">
            <i class="icon-back"></i>
          </div>
          <!--歌曲名-->
          <h1 class="title" v-html="currentSong.name"></h1>
          <!--歌手名-->
          <h2 class="subtitle" v-html="currentSong.singer"></h2>
        </div>
        <!--中间-->
        <div class="middle"
              @touchstart.prevent="middleTouchStart"
              @touchmove.prevent="middleTouchMove"
              @touchend="middleTouchEnd"
        >
          <!--唱片区域-->
          <div class="middle-l" ref="middleL">
            <div class="cd-wrapper" ref="cdWrapper">
              <div class="cd" :class="cdCls">
                <img class="image" :src="currentSong.image"/>
              </div>
            </div>
            <div class="playing-lyric-wrapper">
              <div class="playing-lyric">
                {{playingLyric}}
              </div>
            </div>
          </div>
          <!--歌词区域-->
          <scroll class="middle-r" ref="lyricList" :data="currentLyric && currentLyric.lines">
            <div class="lyric-wrapper">
              <div v-if="currentLyric">
                <p ref="lyricLine"
                   class="text"
                   :class="{'current' : currentLineNum === index}"
                   v-for="(line, index) in currentLyric.lines" :key="index">{{line.txt}}</p>
              </div>
            </div>
          </scroll>
        </div>
        <!--底部-->
        <div class="bottom">
          <!--切换的标记点-->
          <div class="dot-wrapper">
            <span class="dot" :class="{'active':currentShow === 'cd'}"></span>
            <span class="dot" :class="{'active':currentShow === 'lyric'}"></span>
          </div>
          <!--进度条-->
          <div class="progress-wrapper">
            <span class="time time-l">{{format(currentTime)}}</span>
            <div class="progress-bar-wrapper">
              <progress-bar :percent="percent" @percentChange="onProgressBarChange"></progress-bar>
            </div>
            <span class="time time-r">{{format(currentSong.duration)}}</span>
          </div>
          <!--控制按钮-->
          <div class="operators">
            <!--操作按钮-->
            <div class="icon i-left" @click="changeMode">
              <i :class="iconMode"></i>
            </div>
            <div class="icon i-left" :class="disableCls">
              <i @click="prev" class="icon-prev"></i>
            </div>
            <div class="icon i-center" :class="disableCls">
              <!--播放暂停方法-->
              <i @click="togglePlaying" :class="playIcon"></i>
            </div>
            <div class="icon i-right" :class="disableCls">
              <i @click="next" class="icon-next"></i>
            </div>
            <div class="icon i-right">
              <i class="icon" :class="getFavoriteIcon(currentSong)" @click="toggleFavorite(currentSong)"></i>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <transition name="mini">
      <!--收缩状态下音乐盒-->
      <div class="mini-player" v-show="!fullScreen" @click="open">
        <!--小型唱片图案-->
        <div class="icon">
          <img :class="cdCls" width="40" height="40" :src="currentSong.image"/>
        </div>
        <div class="text">
          <!--歌曲,歌手名称-->
          <h2 class="name" v-html="currentSong.name"></h2>
          <p class="desc" v-html="currentSong.singer"></p>
        </div>
        <!--控制按钮-->
        <div class="control">
          <progress-circle :radius="radius" :percent="percent">
            <i @click.stop="togglePlaying" class="icon-mini" :class="miniIcon"></i>
          </progress-circle>
        </div>
        <!--歌曲列表按钮-->
        <div class="control" @click.stop="showPlaylist">
          <i class="icon-playlist"></i>
        </div>
      </div>
    </transition>
    <!--歌曲列表-->
    <playlist ref="playlistBox"></playlist>
    <!-- 歌曲可以播放时，触发canplay  发生错误时，触发error -->
    <audio ref="audio" :src="currentUrl"
           @play="ready"
           @error="error"
           @timeupdate="updateTime"
           @ended="currentSongEnd"
      ></audio>
  </div>
</template>

<script type="text/ecmascript-6">
import {mapGetters, mapMutations, mapActions} from 'vuex' // 调用vuex getters 获取state状态
import animations from 'create-keyframe-animation' // 调用vue2提供的js使用css3动画
import {prefixStyle} from 'common/js/dom'
import {getSingerPlay} from 'api/singer'
import {ERR_OK} from 'api/config'
import ProgressBar from 'base/progress-bar/progress-bar' // 引入进度条
import ProgressCircle from 'base/progress-circle/progress-circle'
import {playMode} from 'common/js/config'
import Lyric from 'lyric-parser'
import Scroll from 'base/scroll/scroll'
import Playlist from 'components/playlist/playlist'
import {playerMixin} from 'common/js/mixin'

const transform = prefixStyle('transform')
const transitionDuration = prefixStyle('transitionDuration')
const transitionDurationTime = 300

export default {
  mixins: [playerMixin],
  data () {
    return {
      songReady: false, // audio 判断的歌曲执行状态
      currentTime: 0, // 当前歌曲播放进度时间
      radius: 32, // 小播放器时进度条区域宽高
      currentLyric: null, // 当前歌词
      currentLineNum: 0, // 当前歌词所在的行
      currentShow: 'cd', // 默认画面
      playingLyric: '' // 播放当前一句歌词
    }
  },
  computed: {
    cdCls () { // CD唱片旋转 根据播放状态， 对唱片进行 旋转 和 取消旋转
      return this.playing ? 'play' : 'play pause'
    },
    playIcon () { // 播放/暂停按键样式切换
      return this.playing ? 'icon-pause' : 'icon-play'
    },
    miniIcon () { // 缩小版 播放/暂停 样式切换
      return this.playing ? 'icon-pause-mini' : 'icon-play-mini'
    },
    disableCls () { // 计算 播放，上一首，下一首，按钮的样式状态
      return this.songReady ? '' : 'disable'
    },
    percent () {
      return this.currentTime / this.currentSong.duration
    },
    ...mapGetters([
      'fullScreen',
      'currentUrl',
      'currentIndex',
      'goOtherSong',
      'currentUrlInitial',
      'hasInitPlay'
    ])
  },
  created () {
    this.touch = {}
  },
  methods: {
    // 最小化
    back () {
      this.setFullScreen(false)
    },
    // 全屏
    open () {
      this.setFullScreen(true)
    },
    // vue 提供的动画钩子 dong回调after-leave/enter方法
    enter (el, done) {
      const {x, y, scale} = this._getPosAndScale()
      let animation = {
        0: {
          transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`
        },
        60: {
          transform: 'translate3d(0, 0, 0) scale(1.2)'
        },
        100: {
          transform: 'translate3d(0, 0, 0) scale(1)'
        }
      }
      // 注册animations动画
      animations.registerAnimation({
        name: 'move',
        animation,
        presets: {
          duration: 400,
          easing: 'linear'
        }
      })
      // 使用animations动画，dong回调afterEnter方法
      animations.runAnimation(this.$refs.cdWrapper, 'move', done)
    },
    // 进入结束后，取消animation注册，并清空元素上的animation的style
    afterEnter () {
      animations.unregisterAnimation('move')
      this.$refs.cdWrapper.style.animation = ''
    },
    leave (el, done) {
      this.$refs.cdWrapper.style.transition = 'all 0.4s'
      const {x, y, scale} = this._getPosAndScale()
      this.$refs.cdWrapper.style[transform] = `translate3d(${x}px,${y}px,0) scale(${scale})`
      this.$refs.cdWrapper.addEventListener('transitionend', done)
    },
    afterLeave () {
      this.$refs.cdWrapper.style.transition = ''
      this.$refs.cdWrapper.style[transform] = ''
    },
    // 歌曲播放完毕之后方法
    currentSongEnd () {
      console.log('触发结束')
      if (this.mode === playMode.loop) {
        this.loop()
      } else {
        this.next()
      }
    },
    // 单曲循环方法，令当前播放时间等于0
    loop () {
      this.$refs.audio.currentTime = 0
      console.log(this.playing)
      if (!this.playing) {
        this.setPlayingState(true)
        this.setGoOtherSong(true)
      }
      this.$refs.audio.play()
      // 单曲循环时，如果存在currentLyric对象，则调用seek方法，使歌曲进度回到初始状态
      if (this.currentLyric) {
        this.currentLyric.seek(0)
      }
    },
    // 下一首歌
    next () {
      // 变更歌曲url初始状态为 true ，检测currentIndex变化，重新获取歌曲url数据
      this.setCurrentUrlInitial(true)
      if (!this.songReady) {
        return
      }
      if (this.playlist.length === 1 || this.mode === playMode.loop) {
        this.loop()
      } else {
        let index = this.currentIndex + 1
        if (index === this.playlist.length) {
          index = 0
        }
        this.setCurrentIndex(index)
        this.setGoOtherSong(true) // 令 此参数为true 为跳转
        if (!this.playing) {
          this._togglePlay()
        }
        // 进入下一首歌后，将状态改变成false，这时候audio如果可以播放可取，则该状态还会变成true
        this.songReady = false
      }
    },
    // 上一首歌
    prev () {
      // 变更歌曲url初始状态为 true ，检测currentIndex变化，重新获取歌曲url数据
      this.setCurrentUrlInitial(true)
      if (!this.songReady) {
        return
      }
      if (this.playlist.length === 1 || this.mode === playMode.loop) {
        this.loop()
      } else {
        let index = this.currentIndex - 1
        if (index === -1) { // 如果index是-1 则是在 第一首歌的基础上向前退1 则会退到最后一首
          index = this.playlist.length - 1
        }
        this.setCurrentIndex(index)
        this.setGoOtherSong(true) // 令 此参数为true 为跳转
        if (!this.playing) {
          this._togglePlay()
        }
        this.songReady = false
      }
    },
    // 播放器准备好播放歌曲 , 令 songReady状态为true
    ready () {
      this.songReady = true
      this.savePlayHistory(this.currentSong)
    },
    // 播放器播放歌曲出现错误, 也会令 songReady为true，这样还可以操作下一步
    error () {
      this.songReady = true
    },
    // 当歌曲播放时，audio 会派发timeupdate事件 用来返回时间
    updateTime (e) {
      this.currentTime = e.target.currentTime // audio当前播放事件，可读写属性
    },
    // 时间戳转换算法
    format (interval) {
      interval = interval | 0 // 正数向下取整 相当于 Math.floor
      const minute = interval / 60 | 0 // 时间/60 向下取整，获取分钟部分
      const second = this._pad(interval % 60) // 时间 除以 60 取余数 获取秒的部分
      return `${minute}:${second}`
    },
    // 接受派发回来的 监听进度条百分比改变
    onProgressBarChange (percent) {
      const currentTime = this.currentSong.duration * percent // 令当前audio的播放时间等于现在的百分比 * 总播放时间
      this.$refs.audio.currentTime = currentTime // 令当前audio的播放时间等于现在的百分比 * 总播放时间
      if (!this.playing) { // 如果处于暂停状态，拖动进度条。。则拖动完后使歌曲播放
        this._togglePlay()
      }
      if (this.currentLyric) {
        this.currentLyric.seek(currentTime * 1000)
      }
    },
    // 获取歌词方法
    getLyric () {
      this.currentSong.getLyric().then((lyric) => {
        if (this.currentLyric) {
          this.currentLyric.stop()
          this.currentLyric = null
        }
        this.currentLyric = new Lyric(lyric, this.handleLyric)
        if (this.playing) {
          this.currentLyric.play()
        }
      }).catch(() => { // 获取歌词出错时
        this.currentLyric = null // 讲当前歌词对象置为null
        this.playingLyric = '' // 讲唱片部分当前一句歌词置为空
        this.currentLineNum = 0 // 讲当前歌词行数置为0
      })
    },
    showPlaylist () {
      this.$refs.playlistBox.show()
    },
    // 处理歌词回调函数
    handleLyric ({lineNum, txt}) {
      this.$refs.lyricList.refresh()
      this.currentLineNum = lineNum
      if (lineNum > 5) {
        let lineEl = this.$refs.lyricLine[lineNum - 5]
        this.$refs.lyricList.scrollToElement(lineEl, 1000)
      } else {
        this.$refs.lyricList.scrollTo(0, 0, 1000)
      }
      this.playingLyric = txt
    },
    // middle 的touchstart操作
    middleTouchStart (e) {
      console.log('触摸开始')
      this.touch.initiated = true
      const touches = e.touches[0]
      this.touch.startX = touches.pageX
      this.touch.startY = touches.pageY
    },
    // 中间部分 middle 移动中
    middleTouchMove (e) {
      console.log('触摸移动')
      if (!this.touch.initiated) {
        return
      }
      const touches = e.touches[0]
      const deltaX = touches.pageX - this.touch.startX
      const deltaY = touches.pageY - this.touch.startY
      // 如果纵轴偏移量大于横轴偏移量 ，则取消左右滑动屏幕，此时为滑动歌词
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return
      }
      const left = this.currentShow === 'cd' ? 0 : -window.innerWidth
      // offsetWidth 最小不小于 -window.innerWidth,最大不超过0
      const offsetWidth = Math.min(0, Math.max(-window.innerWidth, left + deltaX))
      // 歌词滑动距离相对于总宽度的百分比
      this.touch.percent = Math.abs(offsetWidth / window.innerWidth)
      // lyricList是一个scroll视图,需要访问$element
      this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`
      // 取消 过渡平滑动画
      this.$refs.lyricList.$el.style[transitionDuration] = ''
      // 修改 middlel 的 透明度  percent 越小，opacity的值越大，越不透明，反之，越透明
      this.$refs.middleL.style.opacity = 1 - this.touch.percent
      this.$refs.middleL.style[transitionDuration] = ''
    },
    // 中间部分 middle 移动结束
    middleTouchEnd () {
      console.log('触摸结束')
      let offsetWidth
      let opacity
      // 从右向左滑
      if (this.currentShow === 'cd') {
        // 如果从右向左滑动占屏幕宽的10%以上，则歌词全部显示，否则，歌词退回不显示
        if (this.touch.percent > 0.1) {
          offsetWidth = -window.innerWidth
          opacity = 0
          this.currentShow = 'lyric'
        } else {
          offsetWidth = 0
          opacity = 1
        }
      } else { // 从左向右滑
        // 也是滑动 超过10%
        if (this.touch.percent < 0.9) {
          offsetWidth = 0
          this.currentShow = 'cd'
          opacity = 1
        } else {
          offsetWidth = -window.innerWidth
          opacity = 0
        }
      }
      this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`
      // 设计一个结束 平滑动画
      this.$refs.lyricList.$el.style[transitionDuration] = `${transitionDurationTime}ms`
      // 修改 middlel 的 透明度
      this.$refs.middleL.style.opacity = opacity
      this.$refs.middleL.style[transitionDuration] = `${transitionDurationTime}ms`
    },
    // 位数补 0 算法
    _pad (num, n = 2) {
      let len = num.toString().length // 获取当前数的长度
      while (len < n) {
        num = '0' + num
        len++
      }
      return num
    },
    // 获取位置和缩放尺寸
    _getPosAndScale () {
      // 偏移值 都为 中心到中心
      const targetWidth = 40 // 小图的宽度
      const paddingLeft = 40 // 小图中心距离左边宽度
      const paddingBottom = 30 // 小图中心距离底边高度
      const paddingTop = 80 // 大图距离顶端高度
      const width = window.innerWidth * 0.8 // 大图宽度
      const scale = targetWidth / width // 初始缩放比例 = 小图宽/大图宽
      const x = -(window.innerWidth / 2 - paddingLeft) // 大图到小图 横坐标偏移 负值
      const y = window.innerHeight - paddingTop - width / 2 - paddingBottom // 大图到小图 纵坐标偏移 = 总高度 - 大图据顶端距离 - 大图一半的高度 - 小图中心到底端的距离
      return {
        x,
        y,
        scale
      }
    },
    // 播放按钮功能
    togglePlaying () {
      this.setGoOtherSong(false) // 令 此参数为true 为跳转
      // 播放暂停切换时 调歌词播放暂停状态
      // 如果存在currentLyric对象，则进行currentLyric切换
      if (this.currentLyric) {
        this.currentLyric.togglePlay()
      }
      this._togglePlay()
    },
    // 播放状态切换
    _togglePlay () { // 切换播放状态
      this.setCurrentUrlInitial(true)
      this.setPlayingState(!this.playing) // 切换之后 设置vuex的playing状态
    },
    // 通过mumtation 动作 改变 SET_FULL_SCREEN,SET_PLAYING_STATE,SET_CURRENT_URL 状态
    ...mapMutations({
      setFullScreen: 'SET_FULL_SCREEN',
      setPlayingState: 'SET_PLAYING_STATE',
      setCurrentUrl: 'SET_CURRENT_URL',
      setGoOtherSong: 'SET_GO_OTHER_SONG',
      setHasInitPlay: 'SET_HAS_INIT_PLAY'
    }),
    ...mapActions([
      'savePlayHistory'
    ])
  },
  watch: {
    // 监听当前歌曲索引
    currentIndex () {
      // 如果当前存在currentLyric对象，则停止清空当前currentLyric对象，准备创建新的对象，避免堵塞
      if (!this.currentUrlInitial) { // 如果地址初始化状态为false，则中断
        return
      }
      console.log('监听currentIndex变化')
      // 获取当前歌曲的url，并赋值给song对象
      getSingerPlay(this.currentSong).then((res) => {
        if (res.code === ERR_OK) {
          this.urlParams = res.data.items[0] // 定义返回url各项拼接参数
          let currentSongUrl = `http://dl.stream.qqmusic.qq.com/${this.urlParams.filename}?vkey=${this.urlParams.vkey}&guid=5049378792&uin=0&fromtag=66`
          // 调用action封装的mutations方法
          this.setCurrentUrl(currentSongUrl)
        }
      })
    },
    // 监视初始化的歌曲值，如果变化则进行以下方法
    currentUrl () {
      if (!this.hasInitPlay) {
        this.setPlayingState(false)
        this.setHasInitPlay(!this.hasInitPlay)
        return
      }
      if (!this.playing) {
        this.setPlayingState(true)
      }
      if (!this.goOtherSong) {
        this.setGoOtherSong(true)
      }
      // 如果当前存在currentLyric对象，则停止清空当前currentLyric对象，准备创建新的对象，避免堵塞
      // 需要再更新后的视图进行操作，不能再请求src的时候调audio的play事件
      console.log('监听currentUrl变化')
      // addEventListener('message', () => {
      //   this.$refs.audio.play()
      //   // 调用歌词
      //   this.getLyric()
      // }, false)
      // postMessage(1, '*')
      this.timer = setTimeout(() => {
        this.$refs.audio.play()
        // 调用歌词
        this.getLyric()
      }, 20)
      if (!this.currentUrlInitial) { // 如果歌曲地址初始化状态为false，则赋值为true
        this.setCurrentUrlInitial(true)
      }
    },
    // 监听playing的状态，来操纵audio播放活暂停 , 需要在更新视图后操作
    playing (newPlay) {
      // 判断，如果为播放，暂停状态切换，goOtherSong(false) 进行，如果跳转其他歌曲，则阻断
      if (!this.hasInitPlay) {
        this.setPlayingState(false)
        this.setHasInitPlay(!this.hasInitPlay)
        return
      }
      if (this.goOtherSong) {
        return
      }
      const audio = this.$refs.audio
      console.log('监听audio播放，暂停状态')
      this.$nextTick(() => { // newPlay 且 歌曲地址有值 则调用 播放或暂停
        (newPlay && this.currentUrl !== '') ? audio.play() : audio.pause()
      })
    }
  },
  components: {
    ProgressBar,
    ProgressCircle,
    Scroll,
    Playlist
  }
}

</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .player
    .normal-player
      position: fixed
      left: 0
      right: 0
      top: 0
      bottom: 0
      z-index: 150
      background: $color-background
      .background
        position: absolute
        left: 0
        top: 0
        width: 100%
        height: 100%
        z-index: -1
        opacity: 0.6
        filter: blur(20px)
      .top
        position: relative
        margin-bottom: 25px
        .back
          position absolute
          top: 0
          left: 6px
          z-index: 50
          .icon-back
            display: block
            padding: 9px
            font-size: $font-size-large-x
            color: $color-theme
            transform: rotate(-90deg)
        .title
          width: 70%
          margin: 0 auto
          line-height: 40px
          text-align: center
          no-wrap()
          font-size: $font-size-large
          color: $color-text
        .subtitle
          line-height: 20px
          text-align: center
          font-size: $font-size-medium
          color: $color-text
      .middle
        position: fixed
        width: 100%
        top: 80px
        bottom: 170px
        white-space: nowrap
        font-size: 0
        .middle-l
          display: inline-block
          vertical-align: top
          position: relative
          width: 100%
          height: 0
          padding-top: 80%
          .cd-wrapper
            position: absolute
            left: 18%
            top: 0
            width: 64%
            height: 80%
            .cd
              width: 100%
              height: 100%
              box-sizing: border-box
              border: 10px solid rgba(255, 255, 255, 0.1)
              border-radius: 50%
              &.play
                animation: rotate 20s linear infinite
              &.pause
                animation-play-state: paused
              .image
                position: absolute
                left: 0
                top: 0
                width: 100%
                height: 100%
                border-radius: 50%

          .playing-lyric-wrapper
            width: 80%
            margin: -10% auto 0 auto
            overflow: hidden
            text-align: center
            .playing-lyric
              height: 20px
              line-height: 20px
              font-size: $font-size-medium
              color: $color-text-l
        .middle-r
          display: inline-block
          vertical-align: top
          width: 100%
          height: 100%
          overflow: hidden
          .lyric-wrapper
            width: 80%
            margin: 0 auto
            overflow: hidden
            text-align: center
            .text
              line-height: 32px
              color: $color-text-l
              font-size: $font-size-medium
              &.current
                color: $color-text
      .bottom
        position: absolute
        bottom: 3%
        width: 100%
        .dot-wrapper
          text-align: center
          font-size: 0
          .dot
            display: inline-block
            vertical-align: middle
            margin: 0 4px
            width: 8px
            height: 8px
            border-radius: 50%
            background: $color-text-l
            &.active
              width: 20px
              border-radius: 5px
              background: $color-text-ll
        .progress-wrapper
          display: flex
          align-items: center
          width: 80%
          margin: 0px auto
          padding: 10px 0
          .time
            color: $color-text
            font-size: $font-size-small
            flex: 0 0 30px
            line-height: 30px
            width: 30px
            &.time-l
              text-align: left
            &.time-r
              text-align: right
          .progress-bar-wrapper
            flex: 1
        .operators
          display: flex
          align-items: center
          .icon
            flex: 1
            color: $color-theme
            &.disable
              color: $color-theme-d
            i
              font-size: 30px
          .i-left
            text-align: right
          .i-center
            padding: 0 20px
            text-align: center
            i
              font-size: 40px
          .i-right
            text-align: left
          .icon-favorite
            color: $color-sub-theme
      &.normal-enter-active, &.normal-leave-active
        transition: all 0.4s
        .top, .bottom
          transition: all 0.4s cubic-bezier(0.86, 0.18, 0.82, 1.32)
      &.normal-enter, &.normal-leave-to
        opacity: 0
        .top
          transform: translate3d(0, -100px, 0)
        .bottom
          transform: translate3d(0, 100px, 0)
    .mini-player
      display: flex
      align-items: center
      position: fixed
      left: 0
      bottom: 0
      z-index: 180
      width: 100%
      height: 60px
      background: $color-highlight-background
      &.mini-enter-active, &.mini-leave-active
        transition: all 0.4s
      &.mini-enter, &.mini-leave-to
        opacity: 0
      .icon
        flex: 0 0 40px
        width: 40px
        padding: 0 10px 0 20px
        img
          border-radius: 50%
          &.play
            animation: rotate 10s linear infinite
          &.pause
            animation-play-state: paused
      .text
        display: flex
        flex-direction: column
        justify-content: center
        flex: 1
        line-height: 20px
        overflow: hidden
        .name
          margin-bottom: 2px
          no-wrap()
          font-size: $font-size-medium
          color: $color-text
        .desc
          no-wrap()
          font-size: $font-size-small
          color: $color-text-d
      .control
        flex: 0 0 30px
        width: 30px
        padding: 0 10px
        .icon-play-mini, .icon-pause-mini, .icon-playlist
          font-size: 30px
          color: $color-theme-d
        .icon-mini
          font-size: 32px
          position: absolute
          left: 0
          top: 0

  @keyframes rotate
    0%
      transform: rotate(0)
    100%
      transform: rotate(360deg)
</style>
