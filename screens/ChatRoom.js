"use client"

import { useState, useLayoutEffect, useEffect, useRef, useCallback } from "react"
import {
  Text,
  View,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Modal,
  useColorScheme,
  Alert,
  StyleSheet,
  Animated,
  Easing,
} from "react-native"
import { io } from "socket.io-client"
import axios from "axios"
import { launchCamera, launchImageLibrary } from "react-native-image-picker"
import FastImage from "react-native-fast-image"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { jwtDecode } from "jwt-decode"
//import Sound from 'react-native-sound';
// Import icons from vector libraries
import Ionicons from "react-native-vector-icons/Ionicons"
import Feather from "react-native-vector-icons/Feather"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useNavigation, useRoute } from "@react-navigation/native"

const { width, height } = Dimensions.get("window")

// Socket server URL - make sure this is correct
const SOCKET_URL = "https://socket-ifia.onrender.com/";

// API URL for AI response generation
const API_URL = "https://socket-ifia.onrender.com"

const ChatRoom = () => {
  // States
  const [message, setMessage] = useState("")
  const [imageUri, setImageUri] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [userId, setUserId] = useState("")
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [theme, setTheme] = useState("light") // Default to light theme
  const [socketConnected, setSocketConnected] = useState(false)
  const [typingAnimation] = useState(new Animated.Value(0))
  const [isTyping, setIsTyping] = useState(false)

  // AI Response Generation states
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [selectedMessageForAI, setSelectedMessageForAI] = useState(null)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)

  // Refs
  const scrollViewRef = useRef()
  const inputRef = useRef()
  const socketRef = useRef(null)

  // Hooks
  const navigation = useNavigation()
  const route = useRoute()
  const systemColorScheme = useColorScheme()



