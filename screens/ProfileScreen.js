import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  Pressable,
  ScrollView,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import FastImage from 'react-native-fast-image';

import introimg from"../assests/intro.png"

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState('');
  const [currentProfile, setCurrentProfile] = useState(null);
  const { token, setToken } = useContext(AuthContext);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      setUserId(decodedToken.userId);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      getUserDetails();
    }
  }, [userId]);

  useEffect(() => {
    if (!token) {
      navigation.navigate('AuthStack', { screen: 'Login' });
    }
  }, [token, navigation]);

  const getUserDetails = async () => {
    try {
      const response = await axios.get(`https://socket-ifia.onrender.com/users/${userId}`);
      if (response.status === 200) {
        setCurrentProfile(response.data.user);
      } else {
        console.error('Error fetching user details:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching user details:', error.message);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken("");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        <View style={styles.header}>
          <FastImage
            style={styles.logo}
            source={{ uri: 'https://branditechture.agency/brand-logos/wp-content/uploads/wpdm-cache/Hinge-App-900x0.png' }}
          />
          <View style={styles.iconContainer}>
            <AntDesign name="infocirlce" size={24} color="black" />
            <AntDesign name="setting" size={24} color="black" />
          </View>
        </View>

        <View style={styles.profileContainer}>
          <Pressable onPress={() => navigation.navigate('Details', { currentProfile })}>
            <FastImage
              style={styles.profileImage}
              source={{ uri: currentProfile?.imageUrls[0] }}
            />
            <View style={styles.nameContainer}>
              <Text style={styles.profileName}>{currentProfile?.firstName}</Text>
              <MaterialIcons name="verified" size={22} color="#662d91" />
            </View>
          </Pressable>
        </View>

        <View style={styles.imageContainer}>
          <FastImage
            style={styles.largeImage}
            source={require('.././assests/intro.png')}
          />
        </View>

        <View style={styles.boostContainer}>
          <View style={styles.boostIcon}>
            <MaterialCommunityIcons name="lightning-bolt-outline" size={22} color="white" />
          </View>
          <View>
            <Text style={styles.boostText}>Boost</Text>
            <Text style={styles.boostDescription}>Get seen by 11x more people</Text>
          </View>
        </View>

        <View style={styles.rosesContainer}>
          <View style={styles.rosesIcon}>
            <Ionicons name="rose-outline" size={22} color="white" />
          </View>
          <View>
            <Text style={styles.rosesText}>Roses</Text>
            <Text style={styles.rosesDescription}>2x as likely to lead to get more likes</Text>
          </View>
        </View>

        <Pressable
          onPress={logout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 100,
    height: 80,
    resizeMode: 'cover',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
    borderColor: '#662d91',
    borderWidth: 3,
    alignSelf: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: "center",
    gap: 10,
    marginTop: 12,
  },
  profileName: {
    fontSize: 19,
    fontWeight: '600',
    color: "black",
  },
  imageContainer: {
    marginTop: 30,
    marginHorizontal: 20,
  },
  largeImage: {
    height: 200,
    width: '100%',
    borderRadius: 10,
  },
  boostContainer: {
    marginVertical: 20,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  boostIcon: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#006A4E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostText: {
    fontSize: 15,
    fontWeight: '600',
    color: "black",
  },
  boostDescription: {
    color: 'gray',
    marginTop: 3,
  },
  rosesContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  rosesIcon: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#F9629F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosesText: {
    fontSize: 15,
    fontWeight: '600',
    color: "black",
  },
  rosesDescription: {
    color: 'gray',
    marginTop: 3,
  },
  logoutButton: {
    borderColor: '#E0E0E0',
    marginTop: 40,
    padding: 12,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: "auto",
    marginRight: "auto",
    width: 120,
  },
  logoutText: {
    textAlign: "center",
    fontWeight: "500",
    color:"black"
  },
});

export default ProfileScreen;
