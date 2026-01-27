-- ============================================================================
-- FIX: Add RLS policies for public card access and products visibility
-- ============================================================================

-- Policy 1: Allow public (anon/authenticated) to read cards by QR code
-- This is needed for the client card view
CREATE POLICY "public_read_cards_by_qr" ON cards
  FOR SELECT TO anon, authenticated
  USING (true);

-- Policy 2: Allow service_role full access to cards (for Edge Functions)
CREATE POLICY "service_role_manage_cards" ON cards
  FOR ALL TO service_role
  WITH CHECK (true);

-- Policy 3: Public can read products (for scanner product selection)
CREATE POLICY "public_read_products" ON products
  FOR SELECT TO anon, authenticated
  USING (active = true);

-- Policy 4: Public can read product categories
CREATE POLICY "public_read_categories" ON product_categories
  FOR SELECT TO anon, authenticated
  USING (active = true);

-- Verify all policies for cards
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename IN ('cards', 'products', 'product_categories')
ORDER BY tablename, policyname;
