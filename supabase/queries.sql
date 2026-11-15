-- ============================================================================
-- COLLEGE PROJECT COMPONENT LENDING & TRACKING SYSTEM
-- Standard and Advanced DBMS Queries for Project Viva & Evaluation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BASIC QUERIES (SELECT, FILTERING, SORTING)
-- ----------------------------------------------------------------------------

-- 1.1 List all active components sorted by available quantity descending
SELECT 
    component_name, 
    category, 
    total_quantity, 
    available_quantity, 
    storage_location
FROM components
WHERE is_active = TRUE
ORDER BY available_quantity DESC;

-- 1.2 Identify low-stock components (available stock <= 5 units)
SELECT 
    component_name, 
    category, 
    available_quantity, 
    total_quantity
FROM components
WHERE available_quantity <= 5 AND is_active = TRUE
ORDER BY available_quantity ASC;

-- ----------------------------------------------------------------------------
-- 2. RELATIONAL JOIN QUERIES (2 to 5 TABLES)
-- ----------------------------------------------------------------------------

-- 2.1 Complete Lending Record with Student, Project, Component, and Admin details (5-table JOIN)
SELECT 
    l.lending_id,
    l.request_group_id,
    s.student_name,
    s.usn,
    d.department_name,
    p.project_name,
    c.component_name,
    l.quantity AS quantity_borrowed,
    l.issue_date,
    l.due_date,
    l.status,
    COALESCE(a.admin_name, 'Pending Assignment') AS issued_by_admin
FROM lending l
JOIN students s ON l.student_id = s.student_id
JOIN departments d ON s.department_id = d.department_id
JOIN projects p ON l.project_id = p.project_id
JOIN components c ON l.component_id = c.component_id
LEFT JOIN lab_admins a ON l.admin_id = a.admin_id
ORDER BY l.request_date DESC;

-- 2.2 Return transactions with fine details, student, and component (4-table JOIN)
SELECT 
    r.return_id,
    r.return_date,
    s.student_name,
    s.usn,
    c.component_name,
    r.quantity_returned,
    r.condition_on_return,
    r.fine_amount,
    la.admin_name AS received_by
FROM returns r
JOIN lending l ON r.lending_id = l.lending_id
JOIN students s ON l.student_id = s.student_id
JOIN components c ON l.component_id = c.component_id
JOIN lab_admins la ON r.recorded_by = la.admin_id
ORDER BY r.return_date DESC;

-- ----------------------------------------------------------------------------
-- 3. AGGREGATE FUNCTIONS & GROUP BY / HAVING
-- ----------------------------------------------------------------------------

-- 3.1 Total and Available quantities grouped by component category
SELECT 
    category,
    COUNT(component_id) AS total_item_types,
    SUM(total_quantity) AS total_units,
    SUM(available_quantity) AS available_units,
    SUM(total_quantity - available_quantity) AS currently_circulating_units
FROM components
GROUP BY category
ORDER BY total_units DESC;

-- 3.2 Students with more than 1 active or issued component borrowing (HAVING clause)
SELECT 
    s.student_id,
    s.student_name,
    s.usn,
    COUNT(l.lending_id) AS total_issued_lendings,
    SUM(l.quantity) AS total_components_held
FROM students s
JOIN lending l ON s.student_id = l.student_id
WHERE l.status IN ('Issued', 'Partially Returned')
GROUP BY s.student_id, s.student_name, s.usn
HAVING COUNT(l.lending_id) >= 1
ORDER BY total_components_held DESC;

-- 3.3 Total fines accumulated and paid per department
SELECT 
    d.department_name,
    COUNT(r.return_id) AS total_returns_recorded,
    SUM(r.fine_amount) AS total_fines_levied
FROM departments d
JOIN students s ON d.department_id = s.department_id
JOIN lending l ON s.student_id = l.student_id
JOIN returns r ON l.lending_id = r.lending_id
GROUP BY d.department_name
ORDER BY total_fines_levied DESC;

