-- ============================================================================
-- COLLEGE PROJECT COMPONENT LENDING & TRACKING SYSTEM
-- Seed Data for Development and Testing
-- ============================================================================

-- 1. Departments
INSERT INTO departments (department_id, department_name, department_code, hod_name)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Computer Science and Engineering', 'CSE', 'Dr. Rajesh Sharma'),
    ('22222222-2222-2222-2222-222222222222', 'Information Science and Engineering', 'ISE', 'Dr. Meena Iyer'),
    ('33333333-3333-3333-3333-333333333333', 'Electronics and Communication Engineering', 'ECE', 'Dr. Anand Kulkarni'),
    ('44444444-4444-4444-4444-444444444444', 'Electrical and Electronics Engineering', 'EEE', 'Dr. Sudha Murthy'),
    ('55555555-5555-5555-5555-555555555555', 'Mechanical Engineering', 'MECH', 'Dr. Vikram Patel')
ON CONFLICT (department_name) DO NOTHING;

-- 2. Components
INSERT INTO components (component_id, component_name, category, description, total_quantity, available_quantity, component_condition, storage_location, image_url, is_active)
VALUES
    ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Arduino Uno R3', 'Microcontroller', 'ATmega328P based microcontroller development board with 14 digital I/O pins.', 25, 20, 'Good', 'Cabinet A - Shelf 1', 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400&q=80', true),
    ('aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'Raspberry Pi 4 Model B (4GB)', 'Development Board', 'Quad-core 64-bit ARM Cortex-A72 processor, dual 4K display output, Gigabit Ethernet.', 10, 5, 'Good', 'Cabinet A - Shelf 2', 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400&q=80', true),
    ('aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'Ultrasonic Sensor HC-SR04', 'Sensor', 'Non-contact distance measurement module from 2cm to 400cm.', 35, 30, 'Good', 'Drawer B - Box 3', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80', true),
    ('aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa', 'Solderless Breadboard (830 Points)', 'Circuit Component', 'Standard full-size prototyping breadboard with adhesive back.', 50, 42, 'Good', 'Drawer C - Box 1', 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&q=80', true),
    ('aaaaaaaa-5555-5555-5555-aaaaaaaaaaaa', 'Assorted Resistor Kit (600 pcs)', 'Passive Component', '30 different resistor values from 10 ohm to 1M ohm, 1/4W metal film.', 60, 55, 'Good', 'Drawer C - Box 4', 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400&q=80', true),
    ('aaaaaaaa-6666-6666-6666-aaaaaaaaaaaa', '16x2 LCD Display with I2C', 'Display', '16 characters by 2 lines alphanumeric LCD module with PCF8574 backpack.', 20, 16, 'Good', 'Cabinet B - Shelf 1', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', true),
    ('aaaaaaaa-7777-7777-7777-aaaaaaaaaaaa', 'NodeMCU ESP8266 V3', 'Microcontroller', 'Open-source Lua/Arduino based WiFi development board with ESP-12E.', 18, 14, 'Good', 'Cabinet A - Shelf 3', 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=400&q=80', true),
    ('aaaaaaaa-8888-8888-8888-aaaaaaaaaaaa', 'DHT11 Temperature & Humidity Sensor', 'Sensor', 'Basic, ultra low-cost digital temperature and humidity sensor.', 30, 26, 'Good', 'Drawer B - Box 2', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&q=80', true),
    ('aaaaaaaa-9999-9999-9999-aaaaaaaaaaaa', 'Micro Servo Motor SG90 9g', 'Actuator', 'Tiny and lightweight 180 degree rotation nylon gear servo motor.', 25, 20, 'Good', 'Drawer D - Box 1', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80', true),
    ('aaaaaaaa-0000-0000-0000-aaaaaaaaaaaa', 'L298N Dual H-Bridge Motor Driver', 'Actuator', 'High power dual motor driver module for stepper and DC motors.', 15, 12, 'Good', 'Cabinet B - Shelf 2', 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400&q=80', true)
ON CONFLICT (component_id) DO NOTHING;

-- 3. Lab Admin Profile (Demo)
INSERT INTO lab_admins (admin_id, auth_user_id, admin_name, email, lab_name)
VALUES
    ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001', 'Prof. Ramesh Rao', 'admin@college.edu', 'Embedded Systems & IoT Lab')
ON CONFLICT (admin_id) DO NOTHING;

-- 4. Sample Students
INSERT INTO students (student_id, auth_user_id, usn, student_name, email, phone, department_id, semester)
VALUES
    ('cccccccc-1111-1111-1111-cccccccccccc', '00000000-0000-0000-0000-000000000002', '1RV21CS042', 'Aarav Sharma', 'aarav.cs21@college.edu', '+919876543210', '11111111-1111-1111-1111-111111111111', 6),
    ('cccccccc-2222-2222-2222-cccccccccccc', '00000000-0000-0000-0000-000000000003', '1RV21EC088', 'Priya Nair', 'priya.ec21@college.edu', '+919812345678', '33333333-3333-3333-3333-333333333333', 6),
    ('cccccccc-3333-3333-3333-cccccccccccc', '00000000-0000-0000-0000-000000000004', '1RV22IS019', 'Rohan Verma', 'rohan.is22@college.edu', '+919765432109', '22222222-2222-2222-2222-222222222222', 4)
ON CONFLICT (usn) DO NOTHING;

-- 5. Academic Projects
INSERT INTO projects (project_id, project_name, project_description, student_id, project_status)
VALUES
    ('dddddddd-1111-1111-1111-dddddddddddd', 'Smart Agriculture & Automated Irrigation', 'IoT-driven soil moisture and weather monitoring with automated water pump activation.', 'cccccccc-1111-1111-1111-cccccccccccc', 'Ongoing'),
    ('dddddddd-2222-2222-2222-dddddddddddd', 'Autonomous Obstacle Avoiding Rover', 'Robotic vehicle utilizing ultrasonic sensors and motor drivers to navigate complex terrains.', 'cccccccc-2222-2222-2222-cccccccccccc', 'Ongoing'),
    ('dddddddd-3333-3333-3333-dddddddddddd', 'IoT Hospital Air Quality Monitoring', 'Indoor environmental quality telemetry with cloud logging and display indicators.', 'cccccccc-3333-3333-3333-cccccccccccc', 'Planning')
ON CONFLICT (project_id) DO NOTHING;

-- 6. Sample Lending Transactions
-- Lending Record 1: Issued Arduino Uno (Aarav) - Upcoming Due Date
INSERT INTO lending (lending_id, request_group_id, student_id, project_id, component_id, admin_id, quantity, request_date, issue_date, due_date, status, admin_remarks)
VALUES
    ('eeeeeeee-1111-1111-1111-eeeeeeeeeeee', 'ffffffff-1111-1111-1111-ffffffffffff', 'cccccccc-1111-1111-1111-cccccccccccc', 'dddddddd-1111-1111-1111-dddddddddddd', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 2, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() + INTERVAL '10 days', 'Issued', 'Approved for capstone testing.')
ON CONFLICT (lending_id) DO NOTHING;

-- Lending Record 2: Issued Raspberry Pi 4 (Aarav) - OVERDUE Example
INSERT INTO lending (lending_id, request_group_id, student_id, project_id, component_id, admin_id, quantity, request_date, issue_date, due_date, status, admin_remarks)
VALUES
    ('eeeeeeee-2222-2222-2222-eeeeeeeeeeee', 'ffffffff-1111-1111-1111-ffffffffffff', 'cccccccc-1111-1111-1111-cccccccccccc', 'dddddddd-1111-1111-1111-dddddddddddd', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '3 days', 'Issued', 'High-value item, return promptly.')
ON CONFLICT (lending_id) DO NOTHING;

-- Lending Record 3: Partially Returned Ultrasonic Sensors (Priya)
INSERT INTO lending (lending_id, request_group_id, student_id, project_id, component_id, admin_id, quantity, request_date, issue_date, due_date, status, admin_remarks)
VALUES
    ('eeeeeeee-3333-3333-3333-eeeeeeeeeeee', 'ffffffff-2222-2222-2222-ffffffffffff', 'cccccccc-2222-2222-2222-cccccccccccc', 'dddddddd-2222-2222-2222-dddddddddddd', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 4, NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days', NOW() + INTERVAL '4 days', 'Partially Returned', 'Issued 4 sensors.')
ON CONFLICT (lending_id) DO NOTHING;

-- Lending Record 4: Pending Request (Rohan)
INSERT INTO lending (lending_id, request_group_id, student_id, project_id, component_id, admin_id, quantity, request_date, issue_date, due_date, status, admin_remarks)
VALUES
    ('eeeeeeee-4444-4444-4444-eeeeeeeeeeee', 'ffffffff-3333-3333-3333-ffffffffffff', 'cccccccc-3333-3333-3333-cccccccccccc', 'dddddddd-3333-3333-3333-dddddddddddd', 'aaaaaaaa-7777-7777-7777-aaaaaaaaaaaa', NULL, 2, NOW() - INTERVAL '1 day', NULL, NOW() + INTERVAL '14 days', 'Pending', NULL)
ON CONFLICT (lending_id) DO NOTHING;

-- 7. Sample Return Transaction (for Lending Record 3 partial return)
INSERT INTO returns (return_id, lending_id, return_date, quantity_returned, condition_on_return, fine_amount, remarks, recorded_by)
VALUES
    ('12345678-1111-1111-1111-123456789abc', 'eeeeeeee-3333-3333-3333-eeeeeeeeeeee', NOW() - INTERVAL '2 days', 2, 'Good', 0.00, 'Returned 2 of 4 units in clean working order.', 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb')
ON CONFLICT (return_id) DO NOTHING;