// Add to top-level state definitions:
const [musicModalVisible, setMusicModalVisible] = useState(false);
const [currentSong, setCurrentSong] = useState(null);
const [isListeningTogether, setIsListeningTogether] = useState(false);
const [isPlaying, setIsPlaying] = useState(false);
const [startTime, setStartTime] = useState(null);
const soundRef = useRef(null);
const playActionRef = useRef(false);
  // Theme colors
  const colors = {
    dark: {
      background: "#121212",
      chatBackground: "#1E1E1E",
      inputBackground: "#2A2A2A",
      cardBackground: "#2A2A2A",
      receiverBackground: "#383838", // Darker background for receiver in dark mode
      text: "#FFFFFF",
      subText: "#AAAAAA",
      primary: "#0984E3", // More vibrant purple
      secondary: "#FF3366",
      border: "#333333",
      statusBarStyle: "light-content",
    },
    light: {
      background: "#F8F9FA",
      chatBackground: "#FFFFFF",
      inputBackground: "#F0F2F5",
      cardBackground: "#F8F8F8",
      receiverBackground: "#E9EAEB", // Light gray for receiver in light mode
      text: "#262626",
      subText: "#65676B",
      primary: "#0984E3", // More vibrant purple
      secondary: "#FF3366",
      border: "#E4E6EB",
      statusBarStyle: "dark-content",
    },
  }

  // Active colors based on current theme
  const activeColors = colors[theme]

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    AsyncStorage.setItem("userTheme", newTheme)
  }

  // Load saved theme
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("userTheme")
        if (savedTheme) {
          setTheme(savedTheme)
        } else {
          // Default to system theme if no saved preference
          setTheme(systemColorScheme || "light")
        }
      } catch (error) {
        console.log("Error loading theme", error)
      }
    }
    loadSavedTheme()
  }, [systemColorScheme])






  // Initialize socket connection
  useEffect(() => {
    // Create socket connection if it doesn't exist
    if (!socketRef.current) {
      console.log("🔌 Creating new socket connection to:", SOCKET_URL)
      socketRef.current = io(SOCKET_URL)
  
      socketRef.current.on("connect", () => {
        console.log("✅ Connected to Socket.IO server with ID:", socketRef.current.id)
        setSocketConnected(true)
      })
  
      socketRef.current.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error)
        setSocketConnected(false)
      })
  
      socketRef.current.on("disconnect", () => {
        console.log("🔌 Disconnected from Socket.IO server")
        setSocketConnected(false)
      })
    }
  
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        console.log("🧹 Disconnecting socket")
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  // Fetch user ID and register with socket
  useEffect(() => {
    const fetchUserAndRegister = async () => {
      try {
        const token = await AsyncStorage.getItem("token")
        if (token) {
          const decodedToken = jwtDecode(token)
          const currentUserId = decodedToken.userId
          setUserId(currentUserId)

          // Register user with socket server once connected
          if (socketRef.current && socketConnected) {
            console.log("Registering user with socket:", currentUserId)
            socketRef.current.emit("registerUser", currentUserId)
          }
        }
      } catch (error) {
        console.log("Error fetching user:", error)
      }
    }

    fetchUserAndRegister()
  }, [socketConnected])

  useEffect(() => {
    if (!currentSong || startTime === null) return;
  
    if (soundRef.current) {
      soundRef.current.release();
      soundRef.current = null;
    }
  
    const newSound = new Sound(currentSong.url, null, (error) => {
      if (error) {
        console.log('Failed to load sound', error);
        return;
      }
      const offset = Math.max(0, (Date.now() - startTime) / 1000);
      newSound.setCurrentTime(offset);
      if (isPlaying) newSound.play();
    });
  
    soundRef.current = newSound;
  
    return () => {
      if (soundRef.current) {
        soundRef.current.release();
        soundRef.current = null;
      }
    };
  }, [currentSong, startTime]);
  
  useEffect(() => {
    if (!soundRef.current) return;
    if (isPlaying) {
      soundRef.current.play();
    } else {
      soundRef.current.pause();
    }
  }, [isPlaying]);
  
  useEffect(() => {
    if (!socketRef.current || !userId) return;
  
    socketRef.current.on("music:request", ({ senderId, song, startTime }) => {
      Alert.alert(
        "Music Request",
        `User wants to listen to: ${song.name}`,
        [
          { text: "Decline", style: "cancel" },
          {
            text: "Accept",
            onPress: () => {
              setCurrentSong(song);
              setIsListeningTogether(true);
              setStartTime(startTime);
              setIsPlaying(true);
              socketRef.current.emit("music:accept", { senderId, song, startTime });
            }
          }
        ]
      );
    });
  
    socketRef.current.on("music:accept", ({ song, startTime }) => {
      setCurrentSong(song);
      setIsListeningTogether(true);
      setStartTime(startTime);
      setIsPlaying(true);
    });
  
    socketRef.current.on("music:play", ({ startTime }) => {
      setStartTime(startTime);
      setIsPlaying(true);
    });
  
    socketRef.current.on("music:pause", () => {
      setIsPlaying(false);
    });
  
    socketRef.current.on("music:change", (song) => setCurrentSong(song));
  }, [userId]);

  // Typing animation
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      typingAnimation.setValue(0)
    }
  }, [isTyping, typingAnimation])

  // Fetch message history
  const fetchMessages = useCallback(async () => {
    try {
      const senderId = route?.params?.senderId
      const receiverId = route?.params?.receiverId

      if (!senderId || !receiverId) return

      setInitialLoading(true)
      const response = await axios.get(`${API_URL}/messages`, {
        params: { senderId, receiverId },
      })

      setMessages(response.data || [])
      setInitialLoading(false)
      scrollToBottom()
    } catch (error) {
      console.log("Error fetching messages:", error)
      setInitialLoading(false)
    }
  }, [route?.params])

  // Send message - Improved for real-time experience
  const sendMessage = async () => {
    if (!message.trim() && !imageUri) return

    const senderId = route?.params?.senderId
    const receiverId = route?.params?.receiverId

    if (!senderId || !receiverId) {
      console.log("Sender or receiver ID missing")
      return
    }

    const messageData = {
      senderId,
      receiverId,
      message: message.trim(),
      imageUrl: imageUri,
      timestamp: new Date(),
    }

    // Optimistic update with a temporary ID
    const tempId = Math.random().toString(36).substring(7)
    const optimisticMessage = { 
      ...messageData, 
      _id: tempId, 
      // No "sending" status to avoid UI changes
    }

    // Add message to state immediately
    setMessages((prev) => [...prev, optimisticMessage])
    
    // Clear input and image
    setMessage("")
    setImageUri("")
    
    // Scroll to bottom immediately
    scrollToBottom()

    try {
      // Send through socket
      if (socketRef.current && socketConnected) {
        socketRef.current.emit("sendMessage", messageData)
        console.log("Message sent via socket:", messageData)
      } else {
        console.error("Socket not connected, can't send message")
        // If socket fails, mark message as failed
        setMessages((prev) => 
          prev.map((msg) => (msg._id === tempId ? { ...msg, failed: true } : msg))
        )
      }
    } catch (error) {
      console.log("Error sending message:", error)
      // Handle the error - mark the message as failed
      setMessages((prev) => 
        prev.map((msg) => (msg._id === tempId ? { ...msg, failed: true } : msg))
      )
    }
  }  

  // AI Response Generation Functions
  const handleMessageLongPress = (message, event) => {
    // Get the position of the long press to show the context menu
    const { pageX, pageY } = event.nativeEvent;
    setContextMenuPosition({ x: pageX, y: pageY - 100 }); // Adjust Y to show above finger
    setSelectedMessageForAI(message);
    setContextMenuVisible(true);
  };

  const generateAIResponse = async () => {
    if (!selectedMessageForAI || !selectedMessageForAI.message) {
      setContextMenuVisible(false);
      return;
    }
    
    setIsGeneratingResponse(true);
    setContextMenuVisible(false);
    
    try {
      const response = await axios.post(`${API_URL}/generate-response`, {
        message: selectedMessageForAI.message,
        userId: route?.params?.senderId || userId
      });
      
      // Set the generated response in the input field
      setMessage(response.data.reply);
      // Focus the input field
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error generating AI response:', error);
      Alert.alert('Error', 'Failed to generate AI response. Please try again.');
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // Context Menu and Loading Indicator Components
  const renderContextMenu = () => {
    if (!contextMenuVisible) return null;
    
    return (
      <Modal
        transparent={true}
        visible={contextMenuVisible}
        animationType="fade"
        onRequestClose={() => setContextMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.contextMenuOverlay} 
          activeOpacity={1}
          onPress={() => setContextMenuVisible(false)}
        >
          <View 
            style={[
              styles.contextMenu, 
              { 
                left: contextMenuPosition.x - 70, // Center the menu
                top: contextMenuPosition.y,
                backgroundColor: theme === 'dark' ? '#333' : '#fff'
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.contextMenuItem}
              onPress={generateAIResponse}
            >
              <Text style={[styles.contextMenuItemText, { color: theme === 'dark' ? '#fff' : '#333' }]}>
                ✨ Generate AI Response
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderLoadingIndicator = () => {
    if (!isGeneratingResponse) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <View style={[styles.loadingIndicator, { backgroundColor: theme === 'dark' ? '#333' : '#fff' }]}>
          <ActivityIndicator size="small" color={activeColors.primary} />
          <Text style={[styles.loadingText, { color: theme === 'dark' ? '#fff' : '#333' }]}>
            Generating response...
          </Text>
        </View>
      </View>
    );
  };

  // Media functions
  const openCamera = () => {
    launchCamera(
      {
        mediaType: "photo",
        quality: 0.8,
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) {
          console.log("User cancelled camera")
        } else if (response.error) {
          console.log("Camera error:", response.error)
        } else if (response.assets && response.assets.length > 0) {
          setImageUri(response.assets[0].uri)
        }
      },
    )
  }

  const openImageLibrary = () => {
    const options = {
      mediaType: "photo",
      quality: 0.8,
      selectionLimit: 1,
      includeBase64: false,
      presentationStyle: "pageSheet", // More modern presentation style
    }

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker")
      } else if (response.error) {
        console.log("Image picker error:", response.error)
      } else if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri)
      }
    })
  }

  // Image preview modal
  const openImagePreview = (imageUrl) => {
    setSelectedImage(imageUrl)
    setImageModalVisible(true)
  }

  // Utility functions
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true })
      }
    }, 100)
  }

  const formatTime = (time) => {
    if (!time) return ""
    const date = new Date(time)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDateForHeader = (timestamp) => {
    if (!timestamp) return ""

    const messageDate = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today"
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return messageDate.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
  }

  // Group messages by date for date headers
  const groupMessagesByDate = () => {
    const groups = {}

    messages.forEach((message) => {
      if (!message.timestamp) return

      const date = new Date(message.timestamp).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      displayDate: formatDateForHeader(new Date(date)),
      messages,
    }))
  }

  // Set up header (hiding default header)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [navigation])

  // Fetch messages on mount and params change
  useEffect(() => {
    if (route.params?.senderId && route.params?.receiverId) {
      fetchMessages()
    }
  }, [route.params, fetchMessages])

  // Get user avatar
  const getUserAvatar = (userId) => {
    // Placeholder - replace with actual user avatar logic
    if (route?.params?.image) {
      return route.params.image
    }
    return `https://randomuser.me/api/portraits/${userId % 2 === 0 ? "women" : "men"}/${userId % 10}.jpg`
  }

  // Get user status
  const isUserOnline = () => {
    // Placeholder - replace with actual online status logic
    return Math.random() > 0.3
  }

  // Generate message groups with date headers
  const messageGroups = groupMessagesByDate()

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.receiverContainer]}>
        <View style={styles.avatarPlaceholder}>
          <FastImage 
            source={{ uri: getUserAvatar(route?.params?.receiverId) }} 
            style={styles.messageAvatar} 
          />
        </View>
        <View style={styles.messageContent}>
          <View style={[
            styles.messageCard, 
            styles.receiverCard, 
            { backgroundColor: activeColors.receiverBackground, paddingVertical: 12 }
          ]}>
            <View style={styles.typingIndicator}>
              <Animated.View 
                style={[
                  styles.typingDot, 
                  { 
                    backgroundColor: activeColors.subText,
                    opacity: typingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1]
                    })
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.typingDot, 
                  { 
                    backgroundColor: activeColors.subText,
                    opacity: typingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1]
                    }),
                    marginLeft: 4
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.typingDot, 
                  { 
                    backgroundColor: activeColors.subText,
                    opacity: typingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1]
                    }),
                    marginLeft: 4
                  }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
      <StatusBar barStyle={activeColors.statusBarStyle} backgroundColor={activeColors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: activeColors.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={activeColors.text} />
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <FastImage
              source={{ uri: getUserAvatar(route?.params?.receiverId) }}
              style={[styles.avatar, { borderColor: activeColors.primary }]}
            />

            <View style={styles.userTextInfo}>
              <Text style={[styles.userName, { color: activeColors.text }]}>{route?.params?.name || "User"}</Text>
              <Text style={[styles.statusText, { color: activeColors.primary }]}>
                {isUserOnline() ? "Online now" : "Offline"}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="call-outline" size={22} color={activeColors.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="videocam-outline" size={22} color={activeColors.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="ellipsis-vertical-outline" size={22} color={activeColors.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerButton} onPress={toggleTheme}>
              <Ionicons
                name={theme === "dark" ? "sunny-outline" : "moon-outline"}
                size={22}
                color={activeColors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Connection Status Indicator */}
      {!socketConnected && (
        <View style={styles.connectionIndicator}>
          <Text style={styles.connectionText}>Connecting to server...</Text>
        </View>
      )}

      {/* Chat Area */}
      <View style={[styles.chatContainer, { backgroundColor: activeColors.chatBackground }]}>
        {initialLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={activeColors.primary} />
            <Text style={[styles.loaderText, { color: activeColors.subText }]}>Loading messages...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {messageGroups.map((group, groupIndex) => (
              <View key={group.date}>
                {/* Date Header */}
                <View style={styles.dateIndicator}>
                  <Text
                    style={[
                      styles.dateText,
                      {
                        color: activeColors.subText,
                        backgroundColor: theme === "dark" ? "rgba(50, 50, 50, 0.8)" : "rgba(240, 240, 240, 0.8)",
                      },
                    ]}
                  >
                    {group.displayDate}
                  </Text>
                </View>

                {/* Messages for this date */}
                {group.messages.map((item, index) => {
                  const isSender = item?.senderId === route?.params?.senderId
                  const showAvatar =
                    !isSender && (index === 0 || group.messages[index - 1]?.senderId !== item?.senderId)
                  const isFirstInGroup = index === 0 || group.messages[index - 1]?.senderId !== item?.senderId
                  const isLastInGroup =
                    index === group.messages.length - 1 || group.messages[index + 1]?.senderId !== item?.senderId

                  return (
                    <View
                      key={item._id || index}
                      style={[
                        styles.messageContainer,
                        isSender ? styles.senderContainer : styles.receiverContainer,
                        isFirstInGroup && styles.firstInGroup,
                        isLastInGroup && styles.lastInGroup,
                      ]}
                    >
                      {!isSender && showAvatar ? (
                        <FastImage source={{ uri: getUserAvatar(item?.senderId) }} style={styles.messageAvatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder} />
                      )}

                      <View style={styles.messageContent}>
                        {/* Message Bubble */}
                        <TouchableOpacity 
                          activeOpacity={0.9} 
                          onLongPress={(event) => handleMessageLongPress(item, event)}
                        >
                          <View
                            style={[
                              styles.messageCard,
                              isSender
                                ? [styles.senderCard, { backgroundColor: activeColors.primary }]
                                : [styles.receiverCard, { backgroundColor: activeColors.receiverBackground }],
                              item.failed && styles.failedMessage
                            ]}
                          >
                            {/* Image Content */}
                            {item.imageUrl ? (
                              <TouchableOpacity activeOpacity={0.9} onPress={() => openImagePreview(item.imageUrl)}>
                                <FastImage
                                  source={{ uri: item.imageUrl }}
                                  style={styles.messageImage}
                                  resizeMode="cover"
                                />
                              </TouchableOpacity>
                            ) : null}

                            {/* Text Content */}
                            {item?.message ? (
                              <Text
                                style={[
                                  styles.messageText,
                                  {
                                    color: isSender ? "#FFFFFF" : activeColors.text,
                                  },
                                ]}
                              >
                                {item?.message}
                              </Text>
                            ) : null}

                            {/* Time */}
                            <View style={styles.messageFooter}>
                              <Text
                                style={[
                                  styles.timeText,
                                  { color: isSender ? "rgba(255, 255, 255, 0.7)" : activeColors.subText },
                                ]}
                              >
                                {formatTime(item?.timestamp)}
                              </Text>
                              
                              {/* Status indicator for sent messages */}
                              {isSender && (
                                <View style={styles.messageStatus}>
                                  {item.failed ? (
                                    <Ionicons name="alert-circle" size={14} color="#FF3B30" />
                                  ) : (
                                    <Ionicons name="checkmark-done" size={14} color="rgba(255, 255, 255, 0.7)" />
                                  )}
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                })}
              </View>
            ))}
            
            {/* Typing indicator */}
            {renderTypingIndicator()}
          </ScrollView>
        )}
      </View>

      {/* Image Preview (moved below input area) */}
      {imageUri ? (
        <View style={[styles.previewContainer, { backgroundColor: activeColors.cardBackground }]}>
          <FastImage source={{ uri: imageUri }} style={styles.previewImage} />
          <TouchableOpacity style={styles.removePreviewButton} onPress={() => setImageUri("")}>
            <Ionicons name="close-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: activeColors.background,
              borderTopColor: activeColors.border,
            },
          ]}
        >
          <View style={styles.inputRow}>
            {/* Attachment Button */}
            <TouchableOpacity
              style={[styles.attachButton, { backgroundColor: activeColors.primary }]}
              onPress={openImageLibrary}
            >
              <MaterialIcons name="add-photo-alternate" size={22} color="white" />
            </TouchableOpacity>

            {/* Text Input with Camera & Mic */}
            <View style={[styles.textInputContainer, { backgroundColor: activeColors.inputBackground }]}>
              <TextInput
                ref={inputRef}
                value={message}
                onChangeText={(text) => setMessage(text)}
                style={[styles.textInput, { color: activeColors.text }]}
                placeholder="Type a message..."
                placeholderTextColor={theme === "dark" ? "#999999" : "#888888"}
                multiline
                maxLength={500}
              />

              <View style={styles.inputActionsContainer}>
                <TouchableOpacity style={styles.mediaButton} onPress={openCamera}>
                  <Feather name="camera" size={22} color={activeColors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerButton} onPress={() => setMusicModalVisible(true)}>
  <Ionicons name="musical-notes-outline" size={22} color={activeColors.text} />
</TouchableOpacity>

              </View>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: activeColors.primary }]}
              onPress={sendMessage}
              disabled={!message.trim() && !imageUri}
            >
              <Ionicons name={message.trim() || imageUri ? "send" : "mic"} size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setImageModalVisible(false)}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          {selectedImage && (
            <FastImage source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>


      <Modal
  visible={musicModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setMusicModalVisible(false)}
>
  <View style={{ flex: 1, backgroundColor: "#000000aa", justifyContent: "center", alignItems: "center" }}>
    <View style={{ width: "90%", backgroundColor: "#fff", borderRadius: 12, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Select a song</Text>

      <TouchableOpacity
        onPress={() => {
          const song = { name: "Sample Song", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" };
          setCurrentSong(song);
          setIsListeningTogether(true);
          setIsPlaying(false); // Wait until accepted to play
          socketRef.current.emit("music:request", {
            receiverId: route.params.receiverId,
            senderId: userId,
            song
          });
          setMusicModalVisible(false);
        }}
        style={{ padding: 12, backgroundColor: "#0984E3", borderRadius: 8 }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>Send "Sample Song"</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMusicModalVisible(false)} style={{ marginTop: 10 }}>
        <Text style={{ color: "red", textAlign: "center" }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      {/* AI Response Context Menu */}
      {renderContextMenu()}
      
      {/* AI Response Loading Indicator */}
      {renderLoadingIndicator()}


      {isListeningTogether && currentSong && (
  <View style={{ padding: 10, backgroundColor: '#222', flexDirection: 'row', alignItems: 'center' }}>
    <Text style={{ flex: 1, color: '#fff' }}>{currentSong.name}</Text>
    <TouchableOpacity
      onPress={() => {
        const now = Date.now();
        socketRef.current.emit(isPlaying ? "music:pause" : "music:play", {
          receiverId: route.params.receiverId,
          startTime: now
        });
        setStartTime(now);
        setIsPlaying(!isPlaying);
      }}
    >
      <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
    </TouchableOpacity>
  </View>
)}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 5,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
  },
  userTextInfo: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 17,
    fontWeight: "600",
  },
  statusText: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 10,
  },
  connectionIndicator: {
    backgroundColor: "#FF3B30",
    padding: 5,
    alignItems: "center",
  },
  connectionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  chatContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  dateIndicator: {
    alignItems: "center",
    marginVertical: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: "hidden",
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 1,
    paddingVertical: 2,
  },
  senderContainer: {
    justifyContent: "flex-end",
    marginLeft: 40,
  },
  receiverContainer: {
    justifyContent: "flex-start",
    marginRight: 40,
  },
  firstInGroup: {
    marginTop: 4,
  },
  lastInGroup: {
    marginBottom: 4,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    alignSelf: "flex-end",
  },
  avatarPlaceholder: {
    width: 28,
  },
  messageContent: {
    flex: 1,
  },
  messageCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginHorizontal: 4,
    padding: 10,
    maxWidth: "90%",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  senderCard: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  receiverCard: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  failedMessage: {
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  messageStatus: {
    marginLeft: 4,
  },
  // Typing indicator
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Image preview (moved below input)
  previewContainer: {
    margin: 10,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  removePreviewButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
  },
  // Loading states
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
  },
  inputContainer: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  attachButton: {
    padding: 10,
    marginRight: 8,
    borderRadius: 20,
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  textInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 20,
    maxHeight: 100,
    fontSize: 15,
    padding: 0,
  },
  inputActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mediaButton: {
    padding: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: width * 0.9,
    height: height * 0.7,
  },
  modalCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  // AI Response Context Menu styles
  contextMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  contextMenu: {
    position: "absolute",
    width: 200,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 8,
  },
  contextMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
  },
  contextMenuItemText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  loadingContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  loadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  }
})

export default ChatRoom;