-- ----------------------------------------------------------------------------
-- 4. NESTED SUBQUERIES (SUB-SELECT, IN, EXISTS, NOT EXISTS)
-- ----------------------------------------------------------------------------

-- 4.1 Find all students who have at least one OVERDUE borrowing currently
SELECT 
    student_name, 
    usn, 
    email, 
    phone
FROM students
WHERE student_id IN (
    SELECT student_id 
    FROM lending 
    WHERE status IN ('Issued', 'Partially Returned') 
      AND due_date < NOW()
);

-- 4.2 Find components that have NEVER been borrowed (NOT EXISTS)
SELECT 
    c.component_id, 
    c.component_name, 
    c.category, 
    c.total_quantity
FROM components c
WHERE NOT EXISTS (
    SELECT 1 
    FROM lending l 
    WHERE l.component_id = c.component_id
);

-- 4.3 Find projects that have borrowed more than the average number of components
SELECT 
    p.project_name,
    s.student_name,
    SUM(l.quantity) AS project_components_total
FROM projects p
JOIN students s ON p.student_id = s.student_id
JOIN lending l ON p.project_id = l.project_id
GROUP BY p.project_id, p.project_name, s.student_name
HAVING SUM(l.quantity) > (
    SELECT AVG(total_qty)
    FROM (
        SELECT SUM(quantity) AS total_qty
        FROM lending
        GROUP BY project_id
    ) AS project_averages
);

-- ----------------------------------------------------------------------------
-- 5. ADVANCED ANALYTICAL / OPERATIONAL QUERIES
-- ----------------------------------------------------------------------------

-- 5.1 Real-time Overdue Report with live fine calculation at ₹5/day
SELECT 
    l.lending_id,
    s.student_name,
    s.usn,
    s.phone,
    c.component_name,
    l.quantity - COALESCE(ret.returned_sum, 0) AS unreturned_quantity,
    l.due_date,
    DATE_PART('day', NOW() - l.due_date)::INTEGER AS overdue_days,
    ROUND(DATE_PART('day', NOW() - l.due_date)::NUMERIC * (l.quantity - COALESCE(ret.returned_sum, 0)) * 5.0, 2) AS estimated_current_fine
FROM lending l
JOIN students s ON l.student_id = s.student_id
JOIN components c ON l.component_id = c.component_id
LEFT JOIN (
    SELECT lending_id, SUM(quantity_returned) AS returned_sum 
    FROM returns 
    GROUP BY lending_id
) ret ON l.lending_id = ret.lending_id
WHERE l.status IN ('Issued', 'Partially Returned')
  AND l.due_date < NOW()
ORDER BY overdue_days DESC;

-- 5.2 Most frequently borrowed components (Top 5 Leaderboard)
SELECT 
    c.component_name,
    c.category,
    COUNT(l.lending_id) AS borrow_request_count,
    COALESCE(SUM(l.quantity), 0) AS total_units_borrowed
FROM components c
JOIN lending l ON c.component_id = l.component_id
WHERE l.status IN ('Approved', 'Issued', 'Partially Returned', 'Returned')
GROUP BY c.component_id, c.component_name, c.category
ORDER BY total_units_borrowed DESC
LIMIT 5;

-- 5.3 Component health / damage loss audit
SELECT 
    c.component_name,
    c.category,
    c.total_quantity AS current_working_inventory,
    COALESCE(SUM(CASE WHEN r.condition_on_return = 'Damaged' THEN r.quantity_returned ELSE 0 END), 0) AS damaged_count,
    COALESCE(SUM(CASE WHEN r.condition_on_return = 'Lost' THEN r.quantity_returned ELSE 0 END), 0) AS lost_count
FROM components c
LEFT JOIN lending l ON c.component_id = l.component_id
LEFT JOIN returns r ON l.lending_id = r.lending_id
GROUP BY c.component_id, c.component_name, c.category, c.total_quantity
ORDER BY damaged_count DESC, lost_count DESC;

