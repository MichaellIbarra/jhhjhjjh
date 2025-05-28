
"use client";

import * as React from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  GraduationCap,
  FileText,
  Users as UsersIcon, // Renamed to avoid conflict
  Sparkles,
  PanelLeft,
  School,
  Loader2,
  MessageSquare,
  Building2,
  Settings,
  BookMarked,
} from 'lucide-react';
import { UserNav } from '@/components/UserNav';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useCampusContext } from '@/contexts/CampusContext';
import type { LegacyUserRole } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: LegacyUserRole[];
  requiresCampus?: boolean;
  basePath?: 'admin' | 'teacher' | 'common';
}

const baseNavItems: NavItem[] = [
  // Common (but role-specific dashboard target)
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, basePath: 'common' }, // href is updated dynamically

  // Teacher items
  { href: '/teacher/attendance', label: 'Asistencia', icon: CalendarCheck, basePath: 'teacher', roles: ['normal', 'superuser'], requiresCampus: true },
  { href: '/teacher/grades', label: 'Notas', icon: GraduationCap, basePath: 'teacher', roles: ['normal', 'superuser'], requiresCampus: true },
  { href: '/teacher/reports', label: 'Informes', icon: FileText, basePath: 'teacher', roles: ['normal', 'superuser'], requiresCampus: true },
  { href: '/teacher/students', label: 'Estudiantes', icon: UsersIcon, basePath: 'teacher', roles: ['normal', 'superuser'], requiresCampus: true },
  { href: '/teacher/notifications', label: 'Notificaciones', icon: MessageSquare, basePath: 'teacher', roles: ['normal', 'superuser'], requiresCampus: true },
  { href: '/teacher/fut', label: 'Fut', icon: BookMarked , basePath: 'teacher', roles: ['normal', 'superuser'], requiresCampus: true },

  // Profile and Settings are not in sidebar anymore, handled by UserNav
  // { href: '/teacher/profile', label: 'Perfil', icon: UsersIcon, basePath: 'teacher', roles: ['normal'] },
  // { href: '/teacher/settings', label: 'Configuración', icon: Settings, basePath: 'teacher', roles: ['normal'] },

  // Admin items
  // Admin dashboard is now the primary campus management view. "Sedes" link might be redundant or point to the same place.
  // For clarity, /admin/dashboard is the main entry. /admin/campuses could be a sub-section or alias.
  // Let's assume /admin/dashboard is the main campus management page for now.
  // The "Sedes" link for superuser if they are on a teacher page could point back to /admin/dashboard.
  { href: '/admin/dashboard', label: 'Instituciones y Sedes', icon: Building2, basePath: 'admin', roles: ['superuser'], requiresCampus: false },
  { href: '/admin/course-assignment', label: 'Asignación de Cursos', icon: BookMarked, basePath: 'admin', roles: ['superuser'], requiresCampus: true },
  { href: '/admin/anomaly-checker', label: 'Verificador IA', icon: Sparkles, basePath: 'admin', roles: ['superuser'], requiresCampus: false },
  // Profile and Settings are not in sidebar anymore, handled by UserNav
  // { href: '/admin/profile', label: 'Perfil', icon: UsersIcon, basePath: 'admin', roles: ['superuser'] },
  // { href: '/admin/settings', label: 'Configuración', icon: Settings, basePath: 'admin', roles: ['superuser'] },
];


