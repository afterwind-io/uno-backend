import * as CONFIG from '../config'
import * as Ioredis from 'ioredis'

/**
 * 快速创建redis代理对象
 * 
 * @export
 * @param {number} [index=0] 数据库索引号
 * @returns {Ioredis.Redis} 
 */
function ConnectRedis(index: number = 0): Ioredis.Redis {
  return new Ioredis({
    port: 6379,
    host: '127.0.0.1',
    db: index
  })
}

/**
 * 初始化
 */
const redis = ConnectRedis(CONFIG.redis.cache);
(async () => {
  await redis.flushdb()
  redis.disconnect()
})()

export default ConnectRedis
