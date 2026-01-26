# ⚡ Quick Setup - Fidelix

## 🚀 Setup Rapido (5 minuti)

### 1. Crea Progetto Supabase

1. Vai su https://supabase.com
2. Clicca "New Project"
3. Scegli nome e password
4. Aspetta che il progetto sia pronto (~2 min)

### 2. Ottieni Credenziali

Nel dashboard Supabase:
- Vai su **Settings** → **API**
- Copia **Project URL**
- Copia **anon/public key**

### 3. Configura Database

1. Nel dashboard → **SQL Editor**
2. Apri il file `supabase/migrations/20260126_initial_schema.sql`
3. Copia TUTTO il contenuto
4. Incolla nel SQL Editor
5. Clicca **Run**

✅ Attendi conferma "Success"

### 4. (Opzionale) Dati Demo

Ripeti lo stesso processo con `supabase/seed.sql` per avere:
- Tenant demo "Demo Coffee Shop"
- Prodotti (Espresso, Cappuccino, ecc.)
- Regole loyalty (5+1)
- 2 clienti di test

### 5. Configura Frontend

Modifica `frontend/.env`:

```bash
VITE_SUPABASE_URL=https://[TUO_PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=[TUA_ANON_KEY]
```

### 6. Avvia Frontend

```bash
cd frontend
npm run dev
```

Apri http://localhost:3000

---

## ✅ Test Funzionamento

### Test Cliente (senza login)

1. Apri http://localhost:3000
2. Dovresti vedere:
   - QR code personale
   - Sezione "I tuoi premi" (vuota inizialmente)
   - Pulsanti "Add to Wallet"

### Test Admin

1. Prima crea un utente admin:
   - Supabase Dashboard → **Authentication** → **Users**
   - Clicca "Add user"
   - Email: `admin@test.com`, Password: `password123`
   - Copia lo **User ID**

2. Collega l'utente al tenant demo:
   - SQL Editor → esegui:
   ```sql
   INSERT INTO admins (tenant_id, user_id, role)
   VALUES (
     '11111111-1111-1111-1111-111111111111',
     '[USER_ID_COPIATO]',
     'owner'
   );
   ```

3. Test login:
   - Vai su http://localhost:3000/admin/login
   - Login: `admin@test.com` / `password123`
   - Dovresti vedere la dashboard

### Test Scan

1. Apri 2 browser/tab:
   - Tab 1: Cliente (http://localhost:3000)
   - Tab 2: Admin dashboard

2. In Admin:
   - Clicca "Scansiona QR Code"
   - Permetti accesso camera
   - Punta al QR della tab cliente (o inserisci manualmente il codice)

3. Seleziona prodotto (es. "Espresso")
4. Conferma
5. Torna alla tab cliente → dovresti vedere il contatore aggiornato!

---

## 🐛 Problemi Comuni

### "Missing Supabase environment variables"
→ Controlla che `.env` sia nella cartella `frontend/` (non nella root)

### "Invalid API key"
→ Verifica di aver copiato la **anon key** (non la service_role key)

### Admin login non funziona
→ Controlla di aver inserito l'admin nella tabella `admins` con il comando SQL

### Pagina bianca
→ Apri Console browser (F12) e guarda gli errori

---

## 📖 Documentazione Completa

- Setup dettagliato: `docs/SETUP.md`
- Architettura: `docs/ARCHITECTURE.md`
- API: `docs/API.md`
- Roadmap: `docs/ROADMAP.md`

---

**Pronto!** 🎉 Ora hai Fidelix funzionante in locale.
