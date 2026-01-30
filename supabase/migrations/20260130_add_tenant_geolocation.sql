-- Add geolocation support to tenants table
-- ============================================================================

-- Add latitude and longitude columns to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_tenants_coordinates ON tenants(latitude, longitude);

-- ============================================================================
-- Insert demo tenants with geolocation
-- ============================================================================

-- Clear existing demo tenant if exists
DELETE FROM tenants WHERE slug IN ('cafenescu', 'fitgym', 'nailbeauty');

-- 1. Caffetteria Cafenescu
INSERT INTO tenants (
  id,
  name,
  slug,
  latitude,
  longitude,
  address,
  city,
  postal_code,
  brand_color,
  active,
  metadata
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Cafenescu',
  'cafenescu',
  47.210927,
  27.021727,
  'Strada Principală 123',
  'Iași',
  '700001',
  '#8B5CF6',
  true,
  '{"type": "cafe", "description": "La tua caffetteria di fiducia"}'::jsonb
);

-- 2. Palestra FitGym
INSERT INTO tenants (
  id,
  name,
  slug,
  latitude,
  longitude,
  address,
  city,
  postal_code,
  brand_color,
  active,
  metadata
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'FitGym',
  'fitgym',
  47.202549,
  27.010652,
  'Bulevardul Sport 45',
  'Iași',
  '700002',
  '#10B981',
  true,
  '{"type": "gym", "description": "Fitness e benessere per tutti"}'::jsonb
);

-- 3. Nail Beauty Salon
INSERT INTO tenants (
  id,
  name,
  slug,
  latitude,
  longitude,
  address,
  city,
  postal_code,
  brand_color,
  active,
  metadata
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Nail Beauty',
  'nailbeauty',
  47.210745,
  27.008821,
  'Strada Frumuseții 78',
  'Iași',
  '700003',
  '#EC4899',
  true,
  '{"type": "beauty", "description": "Salone di bellezza per unghie e cura della persona"}'::jsonb
);

-- ============================================================================
-- Function to calculate distance between two coordinates (Haversine formula)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- Earth radius in kilometers
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Function to get nearest tenants
-- ============================================================================

CREATE OR REPLACE FUNCTION get_nearest_tenants(
  user_lat DECIMAL,
  user_lon DECIMAL,
  max_results INTEGER DEFAULT 5
) RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  address TEXT,
  city VARCHAR,
  postal_code VARCHAR,
  brand_color VARCHAR,
  logo_url TEXT,
  metadata JSONB,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.latitude,
    t.longitude,
    t.address,
    t.city,
    t.postal_code,
    t.brand_color,
    t.logo_url,
    t.metadata,
    calculate_distance(user_lat, user_lon, t.latitude, t.longitude) as distance_km
  FROM tenants t
  WHERE 
    t.active = true
    AND t.latitude IS NOT NULL 
    AND t.longitude IS NOT NULL
  ORDER BY distance_km ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION calculate_distance TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_nearest_tenants TO anon, authenticated;
