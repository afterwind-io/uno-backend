import * as JWT from 'jsonwebtoken'
import { WSRouteMiddleware, WSRouteInfo } from '../wsrouter.type'

type JWTOptions = {
  secret: string,
  includes?: string[],
  excludes?: string[]
}

/**
 * JWT验证
 * 
 * @param {string} token JWT字符串
 * @param {string} secret secret字符串
 * @returns {boolean} 验证结果
 */
function jwtVerify(token: string = '', secret: string = ''): boolean {
  try {
    JWT.verify(token, secret);
    return true
  } catch (err) {
    return false
  }
}

function needVerify(route: string, includes: string[], excludes: string[], ) {
  return includes.includes(route) || !excludes.includes(route)
}

function jwt(options: JWTOptions): WSRouteMiddleware {
  const { secret, includes = [], excludes = [] } = options


  const middleware: WSRouteMiddleware = async (context, next) => {
    let { route, payload: { token } } = context

    if (needVerify(route, includes, excludes) && !jwtVerify(token, secret)) {
      throw new Error('Authentication failed')
    }

    await next()
  }

  return middleware
}

export default jwt