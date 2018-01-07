/**
 * 代表实例可序列化的基类
 * 
 * @export
 * @class Serializable
 */
export default class Serializable {
  toJson(): string {
    return JSON.stringify(this)
  }
}