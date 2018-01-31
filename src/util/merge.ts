/**
 * 合并多个对象，合并行为同Object.assign
 * 
 * @export
 * @param {...{ [key: string]: any }[]} objs 需要合并的对象
 * @returns {*} 包含所有对象字段的新对象
 */
export default function merge(...objs: { [key: string]: any }[]): any {
  return Object.assign({}, ...objs);
}
