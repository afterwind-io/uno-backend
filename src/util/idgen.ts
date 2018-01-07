/**
 * 生成指定位数的随机字母标识
 * 
 * @export
 * @param {number} [length=8] 标识长度，默认8位
 * @returns {string} 生成结果
 */
export default function idGen(length: number = 8): string {
  let s = ''
  while (length-- > 0) {
    var r = Math.floor(Math.random() * 26) + 97
    s = s + String.fromCharCode(r)
  }
  return s
}