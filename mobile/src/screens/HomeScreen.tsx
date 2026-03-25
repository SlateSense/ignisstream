import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user, profile } = useAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingTop: 0,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 30,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      marginHorizontal: 5,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 5,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
      marginHorizontal: 20,
    },
    quickActionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      margin: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    quickActionIcon: {
      marginRight: 15,
    },
    quickActionText: {
      flex: 1,
    },
    quickActionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    quickActionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    captureButton: {
      margin: 20,
      borderRadius: 12,
      overflow: 'hidden',
    },
    captureButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    captureButtonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 10,
    },
  });

  const quickActions = [
    {
      id: 1,
      title: 'Capture Moment',
      subtitle: 'Share your epic gaming clips',
      icon: 'camera',
      onPress: () => navigation.navigate('Camera'),
    },
    {
      id: 2,
      title: 'Browse Feed',
      subtitle: 'See what gamers are sharing',
      icon: 'newspaper',
      onPress: () => navigation.navigate('Feed'),
    },
    {
      id: 3,
      title: 'My Profile',
      subtitle: 'View and edit your profile',
      icon: 'person',
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome back, {profile?.display_name || user?.email || 'Gamer'}! 👋
        </Text>
        <Text style={styles.subText}>
          Ready to share your epic gaming moments?
        </Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {profile?.forge_points || 0}
            </Text>
            <Text style={styles.statLabel}>Forge Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Posts Shared</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>486</Text>
            <Text style={styles.statLabel}>Total Likes</Text>
          </View>
        </View>
      </View>

      {/* Quick Capture Button */}
      <TouchableOpacity
        style={styles.captureButton}
        onPress={() => navigation.navigate('Camera')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#7c3aed', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.captureButtonInner}
        >
          <Ionicons name="camera" size={24} color="#ffffff" />
          <Text style={styles.captureButtonText}>Capture Epic Moment</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      {quickActions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.quickActionCard}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons 
              name={action.icon as any} 
              size={28} 
              color={colors.primary} 
            />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
            <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      ))}

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.quickActionCard}>
        <View style={styles.quickActionIcon}>
          <Ionicons name="trophy" size={28} color="#f59e0b" />
        </View>
        <View style={styles.quickActionText}>
          <Text style={styles.quickActionTitle}>Achievement Unlocked!</Text>
          <Text style={styles.quickActionSubtitle}>
            First Gaming Moment - You shared your first clip!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
