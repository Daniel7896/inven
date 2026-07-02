import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Button,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Theme } from '../../constants/Theme';
import { Camera, Image as ImageIcon, Check, RefreshCw, Smartphone } from 'lucide-react-native';

export default function ScanBox() {
  const { user } = useAuth();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Flow State: 'camera' | 'loading' | 'form'
  const [flowState, setFlowState] = useState<'camera' | 'loading' | 'form'>('camera');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  // Form State (returned by AI / user edits)
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [color, setColor] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [quantity, setQuantity] = useState('1');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.permissionContainer}>
        <Smartphone size={60} color={Theme.colors.primary} style={{ marginBottom: 16 }} />
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        
        {/* Quick Simulator Fallback */}
        <TouchableOpacity 
          style={[styles.permissionBtn, { backgroundColor: Theme.colors.card, marginTop: 12, borderWidth: 1, borderColor: Theme.colors.border }]} 
          onPress={() => triggerMockScan()}
        >
          <Text style={[styles.permissionBtnText, { color: Theme.colors.text }]}>Use Demo Scanner (Simulate)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Helper to package image form data
  const processImageScan = async (imageUri: string, base64Data?: string) => {
    setFlowState('loading');
    
    try {
      const formData = new FormData();
      
      if (imageUri) {
        if (Platform.OS === 'web') {
          // Web: fetch the URI as blob and append properly
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const extension = blob.type === 'image/png' ? 'png' : 'jpeg';
          formData.append('image', blob, `photo.${extension}`);
        } else {
          // React Native: use { uri, name, type } format
          const uriParts = imageUri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          formData.append('image', {
            uri: imageUri,
            name: `photo.${fileType}`,
            type: `image/${fileType === 'png' ? 'png' : 'jpeg'}`
          } as any);
        }
      }

      console.log('Uploading photo to API...');
      const res = await api.post('/api/ai/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000, // 30s timeout for AI processing
      });

      const { data, isMock } = res.data;
      
      // Populate fields
      setBrand(data.brand || '');
      setModel(data.model || '');
      setVariant(data.variant || '');
      setRam(data.ram || '');
      setStorage(data.storage || '');
      setColor(data.color || '');
      setPurchasePrice(''); // Keep prices blank to force user input
      setSellingPrice('');
      setSupplier('');
      setQuantity('1');

      if (isMock) {
        console.log('AI Mock Response loaded successfully.');
      }

      setFlowState('form');
    } catch (e: any) {
      console.error('Scan failed:', e);
      Alert.alert('Scan Failed', e.response?.data?.message || 'Error communicating with AI parser. Please try again.');
      setFlowState('camera');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true
        });
        
        if (photo && photo.uri) {
          setCapturedImageUri(photo.uri);
          await processImageScan(photo.uri);
        }
      } catch (err) {
        console.error('Failed to snap picture:', err);
        Alert.alert('Camera Error', 'Could not capture photo');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setCapturedImageUri(result.assets[0].uri);
        await processImageScan(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Gallery pick error:', err);
      Alert.alert('Error', 'Could not open photo gallery');
    }
  };

  // Quick simulator trigger for testing on devices/emulators without camera access
  const triggerMockScan = async () => {
    setCapturedImageUri(null);
    setFlowState('loading');
    try {
      // Send a dummy post request but handle empty body on the server which activates the mock
      const res = await api.post('/api/ai/scan', {}, {
        headers: { 'Content-Type': 'application/json' }
      });
      const { data } = res.data;
      
      setBrand(data.brand || '');
      setModel(data.model || '');
      setVariant(data.variant || '');
      setRam(data.ram || '');
      setStorage(data.storage || '');
      setColor(data.color || '');
      setPurchasePrice('800'); // Seed a test price for emulator
      setSellingPrice('1050');
      setSupplier('Simulated Source');
      setQuantity('1');
      setFlowState('form');
    } catch (err: any) {
      // If endpoint requires file, fake it
      setBrand('Apple');
      setModel('iPhone 15 Pro');
      setVariant('Pro');
      setRam('8GB');
      setStorage('256GB');
      setColor('Natural Titanium');
      setPurchasePrice('900');
      setSellingPrice('1199');
      setSupplier('Mock Wholesale');
      setQuantity('1');
      setFlowState('form');
    }
  };

  const handleSaveInventory = async () => {
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
        quantityToAdd: parseInt(quantity, 10) || 1
      });

      Alert.alert('Success', `${brand} ${model} saved to stock!`);
      // Reset state and head back to inventory
      setFlowState('camera');
      setCapturedImageUri(null);
      router.push('/(tabs)/inventory');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (flowState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginBottom: 16 }} />
        <Text style={styles.loadingText}>AI is scanning the box...</Text>
        <Text style={styles.loadingSub}>Extracting phone specifications</Text>
      </View>
    );
  }

  if (flowState === 'form') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formContentContainer}>
        <View style={styles.formHeader}>
          <Smartphone size={32} color={Theme.colors.primary} />
          <View>
            <Text style={styles.formTitle}>Confirm Phone Details</Text>
            <Text style={styles.formSub}>Extracted specs. Review and fill pricing.</Text>
          </View>
        </View>

        {capturedImageUri && (
          <Image source={{ uri: capturedImageUri }} style={styles.previewImage} />
        )}

        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Device Specifications</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.formLabel}>Brand *</Text>
            <TextInput style={styles.formInput} value={brand} onChangeText={setBrand} placeholder="e.g. Apple" placeholderTextColor={Theme.colors.textMuted} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.formLabel}>Model *</Text>
            <TextInput style={styles.formInput} value={model} onChangeText={setModel} placeholder="e.g. iPhone 15 Pro" placeholderTextColor={Theme.colors.textMuted} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.formLabel}>Variant</Text>
            <TextInput style={styles.formInput} value={variant} onChangeText={setVariant} placeholder="e.g. Pro Max" placeholderTextColor={Theme.colors.textMuted} />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.formLabel}>RAM</Text>
              <TextInput style={styles.formInput} value={ram} onChangeText={setRam} placeholder="e.g. 8GB" placeholderTextColor={Theme.colors.textMuted} />
            </View>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.formLabel}>Storage</Text>
              <TextInput style={styles.formInput} value={storage} onChangeText={setStorage} placeholder="e.g. 256GB" placeholderTextColor={Theme.colors.textMuted} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.formLabel}>Color</Text>
            <TextInput style={styles.formInput} value={color} onChangeText={setColor} placeholder="e.g. Space Gray" placeholderTextColor={Theme.colors.textMuted} />
          </View>

          <View style={styles.divider} />
          <Text style={styles.cardSectionTitle}>Pricing & Stock</Text>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.formLabel}>Purchase Cost *</Text>
              <TextInput
                style={styles.formInput}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="900"
                placeholderTextColor={Theme.colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.formLabel}>Selling Price ({user?.settings?.currency || '₹'})</Text>
              <TextInput
                style={styles.formInput}
                value={sellingPrice}
                onChangeText={setSellingPrice}
                placeholder="1199"
                placeholderTextColor={Theme.colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.formLabel}>Supplier</Text>
              <TextInput style={styles.formInput} value={supplier} onChangeText={setSupplier} placeholder="e.g. Apple Inc." placeholderTextColor={Theme.colors.textMuted} />
            </View>
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={styles.formLabel}>Quantity</Text>
              <TextInput style={styles.formInput} value={quantity} onChangeText={setQuantity} placeholder="1" keyboardType="numeric" placeholderTextColor={Theme.colors.textMuted} />
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setFlowState('camera')}>
              <RefreshCw size={18} color={Theme.colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={styles.cancelBtnText}>Rescan</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveInventory} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color={Theme.colors.white} />
              ) : (
                <>
                  <Check size={18} color={Theme.colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save Stock</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.overlayContainer}>
          {/* Top instruction overlay */}
          <View style={styles.topOverlay}>
            <Text style={styles.instructions}>Align phone box label in the center frame</Text>
          </View>

          {/* Target Scanning Window */}
          <View style={styles.middleOverlay}>
            <View style={styles.sideOverlay} />
            <View style={styles.targetFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>

          {/* Bottom control overlay */}
          <View style={styles.bottomOverlay}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <ImageIcon color={Theme.colors.white} size={24} />
              <Text style={styles.controlText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shutterButton} onPress={takePicture}>
              <View style={styles.shutterInner}>
                <Camera color={Theme.colors.primary} size={28} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryButton} onPress={triggerMockScan}>
              <RefreshCw color={Theme.colors.white} size={24} />
              <Text style={styles.controlText}>Simulate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000'
  },
  camera: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: Theme.spacing.md
  },
  loadingSub: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginTop: 4
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg
  },
  permissionText: {
    color: Theme.colors.text,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg
  },
  permissionBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.md,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    alignItems: 'center'
  },
  permissionBtnText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between'
  },
  topOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: Theme.spacing.lg,
    alignItems: 'center'
  },
  instructions: {
    color: Theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  middleOverlay: {
    flexDirection: 'row',
    height: 240
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  targetFrame: {
    width: 280,
    height: 240,
    position: 'relative'
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Theme.colors.primary,
    borderWidth: 4
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0
  },
  bottomOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: Theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  galleryButton: {
    alignItems: 'center',
    width: 70
  },
  controlText: {
    color: Theme.colors.white,
    fontSize: 12,
    marginTop: 6
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background
  },
  formContentContainer: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.sm
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text
  },
  formSub: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 2
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: Theme.roundness.md,
    marginBottom: Theme.spacing.md,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.md
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
  divider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
    marginVertical: Theme.spacing.md
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.md
  },
  cancelBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: 'rgba(11, 17, 30, 0.2)',
    borderRadius: Theme.roundness.md,
    paddingVertical: Theme.spacing.md,
    width: '45%'
  },
  cancelBtnText: {
    color: Theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '600'
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.md,
    paddingVertical: Theme.spacing.md,
    width: '50%'
  },
  saveBtnText: {
    color: Theme.colors.white,
    fontSize: 15,
    fontWeight: '600'
  }
});
