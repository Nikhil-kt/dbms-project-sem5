# Entity-Relationship (ER) Diagram
## College Project Component Lending & Tracking System

```mermaid
erDiagram
    DEPARTMENTS ||--o{ STUDENTS : "enrolls"
    STUDENTS ||--o{ PROJECTS : "creates"
    STUDENTS ||--o{ LENDING : "requests"
    PROJECTS ||--o{ LENDING : "requires"
    COMPONENTS ||--o{ LENDING : "included_in"
    LAB_ADMINS ||--o{ LENDING : "issues"
    LENDING ||--o{ RETURNS : "tracks_return_for"
    LAB_ADMINS ||--o{ RETURNS : "records"

    DEPARTMENTS {
        uuid department_id PK
        varchar department_name UK
        varchar department_code UK
        varchar hod_name
        timestamptz created_at
    }

    STUDENTS {
        uuid student_id PK
        uuid auth_user_id UK,FK
        varchar usn UK
        varchar student_name
        varchar email UK
        varchar phone
        uuid department_id FK
        integer semester
        timestamptz created_at
    }

    LAB_ADMINS {
        uuid admin_id PK
        uuid auth_user_id UK,FK
        varchar admin_name
        varchar email UK
        varchar lab_name
        timestamptz created_at
    }

    COMPONENTS {
        uuid component_id PK
        varchar component_name
        varchar category
        text description
        integer total_quantity
        integer available_quantity
        varchar component_condition
        varchar storage_location
        text image_url
        boolean is_active
        timestamptz created_at
    }

    PROJECTS {
        uuid project_id PK
        varchar project_name
        text project_description
        uuid student_id FK
        varchar project_status
        timestamptz created_at
    }

    LENDING {
        uuid lending_id PK
        uuid request_group_id
        uuid student_id FK
        uuid project_id FK
        uuid component_id FK
        uuid admin_id FK
        integer quantity
        timestamptz request_date
        timestamptz issue_date
        timestamptz due_date
        varchar status
        text admin_remarks
    }

    RETURNS {
        uuid return_id PK
        uuid lending_id FK
        timestamptz return_date
        integer quantity_returned
        varchar condition_on_return
        numeric fine_amount
        text remarks
        uuid recorded_by FK
    }
```

### Cardinality Summary
1. **DEPARTMENTS to STUDENTS**: `1 : N` (One department has many students; each student belongs to one department).
2. **STUDENTS to PROJECTS**: `1 : N` (One student can register multiple academic projects).
3. **STUDENTS to LENDING**: `1 : N` (One student can initiate multiple component requests).
4. **PROJECTS to LENDING**: `1 : N` (One project can have multiple component allocations).
5. **COMPONENTS to LENDING**: `1 : N` (One component catalogue entry can be requested in multiple lending records).
6. **LAB_ADMINS to LENDING**: `1 : N` (One lab admin can approve and issue multiple lending records).
7. **LENDING to RETURNS**: `1 : N` (One lending transaction can have multiple partial returns).
8. **LAB_ADMINS to RETURNS**: `1 : N` (One lab admin can inspect and record multiple return events).

