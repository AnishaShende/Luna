import {
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { saveRegistrationProgress } from '../registrationUtils';

// Predefined prompts with user-friendly questions
const predefinedQuestions = [
  "My hobbies are...",
  "My ideal weekend includes...",
  "My strengths are...",
  "My weaknesses are...",
];

const PromptsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [answers, setAnswers] = useState(Array(predefinedQuestions.length).fill('')); // Initialize answers array

  useEffect(() => {
    if (route.params?.prompts) {
      const existingAnswers = route.params.prompts.map(item => item.answer || '');
      setAnswers(existingAnswers);
    }
  }, [route.params?.prompts]);

  const handleNext = () => {
    // Check if all prompts have been answered
    const allAnswered = answers.every(answer => answer.trim() !== '');

    if (!allAnswered) {
      Alert.alert('Incomplete Answers', 'Please fill out all prompts before proceeding.');
      return; // Prevent moving to the next screen
    }

    const prompts = predefinedQuestions.map((question, index) => ({
      question,
      answer: answers[index], // Use user-provided answers
    }));

    saveRegistrationProgress('Prompts', { prompts });
    navigation.navigate('PreFinal');
  };

  const handleAnswerChange = (index, text) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = text;
    setAnswers(updatedAnswers);
  };

  return (
    <SafeAreaView>
      <View style={{ marginTop: 90, marginHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
            <AntDesign name="eye" size={22} color="black" />
          </View>
          <Image
            style={{ width: 100, height: 40 }}
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
          Write your profile answers
        </Text>
        <View style={{ marginTop: 20, flexDirection: 'column', gap: 20 }}>
          {predefinedQuestions.map((question, index) => (
            <View key={index}>
              <Text style={{ fontWeight: '600', fontSize: 15 ,color:"grey"}}>{question}</Text>
              <TextInput
                value={answers[index]}
                onChangeText={(text) => handleAnswerChange(index, text)}
                placeholder="Type your answer here..."
                placeholderTextColor={"grey"}
              
                style={styles.textInput}
              />
            </View>
          ))}
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

export default PromptsScreen;

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: '#707070',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 15,
    color:"black",
    
  },
});
