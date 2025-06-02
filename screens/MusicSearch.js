import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MusicContext from './MusicContext';
import MiniPlayer from './MiniPlayer';

// Sample music data with actual playable URLs
const sampleSongs = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    duration: '3:20',
    coverUrl: 'https://via.placeholder.com/300x300?text=Blinding+Lights',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: '2',
    title: 'Dance Monkey',
    artist: 'Tones and I',
    duration: '3:29',
    coverUrl: 'https://via.placeholder.com/300x300?text=Dance+Monkey',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: '3',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    duration: '2:54',
    coverUrl: 'https://via.placeholder.com/300x300?text=Watermelon+Sugar',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: '4',
    title: 'Don\'t Start Now',
    artist: 'Dua Lipa',
    duration: '3:03',
    coverUrl: 'https://via.placeholder.com/300x300?text=Dont+Start+Now',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: '5',
    title: 'Circles',
    artist: 'Post Malone',
    duration: '3:35',
    coverUrl: 'https://via.placeholder.com/300x300?text=Circles',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: '6',
    title: 'Memories',
    artist: 'Maroon 5',
    duration: '3:09',
    coverUrl: 'https://via.placeholder.com/300x300?text=Memories',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
  {
    id: '7',
    title: 'Someone You Loved',
    artist: 'Lewis Capaldi',
    duration: '3:02',
    coverUrl: 'https://via.placeholder.com/300x300?text=Someone+You+Loved',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  },
  {
    id: '8',
    title: 'Bad Guy',
    artist: 'Billie Eilish',
    duration: '3:14',
    coverUrl: 'https://via.placeholder.com/300x300?text=Bad+Guy',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  },
];

const MusicSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSongs, setFilteredSongs] = useState(sampleSongs);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState('light');
  const [roomJoined, setRoomJoined] = useState(false);
  
  const navigation = useNavigation();
  const route = useRoute();
  
  const {
    playSong,
    sendMusicInvitation,
    joinMusicRoom,
    isMiniPlayerVisible,
  } = useContext(MusicContext);
  
  // Colors based on theme
  const colors = {
    dark: {
      background: '#111111',
      card: '#222222',
      text: '#FFFFFF',
      subText: '#AAAAAA',
      primary: '#0099FF',
      inputBackground: '#333333',
      border: '#444444',
      statusBarStyle: 'light-content',
    },
    light: {
      background: '#F5F5F5',
      card: '#FFFFFF',
      text: '#222222',
      subText: '#666666',
      primary: '#0099FF',
      inputBackground: '#EEEEEE',
      border: '#DDDDDD',
      statusBarStyle: 'dark-content',
    },
  };
  
  const activeColors = colors[theme];
  
  // Load theme from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Join music room when component mounts
  useEffect(() => {
    if (route?.params?.senderId && route?.params?.receiverId && !roomJoined) {
      const joined = joinMusicRoom(route?.params?.senderId, route?.params?.receiverId);
      if (joined) {
        setRoomJoined(true);
        console.log(`Successfully joined music room for ${route?.params?.senderId} and ${route?.params?.receiverId}`);
      }
    }
  }, [route?.params, roomJoined]);
  
  // Filter songs based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSongs(sampleSongs);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = sampleSongs.filter(
        song =>
          song.title.toLowerCase().includes(lowercasedQuery) ||
          song.artist.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery]);
  
  // Handle song selection
  const handleSongSelect = (song) => {
    const senderId = route?.params?.senderId;
    const receiverId = route?.params?.receiverId;
    
    if (!senderId || !receiverId) {
      Alert.alert('Error', 'Missing sender or receiver ID');
      return;
    }
    
    // Play the song
    playSong(song, senderId, receiverId, 'host');
    
    // Navigate to music player
    navigation.navigate('MusicPlayer', {
      song,
      senderId: senderId,
      receiverId: receiverId,
      mode: 'host'
    });
  };
  
  // Send invitation to listen together
  const handleSendInvitation = (song) => {
    const senderId = route?.params?.senderId;
    const receiverId = route?.params?.receiverId;
    
    if (!senderId || !receiverId) {
      Alert.alert('Error', 'Missing sender or receiver ID');
      return;
    }
    
    // Send invitation
    const roomId = sendMusicInvitation(senderId, receiverId, song);
    
    if (roomId) {
      // Show confirmation
      Alert.alert(
        'Invitation Sent', 
        `Invitation sent to listen to "${song.title}"`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to music player immediately for the sender
              navigation.navigate('MusicPlayer', {
                song,
                senderId: senderId,
                receiverId: receiverId,
                mode: 'host'
              });
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    }
  };
  
  // Render song item
  const renderSongItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.songCard, { backgroundColor: activeColors.card, borderColor: activeColors.border }]}
      onPress={() => handleSongSelect(item)}
    >
      <Image source={{ uri: item.coverUrl }} style={styles.songCover} />
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, { color: activeColors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.songArtist, { color: activeColors.subText }]} numberOfLines={1}>
          {item.artist}
        </Text>
        <Text style={[styles.songDuration, { color: activeColors.subText }]}>
          {item.duration}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.inviteButton, { backgroundColor: activeColors.primary }]}
        onPress={() => handleSendInvitation(item)}
      >
        <Text style={styles.inviteButtonText}>Invite</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
      <StatusBar barStyle={activeColors.statusBarStyle} backgroundColor={activeColors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={activeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeColors.text }]}>Music</Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: activeColors.inputBackground }]}>
        <Ionicons name="search" size={20} color={activeColors.subText} />
        <TextInput
          style={[styles.searchInput, { color: activeColors.text }]}
          placeholder="Search for songs..."
          placeholderTextColor={activeColors.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={activeColors.subText} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Song List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={activeColors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredSongs}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.songList,
            { paddingBottom: isMiniPlayerVisible ? 80 : 20 } // Add padding for mini player
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes" size={50} color={activeColors.subText} />
              <Text style={[styles.emptyText, { color: activeColors.subText }]}>
                No songs found
              </Text>
            </View>
          }
        />
      )}
      
      {/* Mini Player */}
      {isMiniPlayerVisible && <MiniPlayer theme={theme} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    padding: 0,
  },
  songList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  songCover: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  songArtist: {
    fontSize: 14,
    marginTop: 2,
  },
  songDuration: {
    fontSize: 12,
    marginTop: 4,
  },
  inviteButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default MusicSearch;