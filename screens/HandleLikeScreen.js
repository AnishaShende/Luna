"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { jwtDecode } from "jwt-decode"
import io from "socket.io-client"

const GroupChat = ({ route, navigation }) => {
  const { groupId, groupName, isHost } = route.params
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [userId, setUserId] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [members, setMembers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const flatListRef = useRef(null)
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token")
        const decodedToken = jwtDecode(token)
        setUserId(decodedToken.userId)
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (userId) {
      // Initialize socket connection
      socketRef.current = io("http://192.168.39.169:6000")

      // Join the group room
      socketRef.current.emit("joinGroup", { groupId, userId })

      // Listen for new messages
      socketRef.current.on("newGroupMessage", (message) => {
        setMessages((prevMessages) => [...prevMessages, message])

        // Scroll to bottom when new message arrives
        if (flatListRef.current) {
          setTimeout(() => {
            flatListRef.current.scrollToEnd({ animated: true })
          }, 100)
        }
      })

      // Listen for typing events
      socketRef.current.on("userTyping", ({ groupId: gId, userId: uId, userName }) => {
        if (gId === groupId && uId !== userId) {
          setTypingUsers((prev) => {
            if (!prev.some((user) => user.userId === uId)) {
              return [...prev, { userId: uId, userName }]
            }
            return prev
          })
        }
      })

      // Listen for stopped typing events
      socketRef.current.on("userStoppedTyping", ({ groupId: gId, userId: uId }) => {
        if (gId === groupId) {
          setTypingUsers((prev) => prev.filter((user) => user.userId !== uId))
        }
      })

      // Fetch initial messages and group details
      fetchMessages()
      fetchGroupDetails()

      // Clean up on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.emit("leaveGroup", { groupId, userId })
          socketRef.current.disconnect()
        }
      }
    }
  }, [userId, groupId])

  const fetchGroupDetails = async () => {
    try {
      const response = await axios.get(`http://192.168.39.169:6000/api/groups/${groupId}`)
      setMembers(response.data.group.members)
    } catch (error) {
      console.error("Error fetching group details:", error)
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://192.168.39.169:6000/api/groups/${groupId}/messages`)
      setMessages(response.data.messages)
      setLoading(false)

      // Scroll to bottom after messages load
      if (flatListRef.current && response.data.messages.length > 0) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: false })
        }, 200)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      setLoading(false)
    }
  }

  const handleInputChange = (text) => {
    setInputMessage(text)

    // Emit typing event
    if (socketRef.current) {
      socketRef.current.emit("typing", { groupId, userId })

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit("stopTyping", { groupId, userId })
        }
      }, 1000)
    }
  }

  const handleSend = async () => {
    if (inputMessage.trim() === "") return

    try {
      setSending(true)

      // Clear typing indicator
      if (socketRef.current) {
        socketRef.current.emit("stopTyping", { groupId, userId })
      }

      const response = await axios.post("http://192.168.39.169:6000/api/groups/messages", {
        groupId,
        senderId: userId,
        content: inputMessage,
      })

      // Clear input
      setInputMessage("")
      setSending(false)

      // No need to update messages array here as the socket will handle it
    } catch (error) {
      console.error("Error sending message:", error)
      setSending(false)
      Alert.alert("Error", "Failed to send message")
    }
  }

  const handleGroupInfo = () => {
    navigation.navigate("GroupInfo", {
      groupId,
      groupName,
      isHost,
      members,
    })
  }

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === userId

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {!isMyMessage && <Text style={styles.senderName}>{item.senderName}</Text>}
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
          ) : null}
          {item.content ? (
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
              {item.content}
            </Text>
          ) : null}
          <Text style={styles.messageTime}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName}</Text>
        <TouchableOpacity style={styles.infoButton} onPress={handleGroupInfo}>
          <Ionicons name="information-circle-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />

          {typingUsers.length > 0 && (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>
                {typingUsers.length === 1
                  ? `${typingUsers[0].userName || "Someone"} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </Text>
            </View>
          )}
        </>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputMessage}
          onChangeText={handleInputChange}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (sending || inputMessage.trim() === "") && styles.disabledSendButton]}
          onPress={handleSend}
          disabled={sending || inputMessage.trim() === ""}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  infoButton: {
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  senderName: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: "#6C63FF",
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#333333",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageTime: {
    fontSize: 10,
    color: "#999",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  typingContainer: {
    padding: 8,
    paddingHorizontal: 16,
  },
  typingText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  disabledSendButton: {
    backgroundColor: "#CCCCCC",
  },
})

export default GroupChat
