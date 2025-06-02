import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const GroupIcon = ({ name, size = 50, color = '#4CAF50', showAddIcon = false }) => {
  // Get the first letter of the group name
  const firstLetter = name ? name.charAt(0).toUpperCase() : 'G';
  
  return (
    <View style={[
      styles.container, 
      { width: size, height: size, borderRadius: size / 2, backgroundColor: color }
    ]}>
      {showAddIcon ? (
        <>
          <Ionicons name="people-outline" size={size * 0.5} color="#fff" />
          <View style={styles.addIconContainer}>
            <Ionicons name="add-circle" size={size * 0.3} color="#fff" />
          </View>
        </>
      ) : (
        <Text style={[styles.letter, { fontSize: size * 0.4 }]}>{firstLetter}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  letter: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    padding: 2,
  },
});

export default GroupIcon;