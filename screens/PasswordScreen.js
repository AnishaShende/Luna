import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import {useNavigation} from '@react-navigation/native';
import {
  saveRegistrationProgress,
} from '../registrationUtils';

const Password = () => {
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const handleNext = () => {
    if (password.trim() === '') {
      Alert.alert('Password Required', 'Please enter a password to proceed.');
      return;
    }
  
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }
  
    saveRegistrationProgress('Password', {password});
    navigation.navigate('Birth');
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
            <Fontisto name="email" size={26} color="black" style={{color:"black"}}  />
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
            color: "black"
          }}>
          Please choose your password
        </Text>

        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TextInput
            secureTextEntry={!showPassword} // Use the state to toggle visibility
            autoFocus={true}
            value={password}
            onChangeText={text => setPassword(text)}
            style={{
              width: 300, // Adjust width as needed
              marginVertical: 10,
              fontSize: password ? 22 : 22,
              marginTop: 25,
              borderBottomColor: 'black',
              borderBottomWidth: 1,
              paddingBottom: 10,
              fontFamily: 'GeezaPro-Bold',
              color: "black"
            }}
            placeholder="Enter your password"
            placeholderTextColor={'#BEBEBE'}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons
              name={showPassword ? "eye-off" : "eye"} // Change icon based on visibility
              size={26}
              color="black"
              style={{marginLeft: 10}}
            />
          </TouchableOpacity>
        </View>
        
        <Text style={{color: 'gray', fontSize: 15, marginTop: 7}}>
          Note: Your details will be safe with us.
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

export default Password;

const styles = StyleSheet.create({});
