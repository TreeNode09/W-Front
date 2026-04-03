import { io, type Socket } from 'socket.io-client'

import { baseURL } from './http'

export function createSocket(): Socket {
  return io(baseURL, {
    transports: ['websocket', 'polling']
  })
}