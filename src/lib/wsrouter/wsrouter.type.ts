export type WSRouteInfo = {
  socket: SocketIO.Socket,
  namespace: string,
  route: string,
  payload: any,
  response: any
}
export type WSRouteMiddleware = (context: WSRouteInfo, next: () => Promise<void>) => Promise<void>
export type WSRouteHandler = (param: any, socket: SocketIO.Socket) => Promise<any>
export type WSRouteHandlerMap = { [nsp: string]: { [route: string]: WSRouteMiddleware } }