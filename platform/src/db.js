// Data layer — in-memory store (Fase 1; ganti PostgreSQL nanti)
// ponytail: JSON file persist, upgrade ke real DB saat multi-user

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, '..', 'data');
const DB_FILE = join(DB_DIR, 'db.json');

const DEFAULT_DB = { users: [], agents: [], messages: [] };

let db = load();

function load() {
  if (existsSync(DB_FILE)) return JSON.parse(readFileSync(DB_FILE, 'utf8'));
  return structuredClone(DEFAULT_DB);
}

function save() {
  mkdirSync(DB_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function uid() {
  return crypto.randomUUID();
}

// --- users ---
export function createUser({ name, email }) {
  const user = { id: uid(), name, email, createdAt: Date.now() };
  db.users.push(user);
  save();
  return user;
}

export function getUser(id) {
  return db.users.find((u) => u.id === id);
}

export function getUserByEmail(email) {
  return db.users.find((u) => u.email === email);
}

// --- agents ---
// agent = paket yang bisa dipasang: prompt + tools (Fase 1: 1 agent bawaan)
export function createAgent({ ownerId, name, description, prompt, tools = [] }) {
  const agent = {
    id: uid(),
    ownerId,
    name,
    description,
    prompt,
    tools, // [{ name, description }]
    createdAt: Date.now(),
  };
  db.agents.push(agent);
  save();
  return agent;
}

export function getAgent(id) {
  return db.agents.find((a) => a.id === id);
}

export function listAgents() {
  return db.agents;
}

// --- messages ---
export function addMessage({ chatId, role, content, agentId }) {
  const msg = { id: uid(), chatId, role, content, agentId, createdAt: Date.now() };
  db.messages.push(msg);
  save();
  return msg;
}

export function listMessages(chatId) {
  return db.messages.filter((m) => m.chatId === chatId);
}
