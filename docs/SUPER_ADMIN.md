# 🎛️ Super Admin Dashboard - Setup Guide

La **Super Admin Dashboard** ti permette di gestire l'intera piattaforma LoyalCard da un'unica interfaccia.

## ✨ Funzionalità

- **📊 Statistiche Globali**: Visualizza metriche aggregate di tutti i tenant
  - Total Stores (attivi/inattivi)
  - Total Clients
  - Total Scans (oggi, questo mese)
  - Total Rewards
  - Platform Health

- **🏢 Gestione Store**: 
  - Visualizza tutti i tenant con statistiche dettagliate
  - Attiva/Disattiva tenant
  - Cerca store per nome o email
  - Vedi clienti, scans, rewards per ogni store

- **📈 Insights & Analytics**:
  - Top Performing Store (più scans totali)
  - Most Active Today (scans oggi)
  - Highest Engagement (scans per client)

## 🚀 Setup Iniziale

### Step 1: Esegui la Migration SQL

1. Vai su **Supabase Dashboard** → **SQL Editor**
2. Apri il file: `supabase/migrations/20260401000002_add_super_admin.sql`
3. Copia **tutto** il contenuto
4. Incolla nel SQL Editor
5. Clicca **Run** (o Ctrl+Enter)
6. ✅ Conferma "Success"

Questa migration:
- Aggiunge supporto per il ruolo `super_admin`  
- Permette `tenant_id` NULL per super admin
- Crea RLS policies per accesso globale
- Aggiunge constraint di validazione

### Step 2: Crea Utente Super Admin

#### A. Crea utente in Supabase Auth

1. **Authentication** → **Users** → **"Add user"**
2. Inserisci:
   - **Email**: `tuoemail@esempio.com` (usa la tua email reale)
   - **Password**: Scegli una password sicura (es: almeno 12 caratteri)
   - **Auto Confirm User**: ✅ Attiva (se disponibile)
3. Clicca **"Create user"**
4. **📋 IMPORTANTE**: Copia lo **User ID** (UUID, es: `a1b2c3d4-...`)

#### B. Collega utente come Super Admin

