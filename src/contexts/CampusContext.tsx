'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LegacyCampus } from '@/types';
import { hexToHsl } from '@/lib/utils';

interface CampusContextType {
  campuses: LegacyCampus[];
  selectedCampus: LegacyCampus | null;
  setSelectedCampus: (campus: LegacyCampus | null) => void;
  addCampus: (campusData: Omit<LegacyCampus, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateCampus: (updatedCampus: LegacyCampus) => void;
  deleteCampus: (campusId: string) => void;
  getCampusById: (campusId: string) => LegacyCampus | undefined;
  isLoaded: boolean;
  isLoadingSelection: boolean; 
}

const CampusContext = createContext<CampusContextType | undefined>(undefined);

const CAMPUSES_STORAGE_KEY = 'eduassist_campuses';
const SELECTED_CAMPUS_ID_KEY = 'eduassist_selected_campus_id';

const initialCampusesData: LegacyCampus[] = [
  { 
    id: "campus-1", 
    name: "Sede Central Principal", 
    code: "SC-001", 
    address: "Av. Principal 123, Lima", 
    contactPerson: "Juan Perez Gonzales", 
    contactEmail: "jperez@example.com", 
    contactPhone: "987654321", 
    status: 'A', 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(),
    institutionColor: "#3498db", // Default blue
    educationalLevelSelection: "Primaria y Secundaria",
  },
   { 
    id: "campus-2", 
    name: "Anexo Norte Escolar", 
    code: "AN-002", 
    address: "Jr. Olivos 456, Trujillo", 
    contactPerson: "Maria Rodriguez Silva", 
    contactEmail: "mrodriguez@example.com", 
    contactPhone: "912345678", 
    status: 'A', 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(),
    institutionColor: "#e74c3c", // A red color
    educationalLevelSelection: "Primaria",
  },
];

// Default theme colors (HSL components)
const DEFAULT_PRIMARY_H = 207;
const DEFAULT_PRIMARY_S = 70;
const DEFAULT_PRIMARY_L = 53;

const DEFAULT_PRIMARY_FG_H = 210;
const DEFAULT_PRIMARY_FG_S = 40;
const DEFAULT_PRIMARY_FG_L = 98;

// For dark text on light primary background
const DARK_TEXT_H = 210;
const DARK_TEXT_S = 20;
const DARK_TEXT_L = 20;


export const CampusProvider = ({ children }: { children: ReactNode }) => {
  const [campuses, setCampuses] = useState<LegacyCampus[]>(initialCampusesData);
  const [selectedCampus, setSelectedCampusState] = useState<LegacyCampus | null>(null);
  const [isLoaded, setIsLoaded] = useState(false); 
  const [isLoadingSelection, setIsLoadingSelection] = useState(true); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCampuses = localStorage.getItem(CAMPUSES_STORAGE_KEY);
        if (storedCampuses) {
          const parsedCampuses = JSON.parse(storedCampuses);
          if (Array.isArray(parsedCampuses) && parsedCampuses.length > 0) {
            setCampuses(parsedCampuses);
          } else {
             localStorage.setItem(CAMPUSES_STORAGE_KEY, JSON.stringify(initialCampusesData));
             setCampuses(initialCampusesData);
          }
        } else {
          localStorage.setItem(CAMPUSES_STORAGE_KEY, JSON.stringify(initialCampusesData));
          setCampuses(initialCampusesData);
        }
      } catch (error) {
        console.error("Error parsing campuses from localStorage:", error);
        setCampuses(initialCampusesData);
        localStorage.setItem(CAMPUSES_STORAGE_KEY, JSON.stringify(initialCampusesData));
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) { 
      const storedSelectedCampusId = localStorage.getItem(SELECTED_CAMPUS_ID_KEY);
      if (storedSelectedCampusId) {
        const campus = campuses.find(c => c.id === storedSelectedCampusId);
        setSelectedCampusState(campus || null);
      }
      setIsLoadingSelection(false);
    }
  }, [isLoaded, campuses]); 

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(CAMPUSES_STORAGE_KEY, JSON.stringify(campuses));
    }
  }, [campuses, isLoaded]);

  const setSelectedCampus = useCallback((campus: LegacyCampus | null) => {
    setSelectedCampusState(campus);
    if (typeof window !== 'undefined') {
      if (campus) {
        localStorage.setItem(SELECTED_CAMPUS_ID_KEY, campus.id);
      } else {
        localStorage.removeItem(SELECTED_CAMPUS_ID_KEY);
      }
    }
  }, []);

  // Effect to update CSS variables for theming
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const rootStyle = document.documentElement.style;
      if (selectedCampus && selectedCampus.institutionColor) {
        const hslColor = hexToHsl(selectedCampus.institutionColor);
        if (hslColor) {
          rootStyle.setProperty('--dynamic-primary-h', hslColor.h.toString());
          rootStyle.setProperty('--dynamic-primary-s', hslColor.s.toString() + '%');
          rootStyle.setProperty('--dynamic-primary-l', hslColor.l.toString() + '%');

          if (hslColor.l > 60) { 
            rootStyle.setProperty('--dynamic-primary-foreground-h', DARK_TEXT_H.toString());
            rootStyle.setProperty('--dynamic-primary-foreground-s', DARK_TEXT_S.toString() + '%');
            rootStyle.setProperty('--dynamic-primary-foreground-l', DARK_TEXT_L.toString() + '%');
          } else { 
            rootStyle.setProperty('--dynamic-primary-foreground-h', DEFAULT_PRIMARY_FG_H.toString());
            rootStyle.setProperty('--dynamic-primary-foreground-s', DEFAULT_PRIMARY_FG_S.toString() + '%');
            rootStyle.setProperty('--dynamic-primary-foreground-l', DEFAULT_PRIMARY_FG_L.toString() + '%');
          }
        } else {
          rootStyle.removeProperty('--dynamic-primary-h');
          rootStyle.removeProperty('--dynamic-primary-s');
          rootStyle.removeProperty('--dynamic-primary-l');
          rootStyle.removeProperty('--dynamic-primary-foreground-h');
          rootStyle.removeProperty('--dynamic-primary-foreground-s');
          rootStyle.removeProperty('--dynamic-primary-foreground-l');
        }
      } else {
        rootStyle.removeProperty('--dynamic-primary-h');
        rootStyle.removeProperty('--dynamic-primary-s');
        rootStyle.removeProperty('--dynamic-primary-l');
        rootStyle.removeProperty('--dynamic-primary-foreground-h');
        rootStyle.removeProperty('--dynamic-primary-foreground-s');
        rootStyle.removeProperty('--dynamic-primary-foreground-l');
      }
    }
  }, [selectedCampus]);


  const addCampus = (campusData: Omit<LegacyCampus, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const now = new Date().toISOString();
    const newCampus: LegacyCampus = {
      ...campusData,
      institutionColor: campusData.institutionColor || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      status: 'A',
      createdAt: now,
      updatedAt: now,
    };
    setCampuses(prevCampuses => [...prevCampuses, newCampus]);
  };

  const updateCampus = (updatedCampusData: LegacyCampus) => {
    const newUpdatedAt = new Date().toISOString();
    const campusWithTimestamp: LegacyCampus = {
        ...updatedCampusData, 
        name: updatedCampusData.name,
        code: updatedCampusData.code,
        institutionColor: updatedCampusData.institutionColor || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
        educationalLevelSelection: updatedCampusData.educationalLevelSelection || "",
        institutionLogo: updatedCampusData.institutionLogo || "",
        directorPhoto: updatedCampusData.directorPhoto || "",
        directorFirstName: updatedCampusData.directorFirstName || "",
        directorLastName: updatedCampusData.directorLastName || "",
        directorDocumentNumber: updatedCampusData.directorDocumentNumber || "",
        directorPhoneNumber: updatedCampusData.directorPhoneNumber || "",
        directorEmail: updatedCampusData.directorEmail || "",
        status: updatedCampusData.status || 'A', 
        createdAt: updatedCampusData.createdAt || newUpdatedAt, 
        updatedAt: newUpdatedAt,
    };
  
    setCampuses(prevCampuses =>
      prevCampuses.map(c =>
        c.id === campusWithTimestamp.id ? campusWithTimestamp : c
      )
    );
  
    if (selectedCampus && selectedCampus.id === campusWithTimestamp.id) {
      setSelectedCampusState(campusWithTimestamp);
    }
  };

  const deleteCampus = (campusId: string) => {
    setCampuses(prevCampuses => {
      const newCampuses = prevCampuses.filter(c => c.id !== campusId);
      if (selectedCampus?.id === campusId) {
        setSelectedCampus(null); 
      }
      return newCampuses;
    });
  };

  const getCampusById = (campusId: string): LegacyCampus | undefined => {
    return campuses.find(c => c.id === campusId);
  };

  return (
    <CampusContext.Provider value={{ 
      campuses, 
      selectedCampus, 
      setSelectedCampus, 
      addCampus, 
      updateCampus, 
      deleteCampus, 
      getCampusById, 
      isLoaded,
      isLoadingSelection 
    }}>
      {children}
    </CampusContext.Provider>
  );
};

export const useCampusContext = () => {
  const context = useContext(CampusContext);
  if (context === undefined) {
    throw new Error('useCampusContext must be used within a CampusProvider');
  }
  return context;
};
