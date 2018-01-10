import * as CONFIG from '../config'
import idGen from '../util/idgen'
import User, { IUser } from './user'
import ConnectRedis from '../module/redis'
import Serializable from './serializable'

interface PlayerOption {
  uid?: string
  name?: string
  avatar?: string
  anonymous: boolean
  type?: PlayerType
  socketId?: string
  status?: PlayerStatus
  roomId?: string
}

const redis = ConnectRedis(CONFIG.redis.cache)
const REDIS_PLAYER_ONLINE = 'player.online'

/**
 * 获取玩家存储key的标准形式
 * 
 * @param {string} key 用作key的关键字
 * @returns {string} 附加前缀的存储key
 */
function wrapPlayerId(key: string): string {
  return 'player.' + key
}

/**
 * 获取ai存储key的标准形式
 * 
 * @param {string} key 用作key的关键字
 * @returns {string} 附加前缀的存储key
 */
function wrapAiId(key: string) {
  return 'ai.' + key
}

/**
 * 玩家类型标记
 * 
 * @export
 * @enum {number}
 */
export enum PlayerType {
  // 人类
  human = 'human',

  // AI
  ai = 'ai'
}

/**
 * 玩家状态标记
 * 
 * @export
 * @enum {number}
 */
export enum PlayerStatus {
  // 空闲
  idle = 'idle',

  // 队列中
  pending = 'pending',

  // 准备完成
  ready = 'ready',

  // 游戏中
  ingame = 'ingame'
}

/**
 * 玩家数据
 * 
 * @export
 * @class Player
 */
export class Player extends Serializable implements IUser {
  /**
   * 用户id，与对应user一致
   * 
   * @type {string}
   * @memberof Player
   */
  public uid: string

  /**
   * 用户账户名称，与对应user一致
   * 
   * @type {string}
   * @memberof Player
   */
  public name: string

  /**
   * 用户头像链接，与对应user一致
   * 
   * @type {string}
   * @memberof Player
   */
  public avatar: string

  /**
   * 是否为匿名玩家
   * 
   * @type {boolean}
   * @memberof Player
   */
  public anonymous: boolean

  /**
   * 玩家类型
   * 
   * @type {('human' | 'ai')}
   * @memberof Player
   */
  public type: 'human' | 'ai'

  /**
   * 对应socket实例的id
   * 
   * @type {string}
   * @memberof Player
   */
  public socketId: string

  /**
   * 玩家状态
   * 
   * @type {PlayerStatus}
   * @memberof Player
   */
  public status: PlayerStatus

  /**
   * 玩家所在房间编号
   * 
   * @type {string}
   * @memberof Player
   */
  public roomId: string

  /**
   * 创建一个新的玩家实例
   * 
   * @static
   * @param {boolean} anonymous 是否为匿名方式登录
   * @param {string} socketId 对应socket实例的id
   * @param {User} [user] 复写信息的源user实例
   * @returns {Promise<Player>} 玩家实例
   * @memberof Player
   */
  static async createHuman(anonymous: boolean, socketId: string, user?: User): Promise<Player> {
    let option: any = { anonymous, socketId }
    if (!anonymous) {
      option.uid = wrapPlayerId(user.uid)
      option.name = user.name
      option.avatar = user.avatar
    }

    const player = new Player(option)

    await player.inqueue()
    await player.save()

    return player
  }

  /**
   * 创建一个新的AI实例
   * 
   * @static
   * @returns {Promise<Player>} 玩家实例
   * @memberof Player
   */
  static async createAI(): Promise<Player> {
    const uid = wrapAiId(idGen())
    const ai = new Player({
      uid,
      name: 'AI小姐姐#' + uid,
      anonymous: false,
      type: PlayerType.ai,
    })

    await ai.save()

    return ai
  }

  /**
   * 移除一个玩家实例
   * 
   * @static
   * @param {string} uid 玩家uid
   * @returns {Promise<Player>} 被移除的玩家实例
   * @memberof Player
   */
  static async remove(uid: string): Promise<Player> {
    const player = await Player.fetch(uid)

    if (player.type !== 'ai') await player.dequeue()
    await player.destory()

    return player
  }

  /**
   * 根据玩家uid获取玩家实例
   * 
   * @static
   * @param {string} uid 玩家uid
   * @returns {Promise<Player>} 玩家实例。若id不存在，则返回undefined
   * @memberof Player
   */
  static async fetch(uid: string): Promise<Player> {
    const option = await redis.get(uid)
    return option == null ? void 0 : Player.parse(option)
  }

  /**
   * 根据一组玩家uid获取一组玩家实例
   * 
   * @static
   * @param {string[]} uids 玩家uid数组
   * @returns {Promise<Player[]>} 玩家实例数组
   * @memberof Player
   */
  static async fetchMulti(uids: string[]): Promise<Player[]> {
    const options: string[] = await redis.mget(...uids)
    return options.map(option => Player.parse(option))
  }

  /**
   * 根据指定数量获取一组玩家实例
   * 
   * 注：由于redis机制问题，此处返回的结果为随机获取
   * 
   * @static
   * @param {number} [count=0] 需要获取的数量
   * @returns {Promise<Player[]>} 玩家实例数组
   * @memberof Player
   */
  static async fetchRange(count: number = 0): Promise<Player[]> {
    const uids = await redis.srandmember(REDIS_PLAYER_ONLINE, count)

    return Player.fetchMulti(uids)
  }

  /**
   * 判断指定玩家是否在线
   * 
   * @static
   * @param {string} uid 玩家uid
   * @returns {Promise<boolean>} 判断结果
   * @memberof Player
   */
  static async isOnline(uid: string): Promise<boolean> {
    const flag = await redis.sismember(REDIS_PLAYER_ONLINE, uid)
    return flag === 1
  }

  /**
   * 反序列化
   * 
   * @static
   * @param {string} json 序列化信息
   * @returns {Player} 玩家实例。若反序列化产生错误，则返回undefined
   * @memberof Player
   */
  static parse(json: string): Player {
    try {
      return new Player(<PlayerOption>JSON.parse(json))
    } catch (e) {
      console.error(`[Player] Deserialze error: "${json}"`)
      return void 0
    }
  }

  private constructor(option: PlayerOption) {
    super()

    this.uid = option.uid || wrapPlayerId(idGen())
    this.name = option.name || '玩家' + this.uid
    this.avatar = option.avatar || ''
    this.anonymous = option.anonymous || false
    this.socketId = option.socketId || ''
    this.type = option.type || 'human'
    this.status = option.status || PlayerStatus.idle
    this.roomId = option.roomId || '0'
  }

  async join(roomId: string) {
    this.roomId = roomId

    await this.save()
  }

  async leave() {
    this.roomId = '0'

    await this.save()
  }

  private async save() {
    return redis.set(this.uid, this.toJson())
  }

  private async destory() {
    return redis.del(this.uid)
  }

  private async inqueue() {
    return await redis.sadd(REDIS_PLAYER_ONLINE, this.uid)
  }

  private async dequeue() {
    return await redis.srem(REDIS_PLAYER_ONLINE, 0, this.uid)
  }
}