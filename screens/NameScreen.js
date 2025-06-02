import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  getRegistrationProgress,
  saveRegistrationProgress,
} from '../registrationUtils';

const NameScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setlastName] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    getRegistrationProgress('Name').then(progressData => {
      if (progressData) {
        setFirstName(progressData.firstName || '');
      }
    });
  }, []);

  const handleNext = () => {
    if (firstName.trim() === '') {
      // Alert user if first name is empty
      Alert.alert('Validation Error', 'First Name is required!');
      return;
    }
  
    // Save progress if the first name is filled out
    saveRegistrationProgress('Name', {firstName});
    
    // Navigate to the Email screen
    navigation.navigate('Email');
  };
  
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <Text style={{margintop: 50, textAlign: 'center', color: 'grey'}}>
       
      </Text>
      <View style={{marginTop: 30, marginHorizontal: 20}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
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
            <MaterialCommunityIcons
              name="newspaper-variant-outline"
              size={28}
              color="black"
              style={{color:"black"}} 
            />
          </View>
          <Image
            style={{width: 100, height: 40,}}
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/128/10613/10613685.png',
            }}
          />
        </View>
        <View style={{marginTop: 30}}>
          <Text
            style={{
              fontSize: 25,
              fontWeight: 'bold',
              fontFamily: 'GeezaPro-Bold',
              color: 'black',
            }}>
            What's your Name?
          </Text>
          <TextInput
            autoFocus={true}
            value={firstName}
            onChangeText={text => setFirstName(text)}
            style={{
              width: 340,
              marginVertical: 10,
              marginTop: 25,
              borderBottomColor: 'black',
              borderBottomWidth: 1,
              paddingBottom: 10,
              fontSize: firstName ? 22 : 22,
              fontFamily: 'GeezaPro-Bold',
              color:"black"
            }}
            placeholder="First Name*"
            placeholderTextColor={'#BEBEBE'}
          />

          <TextInput
           
            value={lastName}
            onChangeText={text => setlastName(text)}
            style={{
              width: 340,
              marginVertical: 10,
              marginTop: 20,
              borderBottomColor: 'black',
              borderBottomWidth: 1,
              paddingBottom: 10,
              fontSize: firstName ? 22 : 22,
              fontFamily: 'GeezaPro-Bold',
              color:"black"
            }}
            placeholder="Last Name"
            placeholderTextColor={'#BEBEBE'}
          />
        </View>
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

export default NameScreen;

const styles = StyleSheet.create({});
