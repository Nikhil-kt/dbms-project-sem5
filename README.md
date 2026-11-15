# College Project Component Lending & Tracking System (LabTrack DBMS)

A full-stack, enterprise-grade academic Database Management System (DBMS) designed for engineering college laboratories to digitize and manage the borrowing, tracking, and returning of electronic components, microcontroller kits, and test instruments.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase PostgreSQL**.

---

## 🚀 Key DBMS Features & Invariants

1. **Strictly Normalized Relational Schema (3NF/BCNF)**:
   - Exactly seven core application tables: `departments`, `students`, `lab_admins`, `components`, `projects`, `lending`, and `returns`.
   - Authentic foreign keys with cascading rules and integrity checks.
2. **Atomic Inventory Control**:
   - Component requests and approvals do **not** prematurely reduce stock.
   - Available stock is atomically decremented upon physical handoff via PostgreSQL function `issue_component()`.
   - Invariant: `available_quantity >= 0 AND available_quantity <= total_quantity`.
3. **Partial Returns Support**:
   - Supports returning a batch across multiple dates.
   - Outstanding quantity is dynamically computed: `Outstanding = Issued Quantity - Total Previously Returned`.
   - Lending status automatically transitions to `Partially Returned` or `Returned`.
4. **Conditional Stock Restoration**:
   - Units returned in **Good** condition are immediately restored to usable inventory.
   - Units returned as **Damaged** or **Lost** are isolated from usable stock and permanently accounted for.
5. **Automated Overdue Fine Calculation**:
   - Server-side/Database function `calculate_fine()` computes fines based on:
     $$\text{Fine} = \text{Overdue Days} \times \text{Returned Quantity} \times \text{Daily Rate (₹5.00)}$$
   - On-time returns incur ₹0.00 fine.
6. **Role-Based Access Control (RBAC) & Row Level Security (RLS)**:
   - Strict separation between **Student** and **Lab Administrator**.
   - Database-level RLS policies prevent unauthorized access or privilege escalation.
7. **Comprehensive Audit Reports & CSV Export**:
   - Inventory Report, Student Borrowings, Pending Requests, Overdue Tracking, Damaged/Lost audit, and Most Popular Components.

---

## 🏗️ Relational Architecture (The 7 Application Tables)

| # | Table Name | Purpose | Primary Key | Foreign Keys |
|---|---|---|---|---|
| 1 | `departments` | College academic departments | `department_id` | - |
| 2 | `students` | Student academic profiles | `student_id` | `auth_user_id` &rarr; `auth.users`, `department_id` &rarr; `departments` |
| 3 | `lab_admins` | Lab administrator & faculty profiles | `admin_id` | `auth_user_id` &rarr; `auth.users` |
| 4 | `components` | Electronic hardware inventory | `component_id` | - |
| 5 | `projects` | Academic capstone & miniprojects | `project_id` | `student_id` &rarr; `students` |
| 6 | `lending` | Component lending transactions & requests | `lending_id` | `student_id`, `project_id`, `component_id`, `admin_id` |
| 7 | `returns` | Component return transactions & fines | `return_id` | `lending_id`, `recorded_by` &rarr; `lab_admins` |

> Detailed diagrams and proofs:
> - **ER Diagram**: [docs/ER_DIAGRAM.md](file:///d:/my%20projects/dbms%20project/docs/ER_DIAGRAM.md)
> - **Relational Schema & Normalization Analysis**: [docs/RELATIONAL_SCHEMA.md](file:///d:/my%20projects/dbms%20project/docs/RELATIONAL_SCHEMA.md)
> - **DBMS Evaluation Queries**: [supabase/queries.sql](file:///d:/my%20projects/dbms%20project/supabase/queries.sql)

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Icons & Charts**: Lucide React, Recharts
- **Backend**: Next.js Server Actions / Route Handlers & PostgreSQL Stored Procedures
- **Database**: Supabase PostgreSQL 15+
- **Authentication**: Supabase Auth (with instant demo switcher support)

---

## 📦 Getting Started

### 1. Clone & Install Dependencies
```bash
cd "d:\my projects\dbms project"
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_DAILY_FINE_RATE=5
```
*(Note: If you launch without Supabase keys, the application automatically runs in an interactive High-Fidelity Local Mode so all UI flows, calculations, and tables work out of the box!)*

### 3. Initialize Supabase Database
In your Supabase SQL Editor:
1. Run `supabase/schema.sql` to construct the tables, indexes, RLS policies, and stored functions (`issue_component`, `return_component`, `calculate_fine`).
2. Run `supabase/seed.sql` to populate sample departments, microcontrollers, student profiles, and test lending transactions.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Credentials

The application includes an instant top-bar switcher between roles:

- **Lab Administrator Demo**:
  - Email: `admin@college.edu`
  - Password: `admin123`
  - Access: Full inventory control, request approval, physical issue desk, return desk with fine settlement, reports.
- **Student Demo**:
  - Email: `aarav.cs21@college.edu`
  - Password: `student123`
  - Access: Browse components, register projects, submit requests, track borrowings, view return history.

---

## 🧪 Testing Scenarios & Verification Matrix

| Test Scenario | Action | Verified Outcome |
|---|---|---|
| **Student Registration** | Submit register form with USN & Dept | Creates auth record and student profile row linked to department |
| **Component Request** | Student requests 2 units of Arduino Uno | Creates record with status `Pending`; Available stock remains unchanged (20) |
| **Admin Approval** | Admin approves request | Status changes to `Approved`; Stock remains 20 |
| **Physical Issue** | Admin issues approved request | Status changes to `Issued`; Stock decreases atomically to 18 |
| **Partial Return (Good)** | Student returns 1 of 2 units in Good condition | Outstanding becomes 1; Stock increases to 19; Status is `Partially Returned` |
| **Overdue Fine** | Item returned 3 days late | Fine computed: $3 \times 1 \times ₹5 = ₹15.00$; Saved in `returns` |
| **Damaged Return** | Return marked `Damaged` | Stock is NOT restored to available inventory; marked permanently |

