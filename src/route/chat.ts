import router from './router'
import ws from '../module/websocket'
import { Player } from '../model/player'
import idGen from '../util/idgen'

interface IParamPrivateRequest {
  from: string
  to: string
}

interface IReturnPrivateRequest {
  from: Player
}

router.on('chat/privateRequest', async (packet: IParamPrivateRequest) => {
  const { from, to } = packet

  const source = await Player.fetch(from)
  const target = await Player.fetch(to)

  const request: IReturnPrivateRequest = { from: source }
  ws.to(target.socketId).emit('chat/request', request)
})

interface IParamPrivateAccept {
  from: string
}

router.on('chat/privateAccept', async (packet: IParamPrivateAccept, socket) => {
  const { from } = packet

  const source = await Player.fetch(from)
  const invitor = ws.of('/').connected[source.socketId]

  if (invitor === void 0) {
    throw new Error('私聊连接失败')
  } else {
    const chatId = idGen()

    invitor.join(chatId)
    socket.join(chatId)
    ws.to(chatId).emit('chat/established', chatId)
  }
})

interface IParamPrivateReject extends IParamPrivateAccept { }

router.on('chat/privateReject', async (packet: IParamPrivateReject) => {
  const { from } = packet

  const source = await Player.fetch(from)
  const invitor = ws.of('/').connected[source.socketId]

  ws.to(source.socketId).emit('chat/reject', )
})

interface IParamPrivateLeave {
  chatId: string
}

router.on('chat/privateLeave', async (packet: IParamPrivateLeave, socket) => {
  const { chatId } = packet

  socket.leave(chatId)
})
