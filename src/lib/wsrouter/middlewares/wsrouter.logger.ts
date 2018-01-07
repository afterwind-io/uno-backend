import { WSRouteMiddleware, WSRouteInfo } from '../wsrouter.type'

const logger: WSRouteMiddleware = async (context, next) => {
  const { namespace, route, payload } = context
  console.log(`[ws] <= ${namespace}/${route} -- "${JSON.stringify(payload)}"`)

  await next()

  const { response } = context
  console.log(`[ws] => ${namespace}/${route} -- "${JSON.stringify(response)}"`)
}

export default logger