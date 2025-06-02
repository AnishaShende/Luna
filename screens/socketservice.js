import { io } from "socket.io-client"

// Define server URL based on environment
const SERVER_URL = "http://192.168.210.169:9000"

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = {}
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
  }

  // Initialize socket connection
  connect() {
    return new Promise((resolve) => {
      if (this.socket && this.socket.connected) {
        console.log("Socket is already connected")
        resolve(true)
        return
      }

      this.socket = io(SERVER_URL, {
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        transports: ["websocket"],
      })

      this.socket.on("connect", () => {
        console.log("Connected to Socket.IO server:", this.socket.id)
        this.reconnectAttempts = 0
        resolve(true)
      })

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
        this.reconnectAttempts++
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          resolve(false)
        }
      })

      // Set up default error handler
      this.socket.on("error", (error) => {
        console.error("Socket error:", error)
        if (this.listeners.error) {
          this.listeners.error(error)
        }
      })
    })
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      console.log("Socket disconnected")
    }
  }

  // Add event listener
  on(event, callback) {
    this.listeners[event] = callback

    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  // Remove event listener
  off(event) {
    if (this.socket) {
      this.socket.off(event)
    }
    delete this.listeners[event]
  }

  // Create or join a music room
  joinMusicRoom(roomId, user) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected")
      return false
    }

    console.log(`Joining music room: ${roomId} as user: ${user.userId}`)

    this.socket.emit("joinMusicRoom", {
      roomId,
      userId: user.userId,
      username: user.username,
      isHost: user.isHost,
    })

    return true
  }

  // Send music control command
  musicControl(roomId, action, song, currentTime) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected")
      return false
    }

    this.socket.emit("musicControl", {
      roomId,
      action,
      song,
      currentTime,
    })

    return true
  }

  // Send music invitation
  sendMusicInvitation(roomId, senderId, senderName, receiverId, song) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected")
      return false
    }

    this.socket.emit("sendMusicInvitation", {
      roomId,
      senderId,
      senderName,
      receiverId,
      song,
    })

    return true
  }

  // Accept music invitation
  acceptMusicInvitation(roomId, userId, username, song) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected")
      return false
    }

    this.socket.emit("acceptMusicInvitation", {
      roomId,
      userId,
      username,
      songData: song,
    })

    return true
  }

  // End music session
  endMusicSession(roomId, userId) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected")
      return false
    }

    this.socket.emit("endMusicSession", {
      roomId,
      userId,
    })

    return true
  }
}

// Create a singleton instance
export const socketService = new SocketService()

export default socketService
