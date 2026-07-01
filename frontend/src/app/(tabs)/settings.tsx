import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Theme } from '../../constants/Theme';
import { Settings as SettingsIcon, LogOut, Plus, Trash2, Globe, ShieldAlert, Store } from 'lucide-react-native';

interface CategoryItem {
  _id: string;
  name: string;
  isCustom: boolean;
}

export default function Settings() {
  const { user, logout, updateSettings, apiUrl, setCustomApiUrl } = useAuth();
  
  // Settings Form State
  const [storeName, setStoreName] = useState(user?.storeName || 'My Mobile Shop');
  const [currency, setCurrency] = useState(user?.settings?.currency || '₹');
  const [lowStockThreshold, setLowStockThreshold] = useState(user?.settings?.lowStockThreshold.toString() || '5');
  const [customIp, setCustomIp] = useState(apiUrl);
  
  // Categories State
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [newCatName, setNewCatName] = useState('');

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isAddingCat, setIsAddingCat] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/accessories/categories');
      setCategories(res.data);
    } catch (e) {
      console.error('Error fetching categories in settings:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      // Sync form with context user profile
      if (user) {
        setStoreName(user.storeName);
        setCurrency(user.settings.currency);
        setLowStockThreshold(user.settings.lowStockThreshold.toString());
      }
    }, [user])
  );

  const handleSaveSettings = async () => {
    const thresholdNum = parseInt(lowStockThreshold, 10);
    if (!storeName || isNaN(thresholdNum)) {
      Alert.alert('Validation Error', 'Shop Name and a valid Low Stock Threshold are required');
      return;
    }

    setIsSavingSettings(true);
    try {
      // 1. Save preferences to backend
      await updateSettings(storeName, {
        currency,
        lowStockThreshold: thresholdNum
      });

      // 2. Save API IP address to AsyncStorage
      await setCustomApiUrl(customIp);

      Alert.alert('Success', 'Shop preferences updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName || !newCatName.trim()) {
      Alert.alert('Validation Error', 'Category name is required');
      return;
    }

    setIsAddingCat(true);
    try {
      await api.post('/api/accessories/categories', { name: newCatName.trim() });
      setNewCatName('');
      fetchCategories();
      Alert.alert('Success', 'Accessory category added');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add category');
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleDeleteCategory = (cat: CategoryItem) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete the "${cat.name}" category?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/accessories/categories/${cat._id}`);
              fetchCategories();
              Alert.alert('Deleted', 'Category removed successfully');
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to delete category');
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <SettingsIcon color={Theme.colors.primary} size={32} />
        <View>
          <Text style={styles.title}>Store Settings</Text>
          <Text style={styles.subtitle}>Manage preferences, catalog, and connections</Text>
        </View>
      </View>

      {/* Account Info */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Store color={Theme.colors.textMuted} size={20} style={{ marginRight: 8 }} />
          <Text style={styles.cardSectionTitle}>Shop Details</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.formLabel}>Shop Name</Text>
          <TextInput
            style={styles.formInput}
            value={storeName}
            onChangeText={setStoreName}
            placeholder="e.g. Daniel Mobile Shop"
            placeholderTextColor={Theme.colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.formLabel}>Account Owner Email</Text>
          <TextInput
            style={[styles.formInput, styles.disabledInput]}
            value={user?.email}
            editable={false}
          />
        </View>
      </View>

      {/* App Preferences */}
      <View style={styles.card}>
        <View style={styles.row}>
          <SettingsIcon color={Theme.colors.textMuted} size={20} style={{ marginRight: 8 }} />
          <Text style={styles.cardSectionTitle}>Preferences</Text>
        </View>

        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { width: '48%' }]}>
            <Text style={styles.formLabel}>Currency Symbol</Text>
            <TextInput
              style={styles.formInput}
              value={currency}
              onChangeText={setCurrency}
              placeholder="₹"
              placeholderTextColor={Theme.colors.textMuted}
            />
          </View>
          <View style={[styles.inputGroup, { width: '48%' }]}>
            <Text style={styles.formLabel}>Low Stock Threshold</Text>
            <TextInput
              style={styles.formInput}
              value={lowStockThreshold}
              onChangeText={setLowStockThreshold}
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor={Theme.colors.textMuted}
            />
          </View>
        </View>
      </View>

      {/* Network settings */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Globe color={Theme.colors.textMuted} size={20} style={{ marginRight: 8 }} />
          <Text style={styles.cardSectionTitle}>Network Settings</Text>
        </View>
        <Text style={styles.cardDescription}>
          Modify backend API URL if using a physical device or a hosted staging server.
        </Text>
        <View style={styles.inputGroup}>
          <Text style={styles.formLabel}>Backend API Endpoint</Text>
          <TextInput
            style={styles.formInput}
            value={customIp}
            onChangeText={setCustomIp}
            placeholder="http://192.168.1.100:5000"
            placeholderTextColor={Theme.colors.textMuted}
          />
        </View>
      </View>

      {/* Save Settings Trigger */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={isSavingSettings}>
        {isSavingSettings ? (
          <ActivityIndicator color={Theme.colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        )}
      </TouchableOpacity>

      {/* Accessory Categories Manager */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Plus color={Theme.colors.textMuted} size={20} style={{ marginRight: 8 }} />
          <Text style={styles.cardSectionTitle}>Custom Accessories Grid</Text>
        </View>
        <Text style={styles.cardDescription}>
          Add custom categories to your Accessories quick-tap grid screen.
        </Text>

        <View style={styles.catInputRow}>
          <TextInput
            style={[styles.formInput, { flex: 1 }]}
            placeholder="e.g. Adapters"
            placeholderTextColor={Theme.colors.textMuted}
            value={newCatName}
            onChangeText={setNewCatName}
          />
          <TouchableOpacity style={styles.addCatBtn} onPress={handleAddCategory} disabled={isAddingCat}>
            {isAddingCat ? (
              <ActivityIndicator color={Theme.colors.white} />
            ) : (
              <Text style={styles.addCatBtnText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.catListTitle}>Categories List</Text>
        <View style={styles.catGrid}>
          {categories.map((cat) => (
            <View key={cat._id} style={styles.catBadge}>
              <Text style={styles.catBadgeText}>{cat.name}</Text>
              {cat.isCustom ? (
                <TouchableOpacity onPress={() => handleDeleteCategory(cat)} style={styles.trashBtn}>
                  <Trash2 size={14} color={Theme.colors.danger} />
                </TouchableOpacity>
              ) : (
                <Text style={styles.systemTag}>system</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Log out Card */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut color={Theme.colors.white} size={20} style={{ marginRight: 8 }} />
        <Text style={styles.logoutBtnText}>Log Out Account</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background
  },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.sm
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  subtitle: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 4
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    marginBottom: Theme.spacing.md
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  cardDescription: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.md,
    lineHeight: 16
  },
  inputGroup: {
    marginBottom: Theme.spacing.md
  },
  formLabel: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.xs
  },
  formInput: {
    backgroundColor: 'rgba(11, 17, 30, 0.4)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    color: Theme.colors.text,
    fontSize: 15,
    height: 44
  },
  disabledInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: Theme.colors.textMuted,
    borderColor: 'transparent'
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.md,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    marginBottom: Theme.spacing.lg
  },
  saveBtnText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  catInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: Theme.spacing.md
  },
  addCatBtn: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: Theme.roundness.md,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  addCatBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: 14
  },
  catListTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.sm
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  catBadge: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.roundness.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  catBadgeText: {
    color: Theme.colors.text,
    fontSize: 13,
    fontWeight: '500'
  },
  trashBtn: {
    padding: 2
  },
  systemTag: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontStyle: 'italic'
  },
  logoutBtn: {
    backgroundColor: Theme.colors.danger,
    borderRadius: Theme.roundness.md,
    paddingVertical: Theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.md
  },
  logoutBtnText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  }
});
