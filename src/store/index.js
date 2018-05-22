/**
 * Created by Administrator on 2018/3/20.
 */
import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as getters from './getters'
import state from './state'
import mutations from './mutations'
import createLogger from 'vuex/dist/logger' // 每次修改mutation时，会在控制台打印日志

Vue.use(Vuex)
// npm run dev 是dev环境  npm run build 是production   线下模式令debug为true
const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  actions,
  getters,
  state,
  mutations,
  strict: debug,
  plugins: debug ? [createLogger()] : []
})
