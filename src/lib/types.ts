
// Legacy types (from previous localStorage-based structure)
export type LegacyUserRole = 'superuser' | 'normal';

export interface LegacyUser {
  id: string;
  name: string;
  email: string;
  role: LegacyUserRole;
  avatarSeed?: string; 
  passwordHint: string; 
}

export interface LegacyStudent {
  id: string; 
  dni: string; 
  firstName: string; 
  lastName: string; 
  grade: string; 
  section: string; 
  level: 'Inicial' | 'Primaria' | 'Secundaria'; 
  shift: 'Mañana' | 'Tarde'; 
  guardianPhoneNumber: string; 
}

export interface LegacyAttendanceRecord {
  id: string;
  studentId: string; 
  date: string; 
  status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';
  notes?: string;
}

export interface LegacyGrade {
  id: string;
  studentId: string; 
  subjectArea: string; 
  gradeValue: string | number; 
  period: string; 
  evaluationType?: string; 
  evaluationDate?: string; // ISO date string for the actual evaluation
  observations?: string; 
  status?: 'active' | 'deleted'; // For soft delete
}

export interface LegacyProgressReport {
  id: string;
  studentId: string; 
  period: string;
  summary: string; 
  gradesBySubject: Array<{ subject: string; grade: string | number; comments?: string }>;
  behavioralObservations?: string; 
  futRequests?: Array<{ date: string; reason: string; status: string }>; 
  attendanceSummary?: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
  };
}

export interface LegacyCampus {
  id: string; 
  name: string; 
  code: string; 
  
  institutionLogo?: string; 
  institutionColor?: string; 
  educationalLevelSelection?: string; 

  directorPhoto?: string; 
  directorFirstName?: string;
  directorLastName?: string;
  directorDocumentNumber?: string;
  directorPhoneNumber?: string;
  directorEmail?: string;
  directorPassword?: string; 

  address?: string; 
  contactPerson?: string; 
  contactEmail?: string; 
  contactPhone?: string; 

  status: 'A' | 'I'; 
  createdAt: string; 
  updatedAt: string; 
}

export interface LegacyTeacher {
  id: string; 
  name: string;
  specialty?: string;
}

export interface LegacySubject {
  id: string;
  name: string;
  code?: string;
  level?: 'Inicial' | 'Primaria' | 'Secundaria' | string; 
}

export interface LegacyCourseAssignment {
  id: string; 
  campusId: string;
  teacherId: string; 
  subjectId: string; 
  grade: string; 
  section: string; 
  academicYear?: string; 
}


// New types based on the provided SQL schema & Java Model for Grade

export type StatusEnum = 'A' | 'I'; 
export type DocumentTypeEnum = 'DNI' | 'PASSPORT' | 'OTHER';
export type GenderEnum = 'M' | 'F' | 'O';
export type TurnEnum = 'M' | 'T'; 
export type AttendanceStatusEnum = 'PRESENT' | 'MISSED' | 'LATE' | 'JUSTIFIED';


// Simplified Reference Types for data from other microservices
export interface StudentRef {
  id: string; 
  fullName: string; 
  dni: string;
  grade: string;
  section: string;
}

export interface CourseRef {
  id: string; 
  name: string; 
  code?: string;
}

// New Grade model based on Java class
export interface Grade {
  id: string; 
  studentId: string; 
  courseId: string; 
  academicPeriod: string; 
  evaluationType: string; 
  grade: number; 
  evaluationDate: string; 
  remarks?: string; 
  deleted?: boolean; 
}

// --- New Types for Institutions and Headquarters API ---
export interface Headquarter {
  id: string;
  headquartersName: string;
  headquartersCode: string;
  address?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: string; // API sends "A" or "I", frontend might map to "Active"/"Inactive"
}

export interface Institution {
  id: string;
  institutionName: string;
  codeName: string;
  institutionLogo?: string;
  modularCode: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: string; // API sends "A" or "I"
  userId?: string; // This will be used for the Director's User ID
  uiSettings?: Record<string, any>; 
  evaluationSystem?: Record<string, any>;
  scheduleSettings?: Record<string, any>;
  createdAt?: string; // ISO date string
  headquarters: Headquarter[];
  institutionColor?: string; 
  educationalLevelSelection?: string; 
}

// For forms, especially when creating new entities, IDs might not be present.
export type NewHeadquarter = Omit<Headquarter, "id"> & { id?: string }; // id is optional for new, present for existing
export type NewInstitution = Omit<Institution, "id" | "createdAt" | "headquarters"> & {
  id?: string; // Optional for new, present for existing
  createdAt?: string; // Optional
  headquarters: NewHeadquarter[]; // Headquarters can be new or existing (with id)
  // Represent settings as strings for JSON input in forms
  uiSettingsStr?: string;
  evaluationSystemStr?: string;
  scheduleSettingsStr?: string;
};

// --- Existing new types from SQL schema (can be reviewed/merged later if needed) ---
// ... (keeping existing SQL schema types for now, as they might be used elsewhere or in future)
export interface SQLSQLInstitution { // Renamed to avoid conflict with new Institution type
  institution_id: number;
  group_id?: number;
  institution_name: string;
  code_name: string;
  institution_logo?: string;
  modular_code: string;
  institution_color?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: StatusEnum;
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_GROUP_ID?: number; 
}

export interface Role {
  role_id: number;
  institution_id: number;
  role_name: string;
  role_slug: string;
  description?: string;
  status?: StatusEnum;
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_INSTITUTION_ID?: number; 
}

