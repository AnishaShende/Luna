import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import Ionicons from "react-native-vector-icons/Ionicons"

const { width } = Dimensions.get("window")

const MiniPlayer = ({ song, isPlaying, onPlayPause, onPress, currentTime, duration, onStop }) => {
  const navigation = useNavigation()

  if (!song) return null

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={onPress}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <View style={styles.content}>
        <Image
          source={{ uri: song.coverUrl || `https://via.placeholder.com/60x60?text=${encodeURIComponent(song.title)}` }}
          style={styles.cover}
        />

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.stopButton} onPress={onStop}>
            <Ionicons name="stop" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    width: width,
    backgroundColor: "#8B0000", // Dark red background
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  progressContainer: {
    width: "100%",
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FFFFFF",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: "#E5E5E5",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  artist: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  stopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
})

export default MiniPlayer