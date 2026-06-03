-- Create custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'department_supervisor', 'user');

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    supervisor_id UUID, -- This will be linked to users.id later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    role user_role DEFAULT 'user',
    department_id UUID REFERENCES departments(id),
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add circular reference for supervisor_id in departments
ALTER TABLE departments ADD CONSTRAINT fk_supervisor FOREIGN KEY (supervisor_id) REFERENCES users(id);

-- Create attendance_records table
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id),
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    attendance_time TIME WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIME,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    request_id TEXT,
    device_fingerprint TEXT,
    wifi_network TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create wifi_configurations table
CREATE TABLE wifi_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE UNIQUE, -- Added UNIQUE for upsert
    allowed_ssid TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Forms Table
CREATE TABLE attendance_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Records Update
ALTER TABLE attendance_records ADD COLUMN form_id UUID REFERENCES attendance_forms(id);
ALTER TABLE attendance_records ADD COLUMN full_name TEXT;
ALTER TABLE attendance_records ADD COLUMN email TEXT;
ALTER TABLE attendance_records ADD COLUMN phone_number TEXT;
ALTER TABLE attendance_records ADD COLUMN role TEXT;

-- RLS for Attendance Forms
ALTER TABLE attendance_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors can manage their own forms" ON attendance_forms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_user_id = auth.uid()::text 
            AND (role IN ('super_admin', 'department_supervisor'))
        )
    );

CREATE POLICY "Anyone can read active forms" ON attendance_forms
    FOR SELECT USING (is_active = true);

-- Audit Logs update
ALTER TABLE audit_logs ADD COLUMN role TEXT;


-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_id TEXT,
    action TEXT NOT NULL,
    endpoint TEXT,
    ip_address TEXT,
    status INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wifi_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users Policies
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Super admins can do everything on users" ON users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE clerk_user_id = auth.uid()::text AND role = 'super_admin')
    );

CREATE POLICY "Super admins can do everything on departments" ON departments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE clerk_user_id = auth.uid()::text AND role = 'super_admin')
    );

CREATE POLICY "Super admins can do everything on attendance_records" ON attendance_records
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE clerk_user_id = auth.uid()::text AND role = 'super_admin')
    );

CREATE POLICY "Super admins can do everything on wifi_configurations" ON wifi_configurations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE clerk_user_id = auth.uid()::text AND role = 'super_admin')
    );

CREATE POLICY "Super admins can do everything on audit_logs" ON audit_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE clerk_user_id = auth.uid()::text AND role = 'super_admin')
    );

-- Department Supervisor Policies
CREATE POLICY "Supervisors can read their department records" ON attendance_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE clerk_user_id = auth.uid()::text 
            AND role = 'department_supervisor' 
            AND department_id = attendance_records.department_id
        )
    );

CREATE POLICY "Supervisors can read their department users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS u
            WHERE u.clerk_user_id = auth.uid()::text 
            AND u.role = 'department_supervisor' 
            AND u.department_id = users.department_id
        )
    );

-- Attendance Records Policies
CREATE POLICY "Users can read own attendance" ON attendance_records
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE clerk_user_id = auth.uid()::text AND id = attendance_records.user_id)
    );

CREATE POLICY "Users can create attendance" ON attendance_records
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE clerk_user_id = auth.uid()::text AND id = user_id)
    );

-- Views for Analytics
CREATE OR REPLACE VIEW daily_attendance_stats AS
SELECT 
    attendance_date,
    department_id,
    COUNT(*) as total_attendance
FROM attendance_records
GROUP BY attendance_date, department_id;

CREATE OR REPLACE VIEW department_performance AS
SELECT 
    d.name as department_name,
    COUNT(ar.id) as total_records,
    COUNT(DISTINCT ar.user_id) as unique_users
FROM departments d
LEFT JOIN attendance_records ar ON d.id = ar.department_id
GROUP BY d.id, d.name;

-- Triggers for Audit Logging
CREATE OR REPLACE FUNCTION log_attendance_change() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, endpoint, status)
    VALUES (NEW.user_id, 'ATTENDANCE_SUBMITTED', '/attendance', 200);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_audit_trigger
AFTER INSERT ON attendance_records
FOR EACH ROW EXECUTE FUNCTION log_attendance_change();
