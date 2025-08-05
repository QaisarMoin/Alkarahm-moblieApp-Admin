import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F3F4F8" />

      {/* Header 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
      </View>
*/}
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.item}>
          <Text style={styles.itemText}>Terms of Service</Text>
        </TouchableOpacity>

        <View style={styles.item}>
          <Text style={styles.itemText}>App version</Text>
          <Text style={styles.subText}>v1.1 Live</Text>
        </View>

        <TouchableOpacity style={styles.item}>
          <Text style={styles.itemText}>Open Source Libraries</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <Text style={styles.itemText}>Licenses and Registrations</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FB'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16
  },
  content: {
    paddingHorizontal: 16,
    backgroundColor: '#FFF'
  },
  item: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500'
  },
  subText: {
    fontSize: 14,
    color: '#555',
    marginTop: 4
  }
});

export default AboutScreen;
