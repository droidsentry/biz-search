-- api_global_limits テーブルのシードデータ
INSERT INTO api_global_limits (api_name, daily_limit, monthly_limit, updated_at) VALUES
  ('google_custom_search', 100, 10000, NOW()),
  ('pdf_parsing', 50, 1000, NOW()),
  ('google_maps_geocoding', 200, 5000, NOW())
ON CONFLICT (api_name) DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  monthly_limit = EXCLUDED.monthly_limit,
  updated_at = NOW();