import router from './router'
import ws from '../module/websocket'
import User from '../model/user'
import { Player } from '../model/player'
import { Room, RoomDetail } from '../model/room'
import prune from '../util/prune'
import { UNOMode } from '../uno/model/mode';
import * as UNO from '../uno'

// router.of('api')

interface IParamCreate {
  name?: string
  owner: string
  maxPlayers: number
  password?: string
  mode: UNOMode
  maxRounds?: number
  maxScore?: number
}

interface IReturnCreate extends RoomDetail { }

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
  return prune(detail, ['password'])
})

interface IParamJoin {
  playerId: string,
  roomId: string
}

interface IReturnJoin extends RoomDetail { }

router.on('room/join', async (packet: IParamJoin, socket): Promise<IReturnJoin> => {
  const { playerId, roomId } = packet

  const player = await Player.fetch(playerId)
  const room = await Room.fetch(roomId)

  await player.join(room.uid)
  await room.addPlayer(playerId)

  socket.join(room.uid)

  const detail = await room.populate()
  return prune(detail, ['password'])
})

interface IParamAddbot {
  roomId: string
}

interface IReturnAddbot extends RoomDetail { }

router.on('room/addbot', async (packet: IParamAddbot): Promise<IReturnAddbot> => {
  const { roomId } = packet

  const room = await Room.fetch(roomId)
  const ai = await Player.createAI()

  await room.addPlayer(ai.uid)
  await ai.join(roomId)

  const detail = await room.populate()
  return prune(detail, ['password'])
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

  // 最后一位玩家离开后销毁房间实例
  if (room.humanPlayerCount === 0) {
    UNO.destory(room.uid)
    await Room.remove(room.uid)
  }
})

interface IReturnList extends RoomDetail {
  mode: UNOMode
  maxRounds: number
  maxScore: number
  rounds: number
}

router.on('room/list', async (): Promise<IReturnList[]> => {
  // TODO: 取数的范围？
  const rooms = await Room.fetchRange(0, -1)

  const results = []
  for (const room of rooms) {
    const detail = await room.populate()
    const status = UNO.getStatus(room.uid)

    // TODO: 不应暴露字段实现至外侧
    results.push(Object.assign(prune(detail, ['password']), prune(status, ['rounds', 'scores'])))
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

interface IReturnUptate extends RoomDetail {
  mode: UNOMode
  maxRounds: number
  maxScore: number
}

router.on('room/update', async (packet: IParamUpdate): Promise<IReturnUptate> => {
  const { roomId, option } = packet

  const room = await Room.fetch(roomId)
  await room.update(option)

  const detail = await room.populate()
  const status = UNO.getStatus(roomId)

  // TODO: 不应暴露字段实现至外侧
  return Object.assign(prune(detail, ['password']), prune(status, ['rounds', 'scores']))
})
