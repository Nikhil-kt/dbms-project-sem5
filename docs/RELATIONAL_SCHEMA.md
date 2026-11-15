# Relational Schema & Normalization Analysis
## College Project Component Lending & Tracking System

### 1. Relational Schema Representation

* **DEPARTMENTS** (<u>department_id</u>, department_name, department_code, hod_name, created_at)
* **STUDENTS** (<u>student_id</u>, auth_user_id*, usn, student_name, email, phone, department_id*, semester, created_at)
* **LAB_ADMINS** (<u>admin_id</u>, auth_user_id*, admin_name, email, lab_name, created_at)
* **COMPONENTS** (<u>component_id</u>, component_name, category, description, total_quantity, available_quantity, component_condition, storage_location, image_url, is_active, created_at)
* **PROJECTS** (<u>project_id</u>, project_name, project_description, student_id*, project_status, created_at)
* **LENDING** (<u>lending_id</u>, request_group_id, student_id*, project_id*, component_id*, admin_id*, quantity, request_date, issue_date, due_date, status, admin_remarks)
* **RETURNS** (<u>return_id</u>, lending_id*, return_date, quantity_returned, condition_on_return, fine_amount, remarks, recorded_by*)

*(Note: Underlined attributes are Primary Keys; Asterisk (\*) denotes Foreign Keys).*

---

### 2. Functional Dependencies & Keys

#### DEPARTMENTS
- `department_id -> department_name, department_code, hod_name, created_at`
- `department_name -> department_id, department_code, hod_name, created_at`
- `department_code -> department_id, department_name, hod_name, created_at`
- **Candidate Keys:** `department_id`, `department_name`, `department_code`

#### STUDENTS
- `student_id -> auth_user_id, usn, student_name, email, phone, department_id, semester, created_at`
- `auth_user_id -> student_id, usn, student_name, email, phone, department_id, semester, created_at`
- `usn -> student_id, auth_user_id, student_name, email, phone, department_id, semester, created_at`
- `email -> student_id, auth_user_id, usn, student_name, phone, department_id, semester, created_at`
- **Candidate Keys:** `student_id`, `auth_user_id`, `usn`, `email`

#### LAB_ADMINS
- `admin_id -> auth_user_id, admin_name, email, lab_name, created_at`
- `auth_user_id -> admin_id, admin_name, email, lab_name, created_at`
- `email -> admin_id, auth_user_id, admin_name, lab_name, created_at`
- **Candidate Keys:** `admin_id`, `auth_user_id`, `email`

#### COMPONENTS
- `component_id -> component_name, category, description, total_quantity, available_quantity, component_condition, storage_location, image_url, is_active, created_at`
- **Candidate Key:** `component_id`

#### PROJECTS
- `project_id -> project_name, project_description, student_id, project_status, created_at`
- **Candidate Key:** `project_id`

#### LENDING
- `lending_id -> request_group_id, student_id, project_id, component_id, admin_id, quantity, request_date, issue_date, due_date, status, admin_remarks`
- **Candidate Key:** `lending_id`

#### RETURNS
- `return_id -> lending_id, return_date, quantity_returned, condition_on_return, fine_amount, remarks, recorded_by`
- **Candidate Key:** `return_id`

---

### 3. Normalization Analysis (1NF to BCNF)

1. **First Normal Form (1NF):**
   - All attribute values are atomic (e.g. no comma-separated component lists in a single field; individual components in a batch request are discrete rows in `lending` linked by `request_group_id`).
   - Every column has a defined domain, and each row is uniquely identifiable by its primary key.
   - Status: Satisfies 1NF.

2. **Second Normal Form (2NF):**
   - The tables are in 1NF.
   - All candidate keys in all seven tables consist of single attributes (`UUID`).
   - Therefore, there are no composite keys, precluding partial functional dependencies where a non-prime attribute depends on only a portion of a key.
   - Status: Satisfies 2NF.

3. **Third Normal Form (3NF):**
   - The tables are in 2NF.
   - There are no transitive dependencies: no non-prime attribute functionally determines another non-prime attribute.
   - In `lending`, student and component attributes (such as department or component price/category) are not duplicated; foreign keys reference their respective relations.
   - Status: Satisfies 3NF.

4. **Boyce-Codd Normal Form (BCNF):**
   - For every non-trivial functional dependency `X -> Y`, `X` is a superkey (either primary key or unique candidate key).
   - Status: Satisfies BCNF.

