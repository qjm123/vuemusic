<template>
  <div class="progress-bar" ref="progressBar" @click="progressClick">
    <div class="bar-inner">
      <div class="progress" ref="progress"></div>
      <div class="progress-btn-wrapper" ref="progressBtn"
            @touchstart.prevent="progressTouchStart"
            @touchmove.prevent="progressTouchMove"
            @touchend="progressTouchEnd"
      >
        <div class="progress-btn"></div>
      </div>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
import {prefixStyle} from 'common/js/dom'

const progressBtnWidth = 16 // 进度条小按钮宽度
const transform = prefixStyle('transform')

export default {
  data () {
    return {
      barWidth: 0
    }
  },
  props: {
    percent: { // 进度条宽度百分比
      type: Number,
      default: 0
    }
  },
  created () {
    this.touch = {}
  },
  methods: {
    progressTouchStart (e) { // 手指触摸时
      this.touch.initiated = true // 定义一个标志位，表明已经初始化
      this.touch.startX = e.touches[0].pageX // 手指第一次触摸的横坐标
      this.touch.left = this.$refs.progress.clientWidth // 此时手指距离最做端的距离
    },
    progressTouchMove (e) { // 手指移动时
      if (!this.touch.initiated) {
        return
      }
      const deltaX = e.touches[0].pageX - this.touch.startX // 偏移距离 = 手指移动时的坐标 - 初始坐标
      const offsetWidth = Math.min(
        this.barWidth,
        Math.max(0, this.touch.left + deltaX)
      )
      this._offset(offsetWidth)
    },
    progressTouchEnd () { // 手指离开时
      this.touch.initiated = false // 将初始化状态 恢复为 false
      this._triggerPercent()
    },
    progressClick (e) { // 给进度条绑定一个点击事件
      // 当我们点击progressBtn的时候，e.offsetX获取不对
      // this._offset(e.offsetX) // 改变视图
      // getBoundingClientRect为元素边到视图边的距离
      const rect = this.$refs.progressBar.getBoundingClientRect()
      const offsetWidth = Math.min(this.barWidth, e.pageX - rect.left)
      this._offset(offsetWidth)
      this._triggerPercent() // 通知外层，派发事件
    },
    _triggerPercent () { // 通知外层： 定义一个公共方法 用来获得 进度条宽度 和计算 当前占总时间的百分比 并派发出去
      const percent = Math.min(this.$refs.progress.clientWidth / this.barWidth, 1)
      this.$emit('percentChange', percent)
    },
    _offset (offsetWidth) { // 改变视图： 接受偏移量，并绑定到视图上，同时给小按钮添加css3 动画，令其自动移动
      this.$refs.progress.style.width = `${offsetWidth}px`
      this.$refs.progressBtn.style[transform] = `translate3d(${offsetWidth}px,0,0)`
    }
  },
  watch: {
    percent (newPercent) { // 监听百分比的变化
      newPercent = Math.min(newPercent, 1)
      this.barWidth = this.$refs.progressBar.clientWidth - progressBtnWidth
      // 当percent>0 且 不是出于拖动时
      if (newPercent >= 0 && !this.touch.initiated) {
        const offsetWidth = newPercent * this.barWidth
        this._offset(offsetWidth)
      }
    }
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"

  .progress-bar
    height: 30px
    .bar-inner
      position: relative
      top: 13px
      height: 4px
      background: rgba(0, 0, 0, 0.3)
      .progress
        position: absolute
        height: 100%
        background: $color-theme
      .progress-btn-wrapper
        position: absolute
        left: -8px
        top: -13px
        width: 30px
        height: 30px
        .progress-btn
          position: relative
          top: 7px
          left: 7px
          box-sizing: border-box
          width: 16px
          height: 16px
          border: 3px solid $color-text
          border-radius: 50%
          background: $color-theme
</style>
