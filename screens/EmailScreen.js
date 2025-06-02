import {StyleSheet, Text, View, SafeAreaView, Image, TouchableOpacity, Alert} from 'react-native';
import React, {useEffect, useState} from 'react';
import Fontisto from 'react-native-vector-icons/Fontisto';
import {TextInput} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {
  getRegistrationProgress,
  saveRegistrationProgress,
} from '../registrationUtils';
import axios from 'axios';

const EmailScreen = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    getRegistrationProgress('Email').then(progressData => {
      if (progressData) {
        setEmail(progressData.email || '');
      }
    });
  }, []);

  const checkEmailExists = async (email) => {
    try {
      const response = await axios.post('http:/192.168.39.169:3000/check-email', { email });
      return response.data.exists; // Assuming 'exists' field from backend
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format validation
    return emailRegex.test(email);
  };

  const handleNext = async () => {
    if (email.trim() === '') {
      setError('Please enter a valid email.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const emailExists = await checkEmailExists(email);

    if (emailExists) {
      setError('Email is already registered. Please use another email.');
      Alert.alert(
        'Email Already Registered',
        'This email is already registered. Please use another email.',
        [{ text: 'OK' }]
      );
    } else {
      saveRegistrationProgress('Email', {email});
      navigation.navigate('Password');
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={{marginTop: 90, marginHorizontal: 20}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: 'black',
              justifyContent: 'center',
              alignItems: 'center',
               color:"black"
            }}>
            <Fontisto name="email" size={28} color="black"  style={{color:"black"}} />
          </View>
          <Image
            style={{width: 100, height: 40}}
            source={{uri: 'https://cdn-icons-png.flaticon.com/128/10613/10613685.png'}}
          />
        </View>
        <Text style={{fontSize: 25, fontWeight: 'bold', marginTop: 15, color: 'black'}}>
          Please provide a valid email
        </Text>
        <Text style={{marginTop: 10, fontSize: 15, color: 'grey'}}>
          Email verification helps us keep the account secure
        </Text>
        <TextInput
          autoFocus={true}
          value={email}
          onChangeText={text => {
            setEmail(text);
            setError(''); // Clear error on input change
          }}
          placeholder="Enter your email"
          placeholderTextColor={'#BEBEBE'}
          style={{
            width: 340,
            marginVertical: 10,
            marginTop: 25,
            borderBottomColor: 'black',
            borderBottomWidth: 1,
            paddingBottom: 10,
            fontSize: email ? 22 : 22,
            fontFamily: 'GeezaPro-Bold',
            color:"black"
          }}
        />

        {error ? (
          <Text style={{color: 'red', marginTop: 7, fontSize: 15}}>
            {error}
          </Text>
        ) : null}

        <Text style={{color: 'grey', marginTop: 7, fontSize: 15}}>
          Note: You will need to verify your email
        </Text>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={{marginTop: 30, marginLeft: 'auto'}}>
          <MaterialCommunityIcons
            style={{alignSelf: 'center', marginTop: 20}}
            name="arrow-right-circle"
            size={40}
            color="crimson"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EmailScreen;

const styles = StyleSheet.create({});
