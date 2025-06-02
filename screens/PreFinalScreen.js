import {Pressable, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {useNavigation} from '@react-navigation/native';
import {
  getRegistrationProgress,
  saveRegistrationProgress,
} from '../registrationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRoute} from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const PreFinalScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [userData, setUserData] = useState();
  const { token, isLoading,setToken } = useContext(AuthContext);
  
  useEffect(() => {
    // Check if the token is set and not in loading state
    if (token) {
      // Navigate to the main screen
      navigation.replace('MainStack', { screen: 'Main' });
    }
  }, [token]);

  useEffect(() => {
    getAllUserData();
  }, []);

  const getAllUserData = async () => {
    try {
      // Define an array to store data for each screen
      const screens = [
        'Name',
        'Email',
        'Password',
        'Birth',
        'Location',
        'Gender',
        'Education',
        'Type',
        'Dating',
        'LookingFor',
        'Hometown',
        'Photos',
        'Prompts',
      ]; // Add more screens as needed

      // Define an object to store user data
      let userData = {};

      // Retrieve data for each screen and add it to the user data object
      for (const screenName of screens) {
        const screenData = await getRegistrationProgress(screenName);
        if (screenData) {
          userData = {...userData, ...screenData}; // Merge screen data into user data
        }
      }

      // Return the combined user data
      setUserData(userData);
    } catch (error) {
      console.error('Error retrieving user data:', error);
     
    }
  };





 
 
  const clearAllScreenData = async () => {
    try {
      const screens = [
        'Name',
        'Email',
        'Education',
        'Location',
        'Gender',
        'Type',
        'Dating',
        'LookingFor',
        'Hometown',
        'Photos',
      ];
      // Loop through each screen and remove its data from AsyncStorage
      for (const screenName of screens) {
        const key = `registration_progress_${screenName}`;
        await AsyncStorage.removeItem(key);
      }
    
    } catch (error) {
      console.error('Error clearing screen data:', error);
    }
  };
  const registerUser = async () => {
    if (!userData) {
      console.error('User data is not available');
      return; // Exit if user data is not ready
    }
  
    try {
      const response = await axios.post('https://socket-ifia.onrender.com/register', userData);
    
      
      // Check if the token exists in the response
      const token = response.data.token;
      if (token) {
        await AsyncStorage.setItem('token', token);
        setToken(token); // Assuming setToken is provided by AuthContext
        clearAllScreenData(); // Clear data only after successful registration
        navigation.replace('MainStack', { screen: 'Main' }); // Navigate to the main screen
      } else {
        console.error('Token not received');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      // Optionally handle error display to the user
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={{marginTop: 80}}>
        <Text
          style={{
            fontSize: 35,
            fontWeight: 'bold',
            fontFamily: 'GeezaPro-Bold',
            marginLeft: 20,
            color:"black"
          }}>
          All set to register
        </Text>
        <Text
          style={{
            fontSize: 33,
            fontWeight: 'bold',
            fontFamily: 'GeezaPro-Bold',
            marginLeft: 20,
            marginRight: 10,
            marginTop: 10,
            color:"black"
          }}>
          Setting up your profile for you
        </Text>
      </View>

      <View>
        <LottieView
          source={require('../assests/love.json')}
          style={{
            height: 260,
            width: 300,
            alignSelf: 'center',
            marginTop: 40,
            justifyContent: 'center',
          }}
          autoPlay
          loop={true}
          speed={0.7}
        />
      </View>

      <Pressable
        onPress={registerUser}
        style={{backgroundColor: '#900C3F', padding: 15, marginTop: 'auto'}}>
        <Text
          style={{
            textAlign: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: 15,
          }}>
          Finish registering
        </Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default PreFinalScreen;

const styles = StyleSheet.create({});