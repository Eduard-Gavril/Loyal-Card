-- Fix RPC permissions and security
-- ============================================================================

-- Make sure the functions are accessible by anon users
ALTER FUNCTION calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) SECURITY DEFINER;
ALTER FUNCTION get_nearest_tenants(DECIMAL, DECIMAL, INTEGER) SECURITY DEFINER;

-- Grant execute permissions explicitly
GRANT EXECUTE ON FUNCTION calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_nearest_tenants(DECIMAL, DECIMAL, INTEGER) TO anon, authenticated;

-- Make sure tenants table is readable by anon
GRANT SELECT ON tenants TO anon, authenticated;
