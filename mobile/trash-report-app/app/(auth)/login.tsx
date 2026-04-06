import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { loginRequest, registerRequest } from '../../services/api';

const { width } = Dimensions.get('window');
const GREEN = '#3DBFA0';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginEmailErr, setLoginEmailErr] = useState('');
  const [loginPwdErr, setLoginPwdErr] = useState('');
  const [loginGeneralErr, setLoginGeneralErr] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [regNameErr, setRegNameErr] = useState('');
  const [regEmailErr, setRegEmailErr] = useState('');
  const [regPwdErr, setRegPwdErr] = useState('');
  const [regGeneralErr, setRegGeneralErr] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  function switchTo(next: 'login' | 'register') {
    if (next === mode) return;
    Animated.timing(slideAnim, {
      toValue: next === 'register' ? 1 : 0,
      duration: 380,
      useNativeDriver: true,
    }).start(() => setMode(next));
  }

  // ─── Login ──────────────────────────────────────────────────────────────────
  function validateLogin() {
    let ok = true;
    setLoginEmailErr(''); setLoginPwdErr(''); setLoginGeneralErr('');
    if (!loginEmail.trim()) { setLoginEmailErr('El correo es requerido'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) { setLoginEmailErr('Correo inválido'); ok = false; }
    if (!loginPassword.trim()) { setLoginPwdErr('La contraseña es requerida'); ok = false; }
    return ok;
  }

  async function handleLogin() {
    if (!validateLogin()) return;
    setLoginLoading(true);
    try {
      const data = await loginRequest(loginEmail.trim(), loginPassword);
      await signIn(data.token);
      router.replace('/(app)/map');
    } catch (e: any) {
      setLoginGeneralErr(e.message || 'Error al iniciar sesión');
    } finally {
      setLoginLoading(false);
    }
  }

  // ─── Register ────────────────────────────────────────────────────────────────
  function validateRegister() {
    let ok = true;
    setRegNameErr(''); setRegEmailErr(''); setRegPwdErr(''); setRegGeneralErr('');
    if (!regName.trim()) { setRegNameErr('El nombre es requerido'); ok = false; }
    if (!regEmail.trim()) { setRegEmailErr('El correo es requerido'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) { setRegEmailErr('Correo inválido'); ok = false; }
    if (!regPassword.trim()) { setRegPwdErr('La contraseña es requerida'); ok = false; }
    else if (regPassword.length < 6) { setRegPwdErr('Mínimo 6 caracteres'); ok = false; }
    return ok;
  }

  async function handleRegister() {
    if (!validateRegister()) return;
    setRegLoading(true);
    try {
      const data = await registerRequest(regName.trim(), regEmail.trim(), regPassword);
      await signIn(data.token);
      router.replace('/(app)/map');
    } catch (e: any) {
      setRegGeneralErr(e.message || 'Error al registrarse');
    } finally {
      setRegLoading(false);
    }
  }

  // ─── Animations ─────────────────────────────────────────────────────────────
  const panelTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* ── Green top banner ── */}
      <View style={styles.banner}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        {mode === 'login' ? (
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>¡Bienvenido{'\n'}de vuelta!</Text>
            <Text style={styles.bannerSub}>Para seguir conectado inicia sesión{'\n'}con tu cuenta personal</Text>
            <TouchableOpacity style={styles.bannerBtn} onPress={() => switchTo('register')}>
              <Text style={styles.bannerBtnText}>CREAR CUENTA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>¡Hola,{'\n'}bienvenido!</Text>
            <Text style={styles.bannerSub}>¿Ya tienes una cuenta?{'\n'}Inicia sesión aquí</Text>
            <TouchableOpacity style={styles.bannerBtn} onPress={() => switchTo('login')}>
              <Text style={styles.bannerBtnText}>INICIAR SESIÓN</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── White card ── */}
      <View style={styles.card}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {mode === 'login' ? (
            <>
              <Text style={styles.formTitle}>Iniciar Sesión</Text>

              {/* Email */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  style={[styles.inputField, loginEmailErr ? styles.inputErr : null]}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#AAAAAA"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={loginEmail}
                  onChangeText={(t) => { setLoginEmail(t); setLoginEmailErr(''); }}
                />
              </View>
              {loginEmailErr ? <Text style={styles.errText}>{loginEmailErr}</Text> : null}

              {/* Password */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.inputField, loginPwdErr ? styles.inputErr : null]}
                  placeholder="Contraseña"
                  placeholderTextColor="#AAAAAA"
                  secureTextEntry={!showLoginPwd}
                  autoCapitalize="none"
                  value={loginPassword}
                  onChangeText={(t) => { setLoginPassword(t); setLoginPwdErr(''); }}
                />
                <TouchableOpacity onPress={() => setShowLoginPwd(!showLoginPwd)}>
                  <Text style={styles.eyeIcon}>{showLoginPwd ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {loginPwdErr ? <Text style={styles.errText}>{loginPwdErr}</Text> : null}

              {loginGeneralErr ? (
                <View style={styles.generalErrBox}>
                  <Text style={styles.generalErrText}>{loginGeneralErr}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.submitBtn, loginLoading && styles.submitBtnDisabled]}
                onPress={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitBtnText}>INICIAR SESIÓN</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.formTitle}>Crear Cuenta</Text>

              {/* Name */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={[styles.inputField, regNameErr ? styles.inputErr : null]}
                  placeholder="Nombre completo"
                  placeholderTextColor="#AAAAAA"
                  autoCapitalize="words"
                  value={regName}
                  onChangeText={(t) => { setRegName(t); setRegNameErr(''); }}
                />
              </View>
              {regNameErr ? <Text style={styles.errText}>{regNameErr}</Text> : null}

              {/* Email */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  style={[styles.inputField, regEmailErr ? styles.inputErr : null]}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#AAAAAA"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={regEmail}
                  onChangeText={(t) => { setRegEmail(t); setRegEmailErr(''); }}
                />
              </View>
              {regEmailErr ? <Text style={styles.errText}>{regEmailErr}</Text> : null}

              {/* Password */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.inputField, regPwdErr ? styles.inputErr : null]}
                  placeholder="Contraseña (mín. 6 caracteres)"
                  placeholderTextColor="#AAAAAA"
                  secureTextEntry={!showRegPwd}
                  autoCapitalize="none"
                  value={regPassword}
                  onChangeText={(t) => { setRegPassword(t); setRegPwdErr(''); }}
                />
                <TouchableOpacity onPress={() => setShowRegPwd(!showRegPwd)}>
                  <Text style={styles.eyeIcon}>{showRegPwd ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {regPwdErr ? <Text style={styles.errText}>{regPwdErr}</Text> : null}

              {regGeneralErr ? (
                <View style={styles.generalErrBox}>
                  <Text style={styles.generalErrText}>{regGeneralErr}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.submitBtn, regLoading && styles.submitBtnDisabled]}
                onPress={handleRegister}
                disabled={regLoading}
              >
                {regLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitBtnText}>REGISTRARSE</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* Switch link at bottom */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            </Text>
            <TouchableOpacity onPress={() => switchTo(mode === 'login' ? 'register' : 'login')}>
              <Text style={styles.switchLink}>
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GREEN,
  },

  // ── Banner ──────────────────────────────────────────────────────────────────
  banner: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 60,
    left: -40,
  },
  bannerContent: {
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 42,
    marginBottom: 12,
  },
  bannerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 28,
  },
  bannerBtn: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  bannerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },

  // ── White card ──────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    maxHeight: '58%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 28,
  },

  // ── Inputs ──────────────────────────────────────────────────────────────────
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F9F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E8F0EE',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
    color: '#AAAAAA',
  },
  inputField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#333333',
  },
  inputErr: {
    borderColor: '#EF4444',
  },
  eyeIcon: {
    fontSize: 18,
    paddingLeft: 8,
  },
  errText: {
    color: '#EF4444',
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 4,
  },
  generalErrBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  generalErrText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },

  // ── Submit button ────────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: GREEN,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },

  // ── Switch ───────────────────────────────────────────────────────────────────
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  switchText: {
    color: '#999999',
    fontSize: 13,
  },
  switchLink: {
    color: GREEN,
    fontWeight: '700',
    fontSize: 13,
  },
});
