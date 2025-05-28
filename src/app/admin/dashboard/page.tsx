
import Link from "next/link";
import { PlusCircle, Info } from "lucide-react";
import { getAllInstitutions } from "@/lib/api";
import { InstitutionTable } from "@/components/institutions/InstitutionTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/layouts/DashboardLayout";


export default async function AdminDashboardPage() {
  let institutions = [];
  let fetchError = null;

  try {
    institutions = await getAllInstitutions();
  } catch (error) {
    console.error("Failed to fetch institutions:", error);
    fetchError = error instanceof Error ? error.message : "Unknown error fetching institutions.";
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Institutions Management</h1>
          <p className="text-muted-foreground">
            View, create, and manage all educational institutions.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/admin/dashboard/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Institution
          </Link>
        </Button>
      </div>

      {fetchError && (
        <Card className="mb-6 bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Institutions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{fetchError}</p>
            <p className="text-destructive-foreground mt-2">Please check the API connection and try again.</p>
          </CardContent>
        </Card>
      )}

      {!fetchError && institutions.length === 0 && (
         <Card className="text-center">
            <CardHeader>
                <Info className="mx-auto h-12 w-12 text-primary mb-4" />
                <CardTitle>No Institutions Found</CardTitle>
                <CardDescription>
                There are no institutions currently registered. Click the button above to add one.
                </CardDescription>
            </CardHeader>
             <CardContent>
                <Button asChild className="mt-4">
                    <Link href="/admin/dashboard/new">Create New Institution</Link>
                </Button>
            </CardContent>
        </Card>
      )}

      {!fetchError && institutions.length > 0 && (
        <InstitutionTable institutions={institutions} />
      )}
    </DashboardLayout>
  );
}

    