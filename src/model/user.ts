import * as CONFIG from '../config'
import idGen from '../util/idgen'
import ConnectRedis from '../module/redis'
import Serializable from './serializable'

export interface IUser {
  uid: string
  name: string
  avatar: string
}

interface UserOption {
  uid?: string
  name: string
  password: string
  avatar?: string
}

const redis = ConnectRedis(CONFIG.redis.db)

/**
 * 获取用户存储key的标准形式
 * 
 * @param {string} key 用作key的关键字
 * @returns {string} 附加前缀的存储key
 */
function wrapKey(key: string): string {
  return 'user.' + key
}

/**
 * 用于持久化存储的用户数据
 * 
 * @export
 * @class User
 * @extends {Serializable}
 */
export default class User extends Serializable implements IUser {
  /**
   * 用户id
   * 
   * @type {string}
   * @memberof User
   */
  public uid: string

  /**
   * 用户账户名称
   * 
   * @type {string}
   * @memberof User
   */
  public name: string

  /**
   * 账户密码
   * 
   * @type {string}
   * @memberof User
   */
  public password: string

  /**
   * 用户头像链接
   * 
   * @type {string}
   * @memberof User
   */
  public avatar: string

  /**
   * 根据用户信息创建用户对象
   * 
   * @static
   * @param {UserOption} option 用户信息描述对象
   * @returns {Promise<User>} 用户对象实例
   * @memberof User
   */
  static async create(option: UserOption): Promise<User> {
    const user = new User(option)

    await redis.set(wrapKey(user.uid), user.toJson())
    await redis.set(wrapKey(user.name), user.uid)

    return user
  }

  /**
   * 根据用户uid获取用户实例
   * 
   * @static
   * @param {string} uid 用户uid
   * @returns {Promise<User>} 用户实例。若id不存在，则返回undefined
   * @memberof User
   */
  static async fetch(uid: string): Promise<User> {
    const option = await redis.get(wrapKey(uid))
    return option == null ? void 0 : User.parse(option)
  }

  /**
   * 根据用户名称获取用户实例
   * 
   * @static
   * @param {string} [name=''] 用户名称
   * @returns {Promise<User>} 用户实例。若名称不存在，则返回undefined
   * @memberof User
   */
  static async fetchByName(name: string = ''): Promise<User> {
    const uid = await redis.get(wrapKey(name))
    return uid == null ? void 0 : User.fetch(uid)
  }

  /**
   * 反序列化
   * 
   * @static
   * @param {string} json 序列化信息
   * @returns {User} 用户实例。若反序列化产生错误，则返回undefined
   * @memberof User
   */
  static parse(json: string): User {
    try {
      return new User(<UserOption>JSON.parse(json))
    } catch (e) {
      console.error(`[User] Deserialze error: "${json}"`)
      return void 0
    }
  }

  constructor(option: UserOption) {
    super()

    this.uid = option.uid || idGen()
    this.name = option.name
    this.password = option.password
    this.avatar = option.avatar || ''
  }
}
