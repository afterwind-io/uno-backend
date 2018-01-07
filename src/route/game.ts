import router from './router'
import ws from '../module/websocket'
import User from '../model/user'
import { Match } from '../model/match'
import { Player } from '../model/player'
import { Room } from '../model/room'
import * as UNO from '../uno'
import { Card } from '../uno/model/card'

// router.of('api')

interface IPramStart {
  roomId: string
}

router.on('game/start', async (packet: IPramStart, socket) => {
  const { roomId } = packet

  const room = await Room.fetch(roomId)

  const players = []
  // for (let index = 0; index < room.players.length; index++) {
  //   const uid = room.players[index]
  //   const player = await Player.fetch(uid)
  //   players.push(player)
  // }

  // TEST
  for (let index = 0; index < 6; index++) {
    const player = await Player.createAI()
    players.push(player)
  }

  for await (const report of UNO.loop(roomId, players)) {
    // TODO
    if (report.action === 'ready') {
      ws.to(roomId).emit('game/ready')
    }

    // 初始抽牌
    if (report.action === 'pick') {
      report.playerHands.forEach(player => {
        ws.to(player.socketId).emit('game/pick', player.cards)
      })
    }

    // 发放罚牌
    if (report.action === 'penalty') {
      // const socketId = report.snapshot.currentPlayer.player.socketId
      // ws.to(socketId).emit('game/penalty', report.cards)
    }

    if (report.action === 'update') {
      ws.to(roomId).emit('game/update', report.snapshot)
    }

    if (report.action === 'end') {
      ws.to(roomId).emit('game/end', report)
    }
  }
})

interface IPramCall {
  roomId: string,
  deals: Card[]
}

router.on('game/deal', async (packet: IPramCall) => {
  const { roomId, deals } = packet

  UNO.deal(roomId, deals)
})

interface IParamMatch {
  uid: string
}

router.on('game/match/join', async (packet: IParamMatch) => {
  const { uid } = packet

  const match = new Match()
  await match.queue(uid)

  const playerUids = await match.getPlayerIds()
  const players = await Player.fetchMulti(playerUids)

  // TODO
  const event = match.isMatchFull ? 'game/matchStatus' : 'game/matchReady'
  players
    .map(player => player.socketId)
    .forEach(socketId => ws.to(socketId).emit(event, { members: players.length }))
})

router.on('game/match/abort', async (packet) => {

})
