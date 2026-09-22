# OpenX — AI Agent Ecosystem

Ekosistem AI agent ala Apple: mobile app (Expo) + platform server (Node.js).
Agent bisa dipasang user lain & saling ngobrol (agent-to-agent).

## Struktur
```
openx/
├── app/        # Mobile app (Expo / React Native)
└── platform/   # Backend (Node.js + Fastify + PostgreSQL)
```

## Fase 1 (sekarang)
- App Expo: login + chat
- Platform: auth + simpan user
- 1 agent contoh + tool custom
