import { WSRouteHandler, WSRouteHandlerMap, WSRouteMiddleware, WSRouteInfo } from './wsrouter.type'

/**
 * _(:з」∠)_
 * 
 */
async function noop() { }

/**
 * 中间件递归执行器
 * 
 * @param {WSRouteMiddleware[]} handlers 中间件组
 * @param {WSRouteInfo} context 在中间件中传递的数据上下文
 * @param {number} [pointer=0] 当前执行的中间件索引指针
 * @returns {Promise<void>} 
 */
async function step(handlers: WSRouteMiddleware[], context: WSRouteInfo, pointer: number = 0): Promise<void> {
  if (pointer === handlers.length) return

  const next = async function () {
    await step(handlers, context, pointer + 1)
  }

  return await handlers[pointer](context, next)
}

const REQUEST_EVENT: string = 'request'
const FALLBACK_NAME: string = '__fallback__'

class WSRouter {
  private server: SocketIO.Server
  private middlewares: WSRouteMiddleware[] = []
  private handlerMap: WSRouteHandlerMap = {}
  private namespace: string = '/'

  constructor(io: SocketIO.Server) {
    this.server = io
    this.of(this.namespace)
  }

  /**
   * 添加中间件
   * 
   * @param {WSRouteMiddleware} middleware 中间件定义
   * @memberof WS
   */
  use(middleware: WSRouteMiddleware) {
    return (this.middlewares.push(middleware), this)
  }

  /**
   * 标识接下来的路由定义应归属于哪个命名空间下
   * 
   * @param {string} namespace 命名空间名称
   * @returns {WS} 当前的ws对象
   * @memberof WS
   */
  of(namespace: string): WSRouter {
    this.namespace = namespace

    !this.handlerMap[namespace] && (this.handlerMap[namespace] = {})

    !this.hasInit(namespace) && this.initNamespace()

    return this
  }

  /**
   * 定义路由处理方法
   * 
   * @param {string} route 路由名称
   * @param {WSRouteHandler} handler 路由处理方法
   * @returns {WSRouter} 当前的ws对象
   * @memberof WS
   */
  on(route: string, handler: WSRouteHandler): WSRouter {
    let nsp = this.handlerMap[this.namespace]
    nsp[route] = this.wrapHandler(handler)

    return this
  }

  /**
   * 定义无匹配路由时的默认处理方法
   * 
   * @param {WSRouteHandler} handler 
   * @returns {WSRouter} 
   * @memberof WS
   */
  otherwise(handler: WSRouteHandler): WSRouter {
    return this.on(FALLBACK_NAME, handler)
  }

  private hasInit(namespace: string): boolean {
    const nsp = this.server.of(namespace)
    return nsp.eventNames().includes('connection')
  }

  private getHandler(namespace: string, route: string = FALLBACK_NAME): WSRouteMiddleware {
    let nsp = this.handlerMap[namespace]
    let handlerName = nsp[route] !== void 0 ? route : FALLBACK_NAME

    return nsp[handlerName] || noop
  }

  private wrapHandler(handler: WSRouteHandler): WSRouteMiddleware {
    return async function handlerWrapper(context, next) {
      context.response = await handler(context.payload.param || {}, context.socket)
    }
  }

  private initNamespace() {
    const namespace = this.namespace

    const nsp = this.server.of(namespace)
    nsp.on('connection', socket => socket.on(REQUEST_EVENT, async (payload = {}, cb) => {
      const { route } = payload
      const wrapper = this.getHandler(namespace, route)
      const handlerArr = [...this.middlewares, wrapper]

      try {
        let context = { socket, namespace, route, payload, response: void 0 }
        await step(handlerArr, context)

        cb(context.response)
      } catch (error) {
        cb(error.message)
      }
    }))
  }
}

export default WSRouter