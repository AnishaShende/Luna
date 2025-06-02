import React, { createContext, useState, useEffect, useRef } from 'react';
import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  useTrackPlayerEvents,
  usePlaybackState,
  useProgress,
} from 'react-native-track-player';
import { io } from 'socket.io-client';


export const MusicContext = createContext();

const setupPlayer = async () => {
  try {
    await TrackPlayer.setupPlayer({
      waitForBuffer: true,
    });
    
    await TrackPlayer.updateOptions({
      stopWithApp: true,
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
      ],
    });
    
    return true;
  } catch (error) {
    console.error('Error setting up the player:', error);
    return false;
  }
};

export const MusicProvider = ({ children }) => {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  
  const socketRef = useRef(null);
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const navigation = useNavigation();
  
  // Initialize player
  useEffect(() => {
    let unmounted = false;
    
    (async () => {
      const setup = await setupPlayer();
      if (unmounted) return;
      
      setIsPlayerReady(setup);
    })();
    
    return () => {
      unmounted = true;
    };
  }, []);
  
  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io('http://192.168.210.169:9000');
    
    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });
    
    socketRef.current.on('musicStateUpdate', (state) => {
      if (state.song) {
        setCurrentSong(state.song);
        setIsPlaying(state.isPlaying);
        
        if (state.participants) {
          setConnectedUsers(state.participants);
        }
        
        // Update mini player visibility
        setIsMiniPlayerVisible(true);
        
        // Update track player state
        updatePlayerState(state);
      }
      
      if (state.isPlaying === false && !state.song) {
        setCurrentSong(null);
        setIsPlaying(false);
        setIsMiniPlayerVisible(false);
        TrackPlayer.reset();
      }
    });
    
    socketRef.current.on('musicSessionEnded', () => {
      setCurrentSong(null);
      setIsPlaying(false);
      setConnectedUsers([]);
      setIsMiniPlayerVisible(false);
      TrackPlayer.reset();
    });
    
    // Add listener for music invitation accepted
    socketRef.current.on('musicInvitationAccepted', (data) => {
      console.log('Music invitation accepted:', data);
      
      // If this is the sender of the invitation, navigate to music player
      if (data.roomId === currentRoomId) {
        // Extract senderId and receiverId from roomId (format: music_senderId_receiverId)
        const roomParts = data.roomId.split('_');
        if (roomParts.length === 3) {
          const senderId = roomParts[1];
          const receiverId = roomParts[2];
          
          // If we're the sender, navigate to music player
          if (socketRef.current.id === senderId || data.invitationSenderId === socketRef.current.id) {
            // Set current song if available
            if (data.songData) {
              setCurrentSong(data.songData);
            }
            
            // Navigate to music player
            navigation.navigate('MusicPlayer', {
              song: data.songData,
              senderId: senderId,
              receiverId: receiverId,
              mode: 'host'
            });
          }
        }
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [navigation, currentRoomId]);
  
  // Track player events
  useTrackPlayerEvents([Event.PlaybackState], (event) => {
    if (event.state === State.Playing) {
      setIsPlaying(true);
    } else if (event.state === State.Paused || event.state === State.Stopped) {
      setIsPlaying(false);
    }
  });
  
  // Update player state based on socket updates
  const updatePlayerState = async (state) => {
    if (!isPlayerReady) return;
    
    try {
      const queue = await TrackPlayer.getQueue();
      const currentTrack = await TrackPlayer.getCurrentTrack();
      
      // If the song is different, load it
      if (state.song && (!currentTrack || queue.length === 0 || queue[0].id !== state.song.id)) {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: state.song.id,
          url: state.song.audioUrl,
          title: state.song.title,
          artist: state.song.artist,
          artwork: state.song.coverUrl,
        });
      }
      
      // Sync playback state
      if (state.isPlaying && playbackState !== State.Playing) {
        await TrackPlayer.play();
      } else if (!state.isPlaying && playbackState === State.Playing) {
        await TrackPlayer.pause();
      }
      
      // Sync position if needed and not host
      if (!isHost && state.currentTime !== undefined) {
        const currentPosition = progress.position;
        const diff = Math.abs(currentPosition - state.currentTime);
        
        // Only seek if the difference is significant (more than 2 seconds)
        if (diff > 2) {
          await TrackPlayer.seekTo(state.currentTime);
        }
      }
    } catch (error) {
      console.error('Error updating player state:', error);
    }
  };
  
  // Play a song
  const playSong = async (song, roomId, mode = 'host') => {
    if (!isPlayerReady) return;
    
    try {
      setCurrentSong(song);
      setCurrentRoomId(roomId);
      setIsHost(mode === 'host');
      setIsMiniPlayerVisible(true);
      
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: song.id,
        url: song.audioUrl,
        title: song.title,
        artist: song.artist,
        artwork: song.coverUrl,
      });
      
      await TrackPlayer.play();
      
      // If host, broadcast the state
      if (mode === 'host' && socketRef.current) {
        socketRef.current.emit('musicControl', {
          roomId,
          action: 'play',
          song: song,
          currentTime: 0
        });
      }
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };
  
  // Toggle play/pause
  const togglePlayback = async () => {
    if (!isPlayerReady || !currentSong || !currentRoomId) return;
    
    try {
      const newState = !isPlaying;
      
      if (newState) {
        await TrackPlayer.play();
      } else {
        await TrackPlayer.pause();
      }
      
      // If host, broadcast the state
      if (isHost && socketRef.current) {
        socketRef.current.emit('musicControl', {
          roomId: currentRoomId,
          action: newState ? 'play' : 'pause',
          currentTime: progress.position
        });
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };
  
  // Stop playback
  const stopPlayback = async () => {
    if (!isPlayerReady || !currentRoomId) return;
    
    try {
      await TrackPlayer.reset();
      setCurrentSong(null);
      setIsPlaying(false);
      setIsMiniPlayerVisible(false);
      
      // Broadcast stop action
      if (socketRef.current) {
        socketRef.current.emit('musicControl', {
          roomId: currentRoomId,
          action: 'stop'
        });
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };
  
  // Seek to position
  const seekTo = async (position) => {
    if (!isPlayerReady || !isHost || !currentRoomId) return;
    
    try {
      await TrackPlayer.seekTo(position);
      
      // Broadcast seek action
      if (socketRef.current) {
        socketRef.current.emit('musicControl', {
          roomId: currentRoomId,
          action: 'seek',
          currentTime: position
        });
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };
  
  // Join a music room
  const joinMusicRoom = (roomId, userId) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('joinMusicRoom', {
      roomId,
      userId
    });
    
    setCurrentRoomId(roomId);
  };
  
  // Send music invitation
  const sendMusicInvitation = (senderId, receiverId, song) => {
    if (!socketRef.current) return;
    
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
        isInvitation: true
      },
      timestamp: new Date(),
    };
    
    // Send the message through socket
    socketRef.current.emit('sendMessage', messageData);
  };
  
  // Accept music invitation
  const acceptMusicInvitation = (roomId, userId, song) => {
    if (!socketRef.current) return;
    
    // Extract the sender ID from the room ID (format: music_senderId_receiverId)
    const roomParts = roomId.split('_');
    const invitationSenderId = roomParts.length === 3 ? roomParts[1] : null;
    
    // Accept the invitation with the song data
    socketRef.current.emit('acceptMusicInvitation', {
      roomId,
      userId,
      songData: song
    });
    
    // Also emit a specific event to notify the sender to navigate to the music player
    socketRef.current.emit('musicInvitationAccepted', {
      roomId,
      acceptedBy: userId,
      songData: song,
      invitationSenderId: invitationSenderId
    });
    
    setCurrentRoomId(roomId);
    setIsHost(false);
  };
  
  // End music session
  const endMusicSession = (roomId, userId) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('endMusicSession', {
      roomId,
      userId
    });
    
    setCurrentSong(null);
    setIsPlaying(false);
    setConnectedUsers([]);
    setIsMiniPlayerVisible(false);
    setCurrentRoomId(null);
    TrackPlayer.reset();
  };
  
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
        playSong,
        togglePlayback,
        stopPlayback,
        seekTo,
        joinMusicRoom,
        sendMusicInvitation,
        acceptMusicInvitation,
        endMusicSession,
        setIsMiniPlayerVisible,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export default MusicContext;