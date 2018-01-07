const redisIndex: any = {
  db: {
    develop: 10,
    product: 0
  },
  cache: {
    develop: 11,
    product: 1
  }
}

export const port = {
  websocket: 13001
}

export const secret = 'doge'

export const redis = {
  db: redisIndex.db[process.env.NODE_ENV || 'develop'],
  cache: redisIndex.cache[process.env.NODE_ENV || 'develop']
}