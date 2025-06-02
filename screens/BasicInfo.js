import {StyleSheet, Text, View, SafeAreaView, Pressable} from 'react-native';
import React from 'react';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

const BasicInfo = () => {
  const navigation=useNavigation();
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={{marginTop: 80}}>
        <Text
          style={{
            fontFamily: 'GeezaPro-Bold',
            fontWeight: 'bold',
            fontSize: 35,
            marginLeft: 20,
            color:'black'
          }}>
          You're one of kind
        </Text>
        <Text
          style={{
            fontFamily: 'GeezaPro-Bold',
            fontWeight: 'bold',
            fontSize: 35,
            marginLeft: 20,
            marginTop: 10,
            color:'black'
          }}>
          You're profile should be too  
        </Text>
      </View>

      <View>
        <LottieView
          style={{
            height: 260,
            width: 300,
            alignSelf: 'center',
            marginTop: 40,
            justifyContent: 'center',
          }}
          source={require('../assests/love.json')}
          autoPlay
          loop={true}
          speed={0.7}
        />
      </View>
      <Pressable 
      onPress={()=> navigation.navigate("Name")}
        style={{backgroundColor: '#900CRF', padding: 15, marginTop: 'auto'}}>
        <Text
          style={{
            textAlign: 'center',
            color: 'white',
            backgroundColor:'crimson',
            fontWeight: '600',
            fontSize: 15,padding:10
          }}>Let's get started</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default BasicInfo;

const styles = StyleSheet.create({});
