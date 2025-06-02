import {
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

const ShowPromptsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const prompts = [
    { question: 'What motivates you?' },
    { question: 'What do you value in friendships?' },
    { question: 'Describe your dream vacation.' },
  ];

  const handleSelectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setIsModalVisible(true);
  };

  const handleSaveAnswer = () => {
    const updatedPrompts = [...(route?.params?.prompts || [])];
    updatedPrompts[route?.params?.promptIndex] = {
      question: selectedPrompt?.question,
      answer: answer,
    };
    navigation.navigate('PromptsScreen', { prompts: updatedPrompts });
    setIsModalVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
        Select a prompt
      </Text>
      <FlatList
        data={prompts}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedPrompt(item);
              handleSelectPrompt(item);
            }}
            style={{
              borderColor: '#707070',
              borderWidth: 2,
              justifyContent: 'center',
              alignItems: 'center',
              borderStyle: 'dashed',
              borderRadius: 10,
              padding: 15,
              marginVertical: 10,
            }}>
            <Text style={{ fontWeight: '600', fontStyle: 'italic', fontSize: 15 }}>
              {item.question}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
      />

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
          <View
            style={{
              width: '80%',
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
            }}>
            <Text style={{ fontWeight: '600', fontSize: 18 }}>
              {selectedPrompt?.question}
            </Text>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="Write your answer..."
              style={{
                borderColor: '#707070',
                borderWidth: 1,
                marginTop: 20,
                padding: 10,
                borderRadius: 5,
              }}
              multiline
            />
            <TouchableOpacity
              onPress={handleSaveAnswer}
              style={{
                marginTop: 20,
                backgroundColor: '#581845',
                padding: 10,
                borderRadius: 5,
              }}>
              <Text style={{ color: 'white', textAlign: 'center' }}>Save Answer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ShowPromptsScreen;
