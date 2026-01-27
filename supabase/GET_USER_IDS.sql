-- ============================================================================
-- COME OTTENERE GLI USER ID CORRETTI
-- ============================================================================

-- Vai su Supabase Dashboard → Authentication → Users
-- Clicca su ogni utente e COPIA IL FULL UUID (deve essere formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)

-- OPPURE esegui questa query per vedere tutti gli user ID:
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- DOPO AVER OTTENUTO GLI UUID CORRETTI, AGGIORNA QUI SOTTO:
-- ============================================================================

-- ESEMPIO DI UUID CORRETTO: 65713892-2780-4024-851f-18206f740310 (notare le 12 cifre alla fine)

-- Sostituisci questi con i tuoi UUID COMPLETI:
-- cafenescu@admin.test     → user_id: ________________________________________
-- activefit@admin.test     → user_id: f17bc99e-381a-4ce7-ba79-fd2136c29409
-- admin@fidelix.test       → user_id: ________________________________________

-- ============================================================================
