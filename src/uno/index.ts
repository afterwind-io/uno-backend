import { Player } from '../model/player'
import { UNO, UNOAction } from './uno'
import { Card, CardColor, CardSymbol } from './model/card'
import { PlayerProxy } from './player'
import Debug from './util/debug'
import { UNOStatus, UNOMode, UNOStatusOption } from './model/mode'

interface UNOPlayerSnapshot {
  name: string;
  avatar: string;
  lastDeal: Card;
  remains: number;
  score: number;
}

interface UNOSnapshot {
  color: CardColor
  symbol: CardSymbol
  d2: boolean
  d4: boolean
  lastCards: Card[]
  pointer: number
  penaltyCount: number
  action: UNOAction
  turns: number
  direction: number
  players: UNOPlayerSnapshot[]
}

interface UNOReport {
  action: 'ready' | 'pick' | 'penalty' | 'update' | 'end'
  cards?: Card[]
  snapshot?: UNOSnapshot
  playerHands?: { socketId: string, cards: Card[] }[]
}

interface UNODetail {
  game: UNO,
  players: PlayerProxy[],
  status: UNOStatus
}

// 牌局缓存
const gameTable: { [roomUid: string]: UNODetail } = Object.create(null)

// 最大连续出牌轮次
const MAX_TURNS = 1000

function getSnapshot(game: UNO, players: PlayerProxy[]): UNOSnapshot {
  return {
    color: game.color,
    symbol: game.symbol,
    d2: game.d2,
    d4: game.d4,
    lastCards: game.lastCards,
    pointer: game.pointer,
    penaltyCount: game.penalty,
    action: game.action,
    turns: game.turns,
    direction: game.direction,
    players: players.map(proxy => ({
      name: proxy.player.name,
      avatar: proxy.player.avatar,
      lastDeal: proxy.lastDeal,
      remains: proxy.remains,
      score: proxy.score
    }))
  }
}

export function prepare(roomUid: string, option: UNOStatusOption) {
  gameTable[roomUid] = { status: new UNOStatus(option) } as UNODetail
}

export function destory(roomUid: string) {
  delete gameTable[roomUid]
}

export function getStatus(roomUid: string): UNOStatus {
  return gameTable[roomUid].status
}

/**
 * 开始游戏状态循环
 * 
 * @export
 * @param {string} roomId 房间uid
 * @param {Player[]} players 参与的玩家实例
 * @returns {AsyncIterableIterator<UNOSnapshot>} 返回当前游戏状态快照的异步迭代器
 */
export async function* loop(roomId: string, players: Player[]): AsyncIterableIterator<UNOReport> {
  // 初始化玩家代理实例
  const unoPlayers = players.map(player => new PlayerProxy(player))

  // 读取预初始化牌局状态实例
  const status = gameTable[roomId].status

  // 初始化分数表
  status.init(unoPlayers)

  // 缓存玩家状态快照
  Object.assign(gameTable[roomId], { players: unoPlayers })

  yield { action: 'ready' }

  // 开始游戏循环
  while (!status.hasFinished) {
    // TODO: 应有专门的log
    console.error(status.rounds + ' ', ...Object.keys(status.scores).map(key => key + ' ' + status.scores[key] + ', '))

    // 初始化游戏状态机
    const game = new UNO(unoPlayers.length)

    // 缓存游戏状态机
    Object.assign(gameTable[roomId], { game })

    // 发牌
    unoPlayers.forEach(player => {
      player.reset()
      player.pick(game.pick(7))
    })
    yield { action: 'pick', playerHands: unoPlayers.map(proxy => ({ socketId: proxy.player.socketId, cards: proxy.cards })) }

    // 初始抽牌
    game.call(game.pick())

    // 开始单局状态循环
    while (game.turns < MAX_TURNS) {
      // TODO: 应有专门的log
      Debug.printState(game, unoPlayers)

      // 如果当前指令为抽取罚牌，
      // 则抽取指定数量的罚牌进入缓冲区
      const penalties = game.action === UNOAction.TakePenalty
        ? game.pick(game.penalty)
        : []

      // 读取当前玩家实例
      const currentPlayer = unoPlayers[game.pointer]

      // 向接受罚牌的玩家发送罚牌信息
      yield { action: 'penalty', playerHands: [{ socketId: currentPlayer.player.socketId, cards: penalties }] }

      // 向房间广播当前状态
      yield { action: 'update', snapshot: getSnapshot(game, unoPlayers) }

      // HACK: 状态广播后，如果当前玩家为非ai托管，
      // 则其出牌信息将经过ws路由，通过下方的call方法，
      // resolve当前currentPlayer的think返回的promise，
      // 从而异步衔接上循环

      // 异步等待PlayerProxy的返回出牌信息
      const deals = await currentPlayer.think(
        game.action,
        game.color,
        game.symbol,
        game.d2,
        game.d4,
        currentPlayer.cards,
        penalties
      )

      // TODO: 应有专门的log
      Debug.printPlayerDeal(deals, currentPlayer, game.pointer)

      // 如果当前玩家手牌全部出完，循环结束...
      if (currentPlayer.cards.length === 0) break

      // ...否则将当前玩家的出牌推入状态机，进行下一循环
      game.call(deals)
    }

    // 单局结束后结算分数并更新牌局状态
    const winner = unoPlayers[game.pointer]
    status.settleup(winner, unoPlayers)

    // TODO
    yield { action: 'end' }
  }

  // TODO: 应有专门的log
  console.error(status.rounds + ' ', ...Object.keys(status.scores).map(key => key + ' ' + status.scores[key] + ', '))
}

/**
 * 出牌
 * 
 * @export
 * @param {string} roomId 房间uid
 * @param {Card[]} deals 使出的手牌
 */
export function deal(roomId: string, deals: Card[]) {
  const cache = gameTable[roomId]
  if (!cache) return

  const { game, players } = cache
  const currentPlayer = players[game.pointer]

  currentPlayer.deal(deals)
}
