# 🚀 Setup Supabase - Step by Step

## ✅ Credenziali Configurate

Le tue credenziali Supabase sono state configurate in:
- `frontend/.env` (solo anon key - SAFE per git)
- `.supabase.credentials` (tutte le credenziali - PROTECTED, già in .gitignore)

## 📝 Prossimi Step

### 1. Apri Supabase Dashboard

Vai su: https://gthrrolmuoxhqsiziwjf.supabase.co

### 2. Esegui Schema Database

1. Nel dashboard → **SQL Editor**
2. Clicca **"New Query"**
3. Copia TUTTO il contenuto di questo file:
   ```
   supabase/migrations/20260126_initial_schema.sql
   ```
4. Incolla nel SQL Editor
5. Clicca **"Run"** (o Ctrl+Enter)
6. ✅ Attendi conferma "Success"

### 3. (Opzionale) Carica Dati Demo

Ripeti lo stesso con:
```
supabase/seed.sql
```

Questo creerà:
- Tenant demo "Demo Coffee Shop"
- Prodotti (Espresso, Cappuccino, Cornetto, ecc.)
- Regole loyalty (5 espresso = 1 gratis, ecc.)
- 2 clienti di test con card

### 4. Crea Utente Admin

Nel dashboard:

**A. Crea utente in Supabase Auth**
1. **Authentication** → **Users** → **"Add user"**
2. Email: `admin@test.com`
3. Password: `password123` (o quella che preferisci)
4. ✅ **Conferma** e **copia lo User ID** (es: `abc123...`)

**B. Collega utente al tenant demo**
1. **SQL Editor** → New Query
2. Esegui:
```sql
INSERT INTO admins (tenant_id, user_id, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'INCOLLA-QUI-USER-ID',
  'owner'
);
```
3. **Run**

### 5. Verifica Frontend

Nel terminale (cartella `Fidelix/frontend`):

```powershell
npm run dev
```

Apri: http://localhost:3000

Dovresti vedere:
- ✅ Card cliente con QR code (NON più la pagina di setup)
- ✅ Sezione "I tuoi premi"
- ✅ Pulsanti Wallet

### 6. Test Admin Login

1. Vai su: http://localhost:3000/admin/login
2. Login:
   - Email: `admin@test.com`
   - Password: `password123`
3. ✅ Dovresti vedere la dashboard admin

### 7. Test Scan Completo

**Setup 2 finestre:**
- Finestra 1: Cliente (http://localhost:3000)
- Finestra 2: Admin (http://localhost:3000/admin/dashboard)

**In Admin:**
1. Clicca "Scansiona QR Code"
2. Permetti accesso camera
3. Punta al QR nella finestra Cliente (oppure inserisci manualmente il codice, es: `FIDELIX-DEMO-001`)
4. Seleziona prodotto: "Espresso"
5. Clicca "Conferma Acquisto"

**Risultato:**
- ✅ Admin: "Acquisto Registrato!"
- ✅ Cliente: Contatore aggiorna (1/5 per Espresso)
- ✅ Dopo 5 scan: "🎉 Premio Guadagnato!"

---

## 🔒 Sicurezza

✅ **File Protetti (NON committare):**
- `.env` files
- `.supabase.credentials`

⚠️ **Se hai già committato credenziali:**
```powershell
git rm --cached frontend/.env
git rm --cached .supabase.credentials
git commit -m "Remove sensitive files"
```

---

## 🐛 Troubleshooting

### Errore "Missing Supabase environment variables"
→ Riavvia il dev server: `Ctrl+C` poi `npm run dev`

### "Invalid API key"
→ Verifica che l'anon key in `.env` sia corretta

### RLS Error / Permission denied
→ Controlla che l'admin sia stato inserito nella tabella `admins`

### Tabelle non esistono
→ Verifica che lo schema SQL sia stato eseguito completamente

---

## 📚 Docs

- API completa: `docs/API.md`
- Architettura: `docs/ARCHITECTURE.md`
- Setup avanzato: `docs/SETUP.md`

---

**Pronto!** 🎉 Il tuo Fidelix è configurato e sicuro.
