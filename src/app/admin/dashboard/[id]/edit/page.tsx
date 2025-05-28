
import { InstitutionForm } from "@/components/institutions/InstitutionForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { getInstitutionForEdit, updateInstitution } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface EditInstitutionPageProps {
  params: { id: string };
}

export default async function EditInstitutionPage({ params }: EditInstitutionPageProps) {
  const { id } = params;
  const institution = await getInstitutionForEdit(id);

  if (!institution) {
    // If not found by server action (which calls API), show a specific message or redirect
    // For now, let's display a message within the layout.
     return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="mt-10 border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle /> Institution Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>The institution with ID "{id}" could not be found or you do not have permission to edit it.</p>
              <p className="mt-2">Please check the ID or return to the dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Institution: {institution.institutionName}</h1>
          <p className="text-muted-foreground">
            Modify the details of the institution.
          </p>
        </div>
        <InstitutionForm
          institution={institution}
          action={updateInstitution}
          formType="edit"
        />
      </div>
    </DashboardLayout>
  );
}

    