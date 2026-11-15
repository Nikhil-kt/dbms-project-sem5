export type Department = {
  department_id: string;
  department_name: string;
  department_code: string | null;
  hod_name: string | null;
  created_at?: string;
};

export type Student = {
  student_id: string;
  auth_user_id: string;
  usn: string;
  student_name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  semester: number | null;
  created_at?: string;
  departments?: Department;
};

export type LabAdmin = {
  admin_id: string;
  auth_user_id: string;
  admin_name: string;
  email: string;
  lab_name: string | null;
  created_at?: string;
};

export type ComponentCondition = 'New' | 'Good' | 'Fair' | 'Damaged' | 'Under Maintenance';

export type Component = {
  component_id: string;
  component_name: string;
  category: string;
  description: string | null;
  total_quantity: number;
  available_quantity: number;
  component_condition: ComponentCondition;
  storage_location: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
};

export type ProjectStatus = 'Planning' | 'Ongoing' | 'Completed' | 'Cancelled';

export type Project = {
  project_id: string;
  project_name: string;
  project_description: string | null;
  student_id: string;
  project_status: ProjectStatus;
  created_at?: string;
  students?: Student;
};

export type LendingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Partially Returned' | 'Returned';

export type Lending = {
  lending_id: string;
  request_group_id: string;
  student_id: string;
  project_id: string;
  component_id: string;
  admin_id: string | null;
  quantity: number;
  request_date: string;
  issue_date: string | null;
  due_date: string;
  status: LendingStatus;
  admin_remarks: string | null;
  components?: Component;
  students?: Student;
  projects?: Project;
  lab_admins?: LabAdmin;
  returns?: ReturnRecord[];
};

export type ReturnCondition = 'Good' | 'Damaged' | 'Lost';

export type ReturnRecord = {
  return_id: string;
  lending_id: string;
  return_date: string;
  quantity_returned: number;
  condition_on_return: ReturnCondition;
  fine_amount: number;
  remarks: string | null;
  recorded_by: string;
  lending?: Lending;
  lab_admins?: LabAdmin;
};

export type UserRole = 'student' | 'admin' | null;

export type AuthSessionUser = {
  id: string;
  email: string;
  role: 'student' | 'admin';
  name: string;
  studentProfile?: Student;
  adminProfile?: LabAdmin;
};

