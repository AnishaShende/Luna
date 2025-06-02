import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import 'core-js/stable/atob';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

const LikesScreen = () => {
  const navigation = useNavigation();
  const [option, setOption] = useState('Recent');
  const [userId, setUserId] = useState('');
  const [likes, setLikes] = useState([]);
  
  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      setUserId(userId);
    };

    fetchUser();
  }, []);
  
  const fetchReceivedLikes = async () => {
    try {
      const response = await axios.get(
        `https://socket-ifia.onrender.com/received-likes/${userId}`,
      );
      const receivedLikes = response.data.receivedLikes;
      setLikes(receivedLikes);
    } catch (error) {
      console.error('Error fetching received likes:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchReceivedLikes();
    }
  }, [userId]);
  
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchReceivedLikes();
      }
    }, [userId]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Luna</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Requests</Text>
          <TouchableOpacity style={styles.boostButton}>
            <SimpleLineIcons name="fire" size={18} color="white" />
            <Text style={styles.boostButtonText}>Boost</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterIcon}>
            <Ionicons name="filter" size={20} color="#333" />
          </TouchableOpacity>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              onPress={() => setOption('Recent')}
              style={[
                styles.filterOption,
                option === 'Recent' && styles.activeFilterOption
              ]}>
              <Text style={[
                styles.filterText,
                option === 'Recent' && styles.activeFilterText
              ]}>
                Recent
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setOption('your type')}
              style={[
                styles.filterOption,
                option === 'your type' && styles.activeFilterOption
              ]}>
              <Text style={[
                styles.filterText,
                option === 'your type' && styles.activeFilterText
              ]}>
                Your type
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setOption('Last Active')}
              style={[
                styles.filterOption,
                option === 'Last Active' && styles.activeFilterOption
              ]}>
              <Text style={[
                styles.filterText,
                option === 'Last Active' && styles.activeFilterText
              ]}>
                Last Active
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setOption('Nearby')}
              style={[
                styles.filterOption,
                option === 'Nearby' && styles.activeFilterOption
              ]}>
              <Text style={[
                styles.filterText,
                option === 'Nearby' && styles.activeFilterText
              ]}>
                Nearby
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Featured Like */}
        {likes.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('HandleLike', {
                name: likes[0].userId?.firstName,
                image: likes[0].image,
                imageUrls: likes[0].userId?.imageUrls,
                prompts: likes[0].userId?.prompts,
                userId: userId,
                selectedUserId: likes[0].userId?._id,
                likes: likes?.length,
              })
            }
            style={styles.featuredCard}>
            <View style={styles.likeLabel}>
              <Text style={styles.likeLabelText}>Liked your photo</Text>
            </View>
            
            <Text style={styles.featuredName}>{likes[0].userId?.firstName}</Text>
            
            <Image
              source={{uri: likes[0].userId?.imageUrls[0]}}
              style={styles.featuredImage}
            />
          </TouchableOpacity>
        )}

        {/* Up Next Section */}
        {likes.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>Up Next</Text>
            
            <View style={styles.likesGrid}>
              {likes.slice(1).map((like, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.likeCard}
                  onPress={() =>
                    navigation.navigate('HandleLike', {
                      name: like.userId?.firstName,
                      image: like.image,
                      imageUrls: like.userId?.imageUrls,
                      prompts: like.userId?.prompts,
                      userId: userId,
                      selectedUserId: like.userId?._id,
                    })
                  }
                >
                  <View style={styles.likeCardHeader}>
                    <View style={styles.smallLikeLabel}>
                      <Text style={styles.smallLikeLabelText}>
                        {like?.comment || "Liked your photo"}
                      </Text>
                    </View>
                    <Text style={styles.likeCardName}>{like?.userId?.firstName}</Text>
                  </View>
                  
                  <Image
                    source={{uri: like.userId?.imageUrls[0]}}
                    style={styles.likeCardImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        
        {likes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No likes yet</Text>
            <Text style={styles.emptyText}>
              When someone likes you, they'll appear here
            </Text>
          </View>
        )}
      </ScrollView>
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
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  boostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B5C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  boostButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  featuredCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  likeLabel: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    margin: 16,
  },
  likeLabelText: {
    fontSize: 14,
    color: '#666',
  },
  featuredName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  featuredImage: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  likesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  likeCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  likeCardHeader: {
    padding: 12,
  },
  smallLikeLabel: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  smallLikeLabelText: {
    fontSize: 12,
    color: '#666',
  },
  likeCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  likeCardImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default LikesScreen;