import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  Pressable,
  TextInput,
  Button,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions, // Import Dimensions
} from 'react-native';
import React, { useState, useEffect } from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import {
  getRegistrationProgress,
  saveRegistrationProgress,
} from '../registrationUtils';
import { launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window'); // Get the window width

const PhotoScreen = () => {
  const navigation = useNavigation();
  const [imageUrls, setImageUrls] = useState(['', '', '', '', '', '']);
  const [imageUrl, setImageUrl] = useState('');

  const handleAddImage = () => {
    const index = imageUrls.findIndex(url => url === '');
    if (index !== -1 && imageUrl) {
      const updatedUrls = [...imageUrls];
      updatedUrls[index] = imageUrl;
      setImageUrls(updatedUrls);
      setImageUrl('');
    }
  };

  const handleSelectImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.error('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const newImageUrl = asset.uri;
        const index = imageUrls.findIndex(url => url === '');
        if (index !== -1) {
          const updatedUrls = [...imageUrls];
          updatedUrls[index] = newImageUrl;
          setImageUrls(updatedUrls);
        }
      }
    });
  };

  const handleRemoveImage = (index) => {
    const updatedUrls = [...imageUrls];
    updatedUrls[index] = '';
    setImageUrls(updatedUrls);
  };

  useEffect(() => {
    getRegistrationProgress('Photos').then(progressData => {
      if (progressData && progressData.imageUrls) {
        setImageUrls(progressData.imageUrls);
      }
    });
  }, []);

  const handleNext = () => {
    const filledImages = imageUrls.filter(url => url !== '').length;

    if (filledImages < 2) {
      Alert.alert('At Least Two Images Required', 'Please add at least 2 images to proceed.');
      return;
    }

    saveRegistrationProgress('Photos', { imageUrls });
    navigation.navigate('Prompts');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <MaterialIcons name="photo-camera-back" size={22} color="black" style={{color:"black"}} />
          <Image
            style={styles.logo}
            source={{ uri: 'https://cdn-icons-png.flaticon.com/128/10613/10613685.png' }}
          />
        </View>
        <Text style={styles.title}>Pick your videos and photos</Text>

        <View style={styles.imageGrid}>
          {imageUrls.slice(0, 3).map((url, index) => (
            <Pressable key={index} style={[styles.imageContainer, { borderColor: url ? 'transparent' : '#581845' }]}>
              {url ? (
                <>
                  <Image
                    source={{ uri: url }}
                    style={styles.image}
                  />
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemoveImage(index)}>
                    <AntDesign name="closecircle" size={20} color="red" />
                  </TouchableOpacity>
                </>
              ) : (
                <EvilIcons name="image" size={22} color="black" />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.imageGrid}>
          {imageUrls.slice(3, 6).map((url, index) => (
            <Pressable key={index + 3} style={[styles.imageContainer, { borderColor: url ? 'transparent' : '#581845' }]}>
              {url ? (
                <>
                  <Image
                    source={{ uri: url }}
                    style={styles.image}
                  />
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemoveImage(index + 3)}>
                    <AntDesign name="closecircle" size={20} color="red" />
                  </TouchableOpacity>
                </>
              ) : (
                <EvilIcons name="image" size={22} color="black" />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.instructions}>
          <Text style={styles.dragText}>Drag to reorder</Text>
          <Text style={styles.addText}>Add four to six photos</Text>
        </View>

        <View style={styles.addImageSection}>
          <Text>Add a picture of yourself</Text>
          <View style={styles.inputContainer}>
            <EvilIcons name="image" size={22} color="black" />
            <TextInput
              value={imageUrl}
              onChangeText={text => setImageUrl(text)}
              style={styles.input}
              placeholder="Enter your image URL"
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button onPress={handleAddImage} title="Add Image" />
            <Button style={{borderRadius:50}}  onPress={handleSelectImage} title="Select from Device" />
          </View>
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default PhotoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 90,
  },
  logo: {
    width: 100,
    height: 40,
    marginLeft: 10,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    fontFamily: 'GeezaPro-Bold',
    marginTop: 15,
    color: 'black',
  },
  imageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  imageContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
    height: 100,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 5,
  },
  instructions: {
    marginVertical: 10,
  },
  dragText: {
    color: 'grey',
    fontSize: 15,
  },
  addText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#581845',
    marginTop: 3,
    color: 'gray',
  },
  addImageSection: {
    marginTop: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCDCDC',
    borderRadius: 5,
    paddingVertical: 5,
    marginTop: 10,
  },
  input: {
    color: 'gray',
    marginVertical: 10,
    flex: 1,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  nextButton: {
    alignSelf: 'flex-end',
    marginTop: 30,
  },
});
