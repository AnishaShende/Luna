import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const PostScreen = () => {
  return (

    <SafeAreaView>
         <View style={styles.header}>
           <Text style={styles.headerTitle}>Luna</Text>
           
       </View>

       <View style={styles.post}>
        <Text style={styles.selectMembersTitle}>Post feature coming soon!!!</Text>
       </View>
    </SafeAreaView>
  
      
         
  
         
  )
}

export default PostScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
      },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
      },

      post:{
alignContent:'center',
justifyContent:'center'
      },

      selectMembersTitle:{
color:'#333',
margin:30,



      }
})
