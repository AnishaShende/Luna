"use client"

import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native"
import { useState, useEffect, useContext } from "react"
import Feather from "react-native-vector-icons/Feather"
import AntDesign from "react-native-vector-icons/AntDesign"
import LottieView from "lottie-react-native"
import { useNavigation } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { AuthContext } from "../AuthContext"

const { width, height } = Dimensions.get("window")

const LoginScreen = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [activeTab, setActiveTab] = useState("signin") // "signin" or "signup"
  const { token, setToken } = useContext(AuthContext)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
    if (token) {
      navigation.navigate("MainStack", { screen: "Main" })
    }
  }, [token, navigation])

  const signInUser = async () => {
    if (!email || !password) {
      Alert.alert("Missing Information", "Please enter both email and password")
      return
    }

    try {
      setIsLoading(true)
      const user = {
        email,
        password,
      }
      const response = await axios.post("https://socket-ifia.onrender.com/login", user)
      const token = response.data.token
      await AsyncStorage.setItem("token", token)
      setToken(token)
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      Alert.alert("Login Failed", "Please check your email and password")
    }
  }

  const createAccount = () => {
    navigation.navigate("Basic")
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logoText}>Luna</Text>
          </View>

          <View style={styles.animationContainer}>
            <LottieView source={require("../assests/login.json")} style={styles.animation} autoPlay loop speed={0.7} />
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "signin" && styles.activeTab]}
              onPress={() => setActiveTab("signin")}
            >
              <Text style={[styles.tabText, activeTab === "signin" && styles.activeTabText]}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "signup" && styles.activeTab]}
              onPress={() => setActiveTab("signup")}
            >
              <Text style={[styles.tabText, activeTab === "signup" && styles.activeTabText]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {activeTab === "signin" ? (
              <>
                <View style={styles.inputWrapper}>
                  <AntDesign name="mail" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <AntDesign name="lock" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    style={styles.input}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeIcon}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={18} color="#666" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotPasswordContainer}>
                  <Text style={styles.forgotPassword}>Forgot password?</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={signInUser} style={styles.primaryButton} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* <View style={styles.orContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.orText}>or continue with</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialButtonsContainer}>
                  <TouchableOpacity style={styles.socialButton}>
                    <AntDesign name="google" size={20} color="#DB4437" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton}>
                    <AntDesign name="apple1" size={20} color="#000000" />
                  </TouchableOpacity>
                </View> */}
              </>
            ) : (
              <>
                <Text style={styles.createAccountText}>
                  Join our community to connect with amazing people around you
                </Text>

                <TouchableOpacity onPress={createAccount} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>

        {/* Fixed position footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setActiveTab(activeTab === "signin" ? "signup" : "signin")}>
            <Text style={styles.footerText}>
              {activeTab === "signin" ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.footerHighlight}>{activeTab === "signin" ? "Sign Up" : "Sign In"}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 80, // Space for footer
  },
  header: {
    alignItems: "center",
    marginTop: height * 0.05,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    letterSpacing: 0.5,
  },
  animationContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  animation: {
    height: 150,
    width: 150,
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: 30,
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: "#999",
    fontWeight: "500",
    fontSize: 15,
  },
  activeTabText: {
    color: "#333",
    fontWeight: "600",
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    width: "100%",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#333",
    fontSize: 16,
    height: "100%",
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPassword: {
    color: "#666",
    fontWeight: "500",
    fontSize: 14,
  },
  createAccountText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: "crimson", // Modern blue color
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    shadowColor: "#5E72E4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    width: "100%",
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  orText: {
    color: "#999",
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 16,
  },
  socialButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    fontSize: 15,
  },
  footerHighlight: {
    color: "crimson",
    fontWeight: "500",
  },
})

export default LoginScreen
