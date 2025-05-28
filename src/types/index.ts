




// Legacy types (from previous localStorage-based structure)
export type LegacyUserRole = 'superuser' | 'normal';

export interface LegacyUser {
  id: string;
  name: string;
  email: string;
  role: LegacyUserRole;
  avatarSeed?: string; // Used for generating placeholder avatar
  passwordHint: string; // For demo login, e.g. 'super1' or 'normal1'
}

export interface LegacyStudent {
  id: string; // Unique identifier
  dni: string; // DNI del estudiante
  firstName: string; // Nombres
  lastName: string; // Apellidos
  grade: string; // Grado (e.g., "1ro", "5to")
  section: string; // Sección (e.g., "A", "B")
  level: 'Inicial' | 'Primaria' | 'Secundaria'; // Nivel educativo
  shift: 'Mañana' | 'Tarde'; // Turno
  guardianPhoneNumber: string; // Celular del apoderado
}

export interface LegacyAttendanceRecord {
  id: string;
  studentId: string; // Corresponds to LegacyStudent.id
  date: string; // ISO date string
  status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';
  notes?: string;
}

// This LegacyGrade type will be mostly replaced by the new Grade type in the grades section.
export interface LegacyGrade {
  id: string;
  studentId: string; // Corresponds to LegacyStudent.id
  subjectArea: string; // Área piloto o asignatura
  gradeValue: string | number; // Nota (puede ser numérica o literal)
  period: string; // Bimestre, Trimestre, etc.
  evaluationType?: string; 
  evaluationDate?: string; // ISO date string for the actual evaluation
  observations?: string; 
  status?: 'active' | 'deleted'; // For soft delete
}

export interface LegacyProgressReport {
  id: string;
  studentId: string; // Corresponds to LegacyStudent.id
  period: string;
  summary: string; // Resumen del progreso
  gradesBySubject: Array<{ subject: string; grade: string | number; comments?: string }>;
  behavioralObservations?: string; // Para tutorías (conductual)
  futRequests?: Array<{ date: string; reason: string; status: string }>; // Formato FUT
  attendanceSummary?: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
  };
}

export interface LegacyCampus {
  id: string; // Unique identifier (auto-generated string)
  name: string; // Nombre de la Institucion
  code: string; // Codigo de la Institucion (Kept for identification)
  
  institutionLogo?: string; // Data URI string
  institutionColor?: string; // Hex color code, e.g., #FF0000
  educationalLevelSelection?: string; // "Primaria", "Secundaria", "Primaria y Secundaria"

  directorPhoto?: string; // Data URI string
  directorFirstName?: string;
  directorLastName?: string;
  directorDocumentNumber?: string;
  directorPhoneNumber?: string;
  directorEmail?: string;
  directorPassword?: string; // Storing passwords/hints like this is not secure

  // Old fields that might still be in data but not actively used by the new form:
  address?: string; 
  contactPerson?: string; // Replaced by directorFirstName/LastName
  contactEmail?: string; // Replaced by directorEmail
  contactPhone?: string; // Replaced by directorPhoneNumber

  status: 'A' | 'I'; // Active, Inactive, default 'A'
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface LegacyTeacher {
  id: string; // Could be LegacyUser.id
  name: string;
  specialty?: string;
  // other relevant teacher details
}

export interface LegacySubject {
  id: string;
  name: string;
  code?: string;
  level?: 'Inicial' | 'Primaria' | 'Secundaria' | string; // For flexibility
}

export interface LegacyCourseAssignment {
  id: string; // Unique ID for the assignment
  campusId: string;
  teacherId: string; // LegacyTeacher.id
  subjectId: string; // LegacySubject.id
  grade: string; // e.g., "1ro", "5to"
  section: string; // e.g., "A", "B"
  academicYear?: string; // e.g., "2024"
}


// New types based on the provided SQL schema & Java Model for Grade

export type StatusEnum = 'A' | 'I'; // Active, Inactive
export type DocumentTypeEnum = 'DNI' | 'PASSPORT' | 'OTHER';
export type GenderEnum = 'M' | 'F' | 'O';
export type TurnEnum = 'M' | 'T'; // Mañana, Tarde
export type AttendanceStatusEnum = 'PRESENT' | 'MISSED' | 'LATE' | 'JUSTIFIED';


// Simplified Reference Types for data from other microservices
export interface StudentRef {
  id: string; // This will be studentId in the Grade model
  fullName: string; // e.g., "John Doe"
  dni: string;
  grade: string;
  section: string;
}

export interface CourseRef {
  id: string; // This will be courseId in the Grade model
  name: string; // e.g., "Mathematics"
  code?: string;
}

// New Grade model based on Java class
export interface Grade {
  id: string; // Unique identifier for the grade entry (auto-generated or from backend)
  studentId: string; // ID of the student from the student microservice
  courseId: string; // ID of the course/subject from the course microservice
  academicPeriod: string; // e.g., "Bimester I", "Trimestre II", "Anual"
  evaluationType: string; // e.g., "Examen Parcial", "Tarea Semanal", "Proyecto Final"
  grade: number; // Numeric grade value
  evaluationDate: string; // ISO date string (YYYY-MM-DD)
  remarks?: string; // Optional observations/comments
  deleted?: boolean; // For logical deletion
}


// --- Existing new types from SQL schema (can be reviewed/merged later if needed) ---
export interface EducationalGroup {
  group_id: number;
  group_name: string;
  code_name: string;
  logo?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  status?: StatusEnum;
  created_at?: string; 
  updated_at?: string; 
}

export interface GroupUser {
  group_user_id: number;
  firebase_id?: string;
  group_id?: number;
  first_name: string;
  last_name: string;
  document_type?: DocumentTypeEnum;
  document_number: string;
  email: string;
  phone?: string;
  password?: string; 
  user_image?: string;
  role: 'SUPERADMIN';
  status?: StatusEnum;
  created_at?: string; 
  updated_at?: string; 
  FOREIGN_KEY_GROUP_ID?: number; 
}

export interface Institution {
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


// This NewGrade is from the SQL schema, to be differentiated from the Java Model Grade
export interface NewGrade { 
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
