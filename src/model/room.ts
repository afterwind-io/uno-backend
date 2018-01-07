import * as CONFIG from '../config'
import idGen from '../util/idgen'
import ConnectRedis from '../module/redis'
import Serializable from './serializable'
import { Player } from './player'

interface RoomOption {
  uid?: string,
  name?: string,
  owner?: string,
  players?: string[],
  maxPlayers?: number,
  password?: string,
  state?: RoomState
}

export interface RoomDetail {
  uid: string,
  name: string,
  owner: Player,
  players: Player[],
  maxPlayers: number,
  state: RoomState
}

const redis = ConnectRedis(CONFIG.redis.cache)
const REDIS_ROOM_COUNTER = 'room.id'
const REDIS_ROOM_INDEX = 'room.index'
const ROOM_MIN_PLAYER = 2
const ROOM_MAX_PLAYER = 10

/**
 * 获取房间存储key的标准形式
 * 
 * @param {string} key 用作key的关键字
 * @returns {string} 附加前缀的存储key
 */
function wrapKey(key: string | number): string {
  return 'room.' + key
}

/**
 * 房间状态标记
 * 
 * @export
 * @enum {number}
 */
export enum RoomState {
  // 空闲
  idle = 'idle',

  // 游戏中
  ingame = 'ingame'
}

export class Room extends Serializable {
  /**
   * 房间uid
   * 
   * @type {string}
   * @memberof Room
   */
  public uid: string

  /**
   * 房间名称
   * 
   * @type {string}
   * @memberof Room
   */
  public name: string

  /**
   * 房主
   * 
   * @type {string}
   * @memberof Room
   */
  public owner: string

  /**
   * 玩家列表
   * 
   * @type {string[]}
   * @memberof Room
   */
  public players: string[]

  /**
   * 房间最大人数限制
   * 
   * @type {number}
   * @memberof Room
   */
  public maxPlayers: number

  /**
   * 房间密码
   * 
   * @type {string}
   * @memberof Room
   */
  public password: string

  /**
   * 房间状态
   * 
   * @type {RoomState}
   * @memberof Room
   */
  public state: RoomState

  /**
   * 创建一个新的房间实例
   * 
   * @static
   * @param {RoomOption} option 房间信息描述对象
   * @returns {Promise<Room>} 房间实例
   * @memberof Room
   */
  static async create(option: RoomOption): Promise<Room> {
    const uid = (await redis.incr(REDIS_ROOM_COUNTER)).toString()

    const room = new Room(Object.assign(option, { uid }))
    await room.inqueue()
    await room.save()

    return room
  }

  /**
   * 移除一个房间实例
   * 
   * @static
   * @param {number} uid 房间uid
   * @returns {Promise<Room>} 被移除的房间实例
   * @memberof Room
   */
  static async remove(uid: string): Promise<Room> {
    const room = await Room.fetch(uid)
    await room.dequeue()
    await room.destory()

    return room
  }

  /**
   * 根据房间uid获取房间实例
   * 
   * @static
   * @param {string} uid 房间uid
   * @returns {Promise<Room>} 房间实例。若id不存在，则返回undefined
   * @memberof Room
   */
  static async fetch(uid: string): Promise<Room> {
    const option = await redis.get(wrapKey(uid))
    return option == null ? void 0 : Room.parse(option)
  }

  /**
   * 根据一组房间uid获取一组房间实例
   * 
   * @static
   * @param {string[]} uids 房间uid数组
   * @returns {Promise<Room[]>} 房间实例数组
   * @memberof Room
   */
  static async fetchMulti(uids: string[]): Promise<Room[]> {
    const options: string[] = await redis.mget(...uids)
    return options.map(option => Room.parse(option))
  }

  /**
   * 根据索引范围获取一组房间实例
   * 
   * @static
   * @param {number} [start=0] 开始索引
   * @param {number} [end=-1] 结束索引
   * @returns {Promise<Room[]>} 房间实例数组
   * @memberof Room
   */
  static async fetchRange(start: number = 0, end: number = -1): Promise<Room[]> {
    const uids = await redis.lrange(REDIS_ROOM_INDEX, start, end)
    const keys = uids.map(uid => wrapKey(uid))

    return Room.fetchMulti(keys)
  }

  /**
   * 反序列化
   * 
   * @static
   * @param {string} json 序列化信息
   * @returns {Room} 房间实例。若反序列化产生错误，则返回undefined
   * @memberof Room
   */
  static parse(json: string): Room {
    try {
      return new Room(<RoomOption>JSON.parse(json))
    } catch (e) {
      console.error(`[Room] Deserialze error: "${json}"`)
      return void 0
    }
  }

  private constructor(option: RoomOption) {
    super()

    this.init(option)
  }

  get humanPlayerCount(): number {
    // TODO: 不应在此处出现ai id判断逻辑
    return this.players.filter(playerUid => !playerUid.startsWith('ai')).length
  }

  async update(option: RoomOption) {
    // TODO: 不严谨的更新操作
    this.init(Object.assign(this, option))

    return this.save()
  }

  async addPlayer(uid: string) {
    this.players.push(uid)

    await this.save()
  }

  async removePlayer(uid: string) {
    const index = this.players.findIndex(id => uid === id)
    index !== -1 && this.players.slice(index, 1)

    await this.save()
  }

  /**
   * 读取实例中引用对象的详细信息
   * 
   * @returns {Promise<RoomDetail>} 
   * @memberof Room
   */
  async populate(): Promise<RoomDetail> {
    const owner = await Player.fetch(this.owner)
    const players = await Player.fetchMulti(this.players)

    return Object.assign(this, { owner, players })
  }

  private init(option: RoomOption) {
    this.uid = option.uid
    this.name = option.name || `#${option.uid}`
    this.owner = option.owner
    this.players = option.players || []
    this.maxPlayers = option.maxPlayers || ROOM_MAX_PLAYER
    this.password = option.password || ''
    this.state = option.state || RoomState.idle
  }

  private async save() {
    return redis.set(wrapKey(this.uid), this.toJson())
  }

  private async destory() {
    return redis.del(wrapKey(this.uid))
  }

  private async inqueue() {
    return await redis.lpush(REDIS_ROOM_INDEX, this.uid)
  }

  private async dequeue() {
    return await redis.lrem(REDIS_ROOM_INDEX, 0, this.uid)
  }
}