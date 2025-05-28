
import { InstitutionForm } from "@/components/institutions/InstitutionForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { createInstitution } from "@/lib/actions"; // Server action

export default function NewInstitutionPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Institution</h1>
          <p className="text-muted-foreground">
            Fill in the details to add a new educational institution to the system.
          </p>
        </div>
        <InstitutionForm action={createInstitution} formType="create" />
      </div>
    </DashboardLayout>
  );
}

    