# PRD — OpenX: Ekosistem AI Agent

**Versi:** 0.1 (Draft)
**Tanggal:** 2026-09-22
**Author:** Notzeyyyc (Galuh Aldian Pradipta)
**Status:** Brainstorming → Fase 1

---

## 1. Ringkasan Eksekutif

OpenX adalah ekosistem AI agent ala Apple — tapi bukan OS, melainkan **platform agent**. Pengguna bisa membuat agent sendiri, memasang agent buatan orang lain (store), dan agent bisa saling ngobrol satu sama lain (federation). Target utama: siswa SMK jurusan RPL.

**Satu kalimat:** "App Store untuk AI agent, di mana agent punya identitas, bisa dipasang user lain, dan bisa berkomunikasi antar-agent."

---

## 2. Latar Belakang & Masalah

- AI chatbot umum (ChatGPT, dll) = 1 model, 1 percakapan. Tidak ada konsep "agent" dengan identitas & ownership.
- Tools/automation tersebar di banyak app terpisah (bot WA, reminder, reporter) — tidak ada satu ekosistem yang menyatukan.
- Anak SMK RPL butuh platform yang bisa dipakai untuk belajar & berkarya, bukan cuma konsumsi AI.

**Insight:** Metafora Apple (App Store, Siri, iCloud, Handoff) bisa diterjemahkan ke dunia agent:
| Apple | OpenX |
|---|---|
| App Store | Agent Store (marketplace) |
| Siri | Agent Runtime (tempat agent jalan) |
| iCloud | Shared context/state antar agent |
| Handoff | Agent jalan lintas device |
| App Intents | Tools/actions yang bisa dipanggil agent |

---

## 3. Tujuan

### 3.1 Tujuan Produk
1. User bisa **membuat agent** tanpa harus jadi programmer ahli (Fase 2: via form/config).
2. User bisa **memasang agent** buatan orang lain dari store.
3. Agent bisa **saling ngobrol** (A2A — agent-to-agent).
4. Agent punya **akses tool** & bisa di-customize.

### 3.2 Non-Tujuan (Fase 1)
- ❌ Bukan OS / bukan pengganti iOS-Android.
- ❌ Bukan LLM hosting — agent jalan di server, LLM dipanggil via API (9router).
- ❌ Bukan marketplace berbayar (billing/monetisasi ditunda — belum ada keputusan).
- ❌ Bukan editor kode di dalam app.

### 3.3 Metrik Sukses (Fase 1)
- 1 app Expo jalan di HP (Expo Go).
- 1+ agent bisa diajak chat dengan tool beneran.
- 2 user bisa bikin agent masing-masing.
- Agent A bisa chat ke agent B (proof of federation).

---

## 4. Target Pengguna

| Persona | Deskripsi | Kebutuhan |
|---|---|---|
| **Zeyy (Owner)** | Developer, ngoding dari HP, JS | Kontrol penuh, bikin agent custom, integrasi infra sendiri |
| **Temen SMK RPL** | Skill lumayan, JS | Bikin agent, pasang agent orang, eksperimen |
| **User umum RPL** | Baru belajar | Pasang agent siap pakai, chat, gak perlu ngoding |

**Akses & bahasa:** UI Bahasa Indonesia (utama), kode tetap English.

---

## 5. Arsitektur

```
┌─ LAYER 1: APP (Expo / React Native — UI tipis)
│  chat, daftar agent, dashboard, notif
├─ LAYER 2: PLATFORM (Node.js + Fastify — server pusat)
│  identity, routing A2A, agent store, permission
└─ LAYER 3: RUNTIME (Node.js — tempat agent jalan)
   prompt + tools + LLM call
```

### 5.1 Stack
- **App:** Expo SDK 57, React Native 0.86, React 19
- **Backend:** Node.js 24, Fastify 5, @fastify/websocket
- **DB:** JSON file (Fase 1) → PostgreSQL (Fase 2+)
- **LLM gateway:** 9router (`http://localhost:20128/v1`) — OpenAI-compatible
- **Realtime:** WebSocket (chat + agent jalan)

### 5.2 Identitas Agent
```
agent_id = <user>.<workspace>.<agent_name>
contoh: zeyy.gw.wabot
```
Identitas ini yang dipakai routing A2A.

