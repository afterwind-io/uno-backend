import { Card, CardColor, CardSymbol, VirtualCardSymbol } from './model/card'
import { Deck } from './model/deck'

const _ = null

export const enum UNOAction {
  Continue = 'continue',
  CallColor = 'callColor',
  ReturnPenalty = 'returnPenalty',
  TakePenalty = 'takePenalty',
  Challenge = 'challenge',
  Skipped = 'skipped'
}

/**
 * UNO游戏状态机
 * 
 * @export
 * @class UNO
 */
export class UNO {
  public readonly deck: Deck = new Deck()
  public readonly playerCount: number

  public color: CardColor = CardColor.None
  public symbol: CardSymbol = CardSymbol.None
  public action: UNOAction
  public d2: boolean = false
  public d4: boolean = false

  public lastCards: Card[] = []
  public turns: number = -1
  public pointer: number = 0
  public penalty: number = 1
  public direction: number = 1
  private d4ColorCallerPtr: number = 0
  private d4NextPlayerPtr: number = 0

  constructor(playerCount: number) {
    this.playerCount = playerCount
  }

  pick(number: number = 1): Card[] {
    return this.deck.pick(number)
  }

  call(cards: Card[]) {
    this.pushState(cards[0])

    this.deck.toss(cards)

    this.lastCards = cards
    this.turns++
  }

  private pushState(card: Card) {
    switch (card.symbol) {
      case VirtualCardSymbol.PenaltyBack:
        this.setAction(UNOAction.ReturnPenalty)
        this.clearPenalty()
        break
      case VirtualCardSymbol.PenaltyOver:
        this.setAction(this.d4 ? UNOAction.CallColor : UNOAction.Continue)
        this.setState(null, null, false, null)
        this.d4
          ? this.pointer = this.d4ColorCallerPtr
          : this.pointer = this.movePointer()
        this.clearPenalty()
        break
      case VirtualCardSymbol.Pass:
        this.setAction(UNOAction.TakePenalty)
        break
      case VirtualCardSymbol.Skipped:
        this.setAction(UNOAction.Continue)
        this.pointer = this.movePointer()
        break
      case VirtualCardSymbol.PickColor:
        this.setAction(UNOAction.Continue)
        // this.d4
        //   ? this.pointer = this.d4NextPlayerPtr
        //   : this.pointer = this.movePointer()
        this.pointer = this.movePointer()

        // HACK: must clear d4 state after pointer moved
        this.setState(card.color, null, null, false)
        break
      case VirtualCardSymbol.Challenge:
        this.setAction(UNOAction.Challenge)
        this.pointer = this.movePointer(-1)
        break
      case VirtualCardSymbol.ChallengeSucceed:
        this.setAction(UNOAction.TakePenalty)
        this.d4NextPlayerPtr = this.movePointer()
        break
      case VirtualCardSymbol.ChallengeFailed:
        this.setAction(UNOAction.TakePenalty)
        this.addPenalty(2)
        this.d4NextPlayerPtr = this.movePointer(2)
        this.pointer = this.movePointer()
        break
      case CardSymbol.Reverse:
        this.setAction(UNOAction.Continue)
        this.setState(card.color, card.symbol, null, null)
        this.reverseDirection()
        this.pointer = this.movePointer()
        break
      case CardSymbol.Skip:
        this.setAction(UNOAction.Skipped)
        this.setState(card.color, card.symbol, null, null)
        this.pointer = this.movePointer()
        break
      case CardSymbol.Draw2:
        this.setAction(UNOAction.Continue)
        this.setState(card.color, card.symbol, true, false)
        this.addPenalty(2)
        this.pointer = this.movePointer()
        break
      case CardSymbol.Wild:
        this.setAction(UNOAction.CallColor)
        break
      case CardSymbol.Draw4:
        this.setAction(UNOAction.Continue)
        this.setState(null, card.symbol, false, true)
        this.addPenalty(4)
        this.d4ColorCallerPtr = this.pointer
        this.d4NextPlayerPtr = this.movePointer(2)
        this.pointer = this.movePointer()
        break
      default:
        this.setAction(UNOAction.Continue)
        this.setState(card.color, card.symbol, false, false)
        this.pointer = this.movePointer()
        break;
    }
  }

  private setState(color: CardColor, symbol: CardSymbol, d2: boolean, d4: boolean) {
    if (color !== _) this.color = color
    if (symbol !== _) this.symbol = symbol
    if (d2 !== _) this.d2 = d2
    if (d4 !== _) this.d4 = d4
  }

  private setAction(action: UNOAction) {
    this.action = action
  }

  private addPenalty(number: number) {
    if (this.penalty === 1) {
      // HACK: penalty为1，说明此时累计罚牌计数实际为空
      // （为正常摸牌使用，详见clearPenalty说明）
      // 计数值应直接设置为需要累加的张数
      this.penalty = number
    } else {
      this.penalty += number
    }
  }

  private clearPenalty() {
    // HACK: penalty最小值应始终为1，
    // 因为当action为Continue时（非罚牌下正常接牌），
    // 无牌可出需要摸牌1张
    this.penalty = 1
  }

  private movePointer(step: number = 1) {
    return (this.pointer + this.direction * step + this.playerCount) % this.playerCount
  }

  private reverseDirection() {
    this.direction *= -1
  }
}