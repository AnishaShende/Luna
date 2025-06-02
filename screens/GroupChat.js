"use client"

import { useState, useEffect, useRef, useCallback, memo } from "react"
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
  Image,
  SectionList,
  ScrollView,
} from "react-native"
import axios from "axios"
import Ionicons from "react-native-vector-icons/Ionicons"
import { io } from "socket.io-client"
import Modal from "react-native-modals"

// Memoized Message component for better performance
const MessageItem = memo(({ item, userId, members, styles }) => {
  const isCurrentUser = item.user._id === userId
  const member = members.find((m) => m._id === item.user._id)
  const displayName = member ? member.firstName : item.user.name

  return (
    <View style={[styles.messageRow, isCurrentUser ? styles.userMessageRow : styles.otherMessageRow]}>
      {!isCurrentUser && (
        <Image source={{ uri: member?.imageUrls?.[0] || "https://via.placeholder.com/40" }} style={styles.avatar} />
      )}

      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.userBubble : styles.otherBubble,
          item.pending && styles.pendingBubble,
          item.primaryCategory === "important" && styles.importantBubble,
          item.primaryCategory === "reminder" && styles.reminderBubble,
          item.primaryCategory === "announcement" && styles.announcementBubble,
          item.primaryCategory === "spam" && styles.spamBubble,
        ]}
      >
        {!isCurrentUser && <Text style={styles.senderName}>{displayName}</Text>}
        {item.image && <Image source={{ uri: item.image }} style={styles.messageImage} />}
        {item.text && <Text style={styles.messageText}>{item.text}</Text>}
        <View style={styles.messageFooter}>
          {item.primaryCategory !== "unclassified" && item.primaryCategory !== "casual" && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{item.primaryCategory}</Text>
            </View>
          )}
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>

      {isCurrentUser && (
        <Image source={{ uri: member?.imageUrls?.[0] || "https://via.placeholder.com/40" }} style={styles.avatar} />
      )}
    </View>
  )
})

// Memoized Section Header component
const SectionHeaderComponent = memo(({ title, styles }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
))

// Memoized Member Item component
const MemberItem = memo(({ item, group, isHost, userId, handleRemoveMember, styles }) => (
  <View style={styles.memberItem}>
    <Image source={{ uri: item.imageUrls?.[0] || "https://via.placeholder.com/50" }} style={styles.memberAvatar} />
    <View style={styles.memberInfo}>
      <Text style={styles.memberName}>{item.firstName}</Text>
      <Text style={styles.memberStatus}>{item._id === group?.hostId ? "Admin" : "Member"}</Text>
    </View>
    {isHost && item._id !== group?.hostId && item._id !== userId && (
      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveMember(item._id)}>
        <Ionicons name="remove-circle" size={22} color="#FF6B6B" />
      </TouchableOpacity>
    )}
  </View>
))

// Memoized Add Member Item component
const AddMemberItem = memo(({ item, selectedMembers, toggleMemberSelection, styles }) => (
  <TouchableOpacity
    style={[styles.addMemberItem, selectedMembers.includes(item._id) && styles.selectedMemberItem]}
    onPress={() => toggleMemberSelection(item._id)}
  >
    <Image source={{ uri: item.imageUrls?.[0] || "https://via.placeholder.com/50" }} style={styles.memberAvatar} />
    <Text style={styles.memberName}>{item.firstName}</Text>
    <View style={styles.checkboxContainer}>
      {selectedMembers.includes(item._id) ? (
        <View style={styles.checkedBox}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      ) : (
        <View style={styles.uncheckedBox} />
      )}
    </View>
  </TouchableOpacity>
))