export interface RolePermission {
  permission_id: number;
  role_id: number;
  permissions: any; 
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_ROLE_ID?: number; 
}

export interface User { 
  user_id: number;
  firebase_id?: string;
  institution_id?: number;
  first_name: string;
  last_name: string;
  document_type?: DocumentTypeEnum;
  document_number: string;
  email: string;
  phone?: string;
  password?: string; 
  user_image?: string;
  role: string; 
  role_id?: number; 
  status?: StatusEnum;
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_INSTITUTION_ID?: number; 
  FOREIGN_KEY_ROLE_ID?: number; 
}

export interface Campus {
  campus_id: number;
  institution_id: number;
  campus_name: string;
  campus_code: string;
  address?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: StatusEnum;
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_INSTITUTION_ID?: number; 
}

export interface EducationalLevel {
  level_id: number;
  level_name: string; 
  level_code: string;
  description?: string;
  status?: StatusEnum;
}

export interface CampusToLevel {
  c2l_id: number;
  campus_id: number;
  level_id: number;
  status?: StatusEnum;
  sort_order?: number;
  FOREIGN_KEY_CAMPUS_ID?: number; 
  FOREIGN_KEY_LEVEL_ID?: number; 
}

export interface Classroom {
  classroom_id: number;
  campus_id: number;
  level_id: number;
  grade: number; 
  section: string; 
  classroom_name: string; 
  capacity: number;
  status?: StatusEnum;
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_CAMPUS_ID?: number; 
  FOREIGN_KEY_LEVEL_ID?: number; 
}

export interface Student { 
  student_id: number;
  institution_id: number;
  first_name: string;
  last_name: string;
  document_type?: DocumentTypeEnum;
  document_number: string;
  gender: GenderEnum;
  birth_date: string; 
  address?: string;
  phone?: string;
  email?: string;
  name_qr?: string;
  image_data?: string; 
  status?: StatusEnum;
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_INSTITUTION_ID?: number; 
}

export interface ClassroomStudent {
  cs_id: number;
  classroom_id: number;
  student_id: number;
  enrollment_date: string; 
  turn: TurnEnum;
  status?: StatusEnum;
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_CLASSROOM_ID?: number; 
  FOREIGN_KEY_STUDENT_ID?: number; 
}

export interface Attendance {
  attendance_id: number;
  student_id: number;
  classroom_id: number;
  attendance_date: string; 
  status_attendance: AttendanceStatusEnum;
  observation?: string;
  created_by: number; 
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_STUDENT_ID?: number; 
  FOREIGN_KEY_CLASSROOM_ID?: number; 
  FOREIGN_KEY_CREATED_BY?: number; 
}

export interface Subject {
  subject_id: number;
  institution_id: number;
  subject_name: string;
  subject_code: string;
  level_id: number;
  hours_per_week: number;
  status?: StatusEnum;
  created_at?: string; 
  FOREIGN_KEY_LEVEL_ID?: number; 
  FOREIGN_KEY_INSTITUTION_ID?: number; 
}

export interface AcademicPeriod {
  period_id: number;
  institution_id: number;
  period_name: string;
  start_date: string; 
  end_date: string; 
  status?: StatusEnum;
  created_at?: string; 
  FOREIGN_KEY_INSTITUTION_ID?: number; 
}


// This SQLNewGrade is from the SQL schema, to be differentiated from the Java Model Grade
export interface SQLNewGrade { // Renamed to avoid conflict
  grade_id: number;
  student_id: number;
  subject_id: number;
  classroom_id: number;
  period_id: number;
  grade_value: number; 
  evaluation_type: string;
  comments?: string;
  grade_details?: any; 
  created_by: number; 
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_STUDENT_ID?: number; 
  FOREIGN_KEY_SUBJECT_ID?: number; 
  FOREIGN_KEY_CLASSROOM_ID?: number; 
  FOREIGN_KEY_PERIOD_ID?: number; 
  FOREIGN_KEY_CREATED_BY?: number; 
}


export interface UserToCampus {
  u2c_id: number;
  user_id: number;
  campus_id: number;
  status?: StatusEnum;
  sort_order: number;
  created_at?: string; 
  FOREIGN_KEY_USER_ID?: number; 
  FOREIGN_KEY_CAMPUS_ID?: number; 
}

export interface Teacher {
  teacher_id: number;
  user_id: number;
  speciality?: string;
  bio?: string;
  status?: StatusEnum;
  created_at?: string; 
  FOREIGN_KEY_USER_ID?: number; 
}

export interface TeacherSubjectClassroom {
  tsc_id: number;
  teacher_id: number;
  subject_id: number;
  classroom_id: number;
  period_id: number;
  status?: StatusEnum;
  created_at?: string; 
  FOREIGN_KEY_TEACHER_ID?: number; 
  FOREIGN_KEY_SUBJECT_ID?: number; 
  FOREIGN_KEY_CLASSROOM_ID?: number; 
  FOREIGN_KEY_PERIOD_ID?: number; 
}

export interface InstitutionSetting {
  setting_id: number;
  institution_id: number;
  setting_key: string;
  setting_value: any; 
  status?: StatusEnum;
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_INSTITUTION_ID?: number; 
}

export interface CampusSetting {
  setting_id: number;
  campus_id: number;
  setting_key: string;
  setting_value?: string; 
  status?: StatusEnum;
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_CAMPUS_ID?: number; 
}

    