function MobileNavToggle() {
  const { setOpenMobile } = useSidebar();
  const hookIsMobile = useIsMobile();
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || !hookIsMobile) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={() => setOpenMobile(true)}
      aria-label="Toggle Navigation"
    >
      <PanelLeft />
    </Button>
  );
}


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isAuthLoading } = useAuth();
  const { selectedCampus, isLoadingSelection: campusSelectionLoading } = useCampusContext();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      router.push('/login');
    } else if (!isAuthLoading && currentUser) {
      const isAdminPath = pathname.startsWith('/admin');
      const isTeacherPath = pathname.startsWith('/teacher');

      if (currentUser.role === 'superuser' && !isAdminPath && pathname !== '/login' && pathname !== '/') {
        // If superuser is on a teacher path, allow it (they might be managing a campus)
        // Otherwise, redirect to admin dashboard.
        if (!isTeacherPath) {
           if (pathname === '/profile') router.push('/admin/profile');
           else if (pathname === '/settings') router.push('/admin/settings');
           // else router.push('/admin/dashboard'); // Avoid loop if already trying to go there
        }
      } else if (currentUser.role === 'normal' && !isTeacherPath && pathname !== '/login' && pathname !== '/') {
        // If normal user is on an admin path, redirect to teacher dashboard.
        if (isAdminPath) router.push(pathname.replace('/admin', '/teacher'));
        else if (pathname === '/profile') router.push('/teacher/profile');
        else if (pathname === '/settings') router.push('/teacher/settings');
        // else router.push('/teacher/dashboard'); // Avoid loop
      }
    }
  }, [currentUser, isAuthLoading, router, pathname]);

  const processedNavItems = useMemo(() => {
    if (!currentUser) return [];

    let items = baseNavItems.map(item => {
      if (item.label === 'Dashboard' && item.basePath === 'common') {
        return { ...item, href: currentUser.role === 'superuser' ? '/admin/dashboard' : '/teacher/dashboard' };
      }
      // For superuser, ensure "Sedes" link correctly points to /admin/dashboard if they are viewing a campus.
      if (currentUser.role === 'superuser' && item.label === 'Instituciones y Sedes' && item.basePath === 'admin') {
         return { ...item, href: '/admin/dashboard' };
      }
      return item;
    });

    items = items.filter(item => {
      if (currentUser.role === 'superuser') {
        // Common Dashboard link (dynamically points to /admin/dashboard for superuser)
        if (item.label === 'Dashboard' && item.basePath === 'common') return true;

        // Admin specific items
        if (item.basePath === 'admin') return true;

        // If on a /teacher/* path (admin viewing campus details), show relevant teacher items
        if (pathname.startsWith('/teacher/') && item.basePath === 'teacher' && selectedCampus) return true;
        
        return false;
      } else if (currentUser.role === 'normal') {
        if (item.label === 'Dashboard' && item.basePath === 'common') return true;
        if (item.basePath === 'teacher') return true;
        return false;
      }
      return false;
    });

    return items;
  }, [currentUser, selectedCampus, pathname]);


  if (isAuthLoading || !currentUser || campusSelectionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Cargando entorno...</p>
      </div>
    );
  }

  const isViewingAdminPath = pathname.startsWith('/admin');
  const isViewingTeacherPathForAdmin = currentUser.role === 'superuser' && pathname.startsWith('/teacher');

  let sidebarTitle = "EduAssist";
  let SidebarIconComponent = School;
  let mainHeaderTitle = "EduAssist";
  let MainHeaderIconComponent = School;

  if (selectedCampus && (currentUser.role === 'normal' || isViewingTeacherPathForAdmin)) {
    sidebarTitle = selectedCampus.name;
    SidebarIconComponent = Building2;
    mainHeaderTitle = selectedCampus.name;
    MainHeaderIconComponent = Building2;
  } else if (currentUser.role === 'superuser' && isViewingAdminPath) {
    sidebarTitle = "Admin Global";
    SidebarIconComponent = Settings; // Or School if preferred for global admin
    mainHeaderTitle = "Admin Global";
    MainHeaderIconComponent = Settings;
  }


  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">
        <Sidebar
          collapsible="icon"
          className="border-r bg-sidebar text-sidebar-foreground"
          side="left"
        >
          <SidebarHeader className="p-4 flex items-center justify-between">
            <Link href={currentUser.role === 'superuser' ? "/admin/dashboard" : "/teacher/dashboard"} className="flex items-center gap-2 group-data-[collapsible=icon]:hidden" aria-label={sidebarTitle}>
              <SidebarIconComponent className="h-7 w-7 text-sidebar-foreground" />
              <span className="font-semibold text-xl text-sidebar-foreground truncate max-w-[150px]">{sidebarTitle}</span>
            </Link>
            <Link href={currentUser.role === 'superuser' ? "/admin/dashboard" : "/teacher/dashboard"} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center hidden w-full py-1.5" aria-label={sidebarTitle}>
              <SidebarIconComponent className="h-7 w-7 text-sidebar-foreground" />
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {processedNavItems.map((item) => {
                let disabled = item.requiresCampus && !selectedCampus && item.label !== 'Dashboard';
                 if (item.href === '/admin/course-assignment' && !selectedCampus && currentUser?.role === 'superuser') {
                    disabled = true;
                }

                return (
                  <SidebarMenuItem key={`${item.href}-${item.label}`}>
                    <Link href={disabled ? "#" : item.href} passHref legacyBehavior>
                      <SidebarMenuButton
                        isActive={!disabled && (pathname === item.href || (item.label !== "Dashboard" && item.label !== "Instituciones y Sedes" && pathname.startsWith(item.href)))}
                        tooltip={{ children: item.label, className: "whitespace-nowrap" }}
                        className={`justify-start ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-current={!disabled && pathname === item.href ? "page" : undefined}
                        disabled={disabled}
                        aria-disabled={disabled}
                        onClick={(e) => {
                          if (disabled) e.preventDefault();
                        }}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-x-hidden">
          <header className="sticky top-0 z-10 flex h-[57px] items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            <MobileNavToggle />
            <SidebarTrigger className="hidden md:inline-flex" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <MainHeaderIconComponent className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">{mainHeaderTitle}</span>
              </div>
            </div>
            <UserNav />
          </header>
          <SidebarInset>
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
