import * as CONFIG from '../config'
import websocket from '../module/websocket'
import WSRouter from '../lib/wsrouter'
import logger from '../lib/wsrouter/middlewares/wsrouter.logger'
import resWrapper from '../lib/wsrouter/middlewares/wsrouter.response'
import jwtVerify from '../lib/wsrouter/middlewares/wsrouter.jwt'

const wsrouter = new WSRouter(websocket)

wsrouter.use(logger)
wsrouter.use(resWrapper)
wsrouter.use(jwtVerify({
  secret: CONFIG.secret,
  excludes: ['Knock Knock', 'user/register', 'user/login']
}))

export default wsrouter
