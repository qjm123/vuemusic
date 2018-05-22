<template>
  <div class="search">
    <!--搜索输入框-->
    <div class="search-box-wrapper">
      <search-box ref="searchBox" @query="onQueryChange"></search-box>
    </div>
    <div class="shortcut-wrapper" v-show="!query" ref="shortcutWrapper">
      <scroll class="shortcut" :data="shortcut" ref="shortcut">
        <div>
          <!--热门搜索关键词区域选择-->
          <div class="hot-key">
            <h1 class="title">热门搜索</h1>
            <ul>
              <li @click="addQuery(item.k)" class="item" v-for="(item, index) in hotKey" :key="index">
                <span>{{item.k}}</span>
              </li>
            </ul>
          </div>
          <!--搜索历史-->
          <div class="search-history" v-show="searchHistory.length">
            <h1 class="title">
              <span class="text">搜索历史</span>
              <span class="clear" @click="showConfirm">
              <i class="icon-clear"></i>
            </span>
            </h1>
            <search-list @selectSearchItem="addQuery" @deleteSearchItem="deleteOne" :searches="searchHistory"></search-list>
          </div>
        </div>
      </scroll>
    </div>
    <div class="search-result" v-show="query" ref="searchResult">
      <suggest @selectSearch="saveSearch"
               :query="query"
               @listScroll="blurInput"
               ref="suggest"
      ></suggest>
    </div>
    <confirm text="是否清空所有搜索历史"
             confirmBtnText="清空"
             ref="confirm"
             @confirm="clearSearchHistory"
    ></confirm>
    <router-view></router-view>
  </div>
</template>

<script type="text/ecmascript-6">
import SearchBox from 'base/search-box/search-box'
import {getHotKey} from 'api/search'
import {ERR_OK} from 'api/config'
import Suggest from 'components/suggest/suggest'
import {playlistMixin, searchMixin} from 'common/js/mixin'
import SearchList from 'base/search-list/search-list'
import {mapActions} from 'vuex'
import Confirm from 'base/confirm/confirm'
import Scroll from 'base/scroll/scroll'

export default {
  mixins: [playlistMixin, searchMixin],
  data () {
    return {
      hotKey: []
    }
  },
  created () {
    // 获取热门关键词方法
    this._getHotKey()
  },
  computed: {
    shortcut () {
      console.log(this.hotKey.concat(this.searchHistory))
      return this.hotKey.concat(this.searchHistory)
    }
  },
  methods: {
    // 覆盖mixin.js下的handlePlaylist方法
    handlePlaylist (playlist) {
      const bottom = playlist.length > 0 ? '60px' : ''
      this.$refs.shortcutWrapper.style.bottom = bottom
      this.$refs.searchResult.style.bottom = bottom

      this.$refs.shortcut.refresh()
      this.$refs.suggest.refresh()
    },
    // 获取子页面牌发过来的删除事件，并通过actions进行删除
    deleteOne (item) {
      this.deleteSearchHistory(item)
    },
    // 删除所有搜索历史
    // deleteAllSearch () {
    //   this.clearSearchHistory()
    // },
    showConfirm () {
      this.$refs.confirm.show()
    },
    // 获取热门关键词方法
    _getHotKey () {
      getHotKey().then((res) => {
        if (res.code === ERR_OK) {
          this.hotKey = res.data.hotkey.slice(0, 10)
        }
      })
    },
    ...mapActions([
      'clearSearchHistory'
    ])
  },
  watch: {
    query (newQuery) {
      if (!newQuery) {
        setTimeout(() => {
          this.$refs.shortcut.refresh()
        }, 20)
      }
    }
  },
  components: {
    SearchBox,
    Suggest,
    SearchList,
    Confirm,
    Scroll
  }
}
</script>

<style lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .search
    .search-box-wrapper
      margin: 20px
    .shortcut-wrapper
      position: fixed
      top: 178px
      bottom: 0
      width: 100%
      .shortcut
        height: 100%
        overflow: hidden
        .hot-key
          margin: 0 20px 20px 20px
          .title
            margin-bottom: 20px
            font-size: $font-size-medium
            color: $color-text-l
          .item
            display: inline-block
            padding: 5px 10px
            margin: 0 20px 10px 0
            border-radius: 6px
            background: $color-highlight-background
            font-size: $font-size-medium
            color: $color-text-d
        .search-history
          position: relative
          margin: 0 20px
          .title
            display: flex
            align-items: center
            height: 40px
            font-size: $font-size-medium
            color: $color-text-l
            .text
              flex: 1
            .clear
              extend-click()
              .icon-clear
                font-size: $font-size-medium
                color: $color-text-d
    .search-result
      position: fixed
      width: 100%
      top: 178px
      bottom: 0
</style>
