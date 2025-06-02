import {
  Image,
  TextInput,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { getRegistrationProgress, saveRegistrationProgress } from '../registrationUtils';

const GenderScreen = () => {
  const navigation = useNavigation();
  const [gender, setGender] = useState('');

  useEffect(() => {
    getRegistrationProgress('Gender').then(progressData => {
      if (progressData) {
        setGender(progressData.gender || '');
      }
    });
  }, []);

  const handleNext = () => {
    // Navigate to the next screen
    if(gender.trim()!==''){
      saveRegistrationProgress("Gender",{gender})
    navigation.navigate('Education'); }
   
    else {
      // Alert the user if location is empty
      alert('Please select your gender to proceed.');
    }

  };
  return (
    <SafeAreaView>
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
              name="newspaper-variant-outline"
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
            color: 'black',
          }}>
          Gender
        </Text>

        <View style={{marginTop: 30}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontWeight: 500, fontSize: 15, color: 'black'}}>
              Male
            </Text>
            <Pressable onPress={() => setGender('Men')}>
              <FontAwesome
                name="circle"
                size={26}
                color={gender == 'Men' ? 'crimson' : 'grey'}
              />
            </Pressable>
          </View>
        </View>
        <View style={{marginTop: 30}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginVertical:3
            }}>
            <Text style={{fontWeight: 500, fontSize: 15, color: 'black'}}>
             Female
            </Text>
            <Pressable onPress={() => setGender('Women')}>
              <FontAwesome
                name="circle"
                size={26}
                color={gender == 'Women' ? 'crimson' : 'grey'}
              />
            </Pressable>
          </View>
        </View>
        <View style={{marginTop: 30}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginVertical:3
            }}>
            <Text style={{fontWeight: 500, fontSize: 15, color: 'black'}}>
              Other
            </Text>
            <Pressable onPress={() => setGender('Non Binary')}>
              <FontAwesome
                name="circle"
                size={26}
                color={gender == 'Non Binary' ? 'crimson' : 'grey'}
              />
            </Pressable>
          </View>
        </View>
        <View style={{marginTop:30,flexDirection:'row',alignItems:'center',gap:8}}>
          <AntDesign
                name="checksquare"
                size={26}
                color='green'
              />
              <Text  style={{ fontSize: 15, color: 'grey'}}>visible on profile</Text>
        </View>
        

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

export default GenderScreen;

const styles = StyleSheet.create({});
