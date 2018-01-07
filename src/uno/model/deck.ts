import CardPile from './pile'
import { Card } from './card'

/**
 * 数组随机化(Fisher–Yates shuffle)
 * https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 * 
 * @template T 数组元素类型
 * @param {T[]} arr 需要随机化的数组
 * @returns {T[]} 包含随机排列后的原数组元素的新数组
 */
function shuffle<T>(arr: T[]): T[] {
  const results = [...arr]

  let length: number = results.length
  let cache: T
  do {
    const m = Math.floor(Math.random() * (results.length))

    cache = results[m]
    results[m] = results[length - 1]
    results[length - 1] = cache
  } while (length-- > 1)

  return results
}

/**
 * 牌组实例
 * 
 * @export
 * @class Deck
 */
export class Deck {
  private deck: Card[]
  private discards: Card[]

  constructor() {
    this.reset()
  }

  /**
   * 抽牌堆剩余张数
   * 
   * @readonly
   * @type {number}
   * @memberof Deck
   */
  get deckRemains(): number {
    return this.deck.length
  }

  /**
   * 废牌堆剩余张数
   * 
   * @readonly
   * @type {number}
   * @memberof Deck
   */
  get discardsRemains(): number {
    return this.discards.length
  }

  /**
   * 重置牌堆
   * 
   * @memberof Deck
   */
  public reset() {
    this.deck = shuffle(CardPile)
    this.discards = []
  }

  /**
   * 抽牌
   * 
   * @param {number} [number=1] 抽牌数量
   * @returns {Card[]} 指定张数的牌
   * @memberof Deck
   */
  public pick(number: number = 1): Card[] {
    if (this.deck.length < number) {
      this.deck = shuffle([...this.deck, ...this.discards])
      this.discards = []
    }

    return this.deck.splice(0, number)
  }

  /**
   * 弃牌
   * 
   * @param {Card[]} cards 需要放回弃牌堆的牌
   * @memberof Deck
   */
  public toss(cards: Card[]) {
    cards[0].isEntityCard && this.discards.push(...cards)
  }
}