1. **SQL Editor** → **New Query**
2. Esegui questo comando (sostituisci l'UUID):

```sql
INSERT INTO admins (user_id, tenant_id, role, active)
VALUES (
  'INCOLLA-QUI-IL-TUO-USER-ID',  -- Sostituisci con l'UUID copiato sopra
  NULL,                            -- NULL = super admin (nessun tenant specifico)
  'super_admin',                   -- Ruolo super admin
  true                             -- Attivo
);
```

3. Clicca **Run**
4. ✅ Conferma "Success" o "1 row inserted"

#### C. Verifica Creazione

Esegui questa query per verificare:

```sql
SELECT 
  u.email, 
  a.role, 
  a.tenant_id, 
  a.active,
  a.created_at
FROM admins a
JOIN auth.users u ON u.id = a.user_id
WHERE a.role = 'super_admin';
```

Dovresti vedere il tuo utente con:
- **email**: la tua email
- **role**: `super_admin`
- **tenant_id**: `NULL`
- **active**: `true`

## 🔐 Accesso alla Dashboard

### Login

1. Vai su: **http://localhost:3000/admin/login** (o il tuo dominio)
2. Inserisci:
   - **Email**: quella usata per creare il super admin
   - **Password**: quella scelta durante la creazione
3. Clicca **"Login"**
4. ✅ Verrai **automaticamente reindirizzato** a `/super-admin/dashboard`

> **Nota**: Se hai anche un account admin normale (con tenant_id), il sistema ti reindirizzerà alla dashboard corretta in base al ruolo:
> - `super_admin` → `/super-admin/dashboard` (vede tutti i tenant)
> - `owner`/`staff` → `/admin/dashboard` (vede solo il proprio tenant)

### Interfaccia Dashboard

La dashboard è divisa in 4 sezioni principali:

#### 1. 📊 Global Stats (top)
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 🏢 Stores   │ 👥 Clients  │ 📊 Scans    │ 🎁 Rewards  │
│ 5 total     │ 243 total   │ 1,234 total │ 87 total    │
│ ✅ 4 active │             │ 🔥 12 today │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### 2. 🔍 Search Bar
Cerca store per:
- Nome (es: "FitGym")
- Email (es: "contact@fitgym.ro")

#### 3. 📋 Stores Table
Tabella con tutti i tenant e azioni disponibili:

| Store | Status | Clients | Scans | Rewards | Today | Created | Actions |
|-------|--------|---------|-------|---------|-------|---------|---------|
| FitGym | ✅ Active | 45 👥 | 234 📊 | 12 🎁 | 🔥 5 | 2026-03-15 | Deactivate |
| Cafe Luna | ❌ Inactive | 12 👥 | 89 📊 | 3 🎁 | - | 2026-03-20 | Activate |

**Azioni disponibili**:
- **Activate/Deactivate**: Attiva o disattiva un tenant
  - ⚠️ **Disattivare** un tenant non elimina i dati, ma impedisce ai clienti di usare le card e agli admin di loggarsi
  - ✅ **Riattivare** ripristina immediatamente l'accesso

#### 4. 💎 Quick Insights
```
🏆 Top Performing Store     📈 Most Active Today      💎 Highest Engagement
FitGym                      FitGym                    Coffee Bar
234 total scans            5 scans today             8.5 scans/client
```

## 🔧 Gestione Operativa

### Disattivare un Tenant

**Quando usarlo**:
- Tenant non ha pagato
- Violazione termini di servizio
- Richiesta di chiusura temporanea
- Test/manutenzione

**Cosa succede**:
- ❌ Clienti NON vedono più le card
- ❌ Admin del tenant NON possono loggarsi
- ✅ Dati rimangono intatti nel database
- ✅ Super admin può riattivare in qualsiasi momento

**Come fare**:
1. Trova il tenant nella tabella
2. Clicca **"Deactivate"** nella colonna Actions
3. Conferma l'alert
4. ✅ Status diventa "❌ Inactive"

### Riattivare un Tenant

1. Trova il tenant disattivato
2. Clicca **"Activate"**
3. ✅ Status diventa "✅ Active"
4. Il tenant riprende immediatamente a funzionare

## 📈 Monitoraggio Performance

### KPI da Monitorare

1. **Active Tenants Ratio**
   - Formula: `active_tenants / total_tenants`
   - Target: > 80%
   - Se basso → indagare churn

2. **Average Scans per Store**
   - Formula: `total_scans_month / active_tenants`
   - Target: > 50/mese
   - Se basso → engagement problem

3. **Daily Activity**
   - Scans Today > 0 = piattaforma sana
   - Se = 0 per più giorni → problema tecnico

4. **Engagement Rate**
   - Top 3 stores con più scans/client
   - Benchmark per altri tenant

### Alert da Configurare (futuro)

- 🚨 Nessun scan per > 7 giorni (tenant inattivo)
- ⚠️ Drop > 50% scans mese vs mese precedente
- 📉 Tenant con 0 clienti dopo 30 giorni creazione

## 🔒 Sicurezza

### Permessi Super Admin

Il super admin ha **accesso completo** a:
- ✅ Visualizzare **tutti** i tenant
- ✅ Visualizzare **tutti** i clienti (tramite cards)
- ✅ Visualizzare **tutti** gli scan events
- ✅ Modificare status `active` dei tenant
- ❌ NON può modificare dati clienti direttamente
- ❌ NON può eliminare tenant (safety)

### Best Practices

1. **Password Sicura**
   - Minimo 16 caratteri
   - Usa un password manager
   - Cambia ogni 3 mesi

2. **2FA** (se abilitato su Supabase)
   - Attiva autenticazione a due fattori
   - Usa app come Google Authenticator

3. **Audit Log**
   - Tutti gli accessi sono loggati in `auth.users`
   - Le modifiche ai tenant sono tracciabili

4. **Rotazione Credenziali**
   - Non condividere mai le credenziali
   - Se compromesse, cambia immediatamente password

## 🆘 Troubleshooting

### Problema: "Admin not found or inactive" al login

**Causa**: Record non creato/errori in admins table

**Soluzione**:
```sql
-- Verifica esistenza record
SELECT * FROM admins WHERE user_id = 'TUO-USER-ID';

-- Se non esiste, ricrea:
INSERT INTO admins (user_id, tenant_id, role, active)
VALUES ('TUO-USER-ID', NULL, 'super_admin', true);
```

### Problema: Reindirizzato ad `/admin/dashboard` invece di super admin

**Causa**: Role non è `super_admin`

**Soluzione**:
```sql
-- Verifica role
SELECT role FROM admins WHERE user_id = 'TUO-USER-ID';

-- Se diverso, correggi:
UPDATE admins 
SET role = 'super_admin', tenant_id = NULL 
WHERE user_id = 'TUO-USER-ID';
```

### Problema: "row violates check constraint super_admin_no_tenant"

**Causa**: Stai cercando di creare un super_admin con tenant_id NON NULL

**Soluzione**:
```sql
-- Super admin DEVE avere tenant_id NULL
INSERT INTO admins (user_id, tenant_id, role, active)
VALUES ('TUO-USER-ID', NULL, 'super_admin', true);
--                      ^^^^ DEVE essere NULL
```

### Problema: Dashboard non carica statistiche

**Causa**: RLS policies non configurate

**Soluzione**:
1. Ri-esegui migration `20260401000002_add_super_admin.sql`
2. Verifica policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'tenants';
```

## 🚀 Prossimi Step

### Feature da Aggiungere (opzionali)

1. **Grafici Temporali**
   - Chart scans per giorno (ultimi 30 giorni)
   - Crescita clienti nel tempo

2. **Export Excel**
   - Report completo tutti i tenant
   - Dati per accounting

3. **Notifiche Email**
   - Alert automatici per anomalie
   - Report settimanale performance

4. **Gestione Billing**
   - Tracciare pagamenti tenant
   - Disattivare automaticamente al mancato pagamento

5. **Audit Log Dedicato**
   - Tabella `super_admin_actions`
   - Log tutte le modifiche

6. **Tenant Analytics Dettagliato**
   - Click su tenant → dashboard specifica con grafici
   - Drill-down su prodotti più venduti

## 📞 Supporto

Per problemi tecnici:
- 📧 Email: privacy@loyalcard.net
- 📖 Docs: `/docs/SUPER_ADMIN.md`
- 🐛 Issues: GitHub repository

---

**Creato**: 1 Aprile 2026  
**Versione**: 1.0.0  
**Autore**: LoyalCard Team
