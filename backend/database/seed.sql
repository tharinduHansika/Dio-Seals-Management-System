-- ============================================
-- DIO SEALS SEED DATA
-- ============================================

-- Insert admin user
-- Password: admin123
INSERT INTO users (username, password_hash, full_name, email, phone, role_id) 
VALUES (
  'admin',
  '$2a$10$YQ3b6Bz8ZBEqWxFJFJc0l.nk5KDxHxIxHxIxHxIxHxIxHxIxHxIxI',
  'System Administrator',
  'admin@dioseals.lk',
  '0771234567',
  1
) ON CONFLICT (username) DO NOTHING;

-- Insert marketing manager
-- Password: manager123
INSERT INTO users (username, password_hash, full_name, email, phone, role_id, created_by) 
VALUES (
  'manager',
  '$2a$10$YQ3b6Bz8ZBEqWxFJFJc0l.nk5KDxHxIxHxIxHxIxHxIxHxIxHxIxI',
  'Marketing Manager',
  'manager@dioseals.lk',
  '0771234568',
  3,
  1
) ON CONFLICT (username) DO NOTHING;

-- Insert test customers
INSERT INTO customers (company_name, email, phone, address, city, country, created_by)
VALUES 
  ('ABC Corporation', 'abc@company.lk', '0771111111', '123 Main St, Colombo 03', 'Colombo', 'Sri Lanka', 1),
  ('XYZ Enterprises', 'xyz@company.lk', '0772222222', '456 King St, Kandy', 'Kandy', 'Sri Lanka', 1),
  ('LMN Industries', 'lmn@company.lk', '0773333333', '789 Queen St, Galle', 'Galle', 'Sri Lanka', 1)
ON CONFLICT DO NOTHING;

-- Insert test products
INSERT INTO products (product_name, description, category, unit_price, minimum_threshold, created_by)
VALUES 
  ('Security Seal Type A', 'High security tamper-evident seal', 'Standard', 50.00, 1000, 1),
  ('Security Seal Type B', 'Medium security seal with barcode', 'Standard', 35.00, 1500, 1),
  ('Security Seal Type C', 'Premium seal with QR code', 'Premium', 75.00, 500, 1),
  ('Cable Seal Heavy Duty', 'Industrial cable seal', 'Heavy Duty', 120.00, 300, 1)
ON CONFLICT DO NOTHING;

-- Create stock for all products
INSERT INTO stock (product_id, available_qty)
SELECT product_id, 5000 FROM products
WHERE NOT EXISTS (SELECT 1 FROM stock WHERE stock.product_id = products.product_id);

-- Update specific stock quantities
UPDATE stock SET available_qty = 10000 WHERE product_id = 1;
UPDATE stock SET available_qty = 8000 WHERE product_id = 2;
UPDATE stock SET available_qty = 3000 WHERE product_id = 3;
UPDATE stock SET available_qty = 2000 WHERE product_id = 4;

-- Success message
SELECT 'Test data inserted successfully!' as message;
SELECT 'You can now login with:' as info;
SELECT '  Username: admin' as credentials_1;
SELECT '  Password: admin123' as credentials_2;