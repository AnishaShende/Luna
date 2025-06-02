"use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Animated,
  Dimensions,
  Keyboard,
} from "react-native"
import axios from "axios"
import Ionicons from "react-native-vector-icons/Ionicons"
import VoiceButton from "./VoiceButton"

const { width, height } = Dimensions.get("window")

const AiChatRoom = ({ route, navigation }) => {
  const { userId } = route.params
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasConsented, setHasConsented] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const flatListRef = useRef(null)
  const typingAnimation = useRef(new Animated.Value(0)).current
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height)
    })
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0)
    })

    return () => {
      keyboardDidShowListener?.remove()
      keyboardDidHideListener?.remove()
    }
  }, [navigation])

  useEffect(() => {
    const checkConsent = async () => {
      try {
        const response = await axios.post("https://dyna-ai.onrender.com/api/users", { userId })
        setHasConsented(response.data.user.hasConsented)
        setShowConsent(!response.data.user.hasConsented)
        await fetchMessages()
      } catch (error) {
        console.error("Error checking consent:", error)
        Alert.alert("Error", "Failed to check consent status")
      } finally {
        setLoading(false)
      }
    }

    checkConsent()
  }, [userId])

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else {
      typingAnimation.setValue(0)
    }
  }, [isTyping])

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`https://dyna-ai.onrender.com/api/messages/${userId}/dnya`)
      const formattedMessages = response.data.messages.map((msg) => ({
        _id: msg._id,
        text: msg.content,
        createdAt: new Date(msg.timestamp),
        user: {
          _id: msg.senderId === "dnya" ? "dnya" : userId,
          name: msg.senderId === "dnya" ? "Dyna" : "You",
        },
      }))

      // Sort messages chronologically (oldest first, like WhatsApp)
      const sortedMessages = formattedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      setMessages(sortedMessages)
      
      // Auto scroll to bottom (latest messages) after loading
      setTimeout(() => {
        if (flatListRef.current && sortedMessages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: false })
        }
      }, 100)
    } catch (error) {
      console.error("Error fetching messages:", error)
      Alert.alert("Error", "Failed to load messages")
    }
  }

  const handleConsent = async (consent) => {
    try {
      await axios.put("https://dyna-ai.onrender.com/api/users/consent", {
        userId,
        hasConsented: consent,
      })

      if (consent) {
        setHasConsented(true)
        setShowConsent(false)
      } else {
        navigation.goBack()
      }
    } catch (error) {
      console.error("Error updating consent:", error)
      Alert.alert("Error", "Failed to update consent")
    }
  }

  const sendMessage = async (messageText = inputText.trim()) => {
    if (messageText === "") return

    if (messageText === inputText.trim()) {
      setInputText("")
    }

    setSending(true)

    try {
      const tempMessage = {
        _id: Date.now().toString(),
        text: messageText,
        createdAt: new Date(),
        user: {
          _id: userId,
          name: "You",
        },
        pending: true,
      }

      const newMessages = [...messages, tempMessage]
      setMessages(newMessages)

      // Scroll to bottom immediately after sending
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true })
        }
      }, 100)

      setIsTyping(true)

      const response = await axios.post("https://dyna-ai.onrender.com/api/messages", {
        senderId: userId,
        content: messageText,
      })

      setTimeout(
        () => {
          setIsTyping(false)
          fetchMessages()
        },
        1000 + Math.random() * 1000,
      )
    } catch (error) {
      console.error("Error sending message:", error)
      Alert.alert("Error", "Failed to send message")
      setIsTyping(false)

      const filteredMessages = messages.filter((msg) => !msg.pending)
      setMessages(filteredMessages)
    } finally {
      setSending(false)
    }
  }

  const handleVoiceInput = (text) => {
    sendMessage(text)
  }

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true })
    }
  }

  const renderDateHeader = (currentMessage, previousMessage) => {
    if (!previousMessage) return null

    const currentDate = new Date(currentMessage.createdAt)
    const previousDate = new Date(previousMessage.createdAt)
    
    currentDate.setHours(0, 0, 0, 0)
    previousDate.setHours(0, 0, 0, 0)

    if (currentDate.getTime() !== previousDate.getTime()) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let dateText
      if (currentDate.getTime() === today.getTime()) {
        dateText = "Today"
      } else if (currentDate.getTime() === yesterday.getTime()) {
        dateText = "Yesterday"
      } else {
        dateText = currentDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }

      return (
        <View style={styles.dateHeader}>
          <View style={styles.dateHeaderBubble}>
            <Text style={styles.dateHeaderText}>{dateText}</Text>
          </View>
        </View>
      )
    }
    return null
  }

  const renderMessage = ({ item, index }) => {
    const isUser = item.user._id === userId
    const previousMessage = index > 0 ? messages[index - 1] : null

    return (
      <View>
        {renderDateHeader(item, previousMessage)}
        <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer]}>
          {!isUser && (
            <View style={styles.aiAvatarContainer}>
              <Text style={styles.aiAvatarText}>D</Text>
              <View style={styles.onlineIndicator} />
            </View>
          )}

          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.aiBubble,
              item.pending && styles.pendingBubble,
            ]}
          >
            <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
              {item.text || ""}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.aiTimeText]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
              {isUser && (
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color={item.pending ? "#B0B0B0" : "#4FC3F7"}
                  style={styles.readIndicator}
                />
              )}
            </View>
          </View>

          {isUser && (
            <View style={styles.userAvatarContainer}>
              <Text style={styles.userAvatarText}>Y</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  const renderTypingIndicator = () => {
    if (!isTyping) return null

    return (
      <View style={[styles.messageContainer, styles.aiMessageContainer]}>
        <View style={styles.aiAvatarContainer}>
          <Text style={styles.aiAvatarText}>D</Text>
          <View style={styles.onlineIndicator} />
        </View>
        <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
          <View style={styles.typingIndicator}>
            <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
            <Animated.View
              style={[
                styles.typingDot,
                {
                  opacity: typingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.typingDot,
                {
                  opacity: typingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.typingText}>Dyna is typing...</Text>
        </View>
      </View>
    )
  }

  const ConsentDialog = () => (
    <View style={styles.consentContainer}>
      <View style={styles.consentCard}>
        <View style={styles.consentAvatarContainer}>
          <Text style={styles.consentAvatarText}>D</Text>
          <View style={styles.consentOnlineIndicator} />
        </View>
        <Text style={styles.consentTitle}>Meet Dyna</Text>
        <Text style={styles.consentSubtitle}>Your AI Assistant</Text>
        <Text style={styles.consentText}>
          Dyna is here to help answer your questions and have meaningful conversations. Your chat history will be
          securely stored to provide personalized responses.
        </Text>
        <View style={styles.consentButtons}>
          <TouchableOpacity style={[styles.consentButton, styles.declineButton]} onPress={() => handleConsent(false)}>
            <Text style={styles.declineButtonText}>Not Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.consentButton, styles.acceptButton]} onPress={() => handleConsent(true)}>
            <Text style={styles.acceptButtonText}>Start Chatting</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {showConsent ? (
        <ConsentDialog />
      ) : (
        <View style={styles.container}>
          {/* Custom Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="#007AFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={styles.headerAvatarContainer}>
                <Text style={styles.headerAvatarText}>D</Text>
                <View style={styles.headerOnlineIndicator} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Dyna</Text>
                <Text style={styles.headerSubtitle}>AI Assistant • Online</Text>
              </View>
            </View>

            
          </View>

          {/* Chat Area */}
          <View style={[styles.chatContainer, { paddingBottom: Platform.OS === 'ios' ? keyboardHeight : 0 }]}>
            {messages.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <View style={styles.welcomeAvatarContainer}>
                  <Text style={styles.welcomeAvatarText}>D</Text>
                  <View style={styles.welcomeOnlineIndicator} />
                </View>
                <Text style={styles.welcomeTitle}>Hey there! 👋</Text>
                <Text style={styles.welcomeSubtitle}>
                  I'm Dyna, your AI assistant. Ask me anything or just say hello!
                </Text>
                <View style={styles.suggestedMessages}>
                  <TouchableOpacity style={styles.suggestedMessage} onPress={() => sendMessage("Hello Dyna!")}>
                    <Text style={styles.suggestedMessageText}>👋 Say Hello</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestedMessage}
                    onPress={() => sendMessage("What can you help me with?")}
                  >
                    <Text style={styles.suggestedMessageText}>❓ What can you do?</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                ListFooterComponent={renderTypingIndicator}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                  // Auto scroll to bottom when content changes
                  setTimeout(() => {
                    if (flatListRef.current) {
                      flatListRef.current.scrollToEnd({ animated: true })
                    }
                  }, 100)
                }}
                onLayout={() => {
                  // Scroll to bottom on initial layout
                  setTimeout(() => {
                    if (flatListRef.current && messages.length > 0) {
                      flatListRef.current.scrollToEnd({ animated: false })
                    }
                  }, 100)
                }}
              />
            )}
          </View>

          {/* Input Container */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TouchableOpacity style={styles.attachButton}>
                  <Ionicons name="add" size={24} color="#007AFF" />
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Message Dyna..."
                  placeholderTextColor="#8E8E93"
                  multiline
                  maxLength={500}
                  editable={!sending && hasConsented}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (inputText.trim() && !sending && hasConsented) {
                      sendMessage();
                    }
                  }}
                  blurOnSubmit={false}
                />

                <VoiceButton onTextReceived={handleVoiceInput} userId={userId} disabled={!hasConsented || sending} />

                {inputText.trim() ? (
                  <TouchableOpacity
                    style={[styles.sendButton, (!hasConsented || sending) && styles.disabledSendButton]}
                    onPress={() => sendMessage()}
                    disabled={sending || !hasConsented}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  headerAvatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  headerOnlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#34C759",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#34C759",
    fontWeight: "500",
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  welcomeAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeAvatarText: {
    color: "white",
    fontSize: 42,
    fontWeight: "700",
  },
  welcomeOnlineIndicator: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#34C759",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  suggestedMessages: {
    width: "100%",
    gap: 12,
  },
  suggestedMessage: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestedMessageText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    textAlign: "center",
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  dateHeader: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateHeaderBubble: {
    backgroundColor: "rgba(142, 142, 147, 0.12)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dateHeaderText: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "600",
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  aiMessageContainer: {
    justifyContent: "flex-start",
  },
  aiAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    position: "relative",
  },
  aiAvatarText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34C759",
    borderWidth: 2,
    borderColor: "#F2F2F7",
  },
  userAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF9500",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  userAvatarText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 6,
  },
  pendingBubble: {
    opacity: 0.7,
  },
  typingBubble: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 12,
    color: "#8E8E93",
    fontStyle: "italic",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  aiText: {
    color: "#000000",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  userTimeText: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  aiTimeText: {
    color: "#8E8E93",
  },
  readIndicator: {
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E5EA",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F2F2F7",
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 48,
  },
  attachButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 4,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  disabledSendButton: {
    backgroundColor: "#C7C7CC",
  },
  consentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  consentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  consentAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  consentAvatarText: {
    color: "white",
    fontSize: 32,
    fontWeight: "700",
  },
  consentOnlineIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#34C759",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  consentTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
  },
  consentSubtitle: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  consentText: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 32,
    lineHeight: 24,
    textAlign: "center",
  },
  consentButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  consentButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  declineButton: {
    backgroundColor: "#F2F2F7",
  },
  acceptButton: {
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  declineButtonText: {
    color: "#8E8E93",
    fontWeight: "600",
    fontSize: 16,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
})

export default AiChatRoom