import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import FastImage from 'react-native-fast-image';

const UserChat = ({item, userId}) => {
  const navigation = useNavigation();
  return (
    <Pressable
 onPress={()=>
    navigation.navigate('ChatRoom',{
        image:item?.imageUrls[0],
        name:item?.firstName,
        receiverId:item?._id,
        senderId:userId,
    })
 }
    style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 12,
      }}>
      <View>
        <FastImage
          style={{width: 70, height: 75, borderRadius: 35}}
          source={{uri: item?.imageUrls[0]}}
        />
      </View>
      <View>
        <Text
          style={{
            fontWeight: '500',
            fontSize: 16,
            fontFamily: 'GeezaPro-Bold',
            color:"black"
          }}>
          {item.firstName}
        </Text>
        <Text style={{fontSize: 16, fontWeight: 500, marginTop: 6,color:"grey"}}>
          {`Start Chat with ${item.firstName}`}
        </Text>
      </View>
    </Pressable>
  );
};

export default UserChat;

const styles = StyleSheet.create({});
