# Fidelix - Architettura Dettagliata

## 🏛️ Visione Architetturale

Fidelix è un motore di loyalty multi-tenant basato su eventi, progettato per scalabilità e isolamento dati.

## 📐 Principi Architetturali

### 1. Multi-Tenancy
- **Single Database, Logical Isolation**
- Ogni tabella include `tenant_id`
- Row Level Security (RLS) obbligatoria
- Nessuna query senza filtro tenant
- Client ID globale (cross-business possibile in futuro)

### 2. Event-Driven
- **ScanEvent come fonte di verità**
- Append-only log immutabile
- Ricostruzione stato da eventi
- Audit trail completo

### 3. Stateless Backend
- Edge Functions stateless
- Stato in PostgreSQL
- Nessuna sessione server-side
- Scalabilità orizzontale

### 4. Client Anonimo
- Nessun login obbligatorio
- Client ID persistente
- Wallet come identità principale
- Recovery opzionale

## 🔧 Componenti Sistema

### Frontend Layer

```
┌─────────────────────────────────────┐
│         React PWA (SPA)             │
├─────────────────┬───────────────────┤
│   Client View   │    Admin View     │
│  (no auth req)  │  (auth required)  │
└─────────────────┴───────────────────┘
```

**Client View**
- Generazione Client ID al primo accesso
- Visualizzazione card digitale
- Progress bar per prodotto
- QR code personale
- Add to Wallet buttons

**Admin View**
- Login JWT-based
- QR Scanner (WebRTC)
- Product selection
- Dashboard base
- Event log viewer

### Backend Layer (Supabase)

```
┌──────────────────────────────────────────┐
│           Edge Functions                 │
├──────────────┬───────────────────────────┤
│ register_scan│ generate_wallet │ auth    │
│ apply_reward │ update_wallet   │ ...     │
└──────────────┴───────────────────────────┘
                     │
┌────────────────────▼──────────────────────┐
│         PostgreSQL + RLS                  │
└───────────────────────────────────────────┘
```

**Edge Functions Principali**

1. `register_scan`
   - Input: client_id, product_id, admin_id, tenant_id
   - Valida admin + tenant
   - Crea ScanEvent
   - Trigger loyalty engine
   - Output: stato card aggiornato

2. `generate_client_id`
   - Genera UUID anonimo
   - Crea record Client
   - Crea Card iniziale
   - Ritorna client_id + QR

3. `generate_wallet_pass`
   - Genera .pkpass (Apple)
   - Firma con certificato
   - Upload su Storage
   - Ritorna URL temporaneo

4. `update_wallet`
   - Push update ad Apple/Google
   - Aggiorna punti in real-time

### Data Layer

```
┌─────────────────────────────────────────┐
│             PostgreSQL                  │
├─────────────────────────────────────────┤
│  Tenants │ Clients │ Cards │ Products   │
│  Admins  │ Stores  │ Rules │ Events     │
└─────────────────────────────────────────┘
         │
    ┌────▼────┐
    │   RLS   │  ← Isolamento tenant
    └─────────┘
```

## 🔒 Sicurezza Multi-Tenant

### Row Level Security (Critico)

**Esempio: Tabella `scan_events`**

```sql
-- Admin può vedere solo eventi del proprio tenant
CREATE POLICY "admin_own_tenant_scan_events"
ON scan_events
FOR SELECT
TO authenticated
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM admins 
    WHERE auth.uid() = user_id
  )
);

-- Staff può solo inserire, non leggere
CREATE POLICY "staff_insert_scan_events"
ON scan_events
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = (
    SELECT tenant_id 
    FROM admins 
    WHERE auth.uid() = user_id
  )
);
```

**Regole RLS per ogni tabella:**
- `tenants` → owner può CRUD
- `admins` → owner gestisce staff
- `clients` → nessuna RLS (anonimi)
- `cards` → legatura a client_id
- `scan_events` → append-only, tenant-scoped
- `products` → admin può CRUD propri prodotti

## 🎲 Loyalty Engine

### Architettura

```
ScanEvent → [Loyalty Engine] → Card Update
                  │
                  ▼
           [RewardRules]
           - buy_count
           - reward_count
           - product_id / category_id
```

### Logica Core

```typescript
// Pseudo-codice
function applyLoyalty(scanEvent: ScanEvent) {
  // 1. Trova regola applicabile
  const rule = findRule(
    scanEvent.tenant_id,
    scanEvent.product_id
  );
  
  if (!rule) return;
  
  // 2. Incrementa contatore
  const card = getCard(scanEvent.client_id);
  card.counters[rule.id] += 1;
  
  // 3. Check soglia premio
  if (card.counters[rule.id] >= rule.buy_count) {
    card.rewards[rule.id] += rule.reward_count;
    card.counters[rule.id] = 0; // reset
  }
  
  // 4. Salva stato
  saveCard(card);
  
  // 5. Push a Wallet
  if (card.wallet_id) {
    updateWallet(card);
  }
}
```

