/**
 * 标识牌面的颜色
 * 
 * @export
 * @enum {string}
 */
export const enum CardColor {
  /**
   * 空值
   */
  None = '_',

  /**
   * 红色
   */
  Red = 'r',

  /**
   * 绿色
   */
  Green = 'g',

  /**
   * 蓝色
   */
  Blue = 'b',

  /**
   * 黄色
   */
  Yellow = 'y',
}

/**
 * 标识牌面内容的符号
 * 
 * @export
 * @enum {string}
 */
export const enum CardSymbol {
  /**
   * 空值
   */
  None = 'none',

  /**
   * 数字0
   */
  c0 = '0',

  /**
   * 数字1
   */
  c1 = '1',

  /**
   * 数字2
   */
  c2 = '2',

  /**
   * 数字3
   */
  c3 = '3',

  /**
   * 数字4
   */
  c4 = '4',

  /**
   * 数字5
   */
  c5 = '5',

  /**
   * 数字6
   */
  c6 = '6',

  /**
   * 数字7
   */
  c7 = '7',

  /**
   * 数字8
   */
  c8 = '8',

  /**
   * 数字9
   */
  c9 = '9',

  /**
   * 反转
   */
  Reverse = 'R',

  /**
   * 跳过
   */
  Skip = 'S',

  /**
   * 换色
   */
  Wild = 'W',

  /**
   * +2
   */
  Draw2 = 'T',

  /**
   * +4
   */
  Draw4 = 'F',
}

/**
 * 用于标识特殊指令的虚拟符号
 * 
 * @export
 * @enum {string}
 */
export const enum VirtualCardSymbol {
  /**
   * 返回罚牌（被罚牌后立即出罚牌）
   */
  PenaltyBack = 'pnb',

  /**
   * 罚牌阶段结束（被罚牌后返回）
   */
  PenaltyOver = 'pno',

  /**
   * 弃权（无牌可出/故意放弃/下家d4挑战成功 => 罚摸）
   */
  Pass = 'pas',

  /**
   * 被跳过（上家出禁牌/下家d4挑战失败）
   */
  Skipped = 'skp',

  /**
   * 换色（响应换色牌）
   */
  PickColor = 'clr',

  /**
   * 挑战d4
   */
  Challenge = 'clg',

  /**
   * d4挑战成功
   */
  ChallengeSucceed = 'cgs',

  /**
   * d4挑战失败
   */
  ChallengeFailed = 'cgf',
}

/**
 * 牌面分值表
 */
const CARD_SCORE_TABLE = {
  [CardSymbol.c0]: 0,
  [CardSymbol.c1]: 1,
  [CardSymbol.c2]: 2,
  [CardSymbol.c3]: 3,
  [CardSymbol.c4]: 4,
  [CardSymbol.c5]: 5,
  [CardSymbol.c6]: 6,
  [CardSymbol.c7]: 7,
  [CardSymbol.c8]: 8,
  [CardSymbol.c9]: 9,
  [CardSymbol.Reverse]: 20,
  [CardSymbol.Skip]: 20,
  [CardSymbol.Draw2]: 20,
  [CardSymbol.Wild]: 50,
  [CardSymbol.Draw4]: 50,
}

/**
 * 判断指定牌面符号是否代表功能牌
 * 
 * @param {CardSymbol | VirtualCardSymbol} symbol 牌面符号
 * @returns 判断结果
 */
function isActionCard(symbol: CardSymbol | VirtualCardSymbol) {
  // HACK: 既然功能牌的分值都>=20...
  return CARD_SCORE_TABLE[symbol] > 10
}

/**
 * 卡牌实体类
 * 
 * @export
 * @class Card
 */
export class Card {
  /**
   * 牌面颜色
   * 
   * @type {CardColor}
   * @memberof Card
   */
  public readonly color: CardColor

  /**
   * 牌面符号
   * 
   * @type {(CardSymbol | VirtualCardSymbol)}
   * @memberof Card
   */
  public readonly symbol: CardSymbol | VirtualCardSymbol

  /**
   * 创建一张代表VirtualCardSymbol.PickColor的牌
   * 
   * PickColor: 换色（响应换色牌）
   * 
   * @param {CardColor} color 要更换的颜色
   * @returns {Card} 
   * @memberof Card
   */
  static PickColor(color: CardColor): Card {
    return new Card(color, VirtualCardSymbol.PickColor)
  }

  constructor(color: CardColor, symbol: CardSymbol | VirtualCardSymbol) {
    this.color = color
    this.symbol = symbol
  }

