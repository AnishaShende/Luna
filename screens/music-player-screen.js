"use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import Ionicons from "react-native-vector-icons/Ionicons"
import SocketIOClient from "socket.io-client"
import { useMusic } from "./music-context"

const { width, height } = Dimensions.get("window")

// Default song to use if audio loading fails
const DEFAULT_SONG = {
  id: "1",
  title: "Shape of You",
  artist: "Ed Sheeran",
  duration: "3:53",
  coverUrl: "https://via.placeholder.com/300x300?text=Shape+of+You",
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
}

// Sample songs array (replace with your actual data source)
const sampleSongs = [
  {
    id: "1",
    title: "Shape of You",
    artist: "Ed Sheeran",
    duration: "3:53",
    coverUrl: "https://via.placeholder.com/300x300?text=Shape+of+You",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "2",
    title: "Despacito",
    artist: "Luis Fonsi",
    duration: "3:48",
    coverUrl: "https://via.placeholder.com/300x300?text=Despacito",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "3",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    duration: "4:30",
    coverUrl: "https://via.placeholder.com/300x300?text=Uptown+Funk",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
]

const MusicPlayerScreen = () => {
  // Get music context
  const { currentSong, isPlaying, currentTime, duration, playSong, pauseSong, togglePlayPause, seekTo, stopPlayback } =
    useMusic()

  // States
  const [listeningTogether, setListeningTogether] = useState(false)
  const [invitationModalVisible, setInvitationModalVisible] = useState(false)
  const [invitationResponse, setInvitationResponse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Refs
  const socketRef = useRef(null)
  const animatedValue = useRef(new Animated.Value(0)).current

  // Hooks
  const navigation = useNavigation()
  const route = useRoute()

  // Extract params
  const songParam = route?.params?.song
  const songId = route?.params?.songId
  const senderId = route?.params?.senderId
  const receiverId = route?.params?.receiverId
  const receiverName = route?.params?.receiverName || "User"
  const mode = route?.params?.mode || "solo" // 'host', 'guest', or 'solo'

  // Animation for rotating album cover
  const rotateInterpolation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  // Start rotation animation
  const startRotation = () => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      }),
    ).start()
  }

  // Stop rotation animation
  const stopRotation = () => {
    animatedValue.stopAnimation()
  }

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Initialize socket connection
  useEffect(() => {
    try {
      socketRef.current = SocketIOClient("http://192.168.210.169:9000")

      socketRef.current.on("connect", () => {
        console.log("Connected to music socket server")

        // If this is a host or guest, join the music room
        if (mode !== "solo") {
          const roomId = `music_${senderId}_${receiverId}`
          socketRef.current.emit("joinMusicRoom", { roomId, userId: senderId })
          setListeningTogether(true)
        }
      })

      socketRef.current.on("musicRoomState", (state) => {
        console.log("Received music room state:", state)
        if (state.isPlaying) {
          if (!isPlaying) {
            playSong(currentSong)
          }
          seekTo(state.currentTime)
          startRotation()
        } else {
          pauseSong()
          seekTo(state.currentTime)
          stopRotation()
        }
      })

      socketRef.current.on("musicStateUpdate", (state) => {
        console.log("Received music state update:", state)
        if (state.isPlaying) {
          if (!isPlaying) {
            playSong(currentSong)
          }
          seekTo(state.currentTime)
          startRotation()
        } else {
          pauseSong()
          stopRotation()
        }
      })

      socketRef.current.on("musicInvitation", (invitation) => {
        if (invitation.to === senderId) {
          // Load the song from invitation
          playSong(invitation.song)
          setInvitationModalVisible(true)
        }
      })

      socketRef.current.on("musicInvitationAccepted", (data) => {
        if (data.roomId === `music_${senderId}_${receiverId}`) {
          setInvitationResponse("accepted")
          setListeningTogether(true)

          // Start playing for both users
          socketRef.current.emit("musicControl", {
            roomId: `music_${senderId}_${receiverId}`,
            action: "play",
            songId: currentSong?.id,
            currentTime: 0,
          })
        }
      })

      socketRef.current.on("musicControl", (command) => {
        if (command.action === "stop") {
          stopPlayback()
        }
      })

      // Clean up socket connection
      return () => {
        if (socketRef.current) {
          if (mode !== "solo") {
            const roomId = `music_${senderId}_${receiverId}`
            socketRef.current.emit("leaveMusicRoom", { roomId, userId: senderId })
          }
          socketRef.current.disconnect()
        }
      }
    } catch (error) {
      console.error("Socket initialization error:", error)
      Alert.alert("Connection Error", "Failed to connect to the music server")
    }
  }, [])

  // Initialize song data and audio
  useEffect(() => {
    const initializeSong = async () => {
      try {
        setIsLoading(true)
        let songToPlay = null

        if (songParam) {
          songToPlay = songParam
        } else if (songId) {
          songToPlay = sampleSongs.find((s) => s.id === songId) || DEFAULT_SONG
        } else if (currentSong) {
          songToPlay = currentSong
        } else {
          songToPlay = DEFAULT_SONG
        }

        // Play the song using context
        if (songToPlay !== currentSong) {
          await playSong(songToPlay)
        } else if (!isPlaying) {
          togglePlayPause()
        }

        // Start rotation if playing
        if (isPlaying) {
          startRotation()
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing song:", error)
        setIsLoading(false)
      }
    }

    initializeSong()

    // Start/stop rotation based on play state
    if (isPlaying) {
      startRotation()
    } else {
      stopRotation()
    }

    // Clean up animation on unmount
    return () => {
      stopRotation()
    }
  }, [songParam, songId])

  // Effect to handle play/pause state changes
  useEffect(() => {
    if (isPlaying) {
      startRotation()
    } else {
      stopRotation()
    }
  }, [isPlaying])

  // Broadcast mini-player state to chat room
  const broadcastMiniPlayerState = () => {
    if (socketRef.current && currentSong) {
      socketRef.current.emit("broadcastMusicState", {
        roomId: `music_${senderId}_${receiverId}`,
        song: currentSong,
        isPlaying: isPlaying,
        currentTime: currentTime,
      })
    }
  }

  // Handle play/pause with socket communication
  const handlePlayPause = () => {
    togglePlayPause()

    if (listeningTogether && socketRef.current) {
      socketRef.current.emit("musicControl", {
        roomId: `music_${senderId}_${receiverId}`,
        action: isPlaying ? "pause" : "play",
        currentTime,
      })
    }

    // Broadcast state to chat room
    broadcastMiniPlayerState()
  }

  // Handle seek with socket communication
  const handleSeek = (value) => {
    seekTo(value)

    if (listeningTogether && socketRef.current) {
      socketRef.current.emit("musicControl", {
        roomId: `music_${senderId}_${receiverId}`,
        action: "seek",
        currentTime: value,
      })
    }

    // Broadcast state to chat room
    broadcastMiniPlayerState()
  }

  // Handle stop with socket communication
  const handleStop = () => {
    stopPlayback()

    // Broadcast stopped state
    broadcastMiniPlayerState()

    if (listeningTogether && socketRef.current) {
      socketRef.current.emit("musicControl", {
        roomId: `music_${senderId}_${receiverId}`,
        action: "stop",
      })
    }
  }

  // Invite to listen together
  const inviteToListenTogether = () => {
    if (!currentSong || !socketRef.current) return

    socketRef.current.emit("musicInvitation", {
      from: senderId,
      to: receiverId,
      song: currentSong,
    })

    // Send invitation message to chat
    socketRef.current.emit("sendMessage", {
      senderId: senderId,
      receiverId: receiverId,
      message: `Hey, can we listen to "${currentSong.title}" by ${currentSong.artist} together?`,
      type: "musicInvitationRequest",
      songData: currentSong,
      timestamp: new Date(),
    })

    Alert.alert(
      "Invitation Sent",
      `Invitation to listen to "${currentSong.title}" together has been sent to ${receiverName}.`,
      [{ text: "OK" }],
    )
  }

  // Accept invitation
  const acceptInvitation = () => {
    if (!socketRef.current) return

    setInvitationModalVisible(false)
    setListeningTogether(true)

    socketRef.current.emit("acceptMusicInvitation", {
      roomId: `music_${senderId}_${receiverId}`,
      userId: senderId,
    })
  }

  // Decline invitation
  const declineInvitation = () => {
    setInvitationModalVisible(false)

    if (socketRef.current) {
      socketRef.current.emit("musicInvitationDeclined", {
        roomId: `music_${senderId}_${receiverId}`,
        userId: senderId,
      })
    }
  }

  // End listening together session
  const endListeningTogether = () => {
    if (!socketRef.current) return

    setListeningTogether(false)

    // Notify the other user
    socketRef.current.emit("endMusicSession", {
      roomId: `music_${senderId}_${receiverId}`,
      userId: senderId,
    })

    // Update mini-player state
    broadcastMiniPlayerState()
  }


  

  // Custom progress bar component
  const ProgressBar = ({ value, duration, onSeek }) => {
    const progress = value / duration || 0

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(value)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
    )
  }

  if (isLoading || !currentSong) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer, { backgroundColor: "#FFFFFF" }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={[styles.loadingText, { color: "#333333" }]}>Loading music...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color="#333333" />
        </TouchableOpacity>

        {listeningTogether && (
          <View style={[styles.listeningTogetherBadge, { backgroundColor: "#8B0000" }]}>
            <Ionicons name="people" size={16} color="#FFFFFF" />
            <Text style={styles.listeningTogetherText}>Listening with {receiverName}</Text>
          </View>
        )}

        <Text style={[styles.headerTitle, { color: "#333333" }]}>Now Playing</Text>
      </View>

      {/* Album Cover */}
      <View style={styles.albumContainer}>
        <Animated.View style={[styles.albumWrapper, { transform: [{ rotate: rotateInterpolation }] }]}>
          <Image
            source={{
              uri:
                currentSong.coverUrl ||
                `https://via.placeholder.com/300x300?text=${encodeURIComponent(currentSong.title)}`,
            }}
            style={styles.albumCover}
          />
        </Animated.View>
      </View>

      {/* Song Info */}
      <View style={styles.songInfoContainer}>
        <Text style={[styles.songTitle, { color: "#333333" }]}>{currentSong.title}</Text>
        <Text style={[styles.songArtist, { color: "#666666" }]}>{currentSong.artist}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar value={currentTime} duration={duration} onSeek={handleSeek} />
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="play-skip-back" size={24} color="#333333" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton]} onPress={handleStop}>
          <Ionicons name="stop" size={24} color="#333333" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.playPauseButton, { backgroundColor: "#8B0000" }]} onPress={handlePlayPause}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={30} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="play-skip-forward" size={24} color="#333333" />
        </TouchableOpacity>
      </View>

      {/* Listen Together Button */}
      {!listeningTogether ? (
        <TouchableOpacity
          style={[styles.listenTogetherButton, { backgroundColor: "#8B0000" }]}
          onPress={inviteToListenTogether}
        >
          <Ionicons name="people" size={20} color="#FFFFFF" />
          <Text style={styles.listenTogetherButtonText}>Invite {receiverName} to Listen Together</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.listenTogetherButton, styles.endSessionButton, { backgroundColor: "#FF3B30" }]}
          onPress={endListeningTogether}
        >
          <Ionicons name="close-circle" size={20} color="#FFFFFF" />
          <Text style={styles.listenTogetherButtonText}>End Listening Session</Text>
        </TouchableOpacity>
      )}

      {/* Invitation Modal */}
      <Modal visible={invitationModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: "#FFFFFF" }]}>
            <Image
              source={{
                uri:
                  currentSong?.coverUrl ||
                  `https://via.placeholder.com/100x100?text=${encodeURIComponent(currentSong?.title || "Music")}`,
              }}
              style={styles.modalAlbumCover}
            />

            <Text style={[styles.modalTitle, { color: "#333333" }]}>Listen Together Invitation</Text>
            <Text style={[styles.modalText, { color: "#666666" }]}>
              {receiverName} wants to listen to "{currentSong?.title}" with you.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.declineButton, { backgroundColor: "#F2F2F2" }]}
                onPress={declineInvitation}
              >
                <Text style={[styles.modalButtonText, { color: "#333333" }]}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.acceptButton, { backgroundColor: "#8B0000" }]}
                onPress={acceptInvitation}
              >
                <Text style={styles.modalButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  listeningTogetherBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    position: "absolute",
    right: 15,
  },
  listeningTogetherText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  albumContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  albumWrapper: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  albumCover: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E5E5",
  },
  songInfoContainer: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  songArtist: {
    fontSize: 18,
    marginTop: 8,
    textAlign: "center",
  },
  progressContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    width: "100%",
  },
  progressBackground: {
    height: 6,
    backgroundColor: "#E5E5E5",
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: "#8B0000",
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  timeText: {
    color: "#666666",
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 30,
  },
  controlButton: {
    padding: 15,
  },
  playPauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 30,
  },
  listenTogetherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 30,
    marginTop: 40,
  },
  endSessionButton: {
    backgroundColor: "#FF3B30",
  },
  listenTogetherButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    width: width * 0.8,
    alignItems: "center",
  },
  modalAlbumCover: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  declineButton: {
    backgroundColor: "#444444",
  },
  acceptButton: {
    backgroundColor: "#00C6FF",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
})

export default MusicPlayerScreen
