import { 
  Department, 
  Student, 
  LabAdmin, 
  Component, 
  Project, 
  Lending, 
  ReturnRecord, 
  AuthSessionUser,
  ReturnCondition,
  ComponentCondition,
  ProjectStatus
} from '@/types/database';
import { 
  INITIAL_DEPARTMENTS, 
  INITIAL_COMPONENTS, 
  INITIAL_ADMINS, 
  INITIAL_STUDENTS, 
  INITIAL_PROJECTS, 
  INITIAL_LENDING, 
  INITIAL_RETURNS 
} from '@/lib/store/mock-data';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY_PREFIX = 'collegelab_';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getStoredItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) return defaultValue;
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore local storage errors
  }
}

// Service Layer
export const api = {
  // --------------------------------------------------------------------------
  // AUTHENTICATION & SESSION
  // --------------------------------------------------------------------------
  async getCurrentUser(): Promise<AuthSessionUser | null> {
    const supabase = createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check admin
        const { data: admin } = await supabase
          .from('lab_admins')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        if (admin) {
          return {
            id: user.id,
            email: user.email || '',
            role: 'admin',
            name: admin.admin_name,
            adminProfile: admin,
          };
        }
        // Check student
        const { data: student } = await supabase
          .from('students')
          .select('*, departments(*)')
          .eq('auth_user_id', user.id)
          .single();
        if (student) {
          return {
            id: user.id,
            email: user.email || '',
            role: 'student',
            name: student.student_name,
            studentProfile: student,
          };
        }
      }
    }

    // Local / Demo mode fallback
    return getStoredItem<AuthSessionUser | null>('current_session', {
      id: INITIAL_STUDENTS[0].auth_user_id,
      email: INITIAL_STUDENTS[0].email,
      role: 'student',
      name: INITIAL_STUDENTS[0].student_name,
      studentProfile: INITIAL_STUDENTS[0],
    });
  },

  async setSessionUser(user: AuthSessionUser | null): Promise<void> {
    setStoredItem('current_session', user);
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: AuthSessionUser; error?: string }> {
    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        const fullUser = await this.getCurrentUser();
        if (fullUser) return { success: true, user: fullUser };
      }
    }

    // Demo Mode Authentication
    const trimmedEmail = email.trim().toLowerCase();
    const admin = INITIAL_ADMINS.find(a => a.email.toLowerCase() === trimmedEmail);
    if (admin) {
      const sessionUser: AuthSessionUser = {
        id: admin.auth_user_id,
        email: admin.email,
        role: 'admin',
        name: admin.admin_name,
        adminProfile: admin,
      };
      await this.setSessionUser(sessionUser);
      return { success: true, user: sessionUser };
    }

    const students = await this.getStudents();
    const student = students.find(s => s.email.toLowerCase() === trimmedEmail);
    if (student) {
      const sessionUser: AuthSessionUser = {
        id: student.auth_user_id,
        email: student.email,
        role: 'student',
        name: student.student_name,
        studentProfile: student,
      };
      await this.setSessionUser(sessionUser);
      return { success: true, user: sessionUser };
    }

    return { success: false, error: 'Invalid credentials. For demo, use admin@college.edu or aarav.cs21@college.edu' };
  },

  async registerStudent(params: {
    studentName: string;
    usn: string;
    email: string;
    phone: string;
    departmentId: string;
    semester: number;
    password?: string;
  }): Promise<{ success: boolean; student?: Student; error?: string }> {
    const supabase = createClient();
    if (supabase && params.password) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
      });
      if (authError) return { success: false, error: authError.message };

      if (authData.user) {
        const { data: studentRecord, error: profileError } = await supabase
          .from('students')
          .insert({
            auth_user_id: authData.user.id,
            usn: params.usn.toUpperCase(),
            student_name: params.studentName,
            email: params.email,
            phone: params.phone,
            department_id: params.departmentId,
            semester: params.semester,
          })
          .select('*, departments(*)')
          .single();

        if (profileError) return { success: false, error: profileError.message };
        return { success: true, student: studentRecord };
      }
    }

    // Demo Local Storage insert
    const students = await this.getStudents();
    if (students.some(s => s.email.toLowerCase() === params.email.toLowerCase())) {
      return { success: false, error: 'A student with this email already exists' };
    }
    if (students.some(s => s.usn.toUpperCase() === params.usn.toUpperCase())) {
      return { success: false, error: 'A student with this USN already exists' };
    }

    const newStudent: Student = {
      student_id: crypto.randomUUID ? crypto.randomUUID() : 'std-' + Date.now(),
      auth_user_id: crypto.randomUUID ? crypto.randomUUID() : 'auth-' + Date.now(),
      usn: params.usn.toUpperCase(),
      student_name: params.studentName,
      email: params.email,
      phone: params.phone,
      department_id: params.departmentId,
      semester: params.semester,
      created_at: new Date().toISOString(),
    };

    const updated = [newStudent, ...students];
    setStoredItem('students', updated);
    return { success: true, student: newStudent };
  },

  async logout(): Promise<void> {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    if (isBrowser()) {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'current_session');
    }
  },

  // --------------------------------------------------------------------------
  // DEPARTMENTS
  // --------------------------------------------------------------------------
  async getDepartments(): Promise<Department[]> {
    const supabase = createClient();
    if (supabase) {
      const { data } = await supabase.from('departments').select('*').order('department_name');
      if (data && data.length > 0) return data;
    }
    return INITIAL_DEPARTMENTS;
  },

  // --------------------------------------------------------------------------
  // STUDENTS
  // --------------------------------------------------------------------------
  async getStudents(): Promise<Student[]> {
    const supabase = createClient();
    if (supabase) {
      const { data } = await supabase.from('students').select('*, departments(*)').order('created_at', { ascending: false });
      if (data && data.length > 0) return data;
    }
    return getStoredItem<Student[]>('students', INITIAL_STUDENTS);
  },

  // --------------------------------------------------------------------------
  // COMPONENTS (INVENTORY)
  // --------------------------------------------------------------------------
  async getComponents(options?: { category?: string; search?: string; onlyActive?: boolean }): Promise<Component[]> {
    const supabase = createClient();
    if (supabase) {
      let query = supabase.from('components').select('*');
      if (options?.onlyActive !== false) query = query.eq('is_active', true);
      if (options?.category && options.category !== 'All') query = query.eq('category', options.category);
      if (options?.search) query = query.ilike('component_name', `%${options.search}%`);
      const { data } = await query.order('component_name');
      if (data && data.length > 0) return data;
    }

    let list = getStoredItem<Component[]>('components', INITIAL_COMPONENTS);
    if (options?.onlyActive !== false) {
      list = list.filter(c => c.is_active);
    }
    if (options?.category && options.category !== 'All') {
      list = list.filter(c => c.category.toLowerCase() === options.category!.toLowerCase());
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(c => c.component_name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
    }
    return list;
  },

  async addComponent(data: {
    component_name: string;
    category: string;
    description: string;
    total_quantity: number;
    available_quantity?: number;
    component_condition?: ComponentCondition;
    storage_location: string;
    image_url?: string;
  }): Promise<{ success: boolean; component?: Component; error?: string }> {
    if (data.total_quantity < 0) {
      return { success: false, error: 'Total quantity cannot be negative.' };
    }
    const avail = data.available_quantity !== undefined ? data.available_quantity : data.total_quantity;
    if (avail < 0 || avail > data.total_quantity) {
      return { success: false, error: 'Available quantity must be between 0 and total quantity.' };
    }

    const supabase = createClient();
    if (supabase) {
      const { data: comp, error } = await supabase.from('components').insert({
        component_name: data.component_name,
        category: data.category,
        description: data.description,
        total_quantity: data.total_quantity,
        available_quantity: avail,
        component_condition: data.component_condition || 'Good',
        storage_location: data.storage_location,
        image_url: data.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
        is_active: true,
      }).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, component: comp };
    }

    const components = getStoredItem<Component[]>('components', INITIAL_COMPONENTS);
    const newComp: Component = {
      component_id: crypto.randomUUID ? crypto.randomUUID() : 'comp-' + Date.now(),
      component_name: data.component_name,
      category: data.category,
      description: data.description,
      total_quantity: data.total_quantity,
      available_quantity: avail,
      component_condition: data.component_condition || 'Good',
      storage_location: data.storage_location,
      image_url: data.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setStoredItem('components', [newComp, ...components]);
    return { success: true, component: newComp };
  },

  async updateComponent(id: string, updates: Partial<Component>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.from('components').update(updates).eq('component_id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const components = getStoredItem<Component[]>('components', INITIAL_COMPONENTS);
    const updated = components.map(c => {
      if (c.component_id === id) {
        const next = { ...c, ...updates };
        if (next.available_quantity > next.total_quantity) {
          next.available_quantity = next.total_quantity;
        }
        return next;
      }
      return c;
    });
    setStoredItem('components', updated);
    return { success: true };
  },

  async toggleComponentActive(id: string, is_active: boolean): Promise<{ success: boolean }> {
    return this.updateComponent(id, { is_active });
  },

  // --------------------------------------------------------------------------
  // PROJECTS
  // --------------------------------------------------------------------------
  async getProjects(options?: { studentId?: string }): Promise<Project[]> {
    const supabase = createClient();
    if (supabase) {
      let query = supabase.from('projects').select('*, students(*)');
      if (options?.studentId) query = query.eq('student_id', options.studentId);
      const { data } = await query.order('created_at', { ascending: false });
      if (data && data.length > 0) return data;
    }

    let list = getStoredItem<Project[]>('projects', INITIAL_PROJECTS);
    if (options?.studentId) {
      list = list.filter(p => p.student_id === options.studentId);
    }
    return list;
  },

  async createProject(data: {
    project_name: string;
    project_description: string;
    student_id: string;
    project_status?: ProjectStatus;
  }): Promise<{ success: boolean; project?: Project; error?: string }> {
    const supabase = createClient();
    if (supabase) {
      const { data: proj, error } = await supabase.from('projects').insert({
        project_name: data.project_name,
        project_description: data.project_description,
        student_id: data.student_id,
        project_status: data.project_status || 'Planning',
      }).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, project: proj };
    }

    const projects = getStoredItem<Project[]>('projects', INITIAL_PROJECTS);
    const newProject: Project = {
      project_id: crypto.randomUUID ? crypto.randomUUID() : 'proj-' + Date.now(),
      project_name: data.project_name,
      project_description: data.project_description,
      student_id: data.student_id,
      project_status: data.project_status || 'Planning',
      created_at: new Date().toISOString(),
    };
    setStoredItem('projects', [newProject, ...projects]);
    return { success: true, project: newProject };
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.from('projects').update(updates).eq('project_id', id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const projects = getStoredItem<Project[]>('projects', INITIAL_PROJECTS);
    setStoredItem('projects', projects.map(p => p.project_id === id ? { ...p, ...updates } : p));
    return { success: true };
  },

  // --------------------------------------------------------------------------
  // LENDING REQUESTS & TRACKING
  // --------------------------------------------------------------------------
  async getLending(options?: { studentId?: string; status?: string }): Promise<Lending[]> {
    const supabase = createClient();
    if (supabase) {
      let query = supabase.from('lending').select(`
        *,
        components(*),
        students(*, departments(*)),
        projects(*),
        lab_admins(*),
        returns(*)
      `);
      if (options?.studentId) query = query.eq('student_id', options.studentId);
      if (options?.status) query = query.eq('status', options.status);
      const { data } = await query.order('request_date', { ascending: false });
      if (data && data.length > 0) return data;
    }

    let list = getStoredItem<Lending[]>('lending', INITIAL_LENDING);
    const components = getStoredItem<Component[]>('components', INITIAL_COMPONENTS);
    const students = getStoredItem<Student[]>('students', INITIAL_STUDENTS);
    const projects = getStoredItem<Project[]>('projects', INITIAL_PROJECTS);
    const admins = INITIAL_ADMINS;
    const returns = getStoredItem<ReturnRecord[]>('returns', INITIAL_RETURNS);

    // Hydrate relations
    let hydrated = list.map(item => ({
      ...item,
      components: components.find(c => c.component_id === item.component_id),
      students: students.find(s => s.student_id === item.student_id),
      projects: projects.find(p => p.project_id === item.project_id),
      lab_admins: admins.find(a => a.admin_id === item.admin_id),
      returns: returns.filter(r => r.lending_id === item.lending_id),
    }));

    if (options?.studentId) {
      hydrated = hydrated.filter(l => l.student_id === options.studentId);
    }
    if (options?.status) {
      hydrated = hydrated.filter(l => l.status === options.status);
    }
    return hydrated;
  },

  async submitLendingRequest(params: {
    studentId: string;
    projectId: string;
    dueDate: string;
    items: { componentId: string; quantity: number }[];
  }): Promise<{ success: boolean; requestGroupId?: string; count?: number; error?: string }> {
    if (!params.items || params.items.length === 0) {
      return { success: false, error: 'Please select at least one component.' };
    }

    const requestGroupId = crypto.randomUUID ? crypto.randomUUID() : 'grp-' + Date.now();
    const supabase = createClient();

    if (supabase) {
      const inserts = params.items.map(item => ({
        request_group_id: requestGroupId,
        student_id: params.studentId,
        project_id: params.projectId,
        component_id: item.componentId,
        quantity: item.quantity,
        due_date: params.dueDate,
        status: 'Pending',
      }));

      const { error } = await supabase.from('lending').insert(inserts);
      if (error) return { success: false, error: error.message };
      return { success: true, requestGroupId, count: params.items.length };
    }

    // Local Storage Mock
    const lendingList = getStoredItem<Lending[]>('lending', INITIAL_LENDING);
    const newRecords: Lending[] = params.items.map((item, idx) => ({
      lending_id: crypto.randomUUID ? crypto.randomUUID() : `lend-${Date.now()}-${idx}`,
      request_group_id: requestGroupId,
      student_id: params.studentId,
      project_id: params.projectId,
      component_id: item.componentId,
      admin_id: null,
      quantity: item.quantity,
      request_date: new Date().toISOString(),
      issue_date: null,
      due_date: params.dueDate,
      status: 'Pending',
      admin_remarks: null,
    }));

    setStoredItem('lending', [...newRecords, ...lendingList]);
    return { success: true, requestGroupId, count: params.items.length };
  },

  async approveLending(lendingId: string, adminRemarks?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase
        .from('lending')
        .update({ status: 'Approved', admin_remarks: adminRemarks || 'Approved by Lab Administrator' })
        .eq('lending_id', lendingId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const lendingList = getStoredItem<Lending[]>('lending', INITIAL_LENDING);
    const updated = lendingList.map(l => 
      l.lending_id === lendingId ? { ...l, status: 'Approved' as const, admin_remarks: adminRemarks || 'Approved by Lab Administrator' } : l
    );
    setStoredItem('lending', updated);
    return { success: true };
  },

  async rejectLending(lendingId: string, adminRemarks: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase
        .from('lending')
        .update({ status: 'Rejected', admin_remarks: adminRemarks })
        .eq('lending_id', lendingId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const lendingList = getStoredItem<Lending[]>('lending', INITIAL_LENDING);
    const updated = lendingList.map(l => 
      l.lending_id === lendingId ? { ...l, status: 'Rejected' as const, admin_remarks: adminRemarks } : l
    );
    setStoredItem('lending', updated);
    return { success: true };
  },

  // --------------------------------------------------------------------------
  // ATOMIC COMPONENT ISSUING
  // Decrements stock and sets status = 'Issued'
  // --------------------------------------------------------------------------
  async issueComponent(lendingId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    if (supabase) {
      // Call Postgres database function: issue_component()
      const { data, error } = await supabase.rpc('issue_component', {
        p_lending_id: lendingId,
        p_admin_id: adminId,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    // Local atomic implementation
    const lendingList = getStoredItem<Lending[]>('lending', INITIAL_LENDING);
    const targetLending = lendingList.find(l => l.lending_id === lendingId);
    if (!targetLending) {
      return { success: false, error: 'Lending record not found.' };
    }
    if (targetLending.status !== 'Approved') {
      return { success: false, error: `Cannot issue component with status: ${targetLending.status}. Must be Approved.` };
    }

    const components = getStoredItem<Component[]>('components', INITIAL_COMPONENTS);
    const comp = components.find(c => c.component_id === targetLending.component_id);
    if (!comp) {
      return { success: false, error: 'Component record not found.' };
    }

    if (comp.available_quantity < targetLending.quantity) {
      return { success: false, error: `Insufficient stock! Requested: ${targetLending.quantity}, Available: ${comp.available_quantity}` };
    }

    // Atomically reduce available stock
    comp.available_quantity -= targetLending.quantity;
    setStoredItem('components', [...components]);

    // Update lending status
    targetLending.status = 'Issued';
    targetLending.issue_date = new Date().toISOString();
    targetLending.admin_id = adminId;
    setStoredItem('lending', [...lendingList]);

    return { success: true };
  },

  // --------------------------------------------------------------------------
  // FINE CALCULATION & COMPONENT RETURNS
  // Supports partial returns, condition checking, and stock restoration
  // --------------------------------------------------------------------------
  calculateFine(dueDateStr: string, returnDateStr: string, quantity: number, dailyRate: number = 5): number {
    const dueDate = new Date(dueDateStr);
    const returnDate = new Date(returnDateStr);
    if (returnDate <= dueDate) return 0;

    const diffMs = returnDate.getTime() - dueDate.getTime();
    const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, overdueDays * quantity * dailyRate);
  },

  async returnComponent(params: {
    lendingId: string;
    adminId: string;
    quantityReturned: number;
    condition: ReturnCondition;
    remarks?: string;
    dailyRate?: number;
  }): Promise<{ success: boolean; returnRecord?: ReturnRecord; fineAmount?: number; error?: string }> {
    if (params.quantityReturned <= 0) {
      return { success: false, error: 'Returned quantity must be greater than 0.' };
    }

    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase.rpc('return_component', {
        p_lending_id: params.lendingId,
        p_admin_id: params.adminId,
        p_quantity_returned: params.quantityReturned,
        p_condition_on_return: params.condition,
        p_remarks: params.remarks || null,
        p_daily_rate: params.dailyRate || 5.0,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, fineAmount: data?.fine_amount };
    }

    // Local Storage Mock Atomic Return
    const lendingList = getStoredItem<Lending[]>('lending', INITIAL_LENDING);
    const targetLending = lendingList.find(l => l.lending_id === params.lendingId);
    if (!targetLending) {
      return { success: false, error: 'Lending record not found.' };
    }
    if (!['Issued', 'Partially Returned'].includes(targetLending.status)) {
      return { success: false, error: `Cannot return items for lending in '${targetLending.status}' status.` };
    }

    const returnList = getStoredItem<ReturnRecord[]>('returns', INITIAL_RETURNS);
    const existingReturns = returnList.filter(r => r.lending_id === params.lendingId);
    const totalPreviouslyReturned = existingReturns.reduce((sum, r) => sum + r.quantity_returned, 0);
    const outstanding = targetLending.quantity - totalPreviouslyReturned;

    if (params.quantityReturned > outstanding) {
      return { success: false, error: `Cannot return ${params.quantityReturned} units. Outstanding quantity is only ${outstanding}.` };
    }

    // Calculate fine
    const returnTime = new Date().toISOString();
    const fine = this.calculateFine(targetLending.due_date, returnTime, params.quantityReturned, params.dailyRate || 5);

    // Create return record
    const newReturn: ReturnRecord = {
      return_id: crypto.randomUUID ? crypto.randomUUID() : 'ret-' + Date.now(),
      lending_id: params.lendingId,
      return_date: returnTime,
      quantity_returned: params.quantityReturned,
      condition_on_return: params.condition,
      fine_amount: fine,
      remarks: params.remarks || null,
      recorded_by: params.adminId,
    };

    setStoredItem('returns', [newReturn, ...returnList]);

    // Component stock adjustment
    const components = getStoredItem<Component[]>('components', INITIAL_COMPONENTS);
    const comp = components.find(c => c.component_id === targetLending.component_id);
    if (comp) {
      if (params.condition === 'Good') {
        comp.available_quantity = Math.min(comp.total_quantity, comp.available_quantity + params.quantityReturned);
      } else {
        // Damaged or Lost: permanently deduct from total_quantity
        comp.total_quantity = Math.max(0, comp.total_quantity - params.quantityReturned);
      }
      setStoredItem('components', [...components]);
    }

    // Update lending status
    if (totalPreviouslyReturned + params.quantityReturned >= targetLending.quantity) {
      targetLending.status = 'Returned';
    } else {
      targetLending.status = 'Partially Returned';
    }
    setStoredItem('lending', [...lendingList]);

    return { success: true, returnRecord: newReturn, fineAmount: fine };
  },

  async getReturns(options?: { lendingId?: string }): Promise<ReturnRecord[]> {
    const supabase = createClient();
    if (supabase) {
      let query = supabase.from('returns').select(`
        *,
        lab_admins(*),
        lending(*, components(*), students(*))
      `);
      if (options?.lendingId) query = query.eq('lending_id', options.lendingId);
      const { data } = await query.order('return_date', { ascending: false });
      if (data && data.length > 0) return data;
    }

    const returns = getStoredItem<ReturnRecord[]>('returns', INITIAL_RETURNS);
    const lendingList = await this.getLending();
    const admins = INITIAL_ADMINS;

    let hydrated = returns.map(r => ({
      ...r,
      lending: lendingList.find(l => l.lending_id === r.lending_id),
      lab_admins: admins.find(a => a.admin_id === r.recorded_by),
    }));

    if (options?.lendingId) {
      hydrated = hydrated.filter(r => r.lending_id === options.lendingId);
    }
    return hydrated;
  },

  // --------------------------------------------------------------------------
  // DASHBOARD STATISTICS & ANALYTICS
  // --------------------------------------------------------------------------
  async getAdminStats() {
    const students = await this.getStudents();
    const components = await this.getComponents({ onlyActive: false });
    const lending = await this.getLending();
    const returns = await this.getReturns();

    const totalStudents = students.length;
    const totalComponentsCount = components.length;
    const totalQuantity = components.reduce((sum, c) => sum + c.total_quantity, 0);
    const availableQuantity = components.reduce((sum, c) => sum + c.available_quantity, 0);
    const issuedQuantity = totalQuantity - availableQuantity;

    const pendingRequests = lending.filter(l => l.status === 'Pending').length;
    const activeBorrowings = lending.filter(l => ['Issued', 'Partially Returned'].includes(l.status)).length;

    const now = new Date();
    const overdueBorrowings = lending.filter(l => 
      ['Issued', 'Partially Returned'].includes(l.status) && new Date(l.due_date) < now
    ).length;

    const damagedCount = returns.filter(r => r.condition_on_return === 'Damaged').reduce((sum, r) => sum + r.quantity_returned, 0);
    const totalFines = returns.reduce((sum, r) => sum + Number(r.fine_amount || 0), 0);

    return {
      totalStudents,
      totalComponentsCount,
      totalQuantity,
      availableQuantity,
      issuedQuantity,
      pendingRequests,
      activeBorrowings,
      overdueBorrowings,
      damagedCount,
      totalFines,
    };
  },

  async getStudentStats(studentId: string) {
    const lending = await this.getLending({ studentId });
    const activeBorrowings = lending.filter(l => ['Issued', 'Partially Returned'].includes(l.status)).length;
    const pendingRequests = lending.filter(l => l.status === 'Pending').length;
    const approvedRequests = lending.filter(l => l.status === 'Approved').length;

    const now = new Date();
    const overdueCount = lending.filter(l => 
      ['Issued', 'Partially Returned'].includes(l.status) && new Date(l.due_date) < now
    ).length;

    return {
      activeBorrowings,
      pendingRequests,
      approvedRequests,
      overdueCount,
    };
  },
};

