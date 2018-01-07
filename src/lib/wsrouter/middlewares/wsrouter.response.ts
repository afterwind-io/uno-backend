import { WSRouteMiddleware, WSRouteInfo } from '../wsrouter.type'
import Response from '../../../model/response'

function needWrap(content: any): boolean {
  return typeof content !== 'object' || content.constructor !== Response
}

const resWrapper: WSRouteMiddleware = async (context, next) => {
  try {
    await next()

    if (needWrap(context.response)) {
      context.response = Response.ok(context.response)
    }
  } catch (error) {
    context.response = Response.err(error.message)
    console.error(error)
  }
}

export default resWrapper