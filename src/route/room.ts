import router from './router'
import ws from '../module/websocket'
import User from '../model/user'
import { Player } from '../model/player'
import { Room, RoomDetail } from '../model/room'
import prune from '../util/prune'
import merge from '../util/merge';
import { UNOMode, UNOStatus } from '../uno/model/mode';
import * as UNO from '../uno'

// router.of('api')

function getRoomInfo(room: RoomDetail, status: UNOStatus) {
  // TODO: 不应暴露字段实现至外侧
  return prune(merge(room, status), ['password', 'scores'])
}

interface IParamCreate {
  name: string
  owner: string
  maxPlayers: number
  password?: string
  mode: UNOMode
  maxRounds?: number
  maxScore?: number
}

interface IReturnCreate extends RoomDetail, UNOStatus { }

router.on('room/create', async (packet: IParamCreate, socket): Promise<IReturnCreate> => {
  const player = await Player.fetch(packet.owner)
  const room = await Room.create(packet)

  await player.join(room.uid)
  await room.addPlayer(packet.owner)

  UNO.prepare(room.uid, {
    mode: packet.mode,
    maxScore: packet.maxScore,
    maxRounds: packet.maxRounds
  })

  socket.join(room.uid)

  const detail = await room.populate()
  const status = UNO.getStatus(room.uid)
  return getRoomInfo(detail, status)
})

interface IParamJoin {
  playerId: string,
  roomId: string,
  password: string,
}

interface IReturnJoin extends RoomDetail, UNOStatus { }

router.on('room/join', async (packet: IParamJoin, socket): Promise<IReturnJoin> => {
  const { playerId, roomId, password } = packet

  const player = await Player.fetch(playerId)
  const room = await Room.fetch(roomId)

  // TODO: 密码验证

  await player.join(room.uid)
  await room.addPlayer(playerId)

  socket.join(room.uid)

  const detail = await room.populate()
  const status = UNO.getStatus(room.uid)

  const info = getRoomInfo(detail, status)
  socket.to(room.uid).emit('room/update', info)
  return info
})

interface IParamAddbot {
  roomId: string
}

interface IReturnAddbot extends RoomDetail, UNOStatus { }

router.on('room/addbot', async (packet: IParamAddbot, socket): Promise<IReturnAddbot> => {
  const { roomId } = packet

  const room = await Room.fetch(roomId)
  if (room === void 0) throw new Error(`The room "${roomId}" not exist.`)

  const ai = await Player.createAI()
  await room.addPlayer(ai.uid)
  await ai.join(roomId)

  const detail = await room.populate()
  const status = UNO.getStatus(room.uid)

  const info = getRoomInfo(detail, status)
  socket.to(room.uid).emit('room/update', info)
  return info
})

interface IParamKick {
  roomId: string,
  playerId: string,
}

interface IReturnKick extends RoomDetail, UNOStatus { }

router.on('room/kick', async (packet: IParamKick, socket): Promise<IReturnKick> => {
  const { roomId, playerId: targetId } = packet

  const room = await Room.fetch(roomId)
  if (room === void 0) throw new Error(`The room "${roomId}" not exist.`)

  // TODO: 检测是否为房主的请求

  const target = await Player.fetch(targetId)
  if (target.isAi) {
    await Player.remove(targetId)
    await room.removePlayer(targetId)

    ws.to(roomId).emit('room/chat', `ai小姐姐“${target.name}”和房主分手了。`)
  } else {
    const targetSocket = ws.sockets[target.socketId]
    targetSocket.leave(room.uid)

    await target.leave()
    await room.removePlayer(targetId)

    targetSocket.emit('room/kicked')
    ws.to(roomId).emit('room/chat', `玩家“${target.name}”已被房主请出房间。`)
  }

  const detail = await room.populate()
  const status = UNO.getStatus(room.uid)

  const info = getRoomInfo(detail, status)
  socket.to(room.uid).emit('room/update', info)
  return info
})

interface IParamLeave {
  playerId: string,
  roomId: string
}

router.on('room/leave', async (packet: IParamLeave, socket) => {
  const { playerId, roomId } = packet

  const player = await Player.fetch(playerId)
  const room = await Room.fetch(roomId)

  socket.leave(room.uid)

  await player.leave()
  await room.removePlayer(playerId)

  // 如果房间里没有玩家，则执行清理步骤
  if (room.humanPlayerCount === 0) {
    // 清除游戏状态缓存
    UNO.destory(room.uid)

    // 给所有ai小姐姐放假
    for (const ai of room.players) {
      await Player.remove(ai)
    }

    // 销毁房间实例
    await Room.remove(room.uid)
  } else {
    const detail = await room.populate()
    const status = UNO.getStatus(room.uid)

    const info = getRoomInfo(detail, status)
    socket.to(room.uid).emit('room/update', info)
    return info
  }
})

interface IReturnList extends RoomDetail, UNOStatus { }

router.on('room/list', async (): Promise<IReturnList[]> => {
  // TODO: 取数的范围？
  const rooms = await Room.fetchRange(0, -1)

  const results = []
  for (const room of rooms) {
    const detail = await room.populate()
    const status = UNO.getStatus(room.uid)

    // TODO: 不应暴露字段实现至外侧
    results.push(getRoomInfo(detail, status))
  }

  return results
})

interface IParamUpdate {
  roomId: string,
  option: {
    name?: string
    maxPlayers?: number
    password?: string
    mode?: UNOMode
    maxRounds?: number
    maxScore?: number
  }
}

interface IReturnUptate extends RoomDetail, UNOStatus { }

router.on('room/update', async (packet: IParamUpdate, socket): Promise<IReturnUptate> => {
  const { roomId, option } = packet

  const room = await Room.fetch(roomId)
  await room.update(option)

  const detail = await room.populate()
  const status = UNO.getStatus(roomId)

  const info = getRoomInfo(detail, status)
  socket.to(room.uid).emit('room/update', info)
  return info
})
