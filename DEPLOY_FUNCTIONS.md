# ============================================================================
# GUIDA: DEPLOY EDGE FUNCTIONS SU SUPABASE
# ============================================================================

# PREREQUISITO: Installare Supabase CLI
# Windows: scoop install supabase
# Mac: brew install supabase/tap/supabase
# O scarica da: https://github.com/supabase/cli/releases

# ============================================================================
# STEP 1: LOGIN A SUPABASE
# ============================================================================
supabase login

# ============================================================================
# STEP 2: LINK AL TUO PROGETTO
# ============================================================================
# Sostituisci con il tuo project ref (lo trovi in Settings → General)
supabase link --project-ref gthrrolmuoxhqsiziwjf

# ============================================================================
# STEP 3: DEPLOY DELLE EDGE FUNCTIONS
# ============================================================================

# Deploy tutte le functions
supabase functions deploy

# OPPURE deploy singole:
supabase functions deploy generate-client-id
supabase functions deploy register-scan

# ============================================================================
# VERIFICA CHE LE FUNCTIONS SIANO ATTIVE
# ============================================================================
# Vai su Supabase Dashboard → Edge Functions
# Dovresti vedere:
# - generate-client-id (Deployed)
# - register-scan (Deployed)

# ============================================================================
# DEBUG: VEDERE I LOGS DELLE FUNCTIONS
# ============================================================================
# Per vedere gli errori in tempo reale:
supabase functions serve register-scan --env-file .env.local

# Oppure online:
# Dashboard → Edge Functions → register-scan → Logs

# ============================================================================
# ALTERNATIVE SE NON HAI SUPABASE CLI
# ============================================================================
# Puoi deployare anche da GitHub:
# 1. Vai su Supabase Dashboard → Edge Functions
# 2. Click "Deploy from GitHub"
# 3. Connetti la repo fidelix
# 4. Le functions verranno auto-deployate

# ============================================================================
