import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  TextInput,
  Pressable,
} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useRoute} from '@react-navigation/native';
import axios from 'axios';

const SendLikesScreen = () => {
  const route = useRoute();
  const [message, setMessage] = useState(''); // Renamed from comment to message
  const navigation = useNavigation();

  const sendConnectionRequest = async () => {
    try {
      // Send POST request to backend (same endpoint, different UI presentation)
      const response = await axios.post('https://socket-ifia.onrender.com/like-profile', {
        userId: route.params.userId,
        likedUserId: route.params.likedUserId,
        image: route?.params?.image,
        comment: message, // Backend still expects "comment"
      });

      if (response.status === 200) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connect with {route?.params?.name}</Text>
      </View>
      
      <View style={styles.profileContainer}>
        {/* User card with profile image and name */}
        <View style={styles.userCard}>
          <Image   
            style={styles.profileImage}
            source={{uri: route?.params?.image}}
          />
          <View style={styles.userInfo}>
            <Text style={styles.profileName}>{route?.params?.name}</Text>
            <Text style={styles.userStatus}>Active now</Text>
          </View>
        </View>

        {/* Message input field */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>Add a message</Text>
          <TextInput
            placeholder="Say something nice..."
            value={message}
            onChangeText={text => setMessage(text)}
            placeholderTextColor={"grey"}
            style={styles.messageInput}
            multiline={true}
            numberOfLines={3}
          />
        </View>

        {/* Button section */}
        <View style={styles.buttonContainer}>
          {/* Cancel button */}
          <Pressable 
            onPress={() => navigation.goBack()} 
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          {/* Send Request Button */}
          <Pressable 
            onPress={sendConnectionRequest} 
            style={styles.sendRequestButton}
          >
            <Text style={styles.sendRequestText}>Send Request</Text>
            <MaterialIcons name="send" size={18} color="white" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#333",
  },
  profileContainer: {
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#333",
  },
  userStatus: {
    fontSize: 14,
    color: "#4CAF50",
    marginTop: 4,
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: "#555",
    marginBottom: 8,
  },
  messageInput: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    fontSize: 16,
    color: "black",
    borderWidth: 1,
    borderColor: '#EEEEEE',
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: "#555",
  },
  sendRequestButton: {
    backgroundColor: 'crimson', // Facebook blue for social media feel
    borderRadius: 8,
    padding: 14,
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendRequestText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: "white",
    marginRight: 8,
  },
});

export default SendLikesScreen;