import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {getRegistrationProgress, saveRegistrationProgress} from '../registrationUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
import FastImage from 'react-native-fast-image';

const BirthScreen = () => {
  const navigation = useNavigation();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [showPicker, setShowPicker] = useState(false); // For showing date picker
  const [date, setDate] = useState(new Date()); // Initial date

  useEffect(() => {
    // Fetch the registration progress data for the "Birth" screen
    getRegistrationProgress('Birth').then(progressData => {
      if (progressData) {
        const {dateOfBirth} = progressData;
        const [dayValue, monthValue, yearValue] = dateOfBirth.split('/');
        setDay(dayValue);
        setMonth(monthValue);
        setYear(yearValue);
      }
    });
  }, []);

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false); // Hide picker after selection
    if (selectedDate) {
      const currentDate = selectedDate || date;
      setDate(currentDate);
      const selectedDay = currentDate.getDate().toString().padStart(2, '0');
      const selectedMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const selectedYear = currentDate.getFullYear().toString();
      setDay(selectedDay);
      setMonth(selectedMonth);
      setYear(selectedYear);
    }
  };

  const handleNext = () => {
    if (day.trim() !== '' && month.trim() !== '' && year.trim() !== '') {
      const dateOfBirth = `${day}/${month}/${year}`;
      
      // Calculate age
      const dob = new Date(`${year}-${month}-${day}`);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
  
      // Adjust age if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
  
      // Check if age is at least 16
      if (age >= 16) {
        saveRegistrationProgress('Birth', { dateOfBirth });
        navigation.navigate('Location'); // Navigate to next screen
      } else {
        // Alert the user if they are under 16
        alert('You must be at least 16 years old to proceed.');
      }
    } else {
      // Handle missing date values if needed
      alert('Please enter your date of birth.');
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
          <FastImage
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
            color:"black"
          }}>
          What's your date of birth?
        </Text>
        <TouchableOpacity
          onPress={() => setShowPicker(true)} // Show date picker when pressed
          style={{
            flexDirection: 'row',
            gap: 10,
            marginTop: 80,
            justifyContent: 'center',
          }}>
          {/* Display day, month, and year */}
          <TextInput
            editable={false} // Make input non-editable
            style={{
              borderBottomWidth: 1,
              borderColor: 'black',
              padding: 10,
              width: 50,
              fontSize: 20,
              fontFamily: 'GeezaPro-Bold',
              color:"black"
            }}
            placeholder="DD"
            value={day}
          />
          <TextInput
            editable={false}
            style={{
              borderBottomWidth: 1,
              borderColor: 'black',
              padding: 10,
              width: 60,
              fontSize: 20,
              fontFamily: 'GeezaPro-Bold',
              color:"black"
            }}
            placeholder="MM"
            value={month}
          />
          <TextInput
            editable={false}
            style={{
              borderBottomWidth: 1,
              borderColor: 'black',
              padding: 10,
              width: 75,
              fontSize: 20,
              fontFamily: 'GeezaPro-Bold',
              color:"black"
            }}
            placeholder="YYYY"
            value={year}
          />
        </TouchableOpacity>

        {/* DateTimePicker component */}
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="calendar"
            onChange={handleDateChange}
          />
        )}

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={{marginTop: 30, marginLeft: 'auto'}}>
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

export default BirthScreen;

const styles = StyleSheet.create({});
