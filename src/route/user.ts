import * as JWT from 'jsonwebtoken'
import * as CONFIG from '../config'
import router from './router'
import User from '../model/user'
import { Player } from '../model/player'
import prune from '../util/prune'

// router.of('api')

interface IParamRegister {
  username: string,
  password: string
}

interface IReturnRegister {
  token: string
  user: User
  player: Player
}

router.on('user/register', async (packet: IParamRegister, socket): Promise<IReturnRegister> => {
  const { username: name, password } = packet

  const test = await User.fetchByName(name)
  if (test !== void 0) throw new Error('该用户名已被注册')

  const user = prune(await User.create({ name, password }), ['password'])
  const player = await Player.createHuman(false, socket.id, user)
  const token = JWT.sign({ uid: player.uid, r: Math.random() }, CONFIG.secret)

  return { token, user, player }
})

interface IParamLogin {
  anonymous?: boolean,
  username?: string,
  password?: string
}

interface IReturnLogin {
  token: string
  user: User
  player: Player
}

router.on('user/login', async (packet: IParamLogin, socket): Promise<IReturnLogin> => {
  const { anonymous, username, password } = packet

  let user: User
  if (!anonymous) {
    user = await User.fetchByName(username)

    if (user === void 0 || user.password !== password) {
      throw new Error('用户名或密码错误')
    }

    prune(user, ['password'])
  }

  // if (await Player.isOnline(user.uid)) {
  //   throw new Error(`玩家"${username}"已登录`)
  // }

  const player = await Player.createHuman(anonymous, socket.id, user)
  const token = JWT.sign({ uid: player.uid, r: Math.random() }, CONFIG.secret)

  return { token, user, player }
})

interface IParamLogout {
  uid: string
}

router.on('user/logout', async (packet: IParamLogout) => {
  const { uid } = packet

})

interface IParamDetail {
  uid: string
}

interface IReturnDetail {
  user: User
}

router.on('user/detail', async (packet: IParamDetail): Promise<IReturnDetail> => {
  const { uid } = packet
  const user = await User.fetch(uid)

  if (user === void 0) throw new Error('指定用户不存在')
  return prune(user, ['password'])
})
