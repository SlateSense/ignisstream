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

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user, profile, signOut } = useAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      alignItems: 'center',
      padding: 20,
      paddingTop: 0,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.border,
    },
    editAvatarButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    username: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    userHandle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    bio: {
      fontSize: 15,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 24,
      paddingHorizontal: 40,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    editButton: {
      marginHorizontal: 20,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
    },
    editButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
    },
    editButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    section: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      borderRadius: 12,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 12,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuItemText: {
      fontSize: 15,
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    menuItemSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      marginLeft: 12,
    },
    signOutButton: {
      backgroundColor: colors.error,
      borderRadius: 12,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    signOutButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
    },
    signOutButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will be handled by the auth state change
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: profile?.avatar_url || undefined,
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.username}>
          {profile?.display_name || user?.email || 'Gaming Pro'}
        </Text>
        <Text style={styles.userHandle}>
          @{profile?.username || 'gamer'}
        </Text>

        {profile?.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>42</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1.2K</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>856</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.forge_points || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton}>
          <LinearGradient
            colors={['#7c3aed', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.editButtonInner}
          >
            <Ionicons name="create" size={20} color="#ffffff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Activity Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Activity</Text>
        </View>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="heart" size={20} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemText}>Liked Posts</Text>
            <Text style={styles.menuItemSubtext}>Posts you've liked</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="bookmark" size={20} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemText}>Saved Posts</Text>
            <Text style={styles.menuItemSubtext}>Your bookmarked content</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
          <Ionicons name="trophy" size={20} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemText}>Achievements</Text>
            <Text style={styles.menuItemSubtext}>Your gaming milestones</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications" size={20} color={colors.textSecondary} />
          <Text style={styles.menuItemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield" size={20} color={colors.textSecondary} />
          <Text style={styles.menuItemText}>Privacy & Security</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="color-palette" size={20} color={colors.textSecondary} />
          <Text style={styles.menuItemText}>Appearance</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
          <Ionicons name="help-circle" size={20} color={colors.textSecondary} />
          <Text style={styles.menuItemText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <View style={styles.signOutButtonInner}>
          <Ionicons name="log-out" size={20} color="#ffffff" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}
