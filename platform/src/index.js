// OpenX Platform — HTTP API + WebSocket
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { createUser, getUser, getUserByEmail, createAgent, listAgents, getAgent, addMessage, listMessages } from './db.js';
import { runAgent, listToolNames } from './runtime.js';

const app = Fastify({ logger: true });
await app.register(websocket);

const PORT = process.env.PORT || 3001;

// --- auth (Fase 1: token sederhana, tanpa password) ---
// ponytail: ganti dengan OAuth/password + JWT saat multi-user
const tokens = new Map(); // token -> userId

function authedUser(req) {
  const token = req.headers['x-token'];
  const userId = token && tokens.get(token);
  return userId ? getUser(userId) : null;
}

// --- routes ---
app.post('/register', async (req) => {
  const { name, email } = req.body ?? {};
  if (!name || !email) return { error: 'name & email required' };
  let user = getUserByEmail(email);
  if (!user) user = createUser({ name, email });
  const token = crypto.randomUUID();
  tokens.set(token, user.id);
  return { token, user: { id: user.id, name: user.name, email: user.email } };
});

app.get('/me', async (req) => {
  const user = authedUser(req);
  return user ? { user } : { error: 'unauthorized' };
});

app.get('/agents', async (req) => {
  const user = authedUser(req);
  if (!user) return { error: 'unauthorized' };
  return { agents: listAgents() };
});

app.post('/agents', async (req) => {
  const user = authedUser(req);
  if (!user) return { error: 'unauthorized' };
  const { name, description, prompt, tools } = req.body ?? {};
  if (!name) return { error: 'name required' };
  const agent = createAgent({ ownerId: user.id, name, description, prompt, tools });
  return { agent };
});

app.get('/tools', async () => ({ tools: listToolNames() }));

app.post('/chat', async (req) => {
  const user = authedUser(req);
  if (!user) return { error: 'unauthorized' };
  const { agentId, message } = req.body ?? {};
  if (!agentId || !message) return { error: 'agentId & message required' };
  const agent = getAgent(agentId);
  if (!agent) return { error: 'agent not found' };

  const chatId = req.body.chatId ?? `user:${user.id}:agent:${agentId}`;
  addMessage({ chatId, role: 'user', content: message, agentId });
  const { reply, error } = runAgent(agentId, message);
  if (error) return { error };
  addMessage({ chatId, role: 'assistant', content: reply, agentId });
  return { chatId, reply };
});

app.get('/chats/:chatId', async (req) => {
  const user = authedUser(req);
  if (!user) return { error: 'unauthorized' };
  return { messages: listMessages(req.params.chatId) };
});

// --- WebSocket: realtime chat (Fase 1: echo server sederhana) ---
app.register(async (wsApp) => {
  wsApp.get('/ws', { websocket: true }, (socket) => {
    socket.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      // ponytail: route ke agent runtime + streaming di Fase 2
      socket.send(JSON.stringify({ type: 'echo', data: data.payload }));
    });
  });
});

app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  console.log(`OpenX platform listening on :${PORT}`);
});
