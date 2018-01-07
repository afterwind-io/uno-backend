import * as CONFIG from '../config'
import ConnectRedis from '../module/redis'

const redis = ConnectRedis(CONFIG.redis.cache)

const MATCH_COUNTER = 'match.counter'
const MATCH_PLAYERS = 6

export class Match {
  private matchCounter: number = 0

  get isMatchFull(): boolean {
    return this.matchCounter % MATCH_PLAYERS === 0
  }

  private get matchRoomIndex(): number {
    return ~~(this.matchCounter / MATCH_PLAYERS)
  }

  private get matchRoomKey(): string {
    return `match.list${this.matchRoomIndex}`
  }

  async queue(playerUid: string): Promise<void> {
    // 摇号，利用原子操作确保不重复
    this.matchCounter = await redis.incr(MATCH_COUNTER)

    await redis.lpush(`match.list${this.matchRoomIndex}`, playerUid)
  }

  async getPlayerIds(): Promise<string[]> {
    return redis.lrange(this.matchRoomKey, 0, -1)
  }
}