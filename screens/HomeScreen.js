import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native"
import { useEffect, useState, useCallback } from "react"
import Ionicons from "react-native-vector-icons/Ionicons"
import "core-js/stable/atob"
import Entypo from "react-native-vector-icons/Entypo"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import AntDesign from "react-native-vector-icons/AntDesign"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { jwtDecode } from "jwt-decode"
import axios from "axios"

const HomeScreen = () => {
  const navigation = useNavigation()
  const [option, setOption] = useState("Discover")
  const [profilesData, setProfilesData] = useState([])
  const [userId, setUserId] = useState("")
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [age, setAge] = useState("")

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem("token")
      const decodedToken = jwtDecode(token)
      const userId = decodedToken.userId
      setUserId(userId)
    }

    fetchUser()
  }, [])

  const handleSkip = () => {
    navigateToNextProfile()
  }

  const handleConnect = () => {
    navigateToNextProfile()
  }

  const navigateToNextProfile = () => {
    const nextIndex = currentProfileIndex + 1
    if (nextIndex < profilesData.length) {
      setCurrentProfileIndex(nextIndex)
      setCurrentProfile(profilesData[nextIndex])
    } else {
      Alert.alert("No more profiles", "Check back later for more people to connect with!")
    }
  }

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`https://socket-ifia.onrender.com/matches?userId=${userId}`)
      const matches = response.data.matches
      setProfilesData(matches)
    } catch (error) {
      console.error("Error fetching profiles:", error)
    }
  }

  const fetchExploreProfiles = async () => {
    try {
      const response = await axios.get(`https://socket-ifia.onrender.com/explore?userId=${userId}`)
      const profiles = response.data.profiles || response.data.matches || []
      setProfilesData(profiles)
      setCurrentProfileIndex(0)
    } catch (error) {
      console.error("Error fetching explore profiles:", error)
    }
  }

  const handleOptionChange = (selectedOption) => {
    setOption(selectedOption)
    setCurrentProfileIndex(0)

    if (selectedOption === "Interests") {
      fetchExploreProfiles()
    } else {
      fetchMatches()
    }
  }

  useEffect(() => {
    if (profilesData.length > 0) {
      setCurrentProfile(profilesData[0])
    }
  }, [profilesData])

  useEffect(() => {
    if (userId) {
      fetchMatches()
    }
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        if (option === "Interests") {
          fetchExploreProfiles()
        } else {
          fetchMatches()
        }
      }
    }, [userId, option]),
  )

  useEffect(() => {
    const calculateAge = (dobString) => {
      const [day, month, year] = dobString.split("/").map(Number)
      const birthDate = new Date(year, month - 1, day)
      const today = new Date()

      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      const dayDiff = today.getDate() - birthDate.getDate()

      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--
      }

      return age
    }

    if (currentProfile?.dateOfBirth) {
      const profileAge = calculateAge(currentProfile.dateOfBirth)
      setAge(profileAge)
    }
  }, [currentProfile])

  // Function to render all prompts
  const renderPrompts = () => {
    if (!currentProfile?.prompts || currentProfile.prompts.length === 0) {
      return null
    }

    const promptTitles = [
      "About Me",
      "My Interests",
      "What I'm Looking For",
      "Fun Fact About Me"
    ]

    return currentProfile.prompts.map((prompt, index) => {
      if (index >= 4) return null // Only show first 4 prompts
      
      return (
        <View key={index} style={styles.bioCard}>
          <Text style={styles.bioTitle}>{promptTitles[index] || `Prompt ${index + 1}`}</Text>
          <Text style={styles.bioText}>{prompt.answer}</Text>
        </View>
      )
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Luna</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Filter Options */}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterIcon}>
            <Ionicons name="options-outline" size={20} color="#333" />
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              onPress={() => handleOptionChange("Discover")}
              style={[styles.filterOption, option === "Discover" && styles.activeFilterOption]}
            >
              <Text style={[styles.filterText, option === "Discover" && styles.activeFilterText]}>Discover</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOptionChange("Interests")}
              style={[styles.filterOption, option === "Interests" && styles.activeFilterOption]}
            >
              <Text style={[styles.filterText, option === "Interests" && styles.activeFilterText]}>Interests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleOptionChange("Nearby")}
              style={[styles.filterOption, option === "Nearby" && styles.activeFilterOption]}
            >
              <Text style={[styles.filterText, option === "Nearby" && styles.activeFilterText]}>Nearby</Text>
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
                {currentProfile?.type === "new here" && (
                  <View style={styles.profileBadge}>
                    <Text style={styles.profileBadgeText}>new member</Text>
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
                      navigation.navigate("SendLike", {
                        image: currentProfile?.imageUrls[0],
                        name: currentProfile?.firstName,
                        userId: userId,
                        likedUserId: currentProfile?._id,
                      })
                    }
                    style={styles.connectButton}
                  >
                    <MaterialIcons name="person-add" size={22} color="green" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                  <Text style={styles.detailText}>
                    {age ? `${age} years old` : "Age not specified"}
                  </Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Ionicons name="school-outline" size={20} color="#666" />
                  <Text style={styles.detailText}>{currentProfile?.education || "Education not specified"}</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.detailText}>{currentProfile?.location || "Location not specified"}</Text>
                </View>
                
                <View style={styles.detailDivider} />
                
                <View style={styles.detailRow}>
                  <Ionicons name="briefcase-outline" size={20} color="#666" />
                  <Text style={styles.detailText}>{currentProfile?.occupation || "Occupation not specified"}</Text>
                </View>
              </View>

              {/* Render all prompts */}
              {renderPrompts()}

              {/* Additional Images */}
              {currentProfile?.imageUrls?.slice(1).map(
                (item, index) =>
                  item && (
                    <View key={index} style={styles.imageContainer}>
                      <Image style={styles.profileImage} source={{ uri: item }} />
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("SendLike", {
                            image: item,
                            name: currentProfile?.firstName,
                            userId: userId,
                            likedUserId: currentProfile?._id,
                          })
                        }
                        style={styles.connectButton}
                      >
                        <MaterialIcons name="person-add" size={22} color="crimson" />
                      </TouchableOpacity>
                    </View>
                  )
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <MaterialIcons name="skip-next" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => 
            navigation.navigate("SendLike", {
              image: currentProfile?.imageUrls?.[0],
              name: currentProfile?.firstName,
              userId: userId,
              likedUserId: currentProfile?._id,
            })
          } 
          style={styles.mainConnectButton}
        >
          <MaterialIcons name="person-add" size={24} color="white" />
          {/* <Text style={styles.mainConnectText}>Connect</Text> */}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "black",
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
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
    borderColor: "#EEEEEE",
  },
  activeFilterOption: {
    backgroundColor: "crimson",
    borderColor: "crimson",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  noProfileContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  noProfileText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  noProfileSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  profileContainer: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  profileNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginRight: 12,
  },
  profileBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  profileBadgeText: {
    fontSize: 12,
    color: "#4CAF50",
  },
  profileContent: {
    gap: 16,
  },
  imageContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: 400,
    resizeMode: "cover",
  },
  connectButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "white",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bioCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 8,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "crimson",
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  detailsCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 4,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  skipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  mainConnectButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    width: 18,
    backgroundColor: "crimson",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mainConnectText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
})

export default HomeScreen