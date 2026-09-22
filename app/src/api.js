// API client — connect ke platform
// ponytail: base URL hardcode; ganti dari config/settings di Fase 2

const BASE = 'http://147.182.182.212:3001'; // IP VPS

let token = null;

export function setToken(t) {
  token = t;
}

export function getToken() {
  return token;
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(token ? { 'x-token': token } : {}),
      ...(opts.headers || {}),
    },
  });
  return res.json();
}

export const api = {
  register: (name, email) => req('/register', { method: 'POST', body: JSON.stringify({ name, email }) }),
  agents: () => req('/agents'),
  chat: (agentId, message, chatId) => req('/chat', { method: 'POST', body: JSON.stringify({ agentId, message, chatId }) }),
  history: (chatId) => req(`/chats/${chatId}`),
};
