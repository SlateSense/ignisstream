import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const { colors, theme, setTheme, toggleTheme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
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
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
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
    themeOption: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
  });

  const getThemeDisplayText = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Preferences */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>
        
        <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="palette" size={20} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemText}>Theme</Text>
              <Text style={styles.menuItemSubtext}>Choose your preferred color scheme</Text>
            </View>
          </View>
          <Text style={styles.themeOption}>{getThemeDisplayText()}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="language" size={20} color={colors.textSecondary} />
            <Text style={styles.menuItemText}>Language</Text>
          </View>
          <Text style={styles.themeOption}>English</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="time" size={20} color={colors.textSecondary} />
            <Text style={styles.menuItemText}>Auto-Play Videos</Text>
          </View>
          <Switch
            value={true}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="phone-portrait" size={20} color={colors.textSecondary} />
            <Text style={styles.menuItemText}>Push Notifications</Text>
          </View>
          <Switch
            value={true}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="heart" size={20} color={colors.textSecondary} />
            <Text style={styles.menuItemText}>Likes & Comments</Text>
          </View>
          <Switch
            value={true}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="trophy" size={20} color={colors.textSecondary} />
            <Text style={styles.menuItemText}>Achievements</Text>
          </View>
          <Switch
            value={false}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </TouchableOpacity>
      </View>

      {/* Privacy & Security */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
        </View>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="eye" size={20} color={colors.textSecondary} />
            <Text style={styles.menuItemText}>Profile Visibility</Text>
          </View>
          <Text style={styles.themeOption}>Public</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="chatbubble" size={20} color={colors.textSecondary} />
            <Text style={styles.menuItemText}>Who can message you</Text>
          </View>
          <Text style={styles.themeOption}>Everyone</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
            <Text style={styles.menuItemText}>Two-Factor Authentication</Text>
          </View>
          <Switch
            value={false}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle" size={20} color={colors.textSecondary} />
          <Text style={styles.menuItemText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="document-text" size={20} color={colors.textSecondary} />
          <Text style={styles.menuItemText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-checkmark" size={20} color={colors.textSecondary} />
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="phone-portrait" size={20} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemText}>App Version</Text>
              <Text style={styles.menuItemSubtext}>1.0.0</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
