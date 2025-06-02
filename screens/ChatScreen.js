import { StyleSheet, Text, View, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Modal, TextInput, FlatList, Image } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import 'core-js/stable/atob';
import UserChat from '../components/UserChat';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ChatScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [isCreateGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;
        setUserId(userId);
        
        const email = decodedToken.email;
        setEmail(email);
        
        // Register user
        await axios.post('https://dyna-ai.onrender.com/api/users', { userId, email });
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const fetchMatches = async () => {
    try {
      if (!userId) return;
      
      const response = await axios.get(
        `https://socket-ifia.onrender.com/get-matches/${userId}`
      );
      setMatches(response.data.matches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      if (!userId) return;
      
      const response = await axios.get(
        `https://dyna-ai.onrender.com/api/groups/user/${userId}`
      );
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMatches();
      fetchGroups();
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchMatches();
        fetchGroups();
      }
    }, [userId])
  );

  const handleDnyaPress = () => {
    if (userId) {
      navigation.navigate('AiChatRoom', { userId });
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert('Please enter a group name and select at least one member');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('https://dyna-ai.onrender.com/api/groups', {
        name: groupName,
        hostId: userId,
        members: [...selectedMembers, userId]
      });

      setGroups([...groups, response.data.group]);
      setCreateGroupModalVisible(false);
      setGroupName('');
      setSelectedMembers([]);
      
      // Navigate to the new group chat
      navigation.navigate('GroupChat', { 
        groupId: response.data.group._id,
        groupName: response.data.group.name,
        isHost: true,
        userId
      });
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMemberSelection = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const renderMemberItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.memberItem,
        selectedMembers.includes(item._id) && styles.selectedMemberItem
      ]}
      onPress={() => toggleMemberSelection(item._id)}
    >
      <Image
        source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/50' }}
        style={styles.memberAvatar}
      />
      <Text style={styles.memberName}>{item.firstName}</Text>
      {selectedMembers.includes(item._id) && (
        <Ionicons name="checkmark-circle" size={20} color="#6C63FF" style={styles.checkIcon} />
      )}
    </TouchableOpacity>
  );

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => navigation.navigate('GroupChat', { 
        groupId: item._id,
        groupName: item.name,
        isHost: item.hostId === userId,
        userId
      })}
    >
      <View style={styles.groupAvatar}>
        <Ionicons name="people" size={24} color="#fff" />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupMembers}>{item.members.length} members</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Luna</Text>
        <TouchableOpacity 
          style={styles.createGroupButton}
          onPress={() => setCreateGroupModalVisible(true)}
        >
          <Ionicons name="people-outline" size={24} color="#6C63FF" />
          <Ionicons name="add-circle" size={16} color="#6C63FF" style={styles.addIcon} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Your Chats</Text>
        </View>

        {/* Dnya AI Assistant */}
        <TouchableOpacity 
          style={styles.dnyaContainer}
          onPress={handleDnyaPress}
        >
          <View style={styles.dnyaAvatar}>
            <Ionicons name="chatbots-outline" size={24} color="#fff" />
          </View>
          <View style={styles.dnyaInfo}>
            <Text style={styles.dnyaName}>Dnya</Text>
            <Text style={styles.dnyaDescription}>AI Assistant</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Groups Section */}
        {groups.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Groups</Text>
            </View>
            <FlatList
              data={groups}
              renderItem={renderGroupItem}
              keyExtractor={item => item._id}
              scrollEnabled={false}
            />
          </>
        )}

        <View style={styles.divider} />

        {/* Matches Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Matches</Text>
        </View>
        <View style={styles.matchesContainer}>
          {matches.length > 0 ? (
            matches.map((item, index) => (
              <UserChat key={index} userId={userId} item={item} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>
                Find someone of your interest and start a conversation 💬
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={isCreateGroupModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Group</Text>
              <TouchableOpacity onPress={() => setCreateGroupModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.groupNameInput}
              placeholder="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={30}
            />
            
            <Text style={styles.selectMembersTitle}>Select Members</Text>
            
            {matches.length > 0 ? (
              <FlatList
                data={matches}
                renderItem={renderMemberItem}
                keyExtractor={item => item._id}
                style={styles.membersList}
              />
            ) : (
              <Text style={styles.noMatchesText}>No matches available to add</Text>
            )}
            
            <TouchableOpacity
              style={[
                styles.createButton,
                (isLoading || !groupName.trim() || selectedMembers.length === 0) && styles.disabledButton
              ]}
              onPress={handleCreateGroup}
              disabled={isLoading || !groupName.trim() || selectedMembers.length === 0}
            >
              {isLoading ? (
                <Text style={styles.createButtonText}>Creating...</Text>
              ) : (
                <Text style={styles.createButtonText}>Create Group</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createGroupButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  matchesContainer: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  dnyaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dnyaAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dnyaInfo: {
    flex: 1,
  },
  dnyaName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dnyaDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  groupMembers: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  selectMembersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  membersList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedMemberItem: {
    backgroundColor: '#F0F8FF',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  checkIcon: {
    marginLeft: 10,
  },
  noMatchesText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  createButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatScreen;