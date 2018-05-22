<template>
  <scroll class="listview"
          :data="data"
          ref="listview"
          :listenScroll="listenScroll"
          :probeType="probeType"
          @scroll="scroll"
    >
    <ul>
      <li v-for = "group in data" :key="group.title" class="list-group" ref="listGroup">
        <h2 class="list-group-title">{{group.title}}</h2>
        <ul>
          <li @click="selectItem(item)" v-for="item in group.items" :key="item.id" class="list-group-item">
            <img v-lazy="item.avatar" class="avatar"/>
            <span class="name">{{item.name}}</span>
          </li>
        </ul>
      </li>
    </ul>
    <div class="list-shortcut"
         @touchstart = "onShortcutTouchStart"
         @touchmove.stop.prevent = "onShortcutTouchMove">
      <ul>
        <li v-for="(item,index) in shortcutList"
            :key="item"
            class="item"
            :data-index="index"
            :class="{'current': currentIndex === index }"
          >
          {{item}}
        </li>
      </ul>
    </div>
    <div class="list-fixed" v-show="fixedTitle" ref="fixed">
      <h1 class="fixed-title">{{fixedTitle}}</h1>
    </div>
    <div v-show="!data.length" class="loading-container">
      <loading></loading>
    </div>
  </scroll>
</template>

<script type="text/ecmascript-6">
import Scroll from 'base/scroll/scroll'
import Loading from 'base/loading/loading'
import {getData} from 'common/js/dom'

const ANCHOR_HEIGHT = 18 // 右侧字母导航栏每个元素的高度
const TITLE_HEIGHT = 30 // 每个item的title高度

export default {
  data () {
    return {
      scrollY: -1,
      currentIndex: 0,
      diff: -1
    }
  },
  created () {
    this.touch = {}
    this.listenScroll = true
    this.listHeight = []
    this.probeType = 3 // 监听实时滚动
  },
  props: {
    data: {
      type: Array,
      default: null
    }
  },
  computed: {
    shortcutList () {
      return this.data.map((group) => {
        return group.title.substr(0, 1)
      })
    },
    fixedTitle () {
      if (this.scrollY > 0) {
        return ''
      }
      return this.data[this.currentIndex] ? this.data[this.currentIndex].title : ''
    }
  },
  methods: {
    refresh () {
      this.$refs.listview.refresh()
    },
    selectItem (item) {
      this.$emit('select', item)
    },
    onShortcutTouchStart (e) { // touch触摸滚动
      let anchorIndex = getData(e.target, 'index') // 获取到index的值
      let firstTouch = e.touches[0] // 获取初始触摸的坐标
      this.touch.y1 = firstTouch.pageY // 将touchstart纵坐标赋值给初始touch对象的y1属性
      this.touch.anchorIndex = anchorIndex// 记录一下初始锚点在什么位置
      this._scrollTo(anchorIndex)
    },
    onShortcutTouchMove (e) { // touch拖动滚动
      let firstTouch = e.touches[0]
      this.touch.y2 = firstTouch.pageY// 将touchstart纵坐标赋值给初始touch对象的y2属性
      let delta = (this.touch.y2 - this.touch.y1) / ANCHOR_HEIGHT | 0// y轴上的偏移 = (移动纵坐标-初始纵坐标)/每个间距高度 向下取整
      let anchorIndex = parseInt(this.touch.anchorIndex) + delta// y轴偏移+初始锚点位置偏移 = 现处于偏移
      this._scrollTo(anchorIndex)
    },
    scroll (pos) {
      this.scrollY = pos.y // 实时获取到scroll滚动y轴的距离
    },
    _scrollTo (index) {
      if (!index && index !== 0) { // index为null且idnex不等于0时
        return
      }
      if (index < 0) {
        index = 0
      } else if (index > this.listHeight.length - 2) {
        index = this.listHeight.length - 2
      }
      this.scrollY = -this.listHeight[index]
      this.$refs.listview.scrollToElement(this.$refs.listGroup[index], 500)
    },
    _calculateHeight () { // 计算高度
      this.listHeight = []
      const list = this.$refs.listGroup
      let height = 0
      this.listHeight.push(height)
      for (let i = 0; i < list.length; i++) {
        let item = list[i]
        height += item.clientHeight // 累加每个item的高度，得到当前item至顶端的总高度
        this.listHeight.push(height) // 获取到从第一个到最后一个每个元素对应的height
      }
    }
  },
  watch: {
    data () {
      setTimeout(() => {
        this._calculateHeight()
      }, 20)
    },
    scrollY (newY) {
      const listHeight = this.listHeight
      // 当滚动到顶部，newY>0
      if (newY > 0) {
        this.currentIndex = 0
        return
      }
      // 在中间部分滚动
      for (let i = 0; i < listHeight.length - 1; i++) {
        let height1 = listHeight[i]
        let height2 = listHeight[i + 1]
        if (-newY >= height1 && -newY < height2) {
          this.currentIndex = i
          this.diff = height2 - (-newY) // 一个item的最下端 - 现在高度 = 还差多少到头 如果这个值小于等于title高，则令上一个title向上偏移
          return
        }
      }
      // 当滚动到底端，且-newY>最后一个元素的上限
      this.currentIndex = listHeight.length - 2
    },
    diff (newVal) {
      let fixedTop = (newVal > 0 && newVal < TITLE_HEIGHT) ? newVal - TITLE_HEIGHT : 0
      if (this.fixedTop === fixedTop) { // 如果值没有改变，则不进行任何操作，优化页面渲染
        return
      }
      this.fixedTop = fixedTop
      this.$refs.fixed.style.transform = `translate3d(0,${fixedTop}px,0)`
    }
  },
  components: {
    Scroll,
    Loading
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
@import "~common/stylus/variable"

.listview
  position: relative
  width: 100%
  height: 100%
  overflow: hidden
  background: $color-background
  .list-group
    padding-bottom: 30px
    .list-group-title
      height: 30px
      line-height: 30px
      padding-left: 20px
      font-size: $font-size-small
      color: $color-text-l
      background: $color-highlight-background
    .list-group-item
      display: flex
      align-items: center
      padding: 20px 0 0 30px
      .avatar
        width: 50px
        height: 50px
        border-radius: 50%
      .name
        margin-left: 20px
        color: $color-text-l
        font-size: $font-size-medium
  .list-shortcut
    position: absolute
    z-index: 30
    right: 0
    top: 50%
    transform: translateY(-50%)
    width: 20px
    padding: 20px 0
    border-radius: 10px
    text-align: center
    background: $color-background-d
    font-family: Helvetica
    .item
      padding: 3px
      line-height: 1
      color: $color-text-l
      font-size: $font-size-small
      &.current
        color: $color-theme
  .list-fixed
    position: absolute
    top: 0
    left: 0
    width: 100%
    .fixed-title
      height: 30px
      line-height: 30px
      padding-left: 20px
      font-size: $font-size-small
      color: $color-text-l
      background: $color-highlight-background
  .loading-container
    position: absolute
    width: 100%
    top: 50%
    transform: translateY(-50%)
</style>
