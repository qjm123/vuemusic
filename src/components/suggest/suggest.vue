<template>
  <scroll class="suggest"
          :data="result"
          :pullup="pullup"
          :beforeScroll = "beforeScroll"
          @scrollToEnd="searchMore"
          @beforeScroll = "listScroll"
          ref="suggestScroll"
  >
    <ul class="suggest-list">
      <li @click="selectItem(item)" class="suggest-item" v-for="(item, index) in result" :key="index">
        <div class="icon">
          <i :class="getIconCls(item)"></i>
        </div>
        <div class="name">
          <p class="text" v-html="getDisplayName(item)"></p>
        </div>
      </li>
      <loading v-show="doSearching" title=""></loading>
    </ul>
    <div v-show="!hasMore && !result.length" class="no-result-wrapper">
      <no-result title="抱歉，暂无搜索结果"></no-result>
    </div>
  </scroll>
</template>

<script type="text/ecmascript-6">
import {search} from 'api/search'
import {ERR_OK} from 'api/config'
import {createSong} from 'common/js/song'
import Scroll from 'base/scroll/scroll'
import Loading from 'base/loading/loading'
import Singer from 'common/js/singer'
import {mapMutations, mapActions} from 'vuex'
import NoResult from 'base/no-result/no-result'

const TYPE_SINGER = 'singer' // 是否歌手数据
const PER_PAGE = 20 // 每页的数据

export default {
  props: {
    query: {
      type: String,
      default: ''
    },
    showSinger: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      page: 1,
      result: [],
      pullup: true, // 滚动是否向上拉刷新
      hasMore: true, // 判断有没有加载完的标志位
      doSearching: true, // 正在搜索
      beforeScroll: true // 确定监听开始滚动事件
    }
  },
  methods: {
    searchQuery () {
      this.hasMore = true
      this.doSearching = true
      this.page = 1
      this.$refs.suggestScroll.refresh()
      search(this.query, this.page, this.showSinger, PER_PAGE).then((res) => {
        if (res.code === ERR_OK) {
          this.result = this._genResult(res.data)
          this._checkMore(res.data)
          this.doSearching = false
        }
      })
    },
    searchMore () {
      if (!this.hasMore) {
        return
      }
      this.doSearching = true
      this.page++
      search(this.query, this.page, this.showSinger, PER_PAGE).then((res) => {
        if (res.code === ERR_OK) {
          this.result = this.result.concat(this._genResult(res.data))
          this._checkMore(res.data)
          this.doSearching = false
        }
      })
    },
    getIconCls (item) {
      if (item.type === TYPE_SINGER) {
        return 'icon-mine'
      } else {
        return 'icon-music'
      }
    },
    getDisplayName (item) {
      if (item.type === TYPE_SINGER) {
        return item.singername
      } else {
        return `${item.name}-${item.singer}`
      }
    },
    selectItem (item) {
      // 如果是歌手的话，则进入歌手详情页面
      if (item.type === TYPE_SINGER) {
        const singer = new Singer({
          id: item.singermid,
          name: item.singername
        })
        this.$router.push({
          path: `/search/${singer.id}`
        })
        this.setSinger(singer)
      } else { // 如果是歌曲的话，则插入这首歌曲
        this.insertSong(item)
      }
      // 将选取搜索的当前事件派发出去
      this.$emit('selectSearch')
    },
    refresh () {
      this.$refs.suggestScroll.refresh()
    },
    // 继续讲开始滚动前事件派发给search
    listScroll () {
      this.$emit('listScroll')
    },
    // 扩展对话服务 进行对象映射 mutation的修改映射成方法名
    ...mapMutations({
      setSinger: 'SET_SINGER'
    }),
    ...mapActions([
      'insertSong'
    ]),
    // 检查是否还有更多页
    _checkMore (data) {
      const song = data.song
      if (!song.list.length || (song.curnum + song.curpage * PER_PAGE) > song.totalnum) {
        this.hasMore = false
      }
    },
    // 对拿到的数据进行处理，其中可能包含 歌手数据和歌曲数据
    _genResult (data) {
      let ret = []
      if (data.zhida && data.zhida.singerid) {
        // 两个对象运算符合并到一个对象
        ret.push({...data.zhida, ...{type: TYPE_SINGER}})
      }
      if (data.song) {
        ret = ret.concat(this._normalizeSongs(data.song.list))
      }
      return ret
    },
    _normalizeSongs (list) {
      let ret = []
      list.forEach((musicData) => {
        if (musicData.songid && musicData.albummid) {
          ret.push(createSong(musicData))
        }
      })
      return ret
    }
  },
  watch: {
    query (newQuery) {
      this.searchQuery()
    }
  },
  components: {
    Scroll,
    Loading,
    NoResult
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .suggest
    height: 100%
    overflow: hidden
    .suggest-list
      padding: 0 30px
      .suggest-item
        display: flex
        align-items: center
        padding-bottom: 20px
      .icon
        flex: 0 0 30px
        width: 30px
        [class^="icon-"]
          font-size: 14px
          color: $color-text-d
      .name
        flex: 1
        font-size: $font-size-medium
        color: $color-text-d
        overflow: hidden
        .text
          no-wrap()
    .no-result-wrapper
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
