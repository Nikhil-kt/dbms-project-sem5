-- ============================================================================
-- COLLEGE PROJECT COMPONENT LENDING & TRACKING SYSTEM
-- Database Schema (PostgreSQL for Supabase)
-- Exactly Seven Application Tables
-- ============================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop for idempotency in migrations (if re-running)
-- DROP TABLE IF EXISTS returns CASCADE;
-- DROP TABLE IF EXISTS lending CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP TABLE IF EXISTS components CASCADE;
-- DROP TABLE IF EXISTS lab_admins CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;
-- DROP TABLE IF EXISTS departments CASCADE;

-- ============================================================================
-- TABLE 1: departments
-- Stores college department information
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_code VARCHAR(20) UNIQUE,
    hod_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 2: students
-- Stores student profile information linked to auth.users
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    usn VARCHAR(30) NOT NULL UNIQUE,
    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(15),
    department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    semester INTEGER CHECK (semester >= 1 AND semester <= 8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 3: lab_admins
-- Stores laboratory administrator profiles linked to auth.users
-- ============================================================================
CREATE TABLE IF NOT EXISTS lab_admins (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    lab_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 4: components
-- Stores electronic component inventory
-- ============================================================================
CREATE TABLE IF NOT EXISTS components (
    component_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0 AND available_quantity <= total_quantity),
    component_condition VARCHAR(30) DEFAULT 'Good' CHECK (component_condition IN ('New', 'Good', 'Fair', 'Damaged', 'Under Maintenance')),
    storage_location VARCHAR(100),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 5: projects
-- Stores student academic project information
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(150) NOT NULL,
    project_description TEXT,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    project_status VARCHAR(30) DEFAULT 'Planning' CHECK (project_status IN ('Planning', 'Ongoing', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 6: lending
-- Stores all component lending transactions
-- Status values: Pending, Approved, Rejected, Issued, Partially Returned, Returned
-- ============================================================================
CREATE TABLE IF NOT EXISTS lending (
    lending_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_group_id UUID NOT NULL,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE RESTRICT,
    component_id UUID NOT NULL REFERENCES components(component_id) ON DELETE RESTRICT,
    admin_id UUID REFERENCES lab_admins(admin_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    request_date TIMESTAMPTZ DEFAULT NOW(),
    issue_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Issued', 'Partially Returned', 'Returned')),
    admin_remarks TEXT
);

-- ============================================================================
-- TABLE 7: returns
-- Stores component return transactions (supports partial returns)
-- ============================================================================
CREATE TABLE IF NOT EXISTS returns (
    return_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lending_id UUID NOT NULL REFERENCES lending(lending_id) ON DELETE RESTRICT,
    return_date TIMESTAMPTZ DEFAULT NOW(),
    quantity_returned INTEGER NOT NULL CHECK (quantity_returned > 0),
    condition_on_return VARCHAR(30) NOT NULL CHECK (condition_on_return IN ('Good', 'Damaged', 'Lost')),
    fine_amount NUMERIC(10,2) DEFAULT 0 CHECK (fine_amount >= 0),
    remarks TEXT,
    recorded_by UUID NOT NULL REFERENCES lab_admins(admin_id) ON DELETE RESTRICT
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_students_department_id ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_usn ON students(usn);
CREATE INDEX IF NOT EXISTS idx_lab_admins_auth_user_id ON lab_admins(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
CREATE INDEX IF NOT EXISTS idx_components_is_active ON components(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_student_id ON projects(student_id);
CREATE INDEX IF NOT EXISTS idx_lending_request_group_id ON lending(request_group_id);
CREATE INDEX IF NOT EXISTS idx_lending_student_id ON lending(student_id);
CREATE INDEX IF NOT EXISTS idx_lending_project_id ON lending(project_id);
CREATE INDEX IF NOT EXISTS idx_lending_component_id ON lending(component_id);
CREATE INDEX IF NOT EXISTS idx_lending_status ON lending(status);
CREATE INDEX IF NOT EXISTS idx_lending_due_date ON lending(due_date);
CREATE INDEX IF NOT EXISTS idx_returns_lending_id ON returns(lending_id);
CREATE INDEX IF NOT EXISTS idx_returns_recorded_by ON returns(recorded_by);

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function: calculate_fine
-- Computes fine based on overdue days, returned quantity, and daily rate (default 5.0)
CREATE OR REPLACE FUNCTION calculate_fine(
    p_due_date TIMESTAMPTZ,
    p_return_date TIMESTAMPTZ,
    p_quantity INTEGER,
    p_daily_rate NUMERIC DEFAULT 5.0
)
RETURNS NUMERIC AS $$
DECLARE
    v_overdue_days INTEGER := 0;
    v_fine NUMERIC := 0;
BEGIN
    IF p_return_date > p_due_date THEN
        -- Calculate calendar days overdue
        v_overdue_days := GREATEST(0, DATE_PART('day', p_return_date - p_due_date)::INTEGER);
        -- If return happened on a subsequent day (partial day count >= 1)
        IF v_overdue_days = 0 AND p_return_date::DATE > p_due_date::DATE THEN
            v_overdue_days := (p_return_date::DATE - p_due_date::DATE);
        END IF;
    END IF;

    v_fine := v_overdue_days * p_quantity * p_daily_rate;
    RETURN ROUND(v_fine, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: issue_component
-- Atomically validates available quantity, reduces stock, and marks lending record as Issued
CREATE OR REPLACE FUNCTION issue_component(
    p_lending_id UUID,
    p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_lending RECORD;
    v_available INTEGER;
    v_comp_id UUID;
BEGIN
    -- Select lending row with row-level lock
    SELECT * INTO v_lending
    FROM lending
    WHERE lending_id = p_lending_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lending record % not found', p_lending_id;
    END IF;

    IF v_lending.status <> 'Approved' THEN
        RAISE EXCEPTION 'Cannot issue component with status % (must be Approved)', v_lending.status;
    END IF;

    v_comp_id := v_lending.component_id;

    -- Lock and check component stock
    SELECT available_quantity INTO v_available
    FROM components
    WHERE component_id = v_comp_id
    FOR UPDATE;

    IF v_available < v_lending.quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Requested: %, Available: %', v_lending.quantity, v_available;
    END IF;

    -- Atomically decrement stock
    UPDATE components
    SET available_quantity = available_quantity - v_lending.quantity
    WHERE component_id = v_comp_id;

    -- Update lending record
    UPDATE lending
    SET status = 'Issued',
        issue_date = NOW(),
        admin_id = p_admin_id
    WHERE lending_id = p_lending_id;

    RETURN jsonb_build_object(
        'success', true,
        'lending_id', p_lending_id,
        'component_id', v_comp_id,
        'quantity_issued', v_lending.quantity,
        'remaining_stock', v_available - v_lending.quantity,
        'issue_date', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: return_component
-- Handles full/partial returns, calculates fine, restores stock for 'Good' condition, updates status
CREATE OR REPLACE FUNCTION return_component(
    p_lending_id UUID,
    p_admin_id UUID,
    p_quantity_returned INTEGER,
    p_condition_on_return VARCHAR(30),
    p_remarks TEXT DEFAULT NULL,
    p_daily_rate NUMERIC DEFAULT 5.0
)
RETURNS JSONB AS $$
DECLARE
    v_lending RECORD;
    v_total_returned INTEGER := 0;
    v_outstanding INTEGER;
    v_fine NUMERIC := 0;
    v_new_status VARCHAR(30);
    v_return_id UUID;
    v_return_time TIMESTAMPTZ := NOW();
BEGIN
    -- Verify condition value
    IF p_condition_on_return NOT IN ('Good', 'Damaged', 'Lost') THEN
        RAISE EXCEPTION 'Invalid return condition: %. Allowed values: Good, Damaged, Lost', p_condition_on_return;
    END IF;

    IF p_quantity_returned <= 0 THEN
        RAISE EXCEPTION 'Quantity returned must be greater than zero';
    END IF;

    -- Lock lending record
    SELECT * INTO v_lending
    FROM lending
    WHERE lending_id = p_lending_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lending record % not found', p_lending_id;
    END IF;

    IF v_lending.status NOT IN ('Issued', 'Partially Returned') THEN
        RAISE EXCEPTION 'Cannot return component for lending in % status', v_lending.status;
    END IF;

    -- Calculate total returned so far
    SELECT COALESCE(SUM(quantity_returned), 0) INTO v_total_returned
    FROM returns
    WHERE lending_id = p_lending_id;

    v_outstanding := v_lending.quantity - v_total_returned;

    IF p_quantity_returned > v_outstanding THEN
        RAISE EXCEPTION 'Cannot return % units. Outstanding quantity is only %', p_quantity_returned, v_outstanding;
    END IF;

    -- Calculate overdue fine
    v_fine := calculate_fine(v_lending.due_date, v_return_time, p_quantity_returned, p_daily_rate);

    -- Insert return record
    INSERT INTO returns (
        lending_id,
        return_date,
        quantity_returned,
        condition_on_return,
        fine_amount,
        remarks,
        recorded_by
    )
    VALUES (
        p_lending_id,
        v_return_time,
        p_quantity_returned,
        p_condition_on_return,
        v_fine,
        p_remarks,
        p_admin_id
    )
    RETURNING return_id INTO v_return_id;

    -- Restore stock ONLY if condition is 'Good'
    IF p_condition_on_return = 'Good' THEN
        UPDATE components
        SET available_quantity = available_quantity + p_quantity_returned
        WHERE component_id = v_lending.component_id;
    ELSIF p_condition_on_return IN ('Damaged', 'Lost') THEN
        -- Subtract permanently from total_quantity so broken/lost items are properly accounted
        UPDATE components
        SET total_quantity = GREATEST(0, total_quantity - p_quantity_returned)
        WHERE component_id = v_lending.component_id;
    END IF;

    -- Update lending status
    IF (v_total_returned + p_quantity_returned) >= v_lending.quantity THEN
        v_new_status := 'Returned';
    ELSE
        v_new_status := 'Partially Returned';
    END IF;

    UPDATE lending
    SET status = v_new_status
    WHERE lending_id = p_lending_id;

    RETURN jsonb_build_object(
        'success', true,
        'return_id', v_return_id,
        'lending_id', p_lending_id,
        'quantity_returned', p_quantity_returned,
        'condition', p_condition_on_return,
        'fine_amount', v_fine,
        'outstanding_remaining', v_outstanding - p_quantity_returned,
        'new_status', v_new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATABASE TRIGGERS
-- ============================================================================

-- Trigger 1: Inventory stock sanity check
CREATE OR REPLACE FUNCTION check_inventory_bounds()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.available_quantity < 0 THEN
        RAISE EXCEPTION 'Available quantity cannot be negative (attempted value: %)', NEW.available_quantity;
    END IF;
    IF NEW.available_quantity > NEW.total_quantity THEN
        RAISE EXCEPTION 'Available quantity (%) cannot exceed total quantity (%)', NEW.available_quantity, NEW.total_quantity;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_inventory ON components;
CREATE TRIGGER trg_validate_inventory
BEFORE INSERT OR UPDATE ON components
FOR EACH ROW
EXECUTE FUNCTION check_inventory_bounds();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lending ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM lab_admins
        WHERE auth_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_student_id()
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT student_id INTO v_id
    FROM students
    WHERE auth_user_id = auth.uid();
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. departments policies
CREATE POLICY "Public read departments"
    ON departments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin manage departments"
    ON departments FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- 2. students policies
CREATE POLICY "Students read own profile"
    ON students FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid() OR is_admin());

CREATE POLICY "Students update own profile"
    ON students FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Allow student registration"
    ON students FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id = auth.uid() OR is_admin());

-- 3. lab_admins policies
CREATE POLICY "Admins view lab_admins"
    ON lab_admins FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins manage lab_admins"
    ON lab_admins FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- 4. components policies
CREATE POLICY "Anyone authenticated view active components"
    ON components FOR SELECT
    TO authenticated
    USING (is_active = true OR is_admin());

CREATE POLICY "Admins manage components"
    ON components FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- 5. projects policies
CREATE POLICY "Students view own projects and Admins view all"
    ON projects FOR SELECT
    TO authenticated
    USING (student_id = current_student_id() OR is_admin());

CREATE POLICY "Students create own projects"
    ON projects FOR INSERT
    TO authenticated
    WITH CHECK (student_id = current_student_id());

CREATE POLICY "Students update own projects"
    ON projects FOR UPDATE
    TO authenticated
    USING (student_id = current_student_id() OR is_admin())
    WITH CHECK (student_id = current_student_id() OR is_admin());

CREATE POLICY "Students delete own projects"
    ON projects FOR DELETE
    TO authenticated
    USING (student_id = current_student_id() OR is_admin());

-- 6. lending policies
CREATE POLICY "Students view own lending records and Admins view all"
    ON lending FOR SELECT
    TO authenticated
    USING (student_id = current_student_id() OR is_admin());

CREATE POLICY "Students submit lending requests"
    ON lending FOR INSERT
    TO authenticated
    WITH CHECK (student_id = current_student_id() AND status = 'Pending');

CREATE POLICY "Admins manage lending"
    ON lending FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- 7. returns policies
CREATE POLICY "Students view returns for their lendings and Admins view all"
    ON returns FOR SELECT
    TO authenticated
    USING (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM lending l
            WHERE l.lending_id = returns.lending_id
            AND l.student_id = current_student_id()
        )
    );

CREATE POLICY "Admins insert returns"
    ON returns FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

