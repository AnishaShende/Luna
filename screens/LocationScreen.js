import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  TouchableOpacity,
  TextInput
} from 'react-native';

import React, {useEffect, useState} from 'react';
import MapView, {Marker} from 'react-native-maps';

import {useNavigation} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRegistrationProgress, saveRegistrationProgress } from '../registrationUtils';


const LocationScreen = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState('');
 
  useEffect(() => {
    getRegistrationProgress('Location').then(progressData => {
      if (progressData) {
        setLocation(progressData.location|| '');
      }
    });
  }, []);
 
  const handleNext = () => {
    // Check if location input is not empty
    if (location.trim() !== '') {
      // Save the registration progress
      saveRegistrationProgress('Location', { location });
      // Navigate to the next screen
      navigation.navigate('Gender');
    } else {
      // Alert the user if location is empty
      alert('Please enter your location to proceed.');
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
              borderColor: 'black',
              borderWidth: 2,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <MaterialCommunityIcons
              name="cake-variant-outline"
              size={26}
              color="black"
              style={{color:"black"}} 
            />
          </View>
          <Image
            style={{width: 100, height: 40}}
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/128/10613/10613685.png',
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 25,
            fontWeight: 'bold',
            fontFamily: 'GeezaPro-Bold',
            marginTop: 15,
            color:'black'
          }}>
          Where do you live?
        </Text>

        <TextInput
        autoFocus={true}
          value={location}
          onChangeText={(text)=>setLocation(text)}
        
          placeholder="Enter your city"
          placeholderTextColor={'#BEBEBE'}
          style={{
            width: 340,
            marginVertical: 10,
            marginTop: 25,
            borderBottomColor: 'black',
            borderBottomWidth: 1,
            paddingBottom: 10,
            fontSize: location ? 22 : 22,
            fontFamily: 'GeezaPro-Bold',
            color:"black"
          }}
        />

       
       
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={{marginTop: 20, marginLeft: 'auto'}}>
          <MaterialCommunityIcons
            name="arrow-right-circle"
            size={45}
            color="crimson"
            style={{alignSelf: 'center', marginTop: 20}}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LocationScreen;

const styles = StyleSheet.create({});