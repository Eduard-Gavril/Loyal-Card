# Fidelix - Setup Guide

## 🚀 Quick Start

### Prerequisiti

- **Node.js** 18+ e npm
- **Supabase CLI**: `npm install -g supabase`
- Account Supabase (gratuito)

### 1. Setup Supabase

#### Crea progetto Supabase
1. Vai su [supabase.com](https://supabase.com)
2. Crea nuovo progetto
3. Copia URL e anon key

#### Inizializza Supabase localmente

```bash
cd Fidelix
supabase init
supabase start
```

#### Applica migrations

```bash
supabase db push
```

Oppure manualmente:
1. Vai su Supabase Dashboard → SQL Editor
2. Copia il contenuto di `supabase/migrations/20260126_initial_schema.sql`
3. Esegui

#### Seed data (opzionale per test)

```bash
supabase db reset --db-url "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

O manualmente tramite SQL Editor con `supabase/seed.sql`

### 2. Deploy Edge Functions

```bash
# Login
supabase login

# Link progetto
supabase link --project-ref [YOUR-PROJECT-REF]

# Deploy functions
supabase functions deploy generate-client-id
supabase functions deploy register-scan
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials
# VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
# VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### 4. Run Development

```bash
npm run dev
```

Frontend disponibile su: http://localhost:3000

## 🧪 Test del Sistema

### 1. Crea Admin User

Via Supabase Dashboard:
1. Authentication → Users → Add User
2. Email: `admin@test.com`, Password: `password123`
3. Copia lo User ID

Poi in SQL Editor:

```sql
-- Inserisci admin collegato al tenant demo
INSERT INTO admins (tenant_id, user_id, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '[SUPABASE_USER_ID]',
  'owner'
);
```

### 2. Test Flusso Cliente

1. Apri http://localhost:3000
2. Verrà generato automaticamente un Client ID
3. Visualizza il QR code personale
4. Controlla i premi disponibili (vuoti inizialmente)

### 3. Test Flusso Admin

1. Vai su http://localhost:3000/admin/login
2. Login con: `admin@test.com` / `password123`
3. Dashboard con statistiche
4. Clicca "Scansiona QR Code"
5. Scansiona il QR del cliente (o inserisci manualmente)
6. Seleziona un prodotto
7. Conferma → premio viene aggiunto

### 4. Verifica Loyalty

1. Torna alla card cliente (http://localhost:3000)
2. Dovresti vedere il contatore aggiornato
3. Dopo 5 scan dello stesso prodotto → premio disponibile

## 📦 Deploy Produzione

### Frontend (Vercel)

```bash
cd frontend
npm run build

# Deploy su Vercel
npx vercel --prod
```

Configura environment variables in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Database & Backend

Supabase è già hosted. Assicurati che:
- RLS policies siano attive
- Edge Functions deployate
- Backups automatici abilitati

## 🔐 Sicurezza

### RLS Check

Verifica che tutte le tabelle abbiano RLS abilitata:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Tutte devono avere `rowsecurity = true`.

### Rate Limiting

Configura in Supabase Dashboard:
- API Settings → Rate Limiting
- Consigliato: 100 req/min per IP

## 📊 Monitoraggio

### Logs

```bash
# Edge Functions logs
supabase functions logs generate-client-id
supabase functions logs register-scan
```

### Database Queries

Dashboard → Database → Query Performance

## 🐛 Troubleshooting

### Edge Functions non rispondono

```bash
# Verifica deploy
supabase functions list

# Re-deploy
supabase functions deploy [function-name]
```

### RLS blocca query

Controlla policies:

```sql
SELECT * FROM pg_policies WHERE tablename = '[table-name]';
```

### Frontend non si connette

1. Verifica `.env` con credenziali corrette
2. Controlla CORS in Supabase Dashboard → API Settings
3. Verifica che anon key sia pubblico

## 📚 Prossimi Passi

1. ✅ Setup base completato
2. 🔄 Implementa Apple Wallet integration
3. 🔄 Implementa Google Wallet integration
4. 🔄 Dashboard analytics avanzate
5. 🔄 Sistema billing

---

**Supporto**: Consulta `docs/ARCHITECTURE.md` per dettagli architetturali