### 5.3 Protokol Agent-to-Agent (A2A)
```
Agent A → Platform → Agent B
1. A kirim pesan ke zeyy.gw.wabot
2. Platform cek: B ada? B aktif? A diizinkan chat B?
3. Pesan masuk queue B
4. B proses (LLM + tool sendiri), balas
```
Platform pusat wajib untuk: auth, discoverability, permission.

---

## 6. Fitur & Prioritas

### Fase 1 — Dasar jalan (sekarang, sebagian done)
| # | Fitur | Status |
|---|---|---|
| 1 | App Expo: login + daftar agent + chat | ✅ |
| 2 | Platform: register, auth token, agents, chat API | ✅ |
| 3 | 1 agent seed (WaBot) + tool `get_time`, `echo` | ✅ |
| 4 | Agent runtime: prompt + tools + stub reply | ✅ |
| 4 | **Colok LLM beneran** (ganti stub → call 9router) | ⬜ |
| 5 | Agent panggil tool dari chat (`web_search`, `http_request`) | ⬜ |
| 6 | Chat history persist + load | ⬜ |

### Fase 2 — Multi-agent & Store
| # | Fitur |
|---|---|
| 1 | User bisa bikin agent sendiri (manifest + tools) |
| 2 | Agent store: publish + install agent orang |
| 3 | Agent akses tool yang di-install |
| 4 | PostgreSQL + auth password/JWT |

### Fase 3 — Federation (fitur pembeda)
| # | Fitur |
|---|---|
| 1 | Agent-to-agent chat via platform |
| 2 | Permission: siapa boleh chat agent lo |
| 3 | Multi-user beneran |
| 4 | Shared context antar agent (iCloud analog) |

### Fase 4 — Platform
| # | Fitur |
|---|---|
| 1 | Billing/limit (QRIS — preferensi user) |
| 2 | Distribusi APK (EAS build) |
| 3 | Agent template gallery untuk RPL |

---

## 7. Data Model (Fase 1)

```json
User   { id, name, email, createdAt }
Agent  { id, ownerId, name, description, prompt, tools[], createdAt }
Message{ id, chatId, role, content, agentId, createdAt }
Tool   { name, description, run(args) }   // plugin JS
```

---

## 8. Infra & Lingkungan

- **VPS:** DigitalOcean, Ubuntu, 4 vCPU / 8GB
- **9router:** AI gateway port 20128 (multi-provider: qd, anoman, tokenportal, justtowork, dll)
- **Model tersedia (alias hermes):** `qf` (qwen), `ds41` (deepseek-v4.1), `opus48` (claude-opus-4-8), `hy4` (kuota terbatas)
- **GitHub:** `Notzeyyyc/openx` (public)
- **Domain:** qenoxit.site (untuk deploy platform nanti)

---

## 9. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| LLM di HP berat | Agent gak jalan lokal | Runtime di server, app = UI tipis |
| Kuota provider habis (402) | Agent gagal balas | Multi-provider via 9router, fallback model |
| 2 orang, iseng, no deadline | Proyek mandek | Fase kecil, demo tiap fase, repo publik |
| A2A = fitur kompleks | Over-engineering di awal | Tunda ke Fase 3, bangun setelah store jalan |
| Keamanan multi-user | Agent orang bisa disalahgunakan | Permission & sandbox di Fase 3 |

---

## 10. Roadmap

```
Fase 1 (2-3 minggu)  →  Fase 2 (3-4 minggu)  →  Fase 3 (4-6 minggu)
dasar + LLM beneran      multi-agent + store       federation + permission
```

**Milestone Fase 1:** Agent WaBot bisa jawab pake LLM beneran + panggil tool, dari HP via Expo Go.

---

## 11. Pertanyaan Terbuka

1. Agent custom: user bikin via **form (no-code)** — keputusan: mulai dari form, script JS untuk power user.
2. Tool bawaan MVP: prioritas `web_search` + `http_request` (generik), `wa_send` (integrasi openx-wa) belakangan.
3. App nama & branding: "OpenX" — perlu logo/icon?
4. ~~Billing QRIS~~ — ditunda, belum ada keputusan monetisasi.
