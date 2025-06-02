"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Image,
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { jwtDecode } from "jwt-decode"

const CreateGroupScreen = ({ navigation }) => {
  const [groupName, setGroupName] = useState("")
  const [userId, setUserId] = useState("")
  const [matches, setMatches] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [userDetails, setUserDetails] = useState({})

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
      fetchMatches()
    }
  }, [userId])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`https://socket-ifia.onrender.com/get-matches/${userId}`)

      // Store the matches
      setMatches(response.data.matches)

      // Fetch user details for each match
      const userDetailsPromises = response.data.matches.map(async (match) => {
        try {
          // This assumes you have an endpoint to get user details
          const userResponse = await axios.get(`https://socket-ifia.onrender.com/user/${match.userId}`)
          return { id: match.userId, details: userResponse.data }
        } catch (error) {
          console.error(`Error fetching details for user ${match.userId}:`, error)
          // Use the match data as fallback
          return {
            id: match.userId,
            details: {
              name: match.name || "User",
              email: match.email || null,
              profilePic: match.profilePic || null,
            },
          }
        }
      })

      const userDetailsResults = await Promise.all(userDetailsPromises)
      const userDetailsMap = {}
      userDetailsResults.forEach((result) => {
        userDetailsMap[result.id] = result.details
      })

      setUserDetails(userDetailsMap)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching matches:", error)
      setLoading(false)
    }
  }

  const toggleUserSelection = (matchId) => {
    if (selectedUsers.includes(matchId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== matchId))
    } else {
      setSelectedUsers([...selectedUsers, matchId])
    }
  }

  const handleCreateGroup = async () => {
    if (groupName.trim() === "") {
      Alert.alert("Error", "Please enter a group name")
      return
    }

    if (selectedUsers.length === 0) {
      Alert.alert("Error", "Please select at least one user")
      return
    }

    try {
      setCreating(true)

      // Include the creator in the members list
      const members = [userId, ...selectedUsers]

      const response = await axios.post("https://dyna-ai.onrender.com/api/groups", {
        name: groupName,
        hostId: userId,
        members,
      })

      setCreating(false)

      // Navigate to the new group chat
      navigation.replace("GroupChat", {
        groupId: response.data.group._id,
        groupName: response.data.group.name,
        isHost: true,
      })
    } catch (error) {
      console.error("Error creating group:", error)
      setCreating(false)
      Alert.alert("Error", "Failed to create group")
    }
  }

  const getUserName = (item) => {
    // First try to get name from userDetails
    const details = userDetails[item.userId]
    if (details && details.name) {
      return details.name
    }

    // Fallback to match data
    return item.name || "User"
  }

  const getUserInitial = (item) => {
    const name = getUserName(item)
    return name ? name.charAt(0).toUpperCase() : "?"
  }

  const renderUser = ({ item }) => {
    const isSelected = selectedUsers.includes(item.userId)
    const userName = getUserName(item)

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => toggleUserSelection(item.userId)}
      >
        {item.profilePic ? (
          <Image source={{ uri: item.profilePic }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>{getUserInitial(item)}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName}</Text>
          {item.email && <Text style={styles.userEmail}>{item.email}</Text>}
        </View>
        <View style={styles.checkboxContainer}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color="#6C63FF" />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color="#CCC" />
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="people" size={24} color="#6C63FF" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Group name" value={groupName} onChangeText={setGroupName} />
        </View>

        <Text style={styles.sectionTitle}>Add Members</Text>
        <Text style={styles.selectedCount}>Selected: {selectedUsers.length}</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        ) : matches.length > 0 ? (
          <FlatList
            data={matches}
            renderItem={renderUser}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.usersList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.createButton,
          (groupName.trim() === "" || selectedUsers.length === 0 || creating) && styles.disabledButton,
        ]}
        onPress={handleCreateGroup}
        disabled={creating || groupName.trim() === "" || selectedUsers.length === 0}
      >
        {creating ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.createButtonText}>Create Group</Text>
        )}
      </TouchableOpacity>
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
  formContainer: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  selectedCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  usersList: {
    paddingBottom: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F9F9F9",
  },
  selectedUserItem: {
    backgroundColor: "#F0F0FF",
    borderWidth: 1,
    borderColor: "#E0E0FF",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  userEmail: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  checkboxContainer: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  createButton: {
    backgroundColor: "#6C63FF",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#CCC",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
})

export default CreateGroupScreen
