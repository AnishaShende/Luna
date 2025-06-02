"use client"

import { createContext, useState, useEffect, useRef } from "react"
import TrackPlayer, {
  Capability,
  Event,
  State,
  useTrackPlayerEvents,
  usePlaybackState,
  useProgress,
} from "react-native-track-player"
import { io } from "socket.io-client"

export const MusicContext = createContext()

// API URL constants
const SOCKET_URL = "http://192.168.110.169:9000"

// Helper function to create consistent room IDs
const createRoomId = (user1, user2) => {
  // Sort IDs to ensure consistency regardless of who is sender/receiver
  const sortedIds = [user1, user2].sort()
  return `music_${sortedIds[0]}_${sortedIds[1]}`
}

// Helper function to shorten IDs for logging
const shortenId = (id) => {
  if (!id) return "unknown"
  // Take first 6 characters if ID is long enough
  return id.length > 6 ? id.substring(0, 6) : id
}

const setupPlayer = async () => {
  try {
    await TrackPlayer.setupPlayer({
      waitForBuffer: true,
    })

    await TrackPlayer.updateOptions({
      stopWithApp: true,
      capabilities: [Capability.Play, Capability.Pause, Capability.Stop, Capability.SeekTo],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
    })

    console.log("[Player] Track player setup complete")
    return true
  } catch (error) {
    console.error("[Player] Error setting up the player:", error)
    return false
  }
}

