// Agent runtime — tempat agent "jalan"
// Fase 1: agent = prompt + tools, tanpa LLM beneran (pakai stub reply)
// ponytail: ganti stubReply dengan panggil LLM via 9router saat backend siap

import { getAgent } from './db.js';

// Tool registry — custom tools, plugin JS sederhana
const tools = {
  get_time: {
    description: 'Dapatkan waktu & tanggal sekarang',
    run: () => new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
  },
  echo: {
    description: 'Ulangi pesan user',
    run: (args) => `echo: ${args.text ?? ''}`,
  },
};

export function getTool(name) {
  return tools[name];
}

export function listToolNames() {
  return Object.keys(tools);
}

// Stub reply — ganti dengan LLM call (via 9router) di Fase 2
function stubReply(agent, userMessage) {
  const time = getTool('get_time').run();
  return `[${agent.name}] (stub) Lo bilang: "${userMessage}". Waktu sekarang: ${time}. Agent runtime jalan, tinggal colok LLM.`;
}

export function runAgent(agentId, userMessage) {
  const agent = getAgent(agentId);
  if (!agent) return { error: 'agent not found' };
  return { reply: stubReply(agent, userMessage) };
}