  /**
   * 创建一张代表VirtualCardSymbol.PenaltyBack的牌
   * 
   * PenaltyBack: 返回罚牌（被罚牌后立即出罚牌）
   * 
   * @readonly
   * @static
   * @type {Card}
   * @memberof Card
   */
  static get PenaltyBack(): Card {
    return new Card(CardColor.None, VirtualCardSymbol.PenaltyBack)
  }

  /**
   * 创建一张代表VirtualCardSymbol.PenaltyOver的牌
   * 
   * PenaltyOver: 罚牌阶段结束（被罚牌后返回）
   * 
   * @readonly
   * @static
   * @type {Card}
   * @memberof Card
   */
  static get PenaltyOver(): Card {
    return new Card(CardColor.None, VirtualCardSymbol.PenaltyOver)
  }

  /**
   * 创建一张代表VirtualCardSymbol.Pass的牌
   * 
   * Pass: 弃权（无牌可出/故意放弃/下家d4挑战成功 => 罚摸）
   * 
   * @readonly
   * @static
   * @type {Card}
   * @memberof Card
   */
  static get Pass(): Card {
    return new Card(CardColor.None, VirtualCardSymbol.Pass)
  }

  /**
   * 创建一张代表VirtualCardSymbol.Skipped的牌
   * 
   * Skipped: 被跳过（上家出禁牌/下家d4挑战失败）
   * 
   * @readonly
   * @static
   * @type {Card}
   * @memberof Card
   */
  static get Skip(): Card {
    return new Card(CardColor.None, VirtualCardSymbol.Skipped)
  }

  /**
   * 创建一张代表VirtualCardSymbol.Challenge的牌
   * 
   * Challenge: 挑战d4
   * 
   * @readonly
   * @static
   * @type {Card}
   * @memberof Card
   */
  static get Challenge(): Card {
    return new Card(CardColor.None, VirtualCardSymbol.Challenge)
  }

  /**
   * 牌面代表的分值
   * 
   * @readonly
   * @type {number}
   * @memberof Card
   */
  get score(): number {
    return CARD_SCORE_TABLE[this.symbol]
  }

  /**
   * 是否为功能牌
   * 
   * @readonly
   * @type {boolean}
   * @memberof Card
   */
  get isActionCard(): boolean {
    return isActionCard(this.symbol)
  }

  /**
   * 是否为实体牌（即牌面符号不为虚拟符号）
   * 
   * @readonly
   * @type {boolean}
   * @memberof Card
   */
  get isEntityCard(): boolean {
    // HACK: 虚拟符号卡没有分值
    return this.score !== void 0
  }

  /**
   * 判断指定牌是否与自身相同
   * 
   * @param {Card} card 需要判断的牌
   * @returns {boolean} 判断结果
   * @memberof Card
   */
  isSameCard(card: Card): boolean {
    return this.color === card.color && this.symbol === card.symbol
  }

  /**
   * 根据当前状态判断当前出牌是否合法
   * 
   * @param {CardColor} color 颜色
   * @param {CardSymbol} symbol 牌面符号
   * @param {boolean} d2 前序出牌中是否有Draw2
   * @param {boolean} d4 前序出牌中是否有Draw4
   * @returns {boolean} 判断结果
   * @memberof Card
   */
  isLegal(color: CardColor, symbol: CardSymbol, d2: boolean, d4: boolean): boolean {
    // 如果前序出牌中包含Draw4，则只有Draw4合法
    if (d4) {
      return this.symbol === CardSymbol.Draw4
    }

    // 如果前序出牌中包含Draw2...
    if (d2) {
      // ...那么只有和前序出牌相同颜色的反转，跳过及Draw2可出...
      const allows = [CardSymbol.Reverse, CardSymbol.Skip, CardSymbol.Draw2]
      if (allows.includes(this.symbol as CardSymbol)) {
        return this.color === color
      }

      // ...否则只有出Draw4
      return this.symbol === CardSymbol.Draw4
    }

    // Draw4在任何状态下始终合法
    if (this.symbol === CardSymbol.Draw4) {
      return true
    }

    // 如果当前为换色牌，那么只能接在非功能牌，或d2、d4状态清除后
    if (this.symbol === CardSymbol.Wild) {
      return !isActionCard(symbol)
    }

    // 如果以上条件均不符合，则按照相同颜色或者相同符号判断
    return this.color === color || this.symbol === symbol
  }

  /**
   * 获取代表牌面的字符串
   * 
   * @returns {string} 字符串
   * @memberof Card
   */
  toString(): string {
    return `Card[Color: ${this.color}, Symbol: ${this.symbol.padEnd(3)}]`
  }

  /**
   * 返回代表牌面的缩写字符串
   * 
   * @returns {string} 缩写字符串
   * @memberof Card
   */
  toAbbr(): string {
    return this.color + this.symbol
  }
}