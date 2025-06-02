import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import 'core-js/stable/atob';
import Entypo from 'react-native-vector-icons/Entypo';
import Octicons from 'react-native-vector-icons/Octicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {jwtDecode} from 'jwt-decode';
import axios from 'axios';



const ExploreScreen = () => {
  const navigation = useNavigation();
  const [option, setOption] = useState('Compatible');
  const [profilesData, setProfilesData] = useState([]);
  const [userId, setUserId] = useState('');
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [age, setAge] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      setUserId(userId);
    };

    fetchUser();
  }, []);

  const handleLike = () => {
    navigateToNextProfile();
  };

  const handleCross = () => {
    navigateToNextProfile();
  };

  const navigateToNextProfile = () => {
    const nextIndex = currentProfileIndex + 1;
    if (nextIndex < profilesData.length) {
      setCurrentProfileIndex(nextIndex);
      setCurrentProfile(profilesData[nextIndex]);
    } else {
      Alert.alert('No more profiles', 'More users are coming soon!');
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await axios.get(
        `https://socket-ifia.onrender.com/matches?userId=${userId}`,
      );
      const matches = response.data.matches;
      setProfilesData(matches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  useEffect(() => {
    if (profilesData.length > 0) {
      setCurrentProfile(profilesData[0]);
    }
  }, [profilesData]);

  useEffect(() => {
    if (userId) {
      fetchMatches();
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchMatches();
      }
    }, [userId]),
  );

  useEffect(() => {
    const calculateAge = (dobString) => {
      const [day, month, year] = dobString.split('/').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
  
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
  
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }
  
      return age;
    };
  
    if (currentProfile?.dateOfBirth) {
      const profileAge = calculateAge(currentProfile.dateOfBirth);
      setAge(profileAge);
    }
  }, [currentProfile]); 
  console.log(currentProfile?.dateOfBirth)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Luna</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Filter Options */}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterIcon}>
            <Ionicons name="sparkles-sharp" size={20} color="#333" />
          </TouchableOpacity>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              onPress={() => setOption('Compatible')}
              style={[
                styles.filterOption,
                option === 'Compatible' && styles.activeFilterOption
              ]}>
              <Text style={[
                styles.filterText,
                option === 'Compatible' && styles.activeFilterText
              ]}>
                Compatible
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setOption('Active Today')}
              style={[
                styles.filterOption,
                option === 'Active Today' && styles.activeFilterOption
              ]}>
              <Text style={[
                styles.filterText,
                option === 'Active Today' && styles.activeFilterText
              ]}>
                Active Today
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setOption('New here')}
              style={[
                styles.filterOption,
                option === 'New here' && styles.activeFilterOption
              ]}>
              <Text style={[
                styles.filterText,
                option === 'New here' && styles.activeFilterText
              ]}>
                New here
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {!currentProfile ? (
          <View style={styles.noProfileContainer}>
            <Text style={styles.noProfileText}>No profiles available</Text>
            <Text style={styles.noProfileSubtext}>Check back soon for new connections</Text>
          </View>
        ) : (
          <View style={styles.profileContainer}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileNameContainer}>
                <Text style={styles.profileName}>{currentProfile?.firstName}</Text>
                {currentProfile?.type === 'new here' && (
                  <View style={styles.profileBadge}>
                    <Text style={styles.profileBadgeText}>new here</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Profile Images and Content */}
            <View style={styles.profileContent}>
              {/* Main Image */}
              {currentProfile?.imageUrls?.length > 0 && (
                <View style={styles.imageContainer}>
                  <Image
                    style={styles.profileImage}
                    source={{
                      uri: currentProfile?.imageUrls[0],
                    }}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('SendLike', {
                        image: currentProfile?.imageUrls[0],
                        name: currentProfile?.firstName,
                        userId: userId,
                        likedUserId: currentProfile?._id,
                      })
                    }
                    style={styles.likeButton}>
                    <AntDesign name="heart" size={22} color="#FF3B5C" />
                  </TouchableOpacity>
                </View>
              )}


<View style={styles.detailsCard}>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="cake-variant-outline" size={20} color="#666" />
                      <Text style={styles.detailText}>{age !== null ? age : '--'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <Text style={styles.detailText}>{currentProfile?.gender}</Text>
                  </View>

                  {/* <View style={styles.detailItem}>
                    <Ionicons name="magnet-outline" size={20} color="#666" />
                    <Text style={styles.detailText}>{currentProfile?.type}</Text>
                  </View> */}
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Ionicons name="school-outline" size={20} color="#666" />
                  <Text style={styles.detailText}>{currentProfile?.education}</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.detailText}>{currentProfile?.location}</Text>
                </View>
              </View>


              {/* First Prompt */}
              {currentProfile?.prompts?.length > 0 && (
                <View style={styles.promptCard}>
                  <Text style={styles.promptQuestion}>{currentProfile.prompts[0].question}</Text>
                  <Text style={styles.promptAnswer}>{currentProfile.prompts[0].answer}</Text>
                  
                </View>
                
              )}
{/* Second Prompt */}
{currentProfile?.prompts?.length > 1 && (
                <View style={styles.promptCard}>
                  <Text style={styles.promptQuestion}>{currentProfile.prompts[1].question}</Text>
                  <Text style={styles.promptAnswer}>{currentProfile.prompts[1].answer}</Text>
                </View>
              )}

{currentProfile?.prompts?.slice(2).map((prompt, index) => (
                <View key={index} style={styles.promptCard}>
                  <Text style={styles.promptQuestion}>{prompt.question}</Text>
                  <Text style={styles.promptAnswer}>{prompt.answer}</Text>
                </View>
              ))}


              {/* Profile Details */}
            
              {/* Additional Images */}
              {currentProfile?.imageUrls?.slice(1, 3).map((item, index) => (
                item && (
                  <View key={index} style={styles.imageContainer}>
                    <Image
                      style={styles.profileImage}
                      source={{ uri: item }}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('SendLike', {
                          image: item,
                          name: currentProfile?.firstName,
                          userId: userId,
                          likedUserId: currentProfile?._id,
                        })
                      }
                      style={styles.likeButton}>
                      <AntDesign name="heart" size={22} color="#FF3B5C" />
                    </TouchableOpacity>
                  </View>
                )
              ))}

              


              {/* More Images */}
              {currentProfile?.imageUrls?.slice(3).map((item, index) => (
                item && (
                  <View key={index} style={styles.imageContainer}>
                    <Image
                      style={styles.profileImage}
                      source={{ uri: item }}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('SendLike', {
                          image: item,
                          name: currentProfile?.firstName,
                          userId: userId,
                          likedUserId: currentProfile?._id,
                        })
                      }
                      style={styles.likeButton}>
                      <AntDesign name="heart" size={22} color="#FF3B5C" />
                    </TouchableOpacity>
                  </View>
                )
              ))}

              {/* Additional Prompts */}
            
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={handleCross} style={styles.crossButton}>
          <Entypo name="cross" size={24} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleLike} style={styles.heartButton}>
        <MaterialIcons name="check" size={22} color="green" />

        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'left',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  activeFilterOption: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  noProfileText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  noProfileSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  profileContainer: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  profileBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  profileBadgeText: {
    fontSize: 12,
    color: '#666',
  },
  profileContent: {
    gap: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  likeButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promptCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  promptQuestion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  promptAnswer: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  detailsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 24,
  },
  crossButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heartButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default ExploreScreen;