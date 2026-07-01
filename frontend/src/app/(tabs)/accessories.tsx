import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  FlatList
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Theme } from '../../constants/Theme';
import { 
  Layers, 
  Headphones, 
  Zap, 
  Shield, 
  Battery, 
  Box, 
  Plus, 
  Search, 
  Trash2, 
  DollarSign, 
  Tag, 
  User as UserIcon, 
  Phone as PhoneIcon, 
  Info
} from 'lucide-react-native';

interface CategoryItem {
  _id: string;
  name: string;
  isCustom: boolean;
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

export default function Accessories() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'quick' | 'inventory'>('quick');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [inventory, setInventory] = useState<AccessoryStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Quick Sell Modal State
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryItem | null>(null);
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Accessory Stock Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addCat, setAddCat] = useState('Case');
  const [customCat, setCustomCat] = useState('');
  const [addBrand, setAddBrand] = useState('');
  const [addModel, setAddModel] = useState('');
  const [addCost, setAddCost] = useState('');
  const [addSell, setAddSell] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [addSupplier, setAddSupplier] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Sell Stock Item Modal State
  const [isSellInvModalOpen, setIsSellInvModalOpen] = useState(false);
  const [selectedInvItem, setSelectedInvItem] = useState<AccessoryStockItem | null>(null);
  const [sellInvPrice, setSellInvPrice] = useState('');
  const [sellInvPayment, setSellInvPayment] = useState('cash');
  const [sellInvCustName, setSellInvCustName] = useState('');
  const [sellInvCustPhone, setSellInvCustPhone] = useState('');
  const [isSubmittingSellInv, setIsSubmittingSellInv] = useState(false);

  const fetchCategories = async () => {
    try {
      if (activeTab === 'quick') setIsLoading(true);
      const res = await api.get('/api/accessories/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching accessory categories:', error);
    } finally {
      if (activeTab === 'quick') setIsLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      if (activeTab === 'inventory') setIsLoading(true);
      const res = await api.get('/api/accessories/inventory');
      setInventory(res.data);
    } catch (error) {
      console.error('Error fetching accessory stock:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'quick') {
        fetchCategories();
      } else {
        fetchInventory();
      }
    }, [activeTab])
  );

  // Load cached prices for quick sell category
  const loadCachedPrices = async (catName: string) => {
    try {
      const cached = await AsyncStorage.getItem(`cache_price_${catName}`);
      if (cached) {
        const { cachedCost, cachedSell } = JSON.parse(cached);
        setCostPrice(cachedCost || '');
        setSellPrice(cachedSell || '');
      } else {
        setCostPrice('');
        setSellPrice('');
      }
    } catch (e) {
      setCostPrice('');
      setSellPrice('');
    }
  };

  const handleOpenQuickSell = async (category: CategoryItem) => {
    setSelectedCat(category);
    await loadCachedPrices(category.name);
    setPaymentMethod('cash');
    setCustomerName('');
    setCustomerPhone('');
    setIsSellModalOpen(true);
  };

  const handleSellAccessory = async () => {
    if (!selectedCat || !costPrice || !sellPrice) {
      Alert.alert('Validation Error', 'Cost Price and Selling Price are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/sales/accessory', {
        category: selectedCat.name,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellPrice),
        paymentMethod,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined
      });

      // Cache prices for next quick tap!
      await AsyncStorage.setItem(
        `cache_price_${selectedCat.name}`,
        JSON.stringify({ cachedCost: costPrice, cachedSell: sellPrice })
      );

      Alert.alert('Success', `${selectedCat.name} sale logged successfully`);
      setIsSellModalOpen(false);
      setSelectedCat(null);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSellStockItem = (item: AccessoryStockItem) => {
    setSelectedInvItem(item);
    setSellInvPrice(item.sellingPrice ? item.sellingPrice.toString() : '');
    setSellInvPayment('cash');
    setSellInvCustName('');
    setSellInvCustPhone('');
    setIsSellInvModalOpen(true);
  };

  const handleSellStockItem = async () => {
    if (!selectedInvItem || !sellInvPrice) {
      Alert.alert('Validation Error', 'Selling price is required');
      return;
    }

    setIsSubmittingSellInv(true);
    try {
      await api.post('/api/sales/accessory-item', {
        accessoryItemId: selectedInvItem._id,
        sellingPrice: parseFloat(sellInvPrice),
        paymentMethod: sellInvPayment,
        customerName: sellInvCustName || undefined,
        customerPhone: sellInvCustPhone || undefined
      });

      Alert.alert('Success', 'Accessory sale logged successfully');
      setIsSellInvModalOpen(false);
      setSelectedInvItem(null);
      fetchInventory();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Transaction failed');
    } finally {
      setIsSubmittingSellInv(false);
    }
  };

  const handleAddStock = async () => {
    const finalCategory = addCat === 'Custom' ? customCat.trim() : addCat;

    if (!finalCategory || !addBrand || !addCost) {
      Alert.alert('Validation Error', 'Category, Brand/Company, and Purchase Price are required');
      return;
    }

    setIsSubmittingAdd(true);
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

      Alert.alert('Success', 'Accessory stock updated');
      setIsAddModalOpen(false);
      
      // Reset form
      setAddBrand('');
      setAddModel('');
      setAddCost('');
      setAddSell('');
      setAddQty('1');
      setAddSupplier('');
      setCustomCat('');

      fetchInventory();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add stock');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this accessory stock from inventory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/accessories/inventory/${itemId}`);
              Alert.alert('Success', 'Accessory stock deleted');
              fetchInventory();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  // Helper to pick category icon dynamically
  const renderIcon = (name: string, color: string) => {
    const n = name.toLowerCase();
    if (n.includes('ear') || n.includes('head') || n.includes('sound')) {
      return <Headphones color={color} size={28} />;
    }
    if (n.includes('charg') || n.includes('power') || n.includes('adapter') || n.includes('zap')) {
      return <Zap color={color} size={28} />;
    }
    if (n.includes('shield') || n.includes('glass') || n.includes('guard') || n.includes('temper')) {
      return <Shield color={color} size={28} />;
    }
    if (n.includes('batt') || n.includes('bank')) {
      return <Battery color={color} size={28} />;
    }
    if (n.includes('case') || n.includes('cover')) {
      return <Box color={color} size={28} />;
    }
    return <Layers color={color} size={28} />;
  };

  const renderGridItem = ({ item }: { item: CategoryItem }) => (
    <TouchableOpacity style={styles.gridCard} onPress={() => handleOpenQuickSell(item)}>
      <View style={styles.iconWrapper}>
        {renderIcon(item.name, Theme.colors.primary)}
      </View>
      <Text style={styles.gridLabel} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const getStockBadgeColor = (qty: number) => {
    if (qty <= 0) return Theme.colors.danger;
    if (qty <= (user?.settings?.lowStockThreshold || 5)) return Theme.colors.accent;
    return Theme.colors.secondary;
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.modelCompatibility && item.modelCompatibility.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategoryFilter === 'All' || 
      item.category.toLowerCase() === selectedCategoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ['All', ...Array.from(new Set(inventory.map(i => i.category)))];
  const currencySymbol = user?.settings?.currency || '₹';

  return (
    <View style={styles.container}>
      {/* Header and Custom Segments */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Accessories Manager</Text>
          <TouchableOpacity 
            style={styles.headerAddBtn}
            onPress={() => {
              setAddCat(categories[0]?.name || 'Case');
              setIsAddModalOpen(true);
            }}
          >
            <Plus color={Theme.colors.white} size={20} />
            <Text style={styles.headerAddBtnText}>Add Stock</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'quick' && styles.tabButtonActive]}
            onPress={() => setActiveTab('quick')}
          >
            <Layers color={activeTab === 'quick' ? Theme.colors.white : Theme.colors.textMuted} size={16} />
            <Text style={[styles.tabButtonText, activeTab === 'quick' && styles.tabButtonTextActive]}>Quick Sell Grid</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'inventory' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('inventory');
              fetchInventory();
            }}
          >
            <Box color={activeTab === 'inventory' ? Theme.colors.white : Theme.colors.textMuted} size={16} />
            <Text style={[styles.tabButtonText, activeTab === 'inventory' && styles.tabButtonTextActive]}>Tracked Stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : activeTab === 'quick' ? (
        // QUICK TAP VIEW
        categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Layers color={Theme.colors.textMuted} size={48} />
            <Text style={styles.emptyText}>No accessory categories configured</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item._id}
            renderItem={renderGridItem}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              <Text style={styles.sectionSubtitle}>Tap a category below to log a quick un-tracked transaction</Text>
            }
          />
        )
      ) : (
        // TRACKED INVENTORY VIEW
        <View style={{ flex: 1 }}>
          {/* Search and Filters */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBox}>
              <Search color={Theme.colors.textMuted} size={18} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by company, phone model..."
                placeholderTextColor={Theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
              {uniqueCategories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterPill, selectedCategoryFilter === cat && styles.filterPillActive]}
                  onPress={() => setSelectedCategoryFilter(cat)}
                >
                  <Text style={[styles.filterPillText, selectedCategoryFilter === cat && styles.filterPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Stock List */}
          {filteredInventory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Box color={Theme.colors.textMuted} size={48} />
              <Text style={styles.emptyText}>No stocked accessories match filters</Text>
            </View>
          ) : (
            <FlatList
              data={filteredInventory}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.invListContainer}
              renderItem={({ item }) => (
                <View style={styles.invCard}>
                  <View style={styles.invCardHeader}>
                    <View>
                      <Text style={styles.invBrandText}>{item.brand}</Text>
                      <Text style={styles.invModelText}>
                        {item.category} {item.modelCompatibility ? `for ${item.modelCompatibility}` : ''}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStockBadgeColor(item.quantity) }]}>
                      <Text style={styles.badgeText}>
                        {item.quantity <= 0 ? 'Out of Stock' : `${item.quantity} Left`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.invCardDivider} />

                  <View style={styles.invCardBody}>
                    <View style={styles.priceMetaRow}>
                      <View>
                        <Text style={styles.priceMetaLabel}>Cost Price</Text>
                        <Text style={styles.priceMetaValue}>{currencySymbol}{item.purchasePrice}</Text>
                      </View>
                      <View>
                        <Text style={styles.priceMetaLabel}>Selling Price</Text>
                        <Text style={styles.priceMetaValue}>
                          {item.sellingPrice ? `${currencySymbol}${item.sellingPrice}` : 'Not set'}
                        </Text>
                      </View>
                      {item.supplier && (
                        <View>
                          <Text style={styles.priceMetaLabel}>Supplier</Text>
                          <Text style={styles.priceMetaValue} numberOfLines={1}>{item.supplier}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.invCardActions}>
                      <TouchableOpacity 
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteItem(item._id)}
                      >
                        <Trash2 color={Theme.colors.danger} size={18} />
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.sellBtn, item.quantity <= 0 && styles.sellBtnDisabled]}
                        disabled={item.quantity <= 0}
                        onPress={() => handleOpenSellStockItem(item)}
                      >
                        <Text style={styles.sellBtnText}>Sell Unit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* QUICK SELL MODAL */}
      <Modal visible={isSellModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Sell: {selectedCat?.name}</Text>
              <TouchableOpacity onPress={() => setIsSellModalOpen(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {selectedCat && (
              <ScrollView style={styles.modalForm}>
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { width: '48%' }]}>
                    <Text style={styles.formLabel}>Cost Price ({currencySymbol}) *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="10"
                      placeholderTextColor={Theme.colors.textMuted}
                      keyboardType="numeric"
                      value={costPrice}
                      onChangeText={setCostPrice}
                    />
                  </View>
                  <View style={[styles.inputGroup, { width: '48%' }]}>
                    <Text style={styles.formLabel}>Selling Price ({currencySymbol}) *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="25"
                      placeholderTextColor={Theme.colors.textMuted}
                      keyboardType="numeric"
                      value={sellPrice}
                      onChangeText={setSellPrice}
                    />
                  </View>
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

                <TouchableOpacity style={styles.submitBtn} onPress={handleSellAccessory} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator color={Theme.colors.white} />
                  ) : (
                    <Text style={styles.submitBtnText}>Confirm Quick Sale</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* TRACKED ITEM SELL MODAL */}
      <Modal visible={isSellInvModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sell Accessory Stock</Text>
              <TouchableOpacity onPress={() => setIsSellInvModalOpen(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {selectedInvItem && (
              <ScrollView style={styles.modalForm}>
                <View style={styles.sellItemMetaHeader}>
                  <Text style={styles.sellItemMetaBrand}>{selectedInvItem.brand}</Text>
                  <Text style={styles.sellItemMetaDesc}>
                    {selectedInvItem.category} {selectedInvItem.modelCompatibility ? `for ${selectedInvItem.modelCompatibility}` : ''}
                  </Text>
                  <Text style={styles.sellItemMetaCost}>Purchased for: {currencySymbol}{selectedInvItem.purchasePrice}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>Selling Price ({currencySymbol}) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Selling Price"
                    placeholderTextColor={Theme.colors.textMuted}
                    keyboardType="numeric"
                    value={sellInvPrice}
                    onChangeText={setSellInvPrice}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>Payment Method</Text>
                  <View style={styles.payMethodsGrid}>
                    {user?.settings.paymentMethods.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.payMethodBtn, sellInvPayment === m ? styles.payMethodBtnActive : {}]}
                        onPress={() => setSellInvPayment(m)}
                      >
                        <Text style={[styles.payMethodBtnText, sellInvPayment === m ? styles.payMethodBtnTextActive : {}]}>
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
                    placeholder="Customer Name"
                    placeholderTextColor={Theme.colors.textMuted}
                    value={sellInvCustName}
                    onChangeText={setSellInvCustName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.formLabel}>Customer Phone (Optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Phone number"
                    placeholderTextColor={Theme.colors.textMuted}
                    value={sellInvCustPhone}
                    onChangeText={setSellInvCustPhone}
                  />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSellStockItem} disabled={isSubmittingSellInv}>
                  {isSubmittingSellInv ? (
                    <ActivityIndicator color={Theme.colors.white} />
                  ) : (
                    <Text style={styles.submitBtnText}>Confirm Sale & Decrement Stock</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ADD STOCK MODAL */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Accessory Stock</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Category selector */}
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
                  placeholder="e.g. iPhone 15 Pro, Galaxy S24"
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

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddStock} disabled={isSubmittingAdd}>
                {isSubmittingAdd ? (
                  <ActivityIndicator color={Theme.colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Add / Restock Item</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  header: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.cardBorder
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  sectionSubtitle: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    marginBottom: Theme.spacing.md,
    textAlign: 'center'
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.xs + 2,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.roundness.md
  },
  headerAddBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(11, 17, 30, 0.4)',
    borderRadius: Theme.roundness.md,
    padding: 3,
    marginTop: 4
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Theme.roundness.sm,
    gap: 6
  },
  tabButtonActive: {
    backgroundColor: Theme.colors.primary
  },
  tabButtonText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  tabButtonTextActive: {
    color: Theme.colors.white
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
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md
  },
  gridCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.lg,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    minHeight: 120
  },
  iconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm
  },
  gridLabel: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4
  },
  searchBarContainer: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.cardBorder,
    gap: 10
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 17, 30, 0.5)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    marginLeft: 8,
    fontSize: 14,
    paddingVertical: 4
  },
  filterPillsRow: {
    gap: 8,
    paddingVertical: 2
  },
  filterPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    borderRadius: Theme.roundness.xl,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  filterPillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary
  },
  filterPillText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600'
  },
  filterPillTextActive: {
    color: Theme.colors.white
  },
  invListContainer: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl
  },
  invCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.md
  },
  invCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  invBrandText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  invModelText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 2
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.sm
  },
  badgeText: {
    color: Theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold'
  },
  invCardDivider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
    marginVertical: Theme.spacing.sm
  },
  invCardBody: {
    gap: Theme.spacing.sm
  },
  priceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  priceMetaLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted
  },
  priceMetaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 2
  },
  invCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 4
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: Theme.roundness.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)'
  },
  sellBtn: {
    backgroundColor: Theme.colors.secondary,
    paddingVertical: Theme.spacing.xs + 2,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.roundness.md
  },
  sellBtnDisabled: {
    backgroundColor: Theme.colors.border,
    opacity: 0.5
  },
  sellBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: 13
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
    maxHeight: '85%',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  closeText: {
    color: Theme.colors.danger,
    fontSize: 15,
    fontWeight: '600'
  },
  modalForm: {
    marginBottom: Theme.spacing.md
  },
  sellItemMetaHeader: {
    backgroundColor: 'rgba(11, 17, 30, 0.4)',
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  sellItemMetaBrand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  sellItemMetaDesc: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 2
  },
  sellItemMetaCost: {
    fontSize: 12,
    color: Theme.colors.accent,
    fontWeight: 'bold',
    marginTop: 6
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
    backgroundColor: Theme.colors.secondary,
    borderRadius: Theme.roundness.md,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    marginTop: Theme.spacing.md
  },
  submitBtnText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold'
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
    gap: 6,
    marginVertical: 4
  },
  catSelectBtn: {
    backgroundColor: 'rgba(11, 17, 30, 0.4)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.roundness.sm,
    paddingVertical: 8,
    paddingHorizontal: 12
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
  }
});
