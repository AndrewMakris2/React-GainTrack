import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSignup() {
    if (!email || !password || !name) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }

    // Save name to settings right away if session exists
    if (data.session) {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: data.session.user.id,
          name: name.trim(),
          targets: { calories: 2500, protein: 180, carbs: 250, fat: 80 },
        });
      setLoading(false);
      router.replace('/(tabs)/dashboard');
    } else {
      // Email confirmation required
      setLoading(false);
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>📬</Text>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successText}>
            We sent a confirmation link to {email}. Click it to activate your account, then log in.
          </Text>
          <Link href={"/(auth)" as any} asChild>
            <TouchableOpacity style={styles.btn}>
              <Text style={styles.btnText}>Back to Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.appName}>GainTrack</Text>
            <Text style={styles.formTitle}>Create account</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Alex"
                placeholderTextColor="#4B5563"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#4B5563"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="min. 6 characters"
                placeholderTextColor="#4B5563"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href={"/(auth)" as any} asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Log in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 32,
  },
  header: { gap: 4 },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F97316',
    letterSpacing: 1,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  form: { gap: 16 },
  errorBox: {
    backgroundColor: '#450A0A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: { color: '#FCA5A5', fontSize: 13, fontWeight: '600' },
  field: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '500',
  },
  btn: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginText: { color: '#6B7280', fontSize: 14 },
  loginLink: { color: '#F97316', fontSize: 14, fontWeight: '700' },
  successBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  successIcon: { fontSize: 48 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#F3F4F6' },
  successText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
});
