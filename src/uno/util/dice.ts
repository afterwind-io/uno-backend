/**
 * 骰子
 * 
 * @export
 * @class Dice
 */
export default class Dice {
  /**
   * 概率检定
   * 
   * @static
   * @param {number} sides 骰子的面数
   * @returns 判定结果
   * @memberof Dice
   */
  static check(sides: number): boolean {
    return 1 / sides - Math.random() > 0
  }

  /**
   * 掷骰
   * 
   * @static
   * @param {number} sides 骰子的面数
   * @returns {boolean} 掷出的点数
   * @memberof Dice
   */
  static roll(sides: number): number {
    return Math.floor(Math.random() * sides) + 1
  }
}
