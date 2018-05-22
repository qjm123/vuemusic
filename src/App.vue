<template>
  <div id="app">
    <!--头部-->
    <m-header></m-header>
    <!--标签-->
    <tab></tab>
    <!--支持路由内缓存-->
    <keep-alive>
      <!--标签操作路由-->
      <router-view></router-view>
    </keep-alive>
    <!--播放器路由-->
    <player></player>
  </div>
</template>

<script type="text/ecmascript-6">
import MHeader from 'components/m-header/m-header'
import Tab from 'components/tab/tab'
import Player from 'components/player/player'

export default {
  components: {
    MHeader,
    Tab,
    Player
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
</style>
