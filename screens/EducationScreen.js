import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getRegistrationProgress, saveRegistrationProgress } from '../registrationUtils';
const EducationScreen = () => {
    const navigation = useNavigation();
    const [education, setEducation] = useState('');
   
    useEffect(() => {
      getRegistrationProgress('Education').then(progressData => {
        if (progressData) {
          setEducation(progressData.education|| '');
        }
      });
    }, []);
   
    const handleNext = () => {
      // Navigate to the next screen
      if(education.trim()!==''){
        saveRegistrationProgress("Education",{education})
       navigation.navigate('Photos'); }
    
      else {
        // Alert the user if location is empty
        alert('Please enter your profession to proceed.');
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
            color:"black"
          }}>
          <Ionicons name="bag-add-outline" size={20} color="black" />
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
       Profession
      </Text>

      <TextInput
      autoFocus={true}
        value={education}
        onChangeText={(text)=>setEducation(text)}
      
        placeholder="Enter your profession"
        placeholderTextColor={'#BEBEBE'}
        style={{
          width: 340,
          marginVertical: 10,
          marginTop: 25,
          borderBottomColor: 'black',
          borderBottomWidth: 1,
          paddingBottom: 10,
          fontSize: education ? 22 : 22,
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
  )
}

export default EducationScreen

const styles = StyleSheet.create({})