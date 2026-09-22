import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, ScrollView,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { api, setToken, getToken } from './src/api';

// ---------- Login ----------
function Login({ onLogin }) {
  const [name, setName] = useState('Zeyy');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!email.trim()) { setErr('Email wajib diisi'); return; }
    setLoading(true); setErr('');
    try {
      const res = await api.register(name.trim() || 'User', email.trim());
      if (res.token) {
        setToken(res.token);
        onLogin(res.user);
      } else setErr(res.error || 'Gagal login');
    } catch (e) { setErr('Gagal konek server'); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.logo}>OpenX</Text>
      <Text style={styles.subtitle}>Ekosistem AI Agent</Text>
      <TextInput style={styles.input} placeholder="Nama" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address" />
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <Pressable style={styles.btn} onPress={submit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Loading...' : 'Masuk'}</Text>
      </Pressable>
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

// ---------- Chat ----------
function Chat({ agent, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatId = `user:${getToken()}:agent:${agent.id}`;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await api.chat(agent.id, text, chatId);
      setMessages((m) => [...m, { role: 'assistant', content: res.reply || res.error || '(gak ada reply)' }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Gagal konek server' }]);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.chatHeader}>
        <Pressable onPress={onBack}><Text style={styles.backBtn}>‹</Text></Pressable>
        <Text style={styles.chatTitle}>{agent.name}</Text>
      </View>
      <FlatList
        style={styles.chatList}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAgent]}>
            <Text style={item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAgent}>{item.content}</Text>
          </View>
        )}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput style={styles.chatInput} placeholder="Tulis pesan..." value={input} onChangeText={setInput}
            onSubmitEditing={send} />
          <Pressable style={styles.sendBtn} onPress={send} disabled={loading}>
            <Text style={styles.sendText}>{loading ? '...' : '➤'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------- Home: daftar agent ----------
function Home({ user, onSelectAgent, onLogout }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.agents().then((res) => {
      setAgents(res.agents || []);
      setLoading(false);
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.homeHeader}>
        <Text style={styles.homeTitle}>OpenX</Text>
        <Pressable onPress={onLogout}><Text style={styles.logoutBtn}>Keluar</Text></Pressable>
      </View>
      <Text style={styles.homeSub}>Halo, {user?.name}. Pilih agent:</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : (
        <FlatList
          data={agents}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <Pressable style={styles.agentCard} onPress={() => onSelectAgent(item)}>
              <Text style={styles.agentName}>{item.name}</Text>
              <Text style={styles.agentDesc}>{item.description || 'Agent tanpa deskripsi'}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

// ---------- Root ----------
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('login'); // login | home | chat
  const [agent, setAgent] = useState(null);

  if (screen === 'login') {
    return <Login onLogin={(u) => { setUser(u); setScreen('home'); }} />;
  }
  if (screen === 'chat') {
    return <Chat agent={agent} onBack={() => setScreen('home')} />;
  }
  return (
    <Home
      user={user}
      onSelectAgent={(a) => { setAgent(a); setScreen('chat'); }}
      onLogout={() => { setToken(null); setUser(null); setScreen('login'); }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  logo: { fontSize: 48, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: 100 },
  subtitle: { fontSize: 16, color: '#8b8f9a', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#1a1d24', color: '#fff', borderRadius: 10,
    padding: 14, marginHorizontal: 24, marginBottom: 12, fontSize: 16,
  },
  btn: { backgroundColor: '#4f6ef7', borderRadius: 10, padding: 14, marginHorizontal: 24, marginTop: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  err: { color: '#ff6b6b', textAlign: 'center', marginBottom: 8 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  homeTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  logoutBtn: { color: '#ff6b6b', fontSize: 14 },
  homeSub: { color: '#8b8f9a', fontSize: 14, paddingHorizontal: 20, marginBottom: 12 },
  agentCard: { backgroundColor: '#1a1d24', borderRadius: 12, padding: 16, marginHorizontal: 20, marginBottom: 10 },
  agentName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  agentDesc: { color: '#8b8f9a', fontSize: 13, marginTop: 4 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1a1d24' },
  backBtn: { color: '#4f6ef7', fontSize: 32, marginRight: 12, lineHeight: 30 },
  chatTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  chatList: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  bubble: { borderRadius: 14, padding: 12, marginBottom: 8, maxWidth: '80%' },
  bubbleUser: { backgroundColor: '#4f6ef7', alignSelf: 'flex-end' },
  bubbleAgent: { backgroundColor: '#1a1d24', alignSelf: 'flex-start' },
  bubbleTextUser: { color: '#fff', fontSize: 15 },
  bubbleTextAgent: { color: '#e8eaf0', fontSize: 15 },
  inputRow: { flexDirection: 'row', padding: 12, backgroundColor: '#15171d', alignItems: 'center' },
  chatInput: { flex: 1, backgroundColor: '#1a1d24', color: '#fff', borderRadius: 20, padding: 12, fontSize: 15 },
  sendBtn: { backgroundColor: '#4f6ef7', borderRadius: 20, width: 44, height: 44, marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 18 },
});