### Regole Configurabili

**Tabella `reward_rules`**
```
tenant_id
product_id (nullable)
category_id (nullable)
buy_count: 5
reward_count: 1
reward_product_id: stesso o diverso
active: true
```

**Esempi:**
- 5 espresso → 1 espresso gratis
- 10 qualsiasi → 1 cappuccino gratis
- 3 pasticcini → 1 brioche gratis

## 🔄 Flusso Dati Completo

### Scenario: Scan QR Cliente

```
1. [Cliente] Mostra QR
           ↓
2. [Admin Web] Scansiona QR → decode client_id
           ↓
3. [Admin] Seleziona prodotto acquistato
           ↓
4. [Frontend] POST /edge/register_scan
   {
     client_id: "uuid",
     product_id: "uuid",
     admin_id: "uuid",
     tenant_id: "uuid"
   }
           ↓
5. [Edge Function] Valida:
   - Admin autenticato?
   - Tenant coerente?
   - Prodotto esiste?
           ↓
6. [DB] INSERT scan_events (immutabile)
           ↓
7. [Loyalty Engine] Applica regole
           ↓
8. [DB] UPDATE cards (contatori/premi)
           ↓
9. [Wallet API] Push update (async)
           ↓
10. [Frontend] ← Response: stato card
```

## 📊 Schema Database (Semplificato)

### Core Tables

```sql
-- Multi-tenant root
tenants (
  id, name, logo_url, active, created_at
)

-- Negozi/punti vendita
stores (
  id, tenant_id, name, address
)

-- Utenti admin
admins (
  id, tenant_id, user_id (supabase auth),
  role: 'owner' | 'staff',
  store_id (nullable)
)

-- Clienti anonimi (globali)
clients (
  id (UUID), created_at, metadata (jsonb)
)

-- Card loyalty (legatura client × tenant)
cards (
  id, client_id, tenant_id, wallet_id (nullable),
  counters (jsonb),  -- {rule_id: count}
  rewards (jsonb),   -- {rule_id: rewards_available}
  created_at, updated_at
)

-- Prodotti
products (
  id, tenant_id, name, category_id, active
)

product_categories (
  id, tenant_id, name
)

-- Eventi scan (immutabili)
scan_events (
  id, tenant_id, client_id, admin_id, 
  product_id, store_id (nullable),
  scanned_at (timestamp)
)

-- Regole loyalty
reward_rules (
  id, tenant_id,
  product_id (nullable),
  category_id (nullable),
  buy_count, reward_count,
  reward_product_id,
  active
)
```

### Indici Critici

```sql
CREATE INDEX idx_scan_events_tenant ON scan_events(tenant_id, scanned_at DESC);
CREATE INDEX idx_scan_events_client ON scan_events(client_id, scanned_at DESC);
CREATE INDEX idx_cards_client_tenant ON cards(client_id, tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id, active);
```

## 🌐 Wallet Integration

### Apple Wallet

**Generazione Pass**
```
Edge Function → PassKit Library
   → Genera JSON manifest
   → Firma con .p12 certificato
   → ZIP → .pkpass
   → Upload Supabase Storage
   → Ritorna URL pubblico temporaneo
```

**Update Pass**
```
Card updated → Trigger Edge Function
   → POST ad Apple APN
   → Device pull nuovo pass
```

### Google Wallet

**Creazione Loyalty Object**
```
Edge Function → OAuth2 Google
   → POST Loyalty Object JSON
   → Include QR code (client_id)
   → Ritorna add-to-wallet link
```

**Update Object**
```
Card updated → API call
   → PATCH Loyalty Object
   → Update points/status
```

## 📈 Scalabilità

### Fase MVP
- Single Supabase instance
- Edge Functions sufficienti
- < 100 tenant
- < 10k scan/giorno

### Fase Growth
- Supabase Pro tier
- CDN per asset
- Caching Redis (opzionale)
- < 1000 tenant
- < 100k scan/giorno

### Fase Enterprise
- Migrazione backend custom
- Queue per eventi (SQS/RabbitMQ)
- Microservizi per wallet
- Sharding DB (se necessario)

## 🚨 Punti di Attenzione

### Criticità Alta
1. **RLS mal configurata** → data leak tra tenant
2. **Client ID esposto** → scan non autorizzati
3. **Edge Function senza validazione** → frodi
4. **Rate limiting assente** → abuse

### Mitigazioni
- Test RLS automatici (pytest)
- QR con signature HMAC
- Middleware validazione strict
- Rate limit: 10 scan/min per admin

## 🔮 Evoluzioni Future

### V2
- Stamping (punti con scadenza)
- Regole multiple per cliente
- Gamification (livelli, badge)

### V3
- Analytics predittive
- Notifiche push personalizzate
- Integrazione POS

---

**Principio guida**: Semplice, sicuro, scalabile. No feature prima della solidità.
