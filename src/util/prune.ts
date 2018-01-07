/**
 * 删除对象上的指定字段
 * 
 * @export
 * @param {Object} source 需要裁剪的对象
 * @param {string[]} keys 需要裁剪的字段
 * @returns {*} 裁剪后的源对象
 */
export default function prune(source: Object, keys: string[]): any {
  keys.forEach(key => delete source[key])
  return source
}