import { Card, CardColor, CardSymbol } from './model/card'
import { Player } from '../model/player'
import AIchan from './ai'
import { UNOAction } from './uno'

export class PlayerProxy {
  player: Player
  lastDeal: Card
  cards: Card[] = []
  handler: (deals: Card[]) => void

  constructor(player: Player) {
    this.player = player
  }

  get remains(): number {
    return this.cards.length
  }

  get score(): number {
    return this.cards.reduce((sum, card) => sum + card.score, 0)
  }

  reset() {
    this.cards = []
  }

  async think(
    action: UNOAction,
    color: CardColor,
    symbol: CardSymbol,
    d2: boolean,
    d4: boolean,
    cards: Card[],
    penalties: Card[]
  ): Promise<Card[]> {
    this.pick(penalties)

    if (this.player.type === 'ai') {
      const deals = AIchan.think(
        action,
        color,
        symbol,
        d2,
        d4,
        cards,
        penalties
      )

      this.lastDeal = deals[0]
      this.toss(deals)
      return deals
    } else {
      return new Promise<Card[]>((resolve) => {
        this.handler = resolve
      })
    }
  }

  deal(deals: Card[]) {
    this.lastDeal = deals[0]
    this.toss(deals)

    this.handler(deals)
    this.handler = null
  }

  pick(cards: Card[]) {
    this.cards.push(...cards)
  }

  private toss(discards: Card[]) {
    discards.forEach(discard => {
      const index = this.cards.findIndex(card => card.isSameCard(discard))
      index !== -1 && this.cards.splice(index, 1);
    })
  }
}