
"use client"; 

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PieChartIcon, UsersRound, BarChartHorizontalBig, BookCopy, Building, CheckCircle, Home, Settings2, Users as UsersIcon } from "lucide-react"; // Added UsersIcon
import { useAuth } from "@/contexts/AuthContext"; 
import type { LegacyStudent, LegacyAttendanceRecord, LegacyGrade, LegacyCampus } from "@/types";
import StudentLevelDistributionChart, { type StudentLevelDataPoint } from "@/components/charts/StudentLevelDistributionChart";
import TodaysAttendanceChart, { type AttendanceDataPoint } from "@/components/charts/TodaysAttendanceChart";
import StudentsPerGradeChart, { type StudentsPerGradeDataPoint } from "@/components/charts/StudentsPerGradeChart";
import GradeCountBySubjectChart, { type GradeCountBySubjectDataPoint } from "@/components/charts/GradeCountBySubjectChart";

import { useStudentContext } from "@/contexts/StudentContext";
import { useCampusContext } from "@/contexts/CampusContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Added useRouter

const getAttendanceStorageKey = (date: Date, campusId?: string) => 
  `eduassist_attendance_${campusId ? campusId + '_' : ''}${format(date, "yyyy-MM-dd")}`;
const getGradesStorageKey = (campusId?: string) => 
  `eduassist_grades_${campusId ? campusId + '_' : ''}`;

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function TeacherDashboardPage() { // Renamed from DashboardPage

  return (
    <DashboardLayout>
<h1>Hola soy Noe</h1>
    </DashboardLayout>
  );
}