export const MusicProvider = ({ children }) => {
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false)
  const [currentRoomId, setCurrentRoomId] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [hostId, setHostId] = useState(null) // Track the host ID explicitly
  const [lastSync, setLastSync] = useState(Date.now())

  // Keep track of the original host (sender) for each room
  const roomHostsRef = useRef({})

  const socketRef = useRef(null)
  const progress = useProgress()
  const playbackState = usePlaybackState()

  // Initialize player
  useEffect(() => {
    let unmounted = false
    ;(async () => {
      const setup = await setupPlayer()
      if (unmounted) return

      setIsPlayerReady(setup)
    })()

    return () => {
      unmounted = true
    }
  }, [])

  // Initialize socket connection
  useEffect(() => {
    // Connect to socket server
    console.log(`[Socket] Connecting to socket server at ${SOCKET_URL}`)
    socketRef.current = io(SOCKET_URL)

    socketRef.current.on("connect", () => {
      console.log("[Socket] Connected to Socket.IO server with ID:", socketRef.current.id)
    })

    socketRef.current.on("disconnect", () => {
      console.log("[Socket] Disconnected from Socket.IO server")
    })

    socketRef.current.on("error", (error) => {
      console.error("[Socket] Socket error:", error)
    })

    // Music state updates
    socketRef.current.on("musicStateUpdate", (state) => {
      console.log("[Music] Received music state update:", JSON.stringify(state))

      // Update participants if available
      if (state.participants) {
        console.log(`[Music] Updated participants: ${state.participants.map((id) => shortenId(id)).join(", ")}`)
        setConnectedUsers(state.participants)
      }

      // Handle host updates - if host is null, use the stored host ID
      if (state.host !== undefined) {
        let effectiveHostId = state.host

        // If host is null but we have a stored host for this room, use that
        if (effectiveHostId === null && state.roomId && roomHostsRef.current[state.roomId]) {
          effectiveHostId = roomHostsRef.current[state.roomId]
          console.log(`[Music] Restoring host from stored value: ${shortenId(effectiveHostId)}`)
        }

        console.log(
          `[Music] Host update: ${shortenId(effectiveHostId)}, current user is host: ${effectiveHostId === currentUserId}`,
        )

        setHostId(effectiveHostId)
        setIsHost(effectiveHostId === currentUserId)
      }

      // Handle song updates
      if (state.song) {
        console.log(`[Music] Song update: ${state.song.title}`)
        setCurrentSong(state.song)
        setIsMiniPlayerVisible(true)
      } else if (state.song === null) {
        console.log("[Music] Song cleared")
        setCurrentSong(null)
      }

      // Handle playback state
      if (state.isPlaying !== undefined) {
        console.log(`[Music] Playback state update: ${state.isPlaying}`)
        setIsPlaying(state.isPlaying)
      }

      // Update player state if we have enough information
      if ((state.song || state.isPlaying !== undefined) && isPlayerReady) {
        updatePlayerState(state)
      }

      // Handle session reset
      if (state.isPlaying === false && !state.song && state.participants?.length <= 1) {
        console.log("[Music] Resetting player state due to empty session")
        setCurrentSong(null)
        setIsPlaying(false)
        setIsMiniPlayerVisible(false)
        TrackPlayer.reset()
      }

      // Update last sync timestamp
      setLastSync(Date.now())
    })

    socketRef.current.on("musicSessionEnded", () => {
      console.log("[Music] Session ended")
      setCurrentSong(null)
      setIsPlaying(false)
      setConnectedUsers([])
      setIsMiniPlayerVisible(false)
      setCurrentRoomId(null)
      setHostId(null)
      TrackPlayer.reset()
    })

    // Music invitation accepted
    socketRef.current.on("musicInvitationAccepted", (data) => {
      console.log(`[Music] Invitation accepted by: ${shortenId(data.acceptedBy)} for room: ${data.roomId}`)

      // Check if this is for our active room
      if (data.roomId === currentRoomId) {
        // Set current song if available
        if (data.songData) {
          console.log(`[Music] Setting current song to: ${data.songData.title}`)
          setCurrentSong(data.songData)
        }

        // Update connected users
        if (!connectedUsers.includes(data.acceptedBy)) {
          console.log(`[Music] Adding user ${shortenId(data.acceptedBy)} to connected users`)
          setConnectedUsers((prev) => [...prev, data.acceptedBy])
        }

        // Preserve host information
        if (data.hostId) {
          console.log(`[Music] Setting host from invitation acceptance: ${shortenId(data.hostId)}`)
          setHostId(data.hostId)
          setIsHost(data.hostId === currentUserId)

          // Store the host ID for this room
          if (data.roomId) {
            roomHostsRef.current[data.roomId] = data.hostId
          }
        }

        // Force UI update
        setLastSync(Date.now())
      }
    })

    // Room join confirmations
    socketRef.current.on("roomJoined", (data) => {
      console.log(`[Music] Room joined confirmation for room: ${data.roomId}, success: ${data.success}`)
      if (data.success) {
        setConnectedUsers(data.participants)
        console.log(`[Music] Room participants: ${data.participants.map((id) => shortenId(id)).join(", ")}`)

        // Update host information
        if (data.host !== undefined) {
          console.log(`[Music] Room host: ${shortenId(data.host)}`)
          setHostId(data.host)
          setIsHost(data.host === currentUserId)

          // Store the host ID for this room
          if (data.roomId) {
            roomHostsRef.current[data.roomId] = data.host
          }
        }

        // If there's a current song, update it
        if (data.currentSong) {
          console.log(`[Music] Current song in room: ${data.currentSong.title}, playing: ${data.isPlaying}`)
          setCurrentSong(data.currentSong)
          setIsPlaying(data.isPlaying)
          setIsMiniPlayerVisible(true)

          // Update player state
          updatePlayerState({
            song: data.currentSong,
            isPlaying: data.isPlaying,
            currentTime: data.currentTime,
          })
        }
      }
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [currentUserId])

  // Track player events
  useTrackPlayerEvents([Event.PlaybackState], (event) => {
    if (event.state === State.Playing) {
      setIsPlaying(true)
    } else if (event.state === State.Paused || event.state === State.Stopped) {
      setIsPlaying(false)
    }
  })

  // Update player state based on socket updates
  const updatePlayerState = async (state) => {
    if (!isPlayerReady) {
      console.log("[Player] Player not ready, skipping state update")
      return
    }

    try {
      // If there's no song data but isPlaying is false, just pause the player
      if (!state.song && state.isPlaying === false) {
        console.log("[Player] No song data, pausing player")
        await TrackPlayer.pause()
        return
      }

      // Skip if no song data is provided
      if (!state.song) {
        console.log("[Player] No song data provided, skipping update")
        return
      }

      const queue = await TrackPlayer.getQueue()
      const currentTrack = await TrackPlayer.getCurrentTrack()

      // If the song is different, load it
      if (!currentTrack || queue.length === 0 || queue[0].id !== state.song.id) {
        console.log(`[Player] Loading new song: ${state.song.title}`)
        await TrackPlayer.reset()
        await TrackPlayer.add({
          id: state.song.id,
          url: state.song.audioUrl,
          title: state.song.title,
          artist: state.song.artist,
          artwork: state.song.coverUrl,
        })
      }

      // Sync playback state
      if (state.isPlaying) {
        console.log("[Player] Playing track")
        await TrackPlayer.play()
      } else {
        console.log("[Player] Pausing track")
        await TrackPlayer.pause()
      }

      // Sync position if needed and not host
      if (!isHost && state.currentTime !== undefined) {
        const currentPosition = progress.position
        const diff = Math.abs(currentPosition - state.currentTime)

        // Only seek if the difference is significant (more than 2 seconds)
        if (diff > 2) {
          console.log(`[Player] Syncing position to ${state.currentTime}s (diff: ${diff}s)`)
          await TrackPlayer.seekTo(state.currentTime)
        }
      }
    } catch (error) {
      console.error("[Player] Error updating player state:", error)
    }
  }

  // Join a music room
  const joinMusicRoom = (senderId, receiverId) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error("[Music] Socket not connected")
      return false
    }

    // Create consistent room ID
    const roomId = createRoomId(senderId, receiverId)

    console.log(`[Music] Joining room: ${roomId} as user: ${shortenId(senderId)}`)

    socketRef.current.emit("joinMusicRoom", {
      roomId,
      userId: senderId,
      isHost: false,
    })

    setCurrentRoomId(roomId)
    setCurrentUserId(senderId)
    setIsHost(false)

    return true
  }

  // Accept music invitation
  const acceptMusicInvitation = (senderId, receiverId, songData) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error("[Music] Socket not connected")
      return false
    }

    // Create consistent room ID
    const roomId = createRoomId(senderId, receiverId)

    console.log(`[Music] Accepting invitation for room: ${roomId} as user: ${shortenId(receiverId)}`)

    // Store the original host (sender) for this room
    roomHostsRef.current[roomId] = senderId
    console.log(`[Music] Storing original host for room ${roomId}: ${shortenId(senderId)}`)

    // Join the room
    socketRef.current.emit("joinMusicRoom", {
      roomId,
      userId: receiverId,
      isHost: false,
      originalHost: senderId, // Pass the original host ID
    })

    // Accept the invitation
    socketRef.current.emit("acceptMusicInvitation", {
      roomId,
      userId: receiverId,
      acceptedBy: receiverId,
      songData,
      hostId: senderId, // Include the host ID (sender) in the acceptance
    })

    setCurrentRoomId(roomId)
    setCurrentUserId(receiverId)
    setHostId(senderId) // Set the host ID to the sender
    setIsHost(false)

    return true
  }

  // Play a song
  const playSong = async (song, senderId, receiverId, mode = "host") => {
    if (!isPlayerReady) {
      console.log("[Player] Player not ready, cannot play song")
      return
    }

    if (!song || !song.audioUrl) {
      console.error("[Player] Invalid song data, cannot play")
      return
    }

    try {
      // Create consistent room ID
      const roomId = createRoomId(senderId, receiverId)

      console.log(`[Music] Playing song: ${song.title} in room: ${roomId}, mode: ${mode}`)

      // Store the host for this room
      const hostUserId = mode === "host" ? senderId : null
      if (hostUserId) {
        roomHostsRef.current[roomId] = hostUserId
        console.log(`[Music] Storing host for room ${roomId}: ${shortenId(hostUserId)}`)
      }

      setCurrentSong(song)
      setCurrentRoomId(roomId)
      setCurrentUserId(mode === "host" ? senderId : receiverId)

      // Set host information
      if (mode === "host") {
        setHostId(senderId)
        setIsHost(true)
      } else {
        setIsHost(false)
      }

      setIsMiniPlayerVisible(true)

      await TrackPlayer.reset()
      await TrackPlayer.add({
        id: song.id,
        url: song.audioUrl,
        title: song.title,
        artist: song.artist,
        artwork: song.coverUrl,
      })

      await TrackPlayer.play()
      setIsPlaying(true)

      // If host, broadcast the state
      if (mode === "host" && socketRef.current) {
        console.log("[Music] Broadcasting play action as host")
        socketRef.current.emit("musicControl", {
          roomId,
          action: "play",
          song: song,
          currentTime: 0,
          isPlaying: true,
          host: senderId, // Include host ID in the control message
        })
      }
    } catch (error) {
      console.error("[Player] Error playing song:", error)
    }
  }

  // Toggle play/pause
  const togglePlayback = async () => {
    if (!isPlayerReady || !currentRoomId) {
      console.log("[Player] Cannot toggle playback - player not ready or no room")
      return
    }

    try {
      const newState = !isPlaying

      // If we're trying to play but there's no current song, log an error
      if (newState && !currentSong) {
        console.error("[Player] Cannot play - no song loaded")
        return
      }

      if (newState) {
        console.log("[Player] Playing track")
        await TrackPlayer.play()
      } else {
        console.log("[Player] Pausing track")
        await TrackPlayer.pause()
      }

      setIsPlaying(newState)

      // If host, broadcast the state
      if (isHost && socketRef.current) {
        console.log(`[Music] Broadcasting ${newState ? "play" : "pause"} action as host`)

        // Get the stored host for this room, or use currentUserId as fallback
        const effectiveHostId = roomHostsRef.current[currentRoomId] || currentUserId

        socketRef.current.emit("musicControl", {
          roomId: currentRoomId,
          action: newState ? "play" : "pause",
          currentTime: progress.position,
          song: currentSong, // Always include the current song in updates
          host: effectiveHostId, // Include host ID in the control message
        })
      }
    } catch (error) {
      console.error("[Player] Error toggling playback:", error)
    }
  }

  // Seek to position
  const seekTo = async (position) => {
    if (!isPlayerReady || !isHost || !currentRoomId) {
      console.log("[Player] Cannot seek - player not ready or not host")
      return
    }

    try {
      console.log(`[Player] Seeking to position: ${position}s`)
      await TrackPlayer.seekTo(position)

      // Broadcast seek action
      if (socketRef.current) {
        console.log("[Music] Broadcasting seek action as host")

        // Get the stored host for this room, or use currentUserId as fallback
        const effectiveHostId = roomHostsRef.current[currentRoomId] || currentUserId

        socketRef.current.emit("musicControl", {
          roomId: currentRoomId,
          action: "seek",
          currentTime: position,
          host: effectiveHostId, // Include host ID in the control message
        })
      }
    } catch (error) {
      console.error("[Player] Error seeking:", error)
    }
  }

  // Send music invitation
  const sendMusicInvitation = (senderId, receiverId, song) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error("[Music] Socket not connected")
      return null
    }

    // Create consistent room ID
    const roomId = createRoomId(senderId, receiverId)

    console.log(`[Music] Creating music room: ${roomId} as host: ${shortenId(senderId)}`)

    // Store the host for this room
    roomHostsRef.current[roomId] = senderId
    console.log(`[Music] Storing host for room ${roomId}: ${shortenId(senderId)}`)

    // Join the room as host
    socketRef.current.emit("createMusicRoom", {
      roomId,
      userId: senderId,
      isHost: true,
    })

    setCurrentRoomId(roomId)
    setCurrentUserId(senderId)
    setHostId(senderId) // Set host ID explicitly
    setIsHost(true)
    setConnectedUsers([senderId])

    // Create a music invitation message
    const messageData = {
      senderId,
      receiverId,
      message: "Hey, can we listen to this song together?",
      musicData: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        coverUrl: song.coverUrl,
        audioUrl: song.audioUrl,
        isInvitation: true,
        roomId: roomId,
        hostId: senderId, // Include the host ID in the music data
      },
      timestamp: new Date(),
    }

    // Send the message through socket
    socketRef.current.emit("sendMessage", messageData)

    console.log(`[Music] Sent invitation for song: ${song.title} to user: ${shortenId(receiverId)}`)
    return roomId
  }

  // End music session
  const endMusicSession = () => {
    if (!socketRef.current || !socketRef.current.connected || !currentRoomId) {
      console.error("[Music] Socket not connected or no active room")
      return
    }

    console.log(`[Music] Ending session for room: ${currentRoomId}`)

    socketRef.current.emit("endMusicSession", {
      roomId: currentRoomId,
      userId: currentUserId,
    })

    // Clean up the stored host for this room
    if (roomHostsRef.current[currentRoomId]) {
      delete roomHostsRef.current[currentRoomId]
    }

    setCurrentSong(null)
    setIsPlaying(false)
    setConnectedUsers([])
    setIsMiniPlayerVisible(false)
    setCurrentRoomId(null)
    setHostId(null) // Clear host ID
    TrackPlayer.reset()
  }

  // Periodic sync for hosts
  useEffect(() => {
    // Only run this for hosts, not guests
    if (!isHost || !currentRoomId || !socketRef.current || !currentUserId) return

    const syncInterval = setInterval(() => {
      // Send current state to ensure everyone is in sync
      if (currentSong && socketRef.current.connected) {
        console.log("[Music] Sending periodic sync update as host")

        // Get the stored host for this room, or use currentUserId as fallback
        const effectiveHostId = roomHostsRef.current[currentRoomId] || currentUserId

        socketRef.current.emit("musicControl", {
          roomId: currentRoomId,
          action: isPlaying ? "play" : "pause",
          currentTime: progress.position,
          song: currentSong,
          host: effectiveHostId, // Always include host ID in sync updates
        })
      }
    }, 15000) // Sync every 15 seconds

    return () => clearInterval(syncInterval)
  }, [isHost, currentRoomId, currentSong, isPlaying, progress.position, currentUserId])

  // Add a function to force sync with other users
  const forceSyncWithPeers = () => {
    if (!isHost || !currentRoomId || !socketRef.current || !currentSong) {
      console.log("[Music] Cannot force sync - not host or no active session")
      return
    }

    console.log("[Music] Forcing sync with peers")

    // Get the stored host for this room, or use currentUserId as fallback
    const effectiveHostId = roomHostsRef.current[currentRoomId] || currentUserId

    socketRef.current.emit("musicControl", {
      roomId: currentRoomId,
      action: isPlaying ? "play" : "pause",
      currentTime: progress.position,
      song: currentSong,
      isPlaying: isPlaying,
      host: effectiveHostId, // Always include host ID in force sync
    })
  }

  // Add forceSyncWithPeers to the provider value
  return (
    <MusicContext.Provider
      value={{
        isPlayerReady,
        currentSong,
        isPlaying,
        connectedUsers,
        isMiniPlayerVisible,
        progress,
        isHost,
        socketRef,
        currentRoomId,
        currentUserId,
        hostId, // Expose hostId to components
        playSong,
        togglePlayback,
        seekTo,
        joinMusicRoom,
        sendMusicInvitation,
        acceptMusicInvitation,
        endMusicSession,
        setIsMiniPlayerVisible,
        forceSyncWithPeers,
      }}
    >
      {children}
    </MusicContext.Provider>
  )
}

export default MusicContext
