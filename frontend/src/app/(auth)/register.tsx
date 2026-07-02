import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/Theme';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !storeName) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await register(email, password, storeName);
      // Auth wrapper handles redirect automatically
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Mobile Shop Manager</Text>
          <Text style={styles.subtitle}>Inventory & Revenue Manager</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shop / Store Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Daniel Mobile Zone"
              placeholderTextColor={Theme.colors.textMuted}
              value={storeName}
              onChangeText={setStoreName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="example@shop.com"
              placeholderTextColor={Theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Theme.colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>Register Shop</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Theme.spacing.lg
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl
  },
  logo: {
    width: 160,
    height: 90,
    marginBottom: Theme.spacing.sm
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.xs
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textMuted
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.lg
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Theme.colors.danger,
    borderRadius: Theme.roundness.sm,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.md
  },
  errorText: {
    color: Theme.colors.danger,
    fontSize: 14,
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: Theme.spacing.md
  },
  label: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.xs
  },
  input: {
    backgroundColor: 'rgba(11, 17, 30, 0.5)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: 16,
    color: Theme.colors.text
  },
  button: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.md,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    marginTop: Theme.spacing.md
  },
  buttonText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Theme.spacing.lg
  },
  footerText: {
    color: Theme.colors.textMuted,
    fontSize: 14
  },
  loginLink: {
    color: Theme.colors.secondary,
    fontSize: 14,
    fontWeight: 'bold'
  }
});
