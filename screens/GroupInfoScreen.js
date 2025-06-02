"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { jwtDecode } from "jwt-decode"

const GroupInfoScreen = ({ route, navigation }) => {
  const { groupId, groupName, isHost } = route.params
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
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
      fetchGroupDetails()
    }
  }, [userId, groupId])

  const fetchGroupDetails = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`https://dyna-ai.onrender.com/api/groups/${groupId}`)

      const group = response.data.group
      setMembers(group.members)

      // Fetch user details for each member
      const userDetailsPromises = group.members.map(async (memberId) => {
        try {
          // This assumes you have an endpoint to get user details
          const userResponse = await axios.get(`https://socket-ifia.onrender.com/user/${memberId}`)
          return { id: memberId, details: userResponse.data }
        } catch (error) {
          console.error(`Error fetching details for user ${memberId}:`, error)
          return { id: memberId, details: { name: "Unknown User" } }
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
      console.error("Error fetching group details:", error)
      setLoading(false)
    }
  }

  const handleRemoveMember = (memberId) => {
    if (!isHost) return

    Alert.alert("Remove Member", "Are you sure you want to remove this member from the group?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeMember(memberId),
      },
    ])
  }

  const removeMember = async (memberId) => {
    try {
      // Get current group details
      const response = await axios.get(`https://dyna-ai.onrender.com/api/groups/${groupId}`)

      const currentMembers = response.data.group.members
      const updatedMembers = currentMembers.filter((id) => id !== memberId)

      // Update group with new members list
      await axios.put(`https://dyna-ai.onrender.com/api/groups/${groupId}`, {
        members: updatedMembers,
        hostId: userId, // Include hostId to verify permission
      })

      // Update local state
      setMembers(updatedMembers)

      // Remove from userDetails
      const updatedUserDetails = { ...userDetails }
      delete updatedUserDetails[memberId]
      setUserDetails(updatedUserDetails)

      Alert.alert("Success", "Member removed from the group")
    } catch (error) {
      console.error("Error removing member:", error)
      Alert.alert("Error", "Failed to remove member")
    }
  }

  const handleLeaveGroup = () => {
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Leave",
        style: "destructive",
        onPress: leaveGroup,
      },
    ])
  }

  const leaveGroup = async () => {
    try {
      if (isHost) {
        // If host is leaving, check if there are other members
        if (members.length > 1) {
          // Find a new host (first member who is not current user)
          const newHostId = members.find((id) => id !== userId)

          // Update group with new host and remove current user
          const updatedMembers = members.filter((id) => id !== userId)

          await axios.put(`https://dyna-ai.onrender.com/api/groups/${groupId}`, {
            hostId: newHostId,
            members: updatedMembers,
          })
        } else {
          // If host is the only member, delete the group
          await axios.delete(`https://dyna-ai.onrender.com/api/groups/${groupId}`, {
            data: { userId },
          })
        }
      } else {
        // Regular member leaving
        const updatedMembers = members.filter((id) => id !== userId)

        await axios.put(`https://dyna-ai.onrender.com/api/groups/${groupId}`, {
          members: updatedMembers,
        })
      }

      // Navigate back to chat screen
      navigation.navigate("ChatScreen")
    } catch (error) {
      console.error("Error leaving group:", error)
      Alert.alert("Error", "Failed to leave group")
    }
  }

  const handleDeleteGroup = () => {
    if (!isHost) return

    Alert.alert("Delete Group", "Are you sure you want to delete this group? This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: deleteGroup,
      },
    ])
  }

  const deleteGroup = async () => {
    try {
      await axios.delete(`https://dyna-ai.onrender.com/api/groups/${groupId}`, {
        data: { userId },
      })

      // Navigate back to chat screen
      navigation.navigate("ChatScreen")
    } catch (error) {
      console.error("Error deleting group:", error)
      Alert.alert("Error", "Failed to delete group")
    }
  }

  const getMemberName = (memberId) => {
    const memberDetails = userDetails[memberId] || {}
    return memberDetails.name || "Unknown User"
  }

  const getMemberInitial = (memberId) => {
    const name = getMemberName(memberId)
    return name.charAt(0).toUpperCase()
  }

  const renderMember = ({ item }) => {
    const memberDetails = userDetails[item] || {}
    const isCurrentUser = item === userId
    const isGroupHost = item === route.params.hostId

    return (
      <View style={styles.memberItem}>
        {memberDetails.profilePic ? (
          <Image source={{ uri: memberDetails.profilePic }} style={styles.memberAvatar} />
        ) : (
          <View style={styles.memberAvatar}>
            <Text style={styles.memberInitial}>{getMemberInitial(item)}</Text>
          </View>
        )}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {getMemberName(item)}
            {isCurrentUser ? " (You)" : ""}
            {isGroupHost ? " (Host)" : ""}
          </Text>
          {memberDetails.email && <Text style={styles.memberEmail}>{memberDetails.email}</Text>}
        </View>
        {isHost && !isCurrentUser && (
          <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveMember(item)}>
            <Ionicons name="remove-circle-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Info</Text>
      </View>

      <View style={styles.groupInfoContainer}>
        <View style={styles.groupAvatar}>
          <Ionicons name="people" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.groupName}>{groupName}</Text>
        <Text style={styles.memberCount}>
          {members.length} {members.length === 1 ? "member" : "members"}
        </Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Members</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        ) : (
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.membersList}
          />
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLeaveGroup}>
          <Ionicons name="exit-outline" size={24} color="#FF3B30" />
          <Text style={styles.actionButtonTextDanger}>Leave Group</Text>
        </TouchableOpacity>

        {isHost && (
          <TouchableOpacity style={styles.actionButton} onPress={handleDeleteGroup}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            <Text style={styles.actionButtonTextDanger}>Delete Group</Text>
          </TouchableOpacity>
        )}
      </View>
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
  groupInfoContainer: {
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 16,
    color: "#666",
  },
  sectionContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  membersList: {
    paddingBottom: 16,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F9F9F9",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  memberEmail: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  actionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F9F9F9",
  },
  actionButtonTextDanger: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF3B30",
  },
})

export default GroupInfoScreen
