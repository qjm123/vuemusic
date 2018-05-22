import 'babel-polyfill'
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store' // 引入vuex相关组件js
import fastclick from 'fastclick' // 引入快速点击组件，手机屏幕触摸会有3s间隔
import VueLazyLoad from 'vue-lazyload' // 引入懒加载组件

import 'common/stylus/index.styl'

/* eslint-disable no-unused-vars */
import vConsole from 'vconsole'

fastclick.attach(document.body)
// hack for global nextTick
/*
function noop () {
}

window.MessageChannel = noop
window.setImmediate = noop
*/

Vue.use(VueLazyLoad, {
  loading: require('common/image/default.png')
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App),
  store,
  router
})
