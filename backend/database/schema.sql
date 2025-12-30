-- ============================================
-- DIO SEALS DATABASE SCHEMA
-- ============================================

-- ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (role_name, description, permissions) VALUES
('Admin', 'System Administrator', '{"all": true}'),
('Director', 'Company Director', '{"orders": true, "reports": true, "override": true}'),
('Marketing Manager', 'Marketing Manager', '{"quotations": true, "orders": true}'),
('Store Keeper', 'Store Keeper', '{"stock": true, "grn": true}'),
('Printing Operator', 'Printing Operator', '{"printing": true}'),
('Cashier', 'Cashier', '{"payments": true, "receipts": true}'),
('Accountant', 'Accountant', '{"expenses": true, "assets": true, "reports": true}')
ON CONFLICT (role_name) DO NOTHING;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(role_id),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    created_by INT REFERENCES users(user_id)
);

-- CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    vat_no VARCHAR(50),
    account_no VARCHAR(50),
    billing_contact VARCHAR(100),
    accounting_contact VARCHAR(100),
    delivery_contact VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Sri Lanka',
    status VARCHAR(20) DEFAULT 'active',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(user_id)
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    carton_number VARCHAR(50),
    batch_number VARCHAR(50),
    minimum_threshold INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(user_id)
);

-- STOCK TABLE
CREATE TABLE IF NOT EXISTS stock (
    stock_id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(product_id) UNIQUE,
    available_qty INT DEFAULT 0,
    reserved_qty INT DEFAULT 0,
    sold_qty INT DEFAULT 0,
    damaged_qty INT DEFAULT 0,
    sample_qty INT DEFAULT 0,
    grn_qty INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS quotations (
    quotation_id SERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT REFERENCES customers(customer_id),
    created_by INT REFERENCES users(user_id),
    quotation_date DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    total_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QUOTATION ITEMS TABLE
CREATE TABLE IF NOT EXISTS quotation_items (
    quotation_item_id SERIAL PRIMARY KEY,
    quotation_id INT REFERENCES quotations(quotation_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT REFERENCES customers(customer_id),
    quotation_id INT REFERENCES quotations(quotation_id),
    created_by INT REFERENCES users(user_id),
    order_date DATE DEFAULT CURRENT_DATE,
    completion_date DATE,
    total_amount DECIMAL(12,2) DEFAULT 0,
    order_status VARCHAR(30) DEFAULT 'created',
    payment_status VARCHAR(20) DEFAULT 'pending',
    cancellation_reason TEXT,
    cancelled_date TIMESTAMP,
    cancelled_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    serial_start VARCHAR(50) NOT NULL,
    serial_end VARCHAR(50) NOT NULL,
    printing_type VARCHAR(30),
    item_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SERIAL NUMBERS TABLE
CREATE TABLE IF NOT EXISTS serial_numbers (
    serial_id SERIAL PRIMARY KEY,
    order_item_id INT REFERENCES order_items(order_item_id),
    product_id INT REFERENCES products(product_id),
    customer_id INT REFERENCES customers(customer_id),
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'assigned',
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    printed_date TIMESTAMP,
    is_damaged BOOLEAN DEFAULT FALSE,
    is_reusable BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_serial_number ON serial_numbers(serial_number);
CREATE INDEX IF NOT EXISTS idx_customer_serial ON serial_numbers(customer_id, serial_number);

-- PRINTING JOBS TABLE
CREATE TABLE IF NOT EXISTS printing_jobs (
    job_id SERIAL PRIMARY KEY,
    job_number VARCHAR(50) UNIQUE NOT NULL,
    order_id INT REFERENCES orders(order_id),
    assigned_to INT REFERENCES users(user_id),
    job_status VARCHAR(20) DEFAULT 'new',
    started_date TIMESTAMP,
    completed_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id INT REFERENCES orders(order_id),
    customer_id INT REFERENCES customers(customer_id),
    invoice_type VARCHAR(20),
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    invoice_status VARCHAR(20) DEFAULT 'pending',
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INT REFERENCES invoices(invoice_id),
    order_id INT REFERENCES orders(order_id),
    payment_date DATE DEFAULT CURRENT_DATE,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(30),
    reference_no VARCHAR(100),
    received_by INT REFERENCES users(user_id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GRN TABLE
CREATE TABLE IF NOT EXISTS grn (
    grn_id SERIAL PRIMARY KEY,
    grn_number VARCHAR(50) UNIQUE NOT NULL,
    product_id INT REFERENCES products(product_id),
    quantity INT NOT NULL,
    supplier_name VARCHAR(200),
    received_date DATE DEFAULT CURRENT_DATE,
    received_by INT REFERENCES users(user_id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DAMAGES TABLE
CREATE TABLE IF NOT EXISTS damages (
    damage_id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(product_id),
    order_id INT REFERENCES orders(order_id),
    quantity INT NOT NULL,
    reason TEXT,
    damage_date DATE DEFAULT CURRENT_DATE,
    recorded_by INT REFERENCES users(user_id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SAMPLES TABLE
CREATE TABLE IF NOT EXISTS samples (
    sample_id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(product_id),
    quantity INT NOT NULL,
    purpose TEXT,
    sample_date DATE DEFAULT CURRENT_DATE,
    recorded_by INT REFERENCES users(user_id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    expense_id SERIAL PRIMARY KEY,
    category VARCHAR(50),
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(30),
    recorded_by INT REFERENCES users(user_id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ASSETS TABLE
CREATE TABLE IF NOT EXISTS assets (
    asset_id SERIAL PRIMARY KEY,
    asset_name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    purchase_date DATE,
    purchase_amount DECIMAL(12,2),
    supplier VARCHAR(200),
    warranty_date DATE,
    depreciation_rate DECIMAL(5,2),
    current_value DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Success message
SELECT 'Database schema created successfully!' as message;