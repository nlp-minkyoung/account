-- 스마트 가계부 데이터베이스 스키마

-- 자산 테이블
CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'stock', 'real_estate', 'debt')),
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  quantity INTEGER DEFAULT NULL, -- 주식용
  purchase_price DECIMAL(15,2) DEFAULT NULL, -- 주식용 평균매입가
  current_price DECIMAL(15,2) DEFAULT NULL, -- 주식용 현재가
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 월별 데이터 테이블
CREATE TABLE monthly_data (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  net_worth DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- 수입 테이블
CREATE TABLE income (
  id SERIAL PRIMARY KEY,
  monthly_data_id INTEGER REFERENCES monthly_data(id) ON DELETE CASCADE,
  person VARCHAR(20) NOT NULL CHECK (person IN ('husband', 'wife')),
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 저축 테이블
CREATE TABLE savings (
  id SERIAL PRIMARY KEY,
  monthly_data_id INTEGER REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 고정지출 테이블
CREATE TABLE fixed_expenses (
  id SERIAL PRIMARY KEY,
  monthly_data_id INTEGER REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 변동지출 카테고리 테이블 (사용자 정의)
CREATE TABLE variable_expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 변동지출 테이블
CREATE TABLE variable_expenses (
  id SERIAL PRIMARY KEY,
  monthly_data_id INTEGER REFERENCES monthly_data(id) ON DELETE CASCADE,
  category_name VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 주식 거래 테이블
CREATE TABLE stock_transactions (
  id SERIAL PRIMARY KEY,
  monthly_data_id INTEGER REFERENCES monthly_data(id) ON DELETE CASCADE,
  stock_name VARCHAR(100) NOT NULL,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  quantity INTEGER NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 부채 상환 테이블
CREATE TABLE debt_payments (
  id SERIAL PRIMARY KEY,
  monthly_data_id INTEGER REFERENCES monthly_data(id) ON DELETE CASCADE,
  debt_name VARCHAR(100) NOT NULL,
  payment_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 월별 자산 스냅샷 테이블
CREATE TABLE monthly_asset_snapshots (
  id SERIAL PRIMARY KEY,
  monthly_data_id INTEGER REFERENCES monthly_data(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'stock', 'real_estate', 'debt')),
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  quantity INTEGER DEFAULT NULL, -- 주식용
  purchase_price DECIMAL(15,2) DEFAULT NULL, -- 주식용 평균매입가
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_monthly_data_year_month ON monthly_data(year, month);
CREATE INDEX idx_income_monthly_data ON income(monthly_data_id);
CREATE INDEX idx_savings_monthly_data ON savings(monthly_data_id);
CREATE INDEX idx_fixed_expenses_monthly_data ON fixed_expenses(monthly_data_id);
CREATE INDEX idx_variable_expenses_monthly_data ON variable_expenses(monthly_data_id);
CREATE INDEX idx_variable_expenses_category ON variable_expenses(category_name);
CREATE INDEX idx_stock_transactions_monthly_data ON stock_transactions(monthly_data_id);
CREATE INDEX idx_debt_payments_monthly_data ON debt_payments(monthly_data_id);
CREATE INDEX idx_monthly_asset_snapshots_monthly_data ON monthly_asset_snapshots(monthly_data_id);
CREATE INDEX idx_monthly_asset_snapshots_type ON monthly_asset_snapshots(type);