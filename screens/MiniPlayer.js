import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MiniPlayer = ({ song, isPlaying, onPress, onPlayPause, theme = 'light' }) => {
  if (!song) return null;
  
  // Colors based on theme
  const colors = {
    dark: {
      background: '#1E1E1E',
      text: '#FFFFFF',
      subText: '#AAAAAA',
      primary: '#0984E3',
    },
    light: {
      background: '#F0F2F5',
      text: '#262626',
      subText: '#65676B',
      primary: '#0984E3',
    },
  };
  
  const activeColors = colors[theme];
  
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: activeColors.background }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: song.coverUrl }}
        style={styles.cover}
      />
      
      <View style={styles.info}>
        <Text style={[styles.title, { color: activeColors.text }]} numberOfLines={1}>
          {song.title}
        </Text>
        
        <Text style={[styles.artist, { color: activeColors.subText }]} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={24}
          color={activeColors.primary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  artist: {
    fontSize: 12,
    marginTop: 2,
  },
  playButton: {
    padding: 8,
  },
});

export default MiniPlayer;