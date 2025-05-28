
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { LegacyStudent } from '@/types'; // Updated import

interface StudentContextType {
  students: LegacyStudent[]; // Updated type
  addStudent: (student: Omit<LegacyStudent, 'id'>) => void; // Updated type
  addMultipleStudents: (students: Omit<LegacyStudent, 'id'>[]) => void;
  updateStudent: (student: LegacyStudent) => void; // Updated type
  deleteStudent: (studentId: string) => void;
  getStudentById: (studentId: string) => LegacyStudent | undefined; // Updated type
  isLoaded: boolean; 
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

const initialStudentsData: LegacyStudent[] = [ // Updated type
  { id: "1", dni: "12345678", firstName: "Ana", lastName: "García", grade: "5to", section: "A", level: "Primaria", shift: "Mañana", guardianPhoneNumber: "987654321" },
  { id: "2", dni: "87654321", firstName: "Luis", lastName: "Martínez", grade: "3ro", section: "B", level: "Secundaria", shift: "Tarde", guardianPhoneNumber: "912345678" },
  { id: "3", dni: "11223344", firstName: "Sofía", lastName: "Rodríguez", grade: "Kinder", section: "C", level: "Inicial", shift: "Mañana", guardianPhoneNumber: "998877665" },
];


export const StudentProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<LegacyStudent[]>(initialStudentsData); // Updated type
  const [isLoaded, setIsLoaded] = useState(false); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedStudents = localStorage.getItem('students');
        if (storedStudents) {
          setStudents(JSON.parse(storedStudents));
        }
      } catch (error) {
        console.error("Error parsing students from localStorage:", error);
      }
      setIsLoaded(true); 
    }
  }, []); 

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('students', JSON.stringify(students));
    }
  }, [students, isLoaded]); 

  const addStudent = (studentData: Omit<LegacyStudent, 'id'>) => { // Updated type
    const newStudent: LegacyStudent = { ...studentData, id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}` }; // Updated type
    setStudents(prevStudents => [...prevStudents, newStudent]);
  };

  const addMultipleStudents = (studentsData: Omit<LegacyStudent, 'id'>[]) => {
    const newStudents = studentsData.map(studentData => ({
      ...studentData,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${studentData.dni}` // Ensure some uniqueness for batch
    }));
    setStudents(prevStudents => {
      const updatedStudents = [...prevStudents];
      newStudents.forEach(newStudent => {
        const existingIndex = updatedStudents.findIndex(s => s.dni === newStudent.dni);
        if (existingIndex > -1) {
          // Optionally update existing student or skip. For now, let's update.
          updatedStudents[existingIndex] = { ...updatedStudents[existingIndex], ...newStudent, id: updatedStudents[existingIndex].id };
        } else {
          updatedStudents.push(newStudent);
        }
      });
      return updatedStudents;
    });
  };

  const updateStudent = (updatedStudent: LegacyStudent) => { // Updated type
    setStudents(prevStudents =>
      prevStudents.map(s => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };

  const deleteStudent = (studentId: string) => {
    setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
  };

  const getStudentById = (studentId: string): LegacyStudent | undefined => { // Updated type
    return students.find(s => s.id === studentId);
  };

  return (
    <StudentContext.Provider value={{ students, addStudent, addMultipleStudents, updateStudent, deleteStudent, getStudentById, isLoaded }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudentContext = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudentContext must be used within a StudentProvider');
  }
  return context;
};

