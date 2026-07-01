import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Theme } from '../../constants/Theme';
import { 
  Search, 
  Plus, 
  DollarSign, 
  Edit, 
  AlertCircle, 
  Trash2, 
  Layers, 
  Headphones, 
  Zap, 
  Shield, 
  Battery, 
  Box 
} from 'lucide-react-native';

interface PhoneItem {
  _id: string;
  brand: string;
  model: string;
  variant?: string;
  ram?: string;
  storage?: string;
  color?: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice?: number;
  supplier?: string;
  status: 'available' | 'sold_out';
}

interface AccessoryStockItem {
  _id: string;
  category: string;
  brand: string;
  modelCompatibility: string | null;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number | null;
  supplier: string | null;
  status: 'available' | 'sold_out';
}

type InventorySlot = 'phones' | 'cases' | 'tempered' | 'chargers' | 'cables' | 'earphones' | 'others';

export default function Inventory() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const searchParam = params.search as string;

  const [activeSlot, setActiveSlot] = useState<InventorySlot>('phones');
  const [phoneInventory, setPhoneInventory] = useState<PhoneItem[]>([]);
  const [accessoryInventory, setAccessoryInventory] = useState<AccessoryStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Modals visibility
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<PhoneItem | null>(null);

  // Phone sell form state
  const [sellPrice, setSellPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Accessory sell form state
  const [isSellAccessoryModalOpen, setIsSellAccessoryModalOpen] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<AccessoryStockItem | null>(null);
  const [sellAccessoryPrice, setSellAccessoryPrice] = useState('');
  const [sellAccessoryPayment, setSellAccessoryPayment] = useState('cash');
  const [sellAccessoryCustName, setSellAccessoryCustName] = useState('');
  const [sellAccessoryCustPhone, setSellAccessoryCustPhone] = useState('');

  // Add Phone form state
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [color, setColor] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState('1');

  // Add Accessory form state
  const [addCat, setAddCat] = useState('Case');
  const [customCat, setCustomCat] = useState('');
  const [addBrand, setAddBrand] = useState('');
  const [addModel, setAddModel] = useState('');
  const [addCost, setAddCost] = useState('');
  const [addSell, setAddSell] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [addSupplier, setAddSupplier] = useState('');

  // Submitting states
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPhoneInventory = async () => {
    try {
      setIsLoading(true);
      let statusQuery = '';
      if (activeFilter === 'in_stock') statusQuery = 'available';
      if (activeFilter === 'out_of_stock') statusQuery = 'sold_out';

      const res = await api.get('/api/inventory', {
        params: {
          search: search.trim() !== '' ? search : undefined,
          status: statusQuery !== '' ? statusQuery : undefined
        }
      });
      setPhoneInventory(res.data);
    } catch (error) {
      console.error('Error fetching phone inventory:', error);
      Alert.alert('Error', 'Could not load phone inventory items');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccessoryInventory = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/accessories/inventory');
      setAccessoryInventory(res.data);
    } catch (error) {
      console.error('Error fetching accessory inventory:', error);
      Alert.alert('Error', 'Could not load accessory inventory items');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = () => {
    if (activeSlot === 'phones') {
      fetchPhoneInventory();
    } else {
      fetchAccessoryInventory();
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (searchParam) {
        setSearch(searchParam);
        setActiveSlot('phones');
      }
      fetchData();
    }, [activeSlot, activeFilter, searchParam])
  );

  const handleSearchSubmit = () => {
    fetchData();
  };

  // Add Phone Stock handler
  const handleAddPhone = async () => {
    if (!brand || !model || !purchasePrice) {
      Alert.alert('Validation Error', 'Brand, Model and Purchase Price are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/inventory', {
        brand,
        model,
        variant: variant || undefined,
        ram: ram || undefined,
        storage: storage || undefined,
        color: color || undefined,
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : undefined,
        supplier: supplier || undefined,
        quantityToAdd: parseInt(quantityToAdd, 10) || 1
      });

      Alert.alert('Success', 'Phone added/updated successfully');
      setIsAddModalOpen(false);
      resetAddForm();
      fetchPhoneInventory();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add phone');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Accessory Stock handler
  const handleAddAccessoryStock = async () => {
    const finalCategory = addCat === 'Custom' ? customCat.trim() : addCat;

    if (!finalCategory || !addBrand || !addCost) {
      Alert.alert('Validation Error', 'Category, Brand/Company, and Purchase Price are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/accessories/inventory', {
        category: finalCategory,
        brand: addBrand,
        modelCompatibility: addModel || undefined,
        purchasePrice: parseFloat(addCost),
        sellingPrice: addSell ? parseFloat(addSell) : undefined,
        supplier: addSupplier || undefined,
        quantityToAdd: parseInt(addQty, 10) || 1
      });

      Alert.alert('Success', 'Accessory stock updated successfully');
      setIsAddModalOpen(false);
      resetAddForm();
      fetchAccessoryInventory();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sell Phone transaction handler
  const handleSellPhone = async () => {
    if (!selectedPhone || !sellPrice) {
      Alert.alert('Validation Error', 'Selling price is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/sales/phone', {
        phoneId: selectedPhone._id,
        sellingPrice: parseFloat(sellPrice),
        paymentMethod,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined
      });

      Alert.alert('Success', 'Phone sold successfully');
      setIsSellModalOpen(false);
      resetSellForm();
      fetchPhoneInventory();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sell Accessory transaction handler
  const handleSellAccessory = async () => {
    if (!selectedAccessory || !sellAccessoryPrice) {
      Alert.alert('Validation Error', 'Selling price is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/sales/accessory-item', {
        accessoryItemId: selectedAccessory._id,
        sellingPrice: parseFloat(sellAccessoryPrice),
        paymentMethod: sellAccessoryPayment,
        customerName: sellAccessoryCustName || undefined,
        customerPhone: sellAccessoryCustPhone || undefined
      });

      Alert.alert('Success', 'Accessory sold successfully');
      setIsSellAccessoryModalOpen(false);
      setSelectedAccessory(null);
      fetchAccessoryInventory();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Phone handler
  const handleDeletePhone = (phoneId: string, modelName: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${modelName} from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/inventory/${phoneId}`);
              Alert.alert('Success', 'Phone stock deleted');
              fetchPhoneInventory();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete phone');
            }
          }
        }
      ]
    );
  };

  // Delete Accessory handler
  const handleDeleteAccessory = (itemId: string, brandName: string, category: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${brandName} ${category} from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/accessories/inventory/${itemId}`);
              Alert.alert('Success', 'Accessory stock deleted');
              fetchAccessoryInventory();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete accessory');
            }
          }
        }
      ]
    );
  };

  const openSellModal = (phone: PhoneItem) => {
    setSelectedPhone(phone);
    setSellPrice(phone.sellingPrice ? phone.sellingPrice.toString() : '');
    setIsSellModalOpen(true);
  };

  const openSellAccessoryModal = (item: AccessoryStockItem) => {
    setSelectedAccessory(item);
    setSellAccessoryPrice(item.sellingPrice ? item.sellingPrice.toString() : '');
    setSellAccessoryPayment('cash');
    setSellAccessoryCustName('');
    setSellAccessoryCustPhone('');
    setIsSellAccessoryModalOpen(true);
  };

  const handleOpenAddModal = () => {
    resetAddForm();
    if (activeSlot === 'cases') {
      setAddCat('Case');
    } else if (activeSlot === 'tempered') {
      setAddCat('Tempered Glass');
    } else if (activeSlot === 'chargers') {
      setAddCat('Charger');
    } else if (activeSlot === 'cables') {
      setAddCat('Cable');
    } else if (activeSlot === 'earphones') {
      setAddCat('Earphones');
    } else {
      setAddCat('Custom');
    }
    setIsAddModalOpen(true);
  };

  const resetAddForm = () => {
    // Phone resets
    setBrand('');
    setModel('');
    setVariant('');
    setRam('');
    setStorage('');
    setColor('');
    setPurchasePrice('');
    setSellingPrice('');
    setSupplier('');
    setQuantityToAdd('1');

    // Accessory resets
    setAddBrand('');
    setAddModel('');
    setAddCost('');
    setAddSell('');
    setAddQty('1');
    setAddSupplier('');
    setCustomCat('');
  };

  const resetSellForm = () => {
    setSelectedPhone(null);
    setSellPrice('');
    setPaymentMethod('cash');
    setCustomerName('');
    setCustomerPhone('');
  };

  const currencySymbol = user?.settings?.currency || '₹';
  const lowThreshold = user?.settings?.lowStockThreshold || 5;

  const renderIcon = (name: string, color: string) => {
    const n = name.toLowerCase();
    if (n.includes('ear') || n.includes('head') || n.includes('sound')) {
      return <Headphones color={color} size={18} />;
    }
    if (n.includes('charg') || n.includes('power') || n.includes('adapter') || n.includes('zap')) {
      return <Zap color={color} size={18} />;
    }
    if (n.includes('shield') || n.includes('glass') || n.includes('guard') || n.includes('temper')) {
      return <Shield color={color} size={18} />;
    }
    if (n.includes('batt') || n.includes('bank')) {
      return <Battery color={color} size={18} />;
    }
    if (n.includes('case') || n.includes('cover')) {
      return <Box color={color} size={18} />;
    }
    return <Layers color={color} size={18} />;
  };

  const getFilteredAccessories = () => {
    return accessoryInventory.filter((item) => {
      // 1. Filter by category
      let categoryMatch = false;
      const cat = item.category.toLowerCase();
      if (activeSlot === 'cases') {
        categoryMatch = cat.includes('case') || cat.includes('cover');
      } else if (activeSlot === 'tempered') {
        categoryMatch = cat.includes('temper') || cat.includes('guard') || cat.includes('shield') || cat.includes('glass');
      } else if (activeSlot === 'chargers') {
        categoryMatch = cat.includes('charg') || cat.includes('power') || cat.includes('adapter') || cat.includes('zap');
      } else if (activeSlot === 'cables') {
        categoryMatch = cat.includes('cable') || cat.includes('wire');
      } else if (activeSlot === 'earphones') {
        categoryMatch = cat.includes('ear') || cat.includes('head') || cat.includes('sound');
      } else if (activeSlot === 'others') {
        const isStandard = 
          cat.includes('case') || cat.includes('cover') ||
          cat.includes('temper') || cat.includes('guard') || cat.includes('shield') || cat.includes('glass') ||
          cat.includes('charg') || cat.includes('power') || cat.includes('adapter') || cat.includes('zap') ||
          cat.includes('cable') || cat.includes('wire') ||
          cat.includes('ear') || cat.includes('head') || cat.includes('sound');
        categoryMatch = !isStandard;
      }

      if (!categoryMatch) return false;

      // 2. Filter by stock status
      if (activeFilter === 'in_stock' && item.quantity <= 0) return false;
      if (activeFilter === 'out_of_stock' && item.quantity > 0) return false;

      // 3. Filter by search query
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        const brandMatch = item.brand.toLowerCase().includes(q);
        const compatMatch = item.modelCompatibility ? item.modelCompatibility.toLowerCase().includes(q) : false;
        const catMatch = item.category.toLowerCase().includes(q);
        return brandMatch || compatMatch || catMatch;
      }

      return true;
    });
  };

  const renderPhoneItem = ({ item }: { item: PhoneItem }) => {
    const isLowStock = item.quantity > 0 && item.quantity <= lowThreshold;
    const isOut = item.quantity === 0;

    let borderStyle = {};
    if (isOut) borderStyle = { borderColor: Theme.colors.danger };
    else if (isLowStock) borderStyle = { borderColor: Theme.colors.accent };

    return (
      <View style={[styles.phoneCard, borderStyle]}>
        <View style={styles.phoneHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.phoneTitle}>
              {item.brand} {item.model}
            </Text>
            <Text style={styles.phoneSpecs}>
              {item.storage || 'No Storage'} • {item.ram || 'No RAM'} • {item.color || 'No Color'}
              {item.variant ? ` • ${item.variant}` : ''}
            </Text>
          </View>
          <View style={[styles.badge, isOut ? styles.badgeOut : isLowStock ? styles.badgeLow : styles.badgeOk]}>
            <Text style={[styles.badgeText, isOut ? { color: Theme.colors.danger } : isLowStock ? { color: Theme.colors.accent } : { color: Theme.colors.secondary }]}>
              {isOut ? 'Out of Stock' : `${item.quantity} Left`}
            </Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={{ flex: 1.2 }}>
            <Text style={styles.priceLabel}>Cost / Retail</Text>
            <Text style={styles.priceVal}>
              {currencySymbol}{item.purchasePrice} / <Text style={{ color: Theme.colors.primary }}>{item.sellingPrice ? `${currencySymbol}${item.sellingPrice}` : 'Not set'}</Text>
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeletePhone(item._id, `${item.brand} ${item.model}`)}
            >
              <Trash2 color={Theme.colors.danger} size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sellBtn, isOut ? styles.disabledBtn : {}]}
              disabled={isOut}
              onPress={() => openSellModal(item)}
            >
              <Text style={styles.sellBtnText}>Sell</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderAccessoryItem = ({ item }: { item: AccessoryStockItem }) => {
    const isLowStock = item.quantity > 0 && item.quantity <= lowThreshold;
    const isOut = item.quantity === 0;

    let borderStyle = {};
    if (isOut) borderStyle = { borderColor: Theme.colors.danger };
    else if (isLowStock) borderStyle = { borderColor: Theme.colors.accent };

    return (
      <View style={[styles.phoneCard, borderStyle]}>
        <View style={styles.phoneHeader}>
          <View style={styles.iconWrapperSmall}>
            {renderIcon(item.category, Theme.colors.primary)}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.phoneTitle}>
              {item.brand} {item.category}
            </Text>
            <Text style={styles.phoneSpecs}>
              {item.modelCompatibility ? `For: ${item.modelCompatibility}` : 'Universal compatibility'}
              {item.supplier ? ` • Supplier: ${item.supplier}` : ''}
            </Text>
          </View>
          <View style={[styles.badge, isOut ? styles.badgeOut : isLowStock ? styles.badgeLow : styles.badgeOk]}>
            <Text style={[styles.badgeText, isOut ? { color: Theme.colors.danger } : isLowStock ? { color: Theme.colors.accent } : { color: Theme.colors.secondary }]}>
              {isOut ? 'Out of Stock' : `${item.quantity} Left`}
            </Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={{ flex: 1.2 }}>
            <Text style={styles.priceLabel}>Cost / Retail</Text>
            <Text style={styles.priceVal}>
              {currencySymbol}{item.purchasePrice} / <Text style={{ color: Theme.colors.primary }}>{item.sellingPrice ? `${currencySymbol}${item.sellingPrice}` : 'Not set'}</Text>
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteAccessory(item._id, item.brand, item.category)}
            >
              <Trash2 color={Theme.colors.danger} size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sellBtn, isOut ? styles.disabledBtn : {}]}
              disabled={isOut}
              onPress={() => openSellAccessoryModal(item)}
            >
              <Text style={styles.sellBtnText}>Sell</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const getActiveList = () => {
    if (activeSlot === 'phones') {
      return phoneInventory;
    }
    return getFilteredAccessories();
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Search color={Theme.colors.textMuted} size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeSlot === 'phones' ? "Search brand, model..." : "Search brand, compatibility..."}
            placeholderTextColor={Theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
          />
        </View>
        <TouchableOpacity style={styles.addFloatBtn} onPress={handleOpenAddModal}>
          <Plus color={Theme.colors.white} size={24} />
        </TouchableOpacity>
      </View>

      {/* Category Slot Switcher */}
      <View style={styles.slotsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotsScroll}>
          {[
            { id: 'phones', label: 'Phones', icon: '📱' },
            { id: 'cases', label: 'Cases', icon: '📦' },
            { id: 'tempered', label: 'Tempered Glass', icon: '🛡️' },
            { id: 'chargers', label: 'Chargers', icon: '🔌' },
            { id: 'cables', label: 'Cables', icon: '🎗️' },
            { id: 'earphones', label: 'Earphones', icon: '🎧' },
            { id: 'others', label: 'Others', icon: '⚙️' },
          ].map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[styles.slotTab, activeSlot === slot.id ? styles.activeSlotTab : {}]}
              onPress={() => {
                setActiveSlot(slot.id as any);
                setSearch('');
              }}
            >
              <Text style={styles.slotIcon}>{slot.icon}</Text>
              <Text style={[styles.slotLabel, activeSlot === slot.id ? styles.activeSlotLabel : {}]}>
                {slot.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tabs Filter */}
      <View style={styles.tabsContainer}>
        {(['all', 'in_stock', 'out_of_stock'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeFilter === tab ? styles.activeTabButton : {}]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.tabText, activeFilter === tab ? styles.activeTabText : {}]}>
              {tab === 'all' ? 'All' : tab === 'in_stock' ? 'In Stock' : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Inventory List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : getActiveList().length === 0 ? (
        <View style={styles.emptyContainer}>
          <AlertCircle color={Theme.colors.textMuted} size={48} />
          <Text style={styles.emptyText}>
            No {activeSlot === 'phones' ? 'phones' : 'accessory items'} found in inventory
          </Text>
        </View>
      ) : (
        <FlatList
          data={getActiveList() as any}
          keyExtractor={(item: any) => item._id}
          renderItem={({ item }: { item: any }) => {
            if (activeSlot === 'phones') {
              return renderPhoneItem({ item: item as PhoneItem });
            } else {
              return renderAccessoryItem({ item: item as AccessoryStockItem });
            }
          }}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal 1: Add/Restock Form */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeSlot === 'phones' ? 'Add Mobile Phone' : 'Add Accessory'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {activeSlot === 'phones' ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.formLabel}>Brand *</Text>
                    <TextInput style={styles.formInput} placeholder="e.g. Apple" placeholderTextColor={Theme.colors.textMuted} value={brand} onChangeText={setBrand} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.formLabel}>Model *</Text>
                    <TextInput style={styles.formInput} placeholder="e.g. iPhone 15 Pro" placeholderTextColor={Theme.colors.textMuted} value={model} onChangeText={setModel} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.formLabel}>Variant</Text>
                    <TextInput style={styles.formInput} placeholder="e.g. Pro Max" placeholderTextColor={Theme.colors.textMuted} value={variant} onChangeText={setVariant} />
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { width: '48%' }]}>
                      <Text style={styles.formLabel}>RAM</Text>
                      <TextInput style={styles.formInput} placeholder="e.g. 8GB" placeholderTextColor={Theme.colors.textMuted} value={ram} onChangeText={setRam} />
                    </View>
                    <View style={[styles.inputGroup, { width: '48%' }]}>
                      <Text style={styles.formLabel}>Storage</Text>
                      <TextInput style={styles.formInput} placeholder="e.g. 256GB" placeholderTextColor={Theme.colors.textMuted} value={storage} onChangeText={setStorage} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.formLabel}>Color</Text>
                    <TextInput style={styles.formInput} placeholder="e.g. Natural Titanium" placeholderTextColor={Theme.colors.textMuted} value={color} onChangeText={setColor} />
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { width: '48%' }]}>
                      <Text style={styles.formLabel}>Purchase Price ({currencySymbol}) *</Text>
                      <TextInput style={styles.formInput} placeholder="950" placeholderTextColor={Theme.colors.textMuted} keyboardType="numeric" value={purchasePrice} onChangeText={setPurchasePrice} />
                    </View>
                    <View style={[styles.inputGroup, { width: '48%' }]}>
                      <Text style={styles.formLabel}>Sell Price ({currencySymbol})</Text>
                      <TextInput style={styles.formInput} placeholder="1199" placeholderTextColor={Theme.colors.textMuted} keyboardType="numeric" value={sellingPrice} onChangeText={setSellingPrice} />
                    </View>
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { width: '48%' }]}>
                      <Text style={styles.formLabel}>Supplier</Text>
                      <TextInput style={styles.formInput} placeholder="Wholesale Co." placeholderTextColor={Theme.colors.textMuted} value={supplier} onChangeText={setSupplier} />
                    </View>
                    <View style={[styles.inputGroup, { width: '48%' }]}>
                      <Text style={styles.formLabel}>Quantity to Add</Text>
                      <TextInput style={styles.formInput} placeholder="1" keyboardType="numeric" placeholderTextColor={Theme.colors.textMuted} value={quantityToAdd} onChangeText={setQuantityToAdd} />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.formLabel}>Accessory Category *</Text>
                    <View style={styles.categorySelectRow}>
                      {['Case', 'Tempered Glass', 'Screen Guard', 'Charger', 'Cable', 'Earphones', 'Custom'].map(catOption => (
                        <TouchableOpacity
                          key={catOption}
                          style={[styles.catSelectBtn, addCat === catOption && styles.catSelectBtnActive]}
                          onPress={() => setAddCat(catOption)}
                        >
                          <Text style={[styles.catSelectBtnText, addCat === catOption && styles.catSelectBtnTextActive]}>
                            {catOption}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {addCat === 'Custom' && (
                      <TextInput
                        style={[styles.formInput, { marginTop: Theme.spacing.xs }]}
                        placeholder="e.g. Back Skin"
                        placeholderTextColor={Theme.colors.textMuted}
                        value={customCat}
                        onChangeText={setCustomCat}
                      />
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.formLabel}>Company / Brand Name *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. Spigen, Ringke, Unbranded"
                      placeholderTextColor={Theme.colors.textMuted}
                      value={addBrand}
                      onChangeText={setAddBrand}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.formLabel}>Phone Model Compatibility (Optional)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. iPhone 15 Pro"
                      placeholderTextColor={Theme.colors.textMuted}
                      value={addModel}
                      onChangeText={setAddModel}
                    />
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { width: '48%' }]}>
                      <Text style={styles.formLabel}>Purchase Price ({currencySymbol}) *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Cost price"
                        placeholderTextColor={Theme.colors.textMuted}
                        keyboardType="numeric"
                        value={addCost}
                        onChangeText={setAddCost}
                      />
                    </View>
                    <View style={[styles.inputGroup, { width: '48%' }]}>
                      <Text style={styles.formLabel}>Selling Price ({currencySymbol})</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Retail price"
                        placeholderTextColor={Theme.colors.textMuted}
                        keyboardType="numeric"
                        value={addSell}
                        onChangeText={setAddSell}
                      />
                    </View>
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { width: '48%' }]}>
                      <Text style={styles.formLabel}>Quantity to Add *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="1"
                        placeholderTextColor={Theme.colors.textMuted}
                        keyboardType="numeric"
                        value={addQty}
                        onChangeText={setAddQty}
                      />
                    </View>
                    <View style={[styles.inputGroup, { width: '48%' }]}>
                      <Text style={styles.formLabel}>Supplier (Optional)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Supplier Name"
                        placeholderTextColor={Theme.colors.textMuted}
                        value={addSupplier}
                        onChangeText={setAddSupplier}
                      />
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={activeSlot === 'phones' ? handleAddPhone : handleAddAccessoryStock} 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Theme.colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {activeSlot === 'phones' ? 'Add Phone to Stock' : 'Add Accessory to Stock'}
                  </Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Sell Phone Transaction */}
      <Modal visible={isSellModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sell Phone</Text>
              <TouchableOpacity onPress={() => setIsSellModalOpen(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {selectedPhone && (
              <View style={styles.modalForm}>
                <Text style={styles.sellItemText}>
                  {selectedPhone.brand} {selectedPhone.model} {selectedPhone.storage ? `(${selectedPhone.storage})` : ''}
                </Text>
                <Text style={styles.costPriceHelp}>
                  Purchased Cost: {currencySymbol}{selectedPhone.purchasePrice}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>Selling Price ({currencySymbol}) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 1199"
                    placeholderTextColor={Theme.colors.textMuted}
                    keyboardType="numeric"
                    value={sellPrice}
                    onChangeText={setSellPrice}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>Payment Method</Text>
                  <View style={styles.payMethodsGrid}>
                    {user?.settings.paymentMethods.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.payMethodBtn, paymentMethod === m ? styles.payMethodBtnActive : {}]}
                        onPress={() => setPaymentMethod(m)}
                      >
                        <Text style={[styles.payMethodBtnText, paymentMethod === m ? styles.payMethodBtnTextActive : {}]}>
                          {m.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>Customer Name (Optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="John Doe"
                    placeholderTextColor={Theme.colors.textMuted}
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>Customer Phone (Optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="+919999999999"
                    placeholderTextColor={Theme.colors.textMuted}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                  />
                </View>

                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: Theme.colors.secondary }]} onPress={handleSellPhone} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator color={Theme.colors.white} /> : <Text style={styles.submitBtnText}>Complete Sale</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal 3: Sell Accessory Transaction */}
      <Modal visible={isSellAccessoryModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sell Accessory Item</Text>
              <TouchableOpacity onPress={() => setIsSellAccessoryModalOpen(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {selectedAccessory && (
              <View style={styles.modalForm}>
                <Text style={styles.sellItemText}>
                  {selectedAccessory.brand} {selectedAccessory.category} {selectedAccessory.modelCompatibility ? `(${selectedAccessory.modelCompatibility})` : ''}
                </Text>
                <Text style={styles.costPriceHelp}>
                  Purchased Cost: {currencySymbol}{selectedAccessory.purchasePrice}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>Selling Price ({currencySymbol}) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 250"
                    placeholderTextColor={Theme.colors.textMuted}
                    keyboardType="numeric"
                    value={sellAccessoryPrice}
                    onChangeText={setSellAccessoryPrice}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>Payment Method</Text>
                  <View style={styles.payMethodsGrid}>
                    {user?.settings.paymentMethods.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.payMethodBtn, sellAccessoryPayment === m ? styles.payMethodBtnActive : {}]}
                        onPress={() => setSellAccessoryPayment(m)}
                      >
                        <Text style={[styles.payMethodBtnText, sellAccessoryPayment === m ? styles.payMethodBtnTextActive : {}]}>
                          {m.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>Customer Name (Optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="John Doe"
                    placeholderTextColor={Theme.colors.textMuted}
                    value={sellAccessoryCustName}
                    onChangeText={setSellAccessoryCustName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>Customer Phone (Optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="+919999999999"
                    placeholderTextColor={Theme.colors.textMuted}
                    value={sellAccessoryCustPhone}
                    onChangeText={setSellAccessoryCustPhone}
                  />
                </View>

                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: Theme.colors.secondary }]} onPress={handleSellAccessory} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator color={Theme.colors.white} /> : <Text style={styles.submitBtnText}>Complete Sale</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xs,
    gap: Theme.spacing.sm
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    height: 48
  },
  searchIcon: {
    marginRight: Theme.spacing.sm
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 16
  },
  addFloatBtn: {
    width: 48,
    height: 48,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center'
  },
  slotsWrapper: {
    paddingVertical: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs
  },
  slotsScroll: {
    paddingHorizontal: Theme.spacing.md,
    gap: 10
  },
  slotTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6
  },
  activeSlotTab: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: Theme.colors.primary,
  },
  slotIcon: {
    fontSize: 15
  },
  slotLabel: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  activeSlotLabel: {
    color: Theme.colors.text
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.cardBorder
  },
  tabButton: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.roundness.sm
  },
  activeTabButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: Theme.colors.primary
  },
  tabText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  activeTabText: {
    color: Theme.colors.primary
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl
  },
  emptyText: {
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.md,
    fontSize: 16
  },
  listContainer: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl
  },
  phoneCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder
  },
  phoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md
  },
  phoneTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  phoneSpecs: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.sm,
    borderWidth: 1
  },
  badgeOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: Theme.colors.danger
  },
  badgeLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: Theme.colors.accent
  },
  badgeOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: Theme.colors.secondary
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.cardBorder,
    paddingTop: Theme.spacing.sm
  },
  priceLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted
  },
  priceVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 2
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  deleteBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sellBtn: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: Theme.roundness.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  disabledBtn: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    opacity: 0.5
  },
  sellBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: Theme.roundness.lg,
    borderTopRightRadius: Theme.roundness.lg,
    height: '85%',
    padding: Theme.spacing.lg
  },
  modalContentSmall: {
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: Theme.roundness.lg,
    borderTopRightRadius: Theme.roundness.lg,
    maxHeight: '80%',
    padding: Theme.spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.cardBorder
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  closeText: {
    color: Theme.colors.danger,
    fontSize: 15,
    fontWeight: '600'
  },
  modalForm: {
    flex: 1
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
    fontSize: 15
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.md,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    marginTop: Theme.spacing.lg
  },
  submitBtnText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  sellItemText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4
  },
  costPriceHelp: {
    fontSize: 13,
    color: Theme.colors.secondary,
    marginBottom: Theme.spacing.md
  },
  payMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  payMethodBtn: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.roundness.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
    alignItems: 'center'
  },
  payMethodBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary
  },
  payMethodBtnText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold'
  },
  payMethodBtnTextActive: {
    color: Theme.colors.white
  },
  categorySelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  catSelectBtn: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.roundness.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 4
  },
  catSelectBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary
  },
  catSelectBtnText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600'
  },
  catSelectBtnTextActive: {
    color: Theme.colors.white
  },
  iconWrapperSmall: {
    width: 38,
    height: 38,
    borderRadius: Theme.roundness.sm,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  }
});
