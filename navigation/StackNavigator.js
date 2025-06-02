import {StyleSheet, Text, View} from 'react-native';
import React, {useContext} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LikeScreen from '../screens/LikeScreen';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {NavigationContainer} from '@react-navigation/native';
import BasicInfo from '../screens/BasicInfo';
import NameScreen from '../screens/NameScreen';
import EmailScreen from '../screens/EmailScreen';
import PasswordScreen from '../screens/PasswordScreen';
import BirthScreen from '../screens/BirthScreen';
import LocationScreen from '../screens/LocationScreen';
import GenderScreen from '../screens/GenderScreen';
import TypeScreen from '../screens/TypeScreen';
import DatingType from '../screens/DatingType';
import LookingFor from '../screens/LookingFor';
import PhotoScreen from '../screens/PhotoScreen';
import PromptsScreen from '../screens/PromptsScreen';
import ShowPromptsScreen from '../screens/ShowPromptsScreen';
import PreFinalScreen from '../screens/PreFinalScreen';
import {AuthContext} from '../AuthContext';
import SendLikesScreen from '../screens/SendLikesScreen';
import LoginScreen from '../screens/LoginScreen';
import HandleLikeScreen from '../screens/HandleLikeScreen';
import MusicPlayerScreen from '../screens/music-player-screen';
import MusicSearchScreen from '../screens/music-search-screen';
import MusicPlayer from '../screens/MusicPlayer';
import MusicSearch from '../screens/MusicSearch';
import MusicInvitation from '../screens/MusicInvitation';
import { MusicProvider } from "../screens/MusicContext"
import MusicRoom from '../screens/MusicRoom';

import ChatRoom from '../screens/ChatRoom';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import EducationScreen from '../screens/EducationScreen';
import ExploreScreen from '../screens/ExploreScreen';
import AiChatRoom  from '../screens/AiChatRoom'
import GroupChat from '../screens/GroupChat';
import CreateGroupScreen from "../screens/CreateGroupScreen"

import GroupInfoScreen from "../screens/GroupInfoScreen"
import PostScreen from '../screens/PostScreen';
import VoiceButton from '../screens/VoiceButton';

const StackNavigator = () => {
  const Stack = createNativeStackNavigator();
  const Tab = createBottomTabNavigator();
  const {isLoading, token} = useContext(AuthContext);

  function BottomTabs() {
    return (
      <Tab.Navigator screenOptions={() => ({tabBarShowLabel: false})}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarStyle: {backgroundColor: '#101010'},
            tabBarLabelStyle: {color: '#008397'},
            headerShown: false,
            tabBarIcon: ({focused}) =>
              focused ? (
                <MaterialCommunityIcons name="alpha" size={35} color="white" />
              ) : (
                <MaterialCommunityIcons
                  name="alpha"
                  size={35}
                  color="#989898"
                />
              ),
          }}
        />
        <Tab.Screen
          name="Likes"
          component={LikeScreen}
          options={{
            tabBarStyle: {backgroundColor: '#101010'},
            tabBarLabelStyle: {color: '#008397'},
            headerShown: false,
            tabBarIcon: ({focused}) =>
              focused ? (
                <Entypo name="heart" size={30} color="white" />
              ) : (
                <MaterialCommunityIcons
                  name="heart"
                  size={30}
                  color="#989898"
                />
              ),
          }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            tabBarStyle: {backgroundColor: '#101010'},
            tabBarLabelStyle: {color: '#008397'},
            headerShown: false,
            tabBarIcon: ({focused}) =>
              focused ? (
                <MaterialIcons
                  name="chat-bubble-outline"
                  size={30}
                  color="white"
                />
              ) : (
                <MaterialIcons
                  name="chat-bubble-outline"
                  size={30}
                  color="#989898"
                />
              ),
          }}
        />


<Tab.Screen
          name="PostScreen"
          component={PostScreen}
          options={{
            tabBarStyle: {backgroundColor: '#101010'},
            tabBarLabelStyle: {color: '#008397'},
            headerShown: false,
            tabBarIcon: ({focused}) =>
              focused ? (
                <MaterialIcons
                  name="post-add"
                  size={30}
                  color="white"
                />
              ) : (
                <MaterialIcons
                  name="post-add"
                  size={30}
                  color="#989898"
                />
              ),
          }}
        />


        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarStyle: {backgroundColor: '#101010'},
            tabBarLabelStyle: {color: '#008397'},
            headerShown: false,
            tabBarIcon: ({focused}) =>
              focused ? (
                <Ionicons
                  name="person-circle-outline"
                  size={30}
                  color="white"
                />
              ) : (
                <Ionicons
                  name="person-circle-outline"
                  size={30}
                  color="#989898"
                />
              ),
          }}
        />
      </Tab.Navigator>
    );
  }

  const AuthStack = () => {
    return (

      
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Basic"
          component={BasicInfo}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Name"
          component={NameScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Email"
          component={EmailScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Password"
          component={PasswordScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Birth"
          component={BirthScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Location"
          component={LocationScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Gender"
          component={GenderScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Type"
          component={TypeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Dating"
          component={DatingType}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LookingFor"
          component={LookingFor}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Education"
          component={EducationScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Photos"
          component={PhotoScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Prompts"
          component={PromptsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ShowPrompts"
          component={ShowPromptsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="PreFinal"
          component={PreFinalScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="VoiceButton"
          component={VoiceButton}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    );
  };

  function MainStack() {
    return (

      
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={BottomTabs}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="SendLike"
          component={SendLikesScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="HandleLike"
          component={HandleLikeScreen}
          options={{headerShown: false}}
        />

<Stack.Screen
          name="ExploreScreen"
          component={ExploreScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen name="ChatRoom" component={ChatRoom} />

        <Stack.Screen
          name="Details"
          component={ProfileDetailScreen}
          options={{headerShown: false}}
        />


<Stack.Screen
          name="AiChatRoom"
          component={AiChatRoom}
          options={{headerShown: false}}
        />


<Stack.Screen
          name="GroupChat"
          component={GroupChat}
          options={{headerShown: false}}
        />



<Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
<Stack.Screen name="CreateGroup" component={CreateGroupScreen} />


<Stack.Screen
        name="MusicSearch"
        component={MusicSearch}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="MusicPlayer"
        component={MusicPlayer}
        options={{headerShown: false}}
      />

<Stack.Screen
        name="MusicInvitation"
        component={MusicInvitation}
        options={{headerShown: false}}
      />



<Stack.Screen
        name="MusicRoom"
        component={MusicRoom}
        options={{headerShown: false}}
      />
        
      </Stack.Navigator>
    );
  }

  return (
   
    <NavigationContainer   >
       <MusicProvider>
      {token === null || token === '' ? <AuthStack /> : <MainStack />}
      </MusicProvider>
    </NavigationContainer>
   
  );
};

export default StackNavigator;

const styles = StyleSheet.create({});
