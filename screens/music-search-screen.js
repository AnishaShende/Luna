"use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import Ionicons from "react-native-vector-icons/Ionicons"
import SocketIOClient from "socket.io-client"
import MiniPlayer from "./mini-player"
import { useMusic } from "./music-context"

const { width, height } = Dimensions.get("window")

// Sample songs for demo purposes
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
  {
    id: "4",
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: "3:20",
    coverUrl: "https://via.placeholder.com/300x300?text=Blinding+Lights",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    id: "5",
    title: "Dance Monkey",
    artist: "Tones and I",
    duration: "3:29",
    coverUrl: "https://via.placeholder.com/300x300?text=Dance+Monkey",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  {
    id: "6",
    title: "Bad Guy",
    artist: "Billie Eilish",
    duration: "3:14",
    coverUrl: "https://via.placeholder.com/300x300?text=Bad+Guy",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
  {
    id: "7",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    duration: "2:54",
    coverUrl: "https://via.placeholder.com/300x300?text=Watermelon+Sugar",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  },
  {
    id: "8",
    title: "Don't Start Now",
    artist: "Dua Lipa",
    duration: "3:03",
    coverUrl: "https://via.placeholder.com/300x300?text=Don't+Start+Now",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
  {
    id: "9",
    title: "Circles",
    artist: "Post Malone",
    duration: "3:35",
    coverUrl: "https://via.placeholder.com/300x300?text=Circles",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  },
  {
    id: "10",
    title: "Someone You Loved",
    artist: "Lewis Capaldi",
    duration: "3:02",
    coverUrl: "https://via.placeholder.com/300x300?text=Someone+You+Loved",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  },
]

const MusicSearchScreen = () => {
  // States
  const [searchQuery, setSearchQuery] = useState("")
  const [songs, setSongs] = useState(sampleSongs)
  const [filteredSongs, setFilteredSongs] = useState(sampleSongs)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSong, setSelectedSong] = useState(null)
  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const [invitationSent, setInvitationSent] = useState(false)

  // Get music context
  const {
    currentSong,
    isPlaying,
    playSong,
    pauseSong,
    stopPlayback, // ✅ Make sure this is added
    togglePlayPause,
    currentTime,
    duration,
  } = useMusic()

  // Refs
  const socketRef = useRef(null)

  // Hooks
  const navigation = useNavigation()
  const route = useRoute()

  // Extract params
  const senderId = route?.params?.senderId
  const receiverId = route?.params?.receiverId
  const receiverName = route?.params?.receiverName || "User"

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = SocketIOClient("http://192.168.210.169:9000")

    socketRef.current.on("connect", () => {
      console.log("Connected to Socket.IO server for music search")
    })

    socketRef.current.on("musicInvitationAccepted", (data) => {
      if (data.roomId === `music_${senderId}_${receiverId}`) {
        // Navigate to music player as host
        navigation.navigate("MusicPlayer", {
          song: selectedSong,
          senderId: senderId,
          receiverId: receiverId,
          receiverName: receiverName,
          mode: "host",
        })
      }
    })

    socketRef.current.on("musicInvitationDeclined", (data) => {
      if (data.roomId === `music_${senderId}_${receiverId}`) {
        Alert.alert("Invitation Declined", `${receiverName} has declined your invitation.`)
        setInvitationSent(false)
      }
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [selectedSong])

  // Search function
  const handleSearch = (text) => {
    setSearchQuery(text)
    if (!text.trim()) {
      setFilteredSongs(songs)
      return
    }

    const filtered = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(text.toLowerCase()) || song.artist.toLowerCase().includes(text.toLowerCase()),
    )
    setFilteredSongs(filtered)
  }

  // Select song and show options
  const handleSelectSong = (song) => {
    setSelectedSong(song)
    setInviteModalVisible(true)
  }

  // Send invitation to listen together
  const sendInvitation = () => {
    if (!selectedSong || !socketRef.current) return

    try {
      // Send invitation message to chat
      socketRef.current.emit("sendMessage", {
        senderId: senderId,
        receiverId: receiverId,
        message: `Hey, can we listen to "${selectedSong.title}" by ${selectedSong.artist} together?`,
        type: "musicInvitationRequest",
        songData: selectedSong,
        timestamp: new Date(),
      })

      setInvitationSent(true)
      setInviteModalVisible(false)

      // Navigate back to chat
      navigation.goBack()
    } catch (error) {
      console.error("Error sending invitation:", error)
      Alert.alert("Error", "Failed to send invitation. Please try again.")
    }
  }

  // Listen alone
  const listenAlone = () => {
    if (!selectedSong) return

    // Play the song using the context
    playSong(selectedSong)

    // Navigate to music player
    navigation.navigate("MusicPlayer", {
      song: selectedSong,
      senderId: senderId,
      receiverId: receiverId,
      mode: "solo",
    })

    setInviteModalVisible(false)
  }

  // Share song to chat
  const shareToChat = () => {
    if (!selectedSong || !socketRef.current) return

    try {
      // Send message with music data
      socketRef.current.emit("sendMessage", {
        senderId: senderId,
        receiverId: receiverId,
        message: `Check out this song: "${selectedSong.title}" by ${selectedSong.artist}`,
        musicData: selectedSong,
        timestamp: new Date(),
      })

      setInviteModalVisible(false)
      navigation.goBack()
    } catch (error) {
      console.error("Error sharing song:", error)
      Alert.alert("Error", "Failed to share song. Please try again.")
    }
  }

  // Navigate to full player
  const navigateToFullPlayer = () => {
    if (currentSong) {
      navigation.navigate("MusicPlayer", {
        song: currentSong,
        senderId: senderId,
        receiverId: receiverId,
        mode: "solo",
      })
    }
  }

  // Render song item
  const renderSongItem = ({ item }) => (
    <TouchableOpacity style={styles.songItem} onPress={() => handleSelectSong(item)}>
      <Image source={{ uri: item.coverUrl }} style={styles.songCover} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <Text style={styles.songDuration}>{item.duration}</Text>
    </TouchableOpacity>
  )

  // Calculate bottom padding for FlatList to account for mini player
  const listBottomPadding = currentSong ? 80 : 0

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Music Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for songs or artists..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity style={styles.clearButton} onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={20} color="#999999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Song List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#0099FF" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredSongs}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.songList, { paddingBottom: listBottomPadding }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes" size={50} color="#CCCCCC" />
              <Text style={styles.emptyText}>No songs found</Text>
            </View>
          }
        />
      )}

      {/* Mini Player */}
      {currentSong && (
  <MiniPlayer
    song={currentSong}
    isPlaying={isPlaying}
    onPlayPause={togglePlayPause}
    onPress={navigateToFullPlayer}
    currentTime={currentTime}
    duration={duration}
    onStop={stopPlayback} // Add this line
  />
)}

      {/* Invite Modal */}
      <Modal visible={inviteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Song Options</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setInviteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>

            {selectedSong && (
              <View style={styles.selectedSongContainer}>
                <Image source={{ uri: selectedSong.coverUrl }} style={styles.modalCover} />
                <View style={styles.modalSongInfo}>
                  <Text style={styles.modalSongTitle}>{selectedSong.title}</Text>
                  <Text style={styles.modalSongArtist}>{selectedSong.artist}</Text>
                  <Text style={styles.modalSongDuration}>{selectedSong.duration}</Text>
                </View>
              </View>
            )}

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: "#0099FF" }]}
                onPress={sendInvitation}
                disabled={invitationSent}
              >
                <Ionicons name="people" size={20} color="#FFFFFF" />
                <Text style={styles.optionText}>
                  {invitationSent ? "Invitation Sent" : `Invite ${receiverName} to Listen`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.optionButton, { backgroundColor: "#4CD964" }]} onPress={listenAlone}>
                <Ionicons name="headset" size={20} color="#FFFFFF" />
                <Text style={styles.optionText}>Listen Alone</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.optionButton, { backgroundColor: "#FF9500" }]} onPress={shareToChat}>
                <Ionicons name="share" size={20} color="#FFFFFF" />
                <Text style={styles.optionText}>Share to Chat</Text>
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
    color: "#333333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333333",
  },
  clearButton: {
    padding: 5,
  },
  songList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  songCover: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  songInfo: {
    flex: 1,
    marginLeft: 15,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
  },
  songArtist: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  songDuration: {
    fontSize: 14,
    color: "#999999",
    marginLeft: 10,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#999999",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  closeButton: {
    padding: 5,
  },
  selectedSongContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalCover: {
    width: 70,
    height: 70,
    borderRadius: 5,
  },
  modalSongInfo: {
    flex: 1,
    marginLeft: 15,
  },
  modalSongTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  modalSongArtist: {
    fontSize: 16,
    color: "#666666",
    marginTop: 2,
  },
  modalSongDuration: {
    fontSize: 14,
    color: "#999999",
    marginTop: 5,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginLeft: 10,
  },
})

export default MusicSearchScreen
