# Fidelix - Piattaforma Loyalty Digitale

**Motore di loyalty senza app nativa, basato su web app + QR code + Wallet integration**

## 🎯 Obiettivo

Piattaforma SaaS multi-tenant per programmi fedeltà digitali che:
- Riduce l'attrito per il cliente (no login obbligatorio)
- È affidabile per il business
- Scala facilmente a più attività
- È vendibile come servizio

## 🔑 Concetto Chiave

**Loyalty per prodotto/categoria, non per cliente globale**

Esempio:
- 5 espresso → 6° espresso gratis
- 5 cappuccini → 6° cappuccino gratis
- Premi non intercambiabili tra categorie

## 👥 Attori

1. **Cliente finale** - esperienza senza login
2. **Admin/Staff** - gestione via web app autenticata
3. **Piattaforma SaaS** - multi-tenant

## 🏗️ Architettura

### Frontend
- React PWA mobile-first
- Scanner QR via WebRTC
- No logica sensibile lato client

### Backend (Supabase)
- PostgreSQL con Row Level Security
- Auth per admin/staff
- Edge Functions per logica business
- Storage per asset e pass

### Integrazioni
- Apple Wallet (.pkpass)
- Google Wallet (Loyalty Objects)

## 📱 Flusso Operativo

1. Cliente mostra QR (web o Wallet)
2. Admin scansiona QR dalla web app
3. Admin seleziona prodotto acquistato
4. Backend registra ScanEvent
5. Motore loyalty aggiorna contatore
6. Se soglia raggiunta → premio disponibile
7. Wallet aggiornato via push (se presente)

## 🔐 Sicurezza

- Admin autenticato con JWT + ruoli
- QR validato lato backend
- Rate limiting
- Isolamento multi-tenant con RLS
- Audit log obbligatorio

## 💰 Monetizzazione

- Freemium (limiti scansioni/clienti)
- Abbonamento mensile
- White-label per catene
- Billing basato su eventi scan

## 📂 Struttura Progetto

```
fidelix/
├── supabase/           # Configurazione Supabase
│   ├── migrations/     # Schema DB
│   ├── functions/      # Edge Functions
│   └── config.toml     # Config
├── frontend/           # React PWA
│   ├── src/
│   │   ├── admin/      # Interfaccia admin
│   │   ├── client/     # Card cliente
│   │   └── components/ # Componenti comuni
├── docs/               # Documentazione
└── scripts/            # Utility
```

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+
- Supabase CLI
- Account Supabase

### Setup

```bash
# Clone repository
git clone <repo-url>
cd Fidelix

# Install Supabase CLI
npm install -g supabase

# Setup Supabase
supabase init
supabase start

# Install dependencies
cd frontend
npm install

# Start development
npm run dev
```

## 📊 Modello Dati Principale

- **Tenant** - business/attività
- **Store** - punto vendita (opzionale)
- **Admin** - utenti con ruoli
- **Client** - cliente anonimo (globale)
- **Product** - prodotto venduto
- **ProductCategory** - categoria prodotti
- **Card** - card loyalty del cliente
- **ScanEvent** - evento scan (immutabile)
- **RewardRule** - regole configurabili

## 🎯 Roadmap

### MVP (Fase 1)
- [ ] Schema DB multi-tenant
- [ ] Auth admin
- [ ] Generazione Client ID anonimo
- [ ] QR code dinamico
- [ ] Scan e registrazione eventi
- [ ] Motore loyalty base (buy X get Y)
- [ ] Dashboard admin essenziale

### Fase 2
- [ ] Apple Wallet integration
- [ ] Google Wallet integration
- [ ] Recovery opzionale (email/telefono)
- [ ] White-label base

### Fase 3
- [ ] Analytics avanzate
- [ ] Billing automatico
- [ ] Multi-store per tenant
- [ ] Export dati

## 🛠️ Stack Tecnologico

- **Frontend**: React 18, TypeScript, TailwindCSS, PWA
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth + JWT
- **Wallet**: Apple PassKit, Google Wallet API
- **Scanner**: html5-qrcode / ZXing
- **Deploy**: Vercel (frontend) + Supabase (backend)

## 📄 Licenza

Proprietario - Fidelix © 2026

---

**Nota**: Questo è il punto zero del progetto. Architettura progettata per essere configurabile, non custom per singolo cliente.
