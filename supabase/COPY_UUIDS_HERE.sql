-- ============================================================================
-- COPIA GLI UUID DIRETTAMENTE DA QUESTA QUERY
-- ============================================================================

-- Esegui questa query e COPIA/INCOLLA gli UUID qui sotto:

SELECT 
  email,
  id as user_id,
  LENGTH(id::text) as lunghezza_uuid  -- deve essere 36
FROM auth.users
WHERE email IN ('cafenescu@admin.test', 'activefit@admin.test', 'admin@fidelix.test')
ORDER BY email;

-- ============================================================================
-- POI INCOLLA GLI UUID QUI (copia/incolla, NON scrivere manualmente):
-- ============================================================================

-- cafenescu@admin.test   → UUID: 
-- activefit@admin.test   → UUID: f17bc99e-381a-4ce7-ba79-fd2136c29409
-- admin@fidelix.test     → UUID: 

-- ============================================================================
