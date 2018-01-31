# 用户(user)

## 用户信息
以String形式存储，格式如下：
`user.{uid}:{info}`

## 用户名称至用户uid映射
以String形式存储，格式如下：
`user.{name}:{uid}`


# 玩家(player)

## 玩家/ai信息
以String形式存储，格式如下：
`{uid}:{info}`
其中uid的格式为：
玩家： `player.{8位字母}`
ai：`player.ai#{8位字母}`

## 在线玩家列表
以Sets形式存储玩家uid，格式如下：
`player.online:[{uid}, {uid}, ...]`


# 房间(room)

## 房间信息
以String形式存储，格式如下：
`room.{uid}:{info}`

## 在线房间列表
以List形式存储房间uid，格式如下：
`room.index:[{uid}, {uid}, ...]`

## 房间号生成器
以String形式存储，incr方式递增，格式如下：
`room.id:0`


# 匹配(match)

## 分批计数器
以String形式存储，格式如下：
`match.counter:0`

## 匹配同房玩家列表
以List形式存储房间uid，格式如下：
`match.list{batchIndex}:[{playerUid}, {playerUid}, ...]`


# 统计数据

