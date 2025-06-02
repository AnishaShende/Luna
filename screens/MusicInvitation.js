import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import FastImage from "react-native-fast-image"

const MusicInvitation = ({ song, onAccept, onDecline, theme = "light", isSender = false }) => {
  // Colors based on theme
  const colors = {
    dark: {
      background: "#333333",
      text: "#FFFFFF",
      subText: "#B3B3B3",
      primary: "#1DB954", // Spotify green
      secondary: "#535353",
      accept: "#1DB954",
      decline: "#FF3B30",
    },
    light: {
      background: "#F0F0F0",
      text: "#121212",
      subText: "#7D7D7D",
      primary: "#1DB954", // Spotify green
      secondary: "#E0E0E0",
      accept: "#34C759",
      decline: "#FF3B30",
    },
  }

  const activeColors = colors[theme]

  // Log only once when component renders
  console.log("MusicInvitation rendering with isSender:", isSender)

  // Ensure song object has all required properties
  const safeImage = song?.coverUrl || "https://picsum.photos/200" // Fallback image
  const safeTitle = song?.title || "Unknown Song"
  const safeArtist = song?.artist || "Unknown Artist"

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background }]}>
      <View style={styles.header}>
        <Ionicons name="musical-notes" size={18} color={activeColors.primary} />
        <Text style={[styles.headerText, { color: activeColors.text }]}>
          {isSender ? "You invited to listen together" : "Listen to music together?"}
        </Text>
      </View>

      <View style={styles.songInfo}>
        <FastImage source={{ uri: safeImage }} style={styles.cover} />
        <View style={styles.textInfo}>
          <Text style={[styles.title, { color: activeColors.text }]} numberOfLines={1}>
            {safeTitle}
          </Text>
          <Text style={[styles.artist, { color: activeColors.subText }]} numberOfLines={1}>
            {safeArtist}
          </Text>
        </View>
      </View>

      {!isSender && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, { backgroundColor: activeColors.accept }]} onPress={onAccept}>
            <Text style={styles.buttonText}>Yes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: activeColors.decline }]} onPress={onDecline}>
            <Text style={styles.buttonText}>No</Text>
          </TouchableOpacity>
        </View>
      )}

      {isSender && <Text style={[styles.waitingText, { color: activeColors.subText }]}>Waiting for response...</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    maxWidth: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  songInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cover: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  textInfo: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
  },
  artist: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  waitingText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
})

export default MusicInvitation