const GroupChat = ({ route, navigation }) => {
  const { groupId, groupName: initialGroupName, isHost, userId } = route.params
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false)
  const [isAddMemberModalVisible, setAddMemberModalVisible] = useState(false)
  const [isMenuVisible, setMenuVisible] = useState(false)
  const [showClassifyUI, setShowClassifyUI] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [matches, setMatches] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [userName, setUserName] = useState("")
  const [filteredMessages, setFilteredMessages] = useState([])
  const [groupedMessages, setGroupedMessages] = useState([])
  const [isClassifying, setIsClassifying] = useState(false)
  const [classifiedMessages, setClassifiedMessages] = useState([])
  const [classificationError, setClassificationError] = useState(null)
  const flatListRef = useRef(null)
  const socket = useRef(null)
  const [showCategories, setShowCategories] = useState(false)

  const categories = ["important", "reminder", "announcement", "spam", "greeting", "casual", "unclassified"]

  // Hide the default navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [navigation])

  // Fetch group details and update header
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        console.log("Fetching group details for ID:", groupId)
        const response = await axios.get(`https://dyna-ai.onrender.com/api/groups/${groupId}`)
        console.log("Group details response:", response.data)

        if (!response.data || !response.data.group) {
          console.error("Invalid group data received:", response.data)
          Alert.alert("Error", "Failed to load group details: Invalid data")
          return
        }

        const groupData = response.data.group
        setGroup(groupData)

        // Fetch member details
        try {
          const memberPromises = groupData.members.map((memberId) =>
            axios.get(`https://socket-ifia.onrender.com/users/${memberId}`),
          )

          const memberResponses = await Promise.all(memberPromises)
          const memberDetails = memberResponses.map((res) => res.data.user)
          setMembers(memberDetails)
        } catch (memberError) {
          console.error("Error fetching member details:", memberError)
          // Continue with partial data
        }
      } catch (error) {
        console.error("Error fetching group details:", error)
        Alert.alert("Error", "Failed to load group details")
      }
    }

    fetchGroupDetails()
    fetchMessages()
    fetchMatches()

    // Initialize socket connection
    socket.current = io("https://socket-ifia.onrender.com")

    // Join the group room
    socket.current.emit("group:join", { groupId, userId })

    // Listen for new messages
    socket.current.on("group:message", ({ groupId: msgGroupId, message }) => {
      if (msgGroupId === groupId) {
        setMessages((prevMessages) => {
          const newMessages = [
            ...prevMessages,
            {
              _id: message._id,
              text: message.content,
              createdAt: new Date(message.timestamp),
              user: {
                _id: message.senderId,
                name: message.senderName,
              },
              primaryCategory: message.category || "unclassified",
            },
          ]

          // Update grouped messages
          groupMessagesByDate(newMessages)
          return newMessages
        })
      }
    })

    // Fetch user name
    const fetchUserName = async () => {
      try {
        const response = await axios.get(`https://socket-ifia.onrender.com/users/${userId}`)
        setUserName(response.data.user.firstName || "User")
      } catch (error) {
        console.error("Error fetching user name:", error)
        setUserName("User")
      }
    }

    fetchUserName()

    return () => {
      // Leave the group room when component unmounts
      if (socket.current) {
        socket.current.emit("group:leave", { groupId, userId })
        socket.current.disconnect()
      }
    }
  }, [groupId, userId, navigation])

  useEffect(() => {
    filterMessagesByCategory(selectedCategory)
  }, [selectedCategory, messages, classifiedMessages])

  // Function to classify a single message
  const classifyMessage = async (text) => {
    try {
      const response = await fetch("https://message-classify.onrender.com/batch_classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [text],
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Check if we have results and at least one result item
      if (data && data.results && data.results.length > 0) {
        // Return the first result's predicted class name
        return {
          category: data.results[0].predicted_class_name || "unclassified",
          confidence: data.results[0].confidence || 0,
          all_probability_names: data.results[0].all_probability_names || {},
        }
      }

      return { category: "unclassified", confidence: 0, all_probability_names: {} }
    } catch (error) {
      console.error("Error classifying message:", error)
      // Return a default classification
      return { category: "unclassified", confidence: 0, all_probability_names: {} }
    }
  }

  // Add a function to check if the server is running
  const checkServerAvailability = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch("https://message-classify.onrender.com/batch_classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: ["test"] }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      console.error("Server availability check failed:", error)
      return false
    }
  }

  // Function to classify all messages
  const classifyAllMessages = async () => {
    if (messages.length === 0) {
      Alert.alert("No messages to classify")
      return
    }

    setIsClassifying(true)
    setClassificationError(null)

    try {
      // Extract just the text content from all messages
      const messageTexts = messages.map((message) => message.text).filter(Boolean)

      if (messageTexts.length === 0) {
        Alert.alert("No text messages to classify")
        setIsClassifying(false)
        return
      }

      console.log("Sending messages for classification:", messageTexts)

      // Call the batch classification API
      const response = await fetch("https://message-classify.onrender.com/batch_classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messageTexts,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Classification results:", data)

      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid response format: missing results array")
      }

      // Create a map of message text to classification result
      const classificationMap = {}
      data.results.forEach((result) => {
        if (result.message && result.predicted_class_name) {
          classificationMap[result.message] = {
            category: result.predicted_class_name,
            confidence: result.confidence || 0,
            all_probability_names: result.all_probability_names || {},
          }
        }
      })

      // Update messages with classification results
      const classifiedResults = messages.map((message) => {
        if (!message.text || !classificationMap[message.text]) return message

        const classification = classificationMap[message.text]

        return {
          ...message,
          classification: classification.all_probability_names,
          primaryCategory: classification.category,
          confidence: classification.confidence,
        }
      })

      setClassifiedMessages(classifiedResults)
      setMessages(classifiedResults)
      setShowCategories(true)

      // Update the grouped messages
      groupMessagesByDate(
        !selectedCategory
          ? classifiedResults
          : classifiedResults.filter((msg) => msg.primaryCategory === selectedCategory),
      )

      Alert.alert("Success", "Messages classified successfully")
    } catch (error) {
      console.error("Error in classification process:", error)
      Alert.alert(
        "Failed to classify messages",
        "Please check if the classification server is available at https://message-classify.onrender.com/batch_classify",
      )
      setClassificationError("Classification service error: " + error.message)
    } finally {
      setIsClassifying(false)
    }
  }

  // Function to filter messages by category
  const filterMessagesByCategory = (category) => {
    setSelectedCategory(category)

    const messagesToFilter = classifiedMessages.length > 0 ? classifiedMessages : messages

    if (!category) {
      setFilteredMessages(messagesToFilter)
      groupMessagesByDate(messagesToFilter)
    } else {
      const filtered = messagesToFilter.filter((msg) => msg.primaryCategory === category)
      setFilteredMessages(filtered)
      groupMessagesByDate(filtered)
    }
  }

  // Reset category filter
  const resetCategoryFilter = () => {
    setSelectedCategory(null)
    const messagesToShow = classifiedMessages.length > 0 ? classifiedMessages : messages
    setFilteredMessages(messagesToShow)
    groupMessagesByDate(messagesToShow)
  }

  const groupMessagesByDate = useCallback((msgs) => {
    if (!msgs || msgs.length === 0) {
      setGroupedMessages([])
      return
    }

    // Sort messages by date (newest last)
    const sortedMessages = [...msgs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const sections = {}

    sortedMessages.forEach((message) => {
      const messageDate = new Date(message.createdAt)
      messageDate.setHours(0, 0, 0, 0)

      let sectionTitle

      if (messageDate.getTime() === today.getTime()) {
        sectionTitle = "Today"
      } else if (messageDate.getTime() === yesterday.getTime()) {
        sectionTitle = "Yesterday"
      } else {
        sectionTitle = messageDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }

      if (!sections[sectionTitle]) {
        sections[sectionTitle] = []
      }

      sections[sectionTitle].push(message)
    })

    const formattedSections = Object.keys(sections).map((key) => ({
      title: key,
      data: sections[key],
    }))

    setGroupedMessages(formattedSections)
  }, [])

  const fetchMessages = async () => {
    try {
      console.log("Fetching messages for group:", groupId)
      const response = await axios.get(`https://dyna-ai.onrender.com/api/groups/${groupId}/messages?userId=${userId}`)

      if (!response.data || !response.data.messages) {
        console.error("Invalid messages data received:", response.data)
        setLoading(false)
        return
      }

      const messagesWithCategories = response.data.messages.map((msg) => ({
        _id: msg._id,
        text: msg.content,
        createdAt: new Date(msg.timestamp),
        user: {
          _id: msg.senderId,
          name: msg.senderName,
        },
        image: msg.imageUrl,
        primaryCategory: msg.category || "unclassified",
      }))

      setMessages(messagesWithCategories)
      setFilteredMessages(messagesWithCategories)
      groupMessagesByDate(messagesWithCategories)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching messages:", error)
      Alert.alert("Error", "Failed to load messages")
      setLoading(false)
    }
  }

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`https://socket-ifia.onrender.com/get-matches/${userId}`)

      // Filter out members who are already in the group
      if (group) {
        const filteredMatches = response.data.matches.filter((match) => !group.members.includes(match._id))
        setMatches(filteredMatches)
      } else {
        setMatches(response.data.matches)
      }
    } catch (error) {
      console.error("Error fetching matches:", error)
    }
  }

  const sendMessage = async () => {
    if (inputText.trim() === "") return

    const messageText = inputText.trim()
    setInputText("")
    setSending(true)

    try {
      // Add optimistic message
      const tempMessage = {
        _id: Date.now().toString(),
        text: messageText,
        createdAt: new Date(),
        user: {
          _id: userId,
          name: userName,
        },
        pending: true,
        primaryCategory: "unclassified",
      }

      const newMessages = [...messages, tempMessage]
      setMessages(newMessages)
      groupMessagesByDate(newMessages)

      // Send message via socket
      socket.current.emit("group:sendMessage", {
        groupId,
        senderId: userId,
        senderName: userName,
        content: messageText,
      })

      // Also send via API for reliability
      await axios.post(`https://dyna-ai.onrender.com/api/groups/${groupId}/messages`, {
        senderId: userId,
        senderName: userName,
        content: messageText,
      })

      // Classify the message using the new endpoint
      try {
        const classification = await classifyMessage(messageText)

        // Update the message with the classification
        const updatedMessages = messages.map((msg) =>
          msg._id === tempMessage._id
            ? {
                ...msg,
                classification: classification.all_probability_names,
                primaryCategory: classification.category,
                confidence: classification.confidence,
                pending: false,
              }
            : msg,
        )

        setMessages(updatedMessages)

        if (classifiedMessages.length > 0) {
          setClassifiedMessages([
            ...classifiedMessages,
            {
              ...tempMessage,
              classification: classification.all_probability_names,
              primaryCategory: classification.category,
              confidence: classification.confidence,
              pending: false,
            },
          ])
        }

        groupMessagesByDate(
          !selectedCategory
            ? updatedMessages
            : updatedMessages.filter((msg) => msg.primaryCategory === selectedCategory),
        )
      } catch (classifyError) {
        console.error("Error classifying message:", classifyError)
        setClassificationError(`Error classifying message: ${messageText.substring(0, 20)}...`)
        // Continue without classification
      }
    } catch (error) {
      console.error("Error sending message:", error)
      Alert.alert("Error", "Failed to send message")

      // Remove the optimistic message
      const filteredMessages = messages.filter((msg) => !msg.pending)
      setMessages(filteredMessages)
      groupMessagesByDate(filteredMessages)
    } finally {
      setSending(false)
    }
  }

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      Alert.alert("Error", "Please select at least one member to add")
      return
    }

    try {
      // Add each selected member to the group
      const addPromises = selectedMembers.map((memberId) =>
        axios.post(`https://dyna-ai.onrender.com/api/groups/${groupId}/members`, {
          userId,
          newMemberId: memberId,
        }),
      )

      await Promise.all(addPromises)

      // Refresh group details
      const response = await axios.get(`https://dyna-ai.onrender.com/api/groups/${groupId}`)
      setGroup(response.data.group)

      // Fetch member details
      const memberPromises = response.data.group.members.map((memberId) =>
        axios.get(`https://socket-ifia.onrender.com/users/${memberId}`),
      )

      const memberResponses = await Promise.all(memberPromises)
      const memberDetails = memberResponses.map((res) => res.data.user)
      setMembers(memberDetails)

      setAddMemberModalVisible(false)
      setSelectedMembers([])
      Alert.alert("Success", "Members added to the group")
    } catch (error) {
      console.error("Error adding members:", error)
      Alert.alert("Error", "Failed to add members to the group")
    }
  }

  const handleRemoveMember = useCallback(
    async (memberId) => {
      if (!group) {
        Alert.alert("Error", "Group information not loaded")
        return
      }

      if (memberId === group.hostId) {
        Alert.alert("Error", "Cannot remove the host from the group")
        return
      }

      Alert.alert("Remove Member", "Are you sure you want to remove this member from the group?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`https://dyna-ai.onrender.com/api/groups/${groupId}/members/${memberId}`, {
                data: { userId },
              })

              // Refresh group details
              const response = await axios.get(`https://dyna-ai.onrender.com/api/groups/${groupId}`)
              setGroup(response.data.group)

              // Fetch member details
              const memberPromises = response.data.group.members.map((memberId) =>
                axios.get(`https://socket-ifia.onrender.com/users/${memberId}`),
              )

              const memberResponses = await Promise.all(memberPromises)
              const memberDetails = memberResponses.map((res) => res.data.user)
              setMembers(memberDetails)

              Alert.alert("Success", "Member removed from the group")
            } catch (error) {
              console.error("Error removing member:", error)
              Alert.alert("Error", "Failed to remove member from the group")
            }
          },
        },
      ])
    },
    [group, groupId, userId],
  )

  const handleLeaveGroup = () => {
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`https://dyna-ai.onrender.com/api/groups/${groupId}/members/${userId}`, {
              data: { userId },
            })

            navigation.goBack()
          } catch (error) {
            console.error("Error leaving group:", error)
            Alert.alert("Error", "Failed to leave the group")
          }
        },
      },
    ])
  }

  const handleDeleteGroup = () => {
    Alert.alert("Delete Group", "Are you sure you want to delete this group? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`https://dyna-ai.onrender.com/api/groups/${groupId}`, {
              data: { userId },
            })

            navigation.goBack()
          } catch (error) {
            console.error("Error deleting group:", error)
            Alert.alert("Error", "Failed to delete the group")
          }
        },
      },
    ])
  }

  const toggleMemberSelection = useCallback((memberId) => {
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId)
      } else {
        return [...prev, memberId]
      }
    })
  }, [])

  const renderMessage = useCallback(
    ({ item }) => {
      return <MessageItem item={item} userId={userId} members={members} styles={styles} />
    },
    [userId, members],
  )

  const renderSectionHeader = useCallback(({ section: { title } }) => {
    return <SectionHeaderComponent title={title} styles={styles} />
  }, [])

  const renderMemberItem = useCallback(
    ({ item }) => {
      return (
        <MemberItem
          item={item}
          group={group}
          isHost={isHost}
          userId={userId}
          handleRemoveMember={handleRemoveMember}
          styles={styles}
        />
      )
    },
    [group, isHost, userId, handleRemoveMember],
  )

  const renderAddMemberItem = useCallback(
    ({ item }) => {
      return (
        <AddMemberItem
          item={item}
          selectedMembers={selectedMembers}
          toggleMemberSelection={toggleMemberSelection}
          styles={styles}
        />
      )
    },
    [selectedMembers, toggleMemberSelection],
  )

  const keyExtractor = useCallback((item) => item._id, [])
  const sectionKeyExtractor = useCallback((item, index) => `section-${index}`, [])
  const memberKeyExtractor = useCallback((item) => item._id, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerTitleContainer} onPress={() => setSettingsModalVisible(true)}>
          <View style={styles.groupAvatarSmall}>
            <Text style={styles.groupAvatarTextSmall}>{group?.name?.charAt(0) || "G"}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerGroupName}>{group?.name || initialGroupName || "Group Chat"}</Text>
            <Text style={styles.headerMembersCount}>
              {group?.members?.length || 0} {(group?.members?.length || 0) === 1 ? "member" : "members"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowClassifyUI(true)}>
            <Ionicons name="filter-outline" size={22} color="#6C63FF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Classify UI - Inline instead of modal */}
      {showClassifyUI && (
        <View style={styles.classifyContainer}>
          <View style={styles.classifyHeader}>
            <Text style={styles.classifyTitle}>Classify Messages</Text>
            <TouchableOpacity onPress={() => setShowClassifyUI(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.classifyText}>
            Classify messages to filter and organize your conversations. Select a category to view only those messages.
          </Text>

          <View style={styles.categoryFilterContainer}>
            <View style={styles.categoryFilterHeader}>
              <Text style={styles.filterLabel}>Filter by category:</Text>
              <TouchableOpacity
                style={[styles.categoryButton, !selectedCategory && styles.selectedCategoryButton]}
                onPress={resetCategoryFilter}
              >
                <Text style={[styles.categoryButtonText, !selectedCategory && styles.selectedCategoryButtonText]}>
                  All
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
              contentContainerStyle={styles.categoriesScrollContent}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryButton, selectedCategory === category && styles.selectedCategoryButton]}
                  onPress={() => filterMessagesByCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === category && styles.selectedCategoryButtonText,
                    ]}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[styles.classifyButton, isClassifying && styles.disabledButton]}
            onPress={classifyAllMessages}
            disabled={isClassifying}
          >
            {isClassifying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.classifyButtonText}>Classify All Messages</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {selectedCategory && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterText}>Showing {selectedCategory} messages</Text>
          <TouchableOpacity onPress={resetCategoryFilter}>
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Classification Error Banner */}
      {classificationError && (
        <View style={styles.errorBanner}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.errorText}>{classificationError}</Text>
          <TouchableOpacity onPress={() => setClassificationError(null)}>
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {groupedMessages.length > 0 ? (
          <SectionList
            sections={groupedMessages}
            keyExtractor={keyExtractor}
            renderItem={renderMessage}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.messageList}
            stickySectionHeadersEnabled={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={15}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubText}>Start the conversation!</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (sending || inputText.trim() === "") && styles.disabledSendButton]}
            onPress={sendMessage}
            disabled={sending || inputText.trim() === ""}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Dropdown Menu */}
      {isMenuVisible && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} onPress={() => setMenuVisible(false)} />
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false)
                setSettingsModalVisible(true)
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#333" />
              <Text style={styles.menuItemText}>Group Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false)
                setShowClassifyUI(true)
              }}
            >
              <Ionicons name="filter-outline" size={20} color="#333" />
              <Text style={styles.menuItemText}>Classify Messages</Text>
            </TouchableOpacity>

            {isHost ? (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false)
                  handleDeleteGroup()
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                <Text style={[styles.menuItemText, { color: "#FF6B6B" }]}>Delete Group</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false)
                  handleLeaveGroup()
                }}
              >
                <Ionicons name="exit-outline" size={20} color="#FF9500" />
                <Text style={[styles.menuItemText, { color: "#FF9500" }]}>Leave Group</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Group Settings Modal */}
      <Modal
        visible={isSettingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Info</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.groupInfoSection}>
              <View style={styles.groupAvatarContainer}>
                {group?.avatar ? (
                  <Image source={{ uri: group.avatar }} style={styles.groupAvatarLarge} />
                ) : (
                  <View style={styles.groupAvatarLarge}>
                    <Text style={styles.groupAvatarText}>{group?.name?.charAt(0) || "G"}</Text>
                  </View>
                )}
                {isHost && (
                  <TouchableOpacity style={styles.editAvatarButton}>
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.groupInfoTitle}>{group?.name}</Text>
              <Text style={styles.groupInfoMembers}>
                Group created on {new Date(group?.createdAt).toLocaleDateString()}
              </Text>

              {isHost && (
                <TouchableOpacity style={styles.editGroupNameButton}>
                  <Ionicons name="create-outline" size={18} color="#6C63FF" />
                  <Text style={styles.editGroupNameText}>Edit group name</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Members</Text>
              <Text style={styles.memberCount}>{members.length}</Text>
            </View>

            <FlatList
              data={members}
              renderItem={renderMemberItem}
              keyExtractor={memberKeyExtractor}
              style={styles.membersList}
              removeClippedSubviews={true}
              initialNumToRender={10}
            />

            {isHost && (
              <TouchableOpacity
                style={styles.addMembersButton}
                onPress={() => {
                  setSettingsModalVisible(false)
                  setAddMemberModalVisible(true)
                }}
              >
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
                <Text style={styles.addMembersButtonText}>Add Members</Text>
              </TouchableOpacity>
            )}

            {!isHost && (
              <TouchableOpacity
                style={styles.leaveGroupButton}
                onPress={() => {
                  setSettingsModalVisible(false)
                  handleLeaveGroup()
                }}
              >
                <Ionicons name="exit" size={20} color="#FFFFFF" />
                <Text style={styles.leaveGroupButtonText}>Leave Group</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Members Modal */}
      <Modal
        visible={isAddMemberModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddMemberModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Members</Text>
              <TouchableOpacity onPress={() => setAddMemberModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.searchInput} placeholder="Search contacts..." placeholderTextColor="#999" />

            {matches.length > 0 ? (
              <FlatList
                data={matches}
                renderItem={renderAddMemberItem}
                keyExtractor={memberKeyExtractor}
                style={styles.membersList}
                removeClippedSubviews={true}
                initialNumToRender={10}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={50} color="#CCCCCC" />
                <Text style={styles.emptyText}>No contacts available</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.addButton, selectedMembers.length === 0 && styles.disabledButton]}
              onPress={handleAddMembers}
              disabled={selectedMembers.length === 0}
            >
              <Text style={styles.addButtonText}>
                Add {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ""} Members
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  headerGroupName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerMembersCount: {
    fontSize: 12,
    color: "#666",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  // Classify UI styles - inline instead of modal
  classifyContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  classifyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  classifyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  classifyText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  categoryFilterContainer: {
    marginBottom: 16,
  },
  categoryFilterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginRight: 10,
  },
  categoriesScroll: {
    marginTop: 8,
  },
  categoriesScrollContent: {
    paddingRight: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: "#6C63FF",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#333",
  },
  selectedCategoryButtonText: {
    color: "#FFFFFF",
  },
  classifyButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  classifyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  createGroupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  addIcon: {
    position: "absolute",
    top: -5,
    right: -5,
  },
  groupAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
  },
  groupAvatarTextSmall: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  messageList: {
    padding: 10,
  },
  sectionHeader: {
    backgroundColor: "rgba(248, 249, 250, 0.9)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginVertical: 8,
    alignSelf: "center",
  },
  sectionHeaderText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  otherMessageRow: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 18,
    marginHorizontal: 4,
  },
  userBubble: {
    backgroundColor: "#6C63FF",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
  },
  pendingBubble: {
    opacity: 0.7,
  },
  importantBubble: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF4757",
  },
  reminderBubble: {
    backgroundColor: "#E3FCEF",
    borderLeftWidth: 4,
    borderLeftColor: "#2ED573",
  },
  announcementBubble: {
    backgroundColor: "#FFF9E3",
    borderLeftWidth: 4,
    borderLeftColor: "#FFA502",
  },
  spamBubble: {
    backgroundColor: "#FFE3E3",
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  senderName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 22,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginRight: 5,
  },
  categoryText: {
    fontSize: 10,
    color: "#666",
  },
  timeText: {
    fontSize: 11,
    color: "#999",
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: "#333333",
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
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  menuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    position: "absolute",
    top: 60,
    right: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 5,
    width: 200,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  groupInfoSection: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  groupAvatarContainer: {
    position: "relative",
    marginBottom: 10,
  },
  groupAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
  },
  groupAvatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6C63FF",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  groupInfoTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  groupInfoMembers: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  editGroupNameButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  editGroupNameText: {
    color: "#6C63FF",
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  memberCount: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  membersList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  memberInfo: {
    flex: 1,
    marginLeft: 10,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  memberStatus: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  removeButton: {
    padding: 5,
  },
  addMembersButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  addMembersButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  leaveGroupButton: {
    backgroundColor: "#FF9500",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  leaveGroupButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  addMemberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedMemberItem: {
    backgroundColor: "#F0F8FF",
  },
  checkboxContainer: {
    marginLeft: "auto",
  },
  uncheckedBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#DDD",
  },
  checkedBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
  addButton: {
    backgroundColor: "#6C63FF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  filterBanner: {
    backgroundColor: "#6C63FF",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  errorBanner: {
    backgroundColor: "#FF4757",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorIconContainer: {
    marginRight: 8,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
})

export default GroupChat
