const Koa = require('koa')
const fstatic = require('koa-static')
require('./route')

const app = new Koa()
app.use(fstatic('static'))

app.listen(10086)
