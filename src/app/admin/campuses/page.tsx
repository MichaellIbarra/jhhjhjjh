
// @ts-nocheck
"use client";

// This page is being deprecated in favor of /admin/dashboard for institution/campus management.
// It can be removed or repurposed later. For now, redirecting or showing a message.

import React, { useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OldCampusesPage() {
  const { currentUser, isAuthLoading } = useAuth();
  const router = useRouter();

   useEffect(() => {
    if (!isAuthLoading && (!currentUser || currentUser.role !== 'superuser')) {
      router.push('/login');
    } else if (!isAuthLoading && currentUser && currentUser.role === 'superuser') {
      // Redirect to the new main admin dashboard for institution management
      router.replace('/admin/dashboard');
    }
  }, [currentUser, isAuthLoading, router]);


  if (isAuthLoading || !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
           <p className="ml-4 text-lg text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }
  
   // Should be redirected by useEffect, but as a fallback:
  return (
    <DashboardLayout>
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
            <Info className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Page Moved</CardTitle>
          <CardDescription>
            Institution and campus management has been moved. Redirecting...
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">If you are not redirected automatically, please go to the new dashboard.</p>
            <Button asChild className="mt-4">
                <Link href="/admin/dashboard">Go to Admin Dashboard</Link>
            </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

    