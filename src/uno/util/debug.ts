import Chalk from 'chalk'
import { UNO } from '../uno'
import { PlayerProxy } from '../player'
import { Card, CardColor } from '../model/card'

function colorize(color: CardColor): string {
  if (color === CardColor.None) return Chalk.bgWhite(color)
  if (color === CardColor.Red) return Chalk.redBright.bgRedBright(color)
  if (color === CardColor.Yellow) return Chalk.yellowBright.bgYellowBright(color)
  if (color === CardColor.Green) return Chalk.greenBright.bgGreenBright(color)
  if (color === CardColor.Blue) return Chalk.blueBright.bgBlueBright(color)
}

/**
 * 服务器调试类
 * 
 * @export
 * @class Debug
 */
export default class Debug {
  /**
   * 打印当前状态
   * 
   * @static
   * @param {UNO} game UNO状态机
   * @param {PlayerProxy[]} players 当前玩家组
   * @memberof Debug
   */
  static printState(game: UNO, players: PlayerProxy[]) {
    const turns = `${game.turns}`.padEnd(3)

    const handNum = `${players.reduce((s, p) => s + p.cards.length, 0)}`.padEnd(3)
    const deckNum = `${game.deck.deckRemains}`.padEnd(3)
    const discardsNum = `${game.deck.discardsRemains}`.padEnd(3)
    const penaltyNum = `${game.penalty}`.padEnd(2)
    const sum = `${parseInt(handNum) + parseInt(deckNum) + parseInt(discardsNum)}`.padEnd(3)
    const pointer = `${game.pointer}`.padEnd(1)

    const d4 = game.d4 ? Chalk.greenBright('true ') : Chalk.redBright('false')
    const d2 = game.d2 ? Chalk.greenBright('true ') : Chalk.redBright('false')
    const color = colorize(game.color)
    const symbol = Chalk.bold(game.symbol)
    const action = Chalk.bold.bgWhite.black(game.action.padEnd(3))

    console.log(`No.${turns} Server[${handNum}][${deckNum}][${discardsNum}][${sum}][${penaltyNum}] @[${pointer}] State[Color: ${color}, Symbol: ${symbol}, +2: ${d2}, +4: ${d4} ] Action[${action}]`)
  }

  /**
   * 打印玩家当前状态
   * 
   * @static
   * @param {Card[]} deals 当前玩家的出牌
   * @param {PlayerProxy} player 当前玩家实例
   * @param {number} pointer 当前玩家在玩家组中的索引
   * @memberof Debug
   */
  static printPlayerDeal(deals: Card[], player: PlayerProxy, pointer: number) {
    const card = deals[0]
    const handNum = `${player.cards.length}`.padEnd(3)
    const head = `Player@${pointer}  [${handNum}]`.padStart(42)
    const handCards = player.cards.reduce((s, c) => `${s + c.toAbbr()}, `, '')

    console.log(Chalk.bgBlackBright(`${head}: ${card.toString()} * ${deals.length} [${handCards}]`))
  }
}