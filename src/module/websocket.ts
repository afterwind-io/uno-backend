import * as CONFIG from '../config'
import * as Socket from 'socket.io'

export default Socket(CONFIG.port.websocket)