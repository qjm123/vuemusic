const express = require('express')
const config = require('./config/index')
const axios = require('axios')

const app = express()
const apiRoutes = express.Router()


// 获取热门歌单推荐
apiRoutes.get('/getDiscList', function (req, res){
  let url = 'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg'
  axios.get(url, {
    headers: {
      referer: 'https://c.y.qq.com/',
      host: 'c.y.qq.com'
    },
    params: req.query
  }).then((response) => {
    res.json(response.data)
  }).catch((e) => {
    console.log(e)
  })
})
// 获取歌曲地址
apiRoutes.get('/getSongUrlParams', function (req, res) {
  let url = 'https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg'
  axios.get(url, {
    headers: {
      referer: 'https://y.qq.com/portal/player.html',
      authority: 'c.y.qq.com'
    },
    params: req.query
  }).then((response) => {
    res.json(response.data)
  }).catch((e) => {
    console.log(e)
  })
})
// 获取歌词内容 base64编码的
apiRoutes.get('/lyric', function (req, res) {
  let url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg'
  axios.get(url, {
    headers: {
      referer: 'https://y.qq.com/portal/player.html',
      authority: 'c.y.qq.com'
    },
    params: req.query
  }).then((response) => {
    let ret = response.data
    if (typeof ret === 'string') {
      let reg = /^\w+\(({[^()]+})\)$/
      let matches = ret.match(reg)
      if(matches){
        ret = JSON.parse(matches[1])
      }
    }
    res.json(ret)
  }).catch((e) => {
    console.log(e)
  })
})
// 获取推荐详情
apiRoutes.get('/getDiscSongList', function (req, res) {
  let url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg'
  console.log(`https://y.qq.com/n/yqq/playlist/${req.query.disstid}.html`)
  axios.get(url, {
    headers: {
      referer: `https://y.qq.com/n/yqq/playlist/${req.query.disstid}.html`,
      authority: 'c.y.qq.com'
    },
    params: req.query
  }).then((response) => {
    let ret = response.data
    if (typeof ret === 'string') {
      // 去掉jsonpcallback回调函数字符串： jsonpcallback(...),保留内部json字符串，再转换成json对象
      let reg = /^\w+\((.*)\)$/
      let matches = ret.match(reg)
      if(matches){
        ret = JSON.parse(matches[1])
      }
    }
    res.json(ret)
  }).catch((e) => {
    console.log(e)
  })
})

app.use('/api', apiRoutes)

app.use(express.static('./dist'))

const port = process.env.PORT || config.build.port

module.exports = app.listen(port, function(err){
  if(err){
    console.log(err)
    return
  }
  console.log('Listening at http://localhost:'+port+'\n')
})



