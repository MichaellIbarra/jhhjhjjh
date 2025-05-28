
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createInstitution as apiCreateInstitution,
  updateInstitution as apiUpdateInstitution,
  deleteInstitution as apiDeleteInstitution,
  getInstitutionById,
  restoreInstitution as apiRestoreInstitution, // Import the new API function
  mapApiResponseToFrontend, 
} from "@/lib/api";
import type { NewInstitution, NewHeadquarter, Institution } from "@/lib/types";

const headquarterSchema = z.object({
  id: z.string().optional().or(z.literal("").transform(() => undefined)), 
  headquartersName: z.string().min(1, "Headquarter name is required"),
  headquartersCode: z.string().min(1, "Headquarter code is required"),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  status: z.string().optional(), 
});

const institutionSchemaBase = z.object({
  id: z.string().optional(), 
  institutionName: z.string().min(1, "Institution name is required"),
  codeName: z.string().min(1, "Code name is required"),
  institutionLogo: z.string().optional().or(z.literal('')), 
  modularCode: z.string().min(1, "Modular code is required"),
  address: z.string().optional(),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  status: z.string().optional(), 
  userId: z.string().optional().or(z.literal('')),
  uiSettingsStr: z.string().optional().refine(val => !val || (val && (() => { try { JSON.parse(val); return true; } catch { return false; } })()), { message: "UI Settings must be valid JSON or empty" }),
  evaluationSystemStr: z.string().optional().refine(val => !val || (val && (() => { try { JSON.parse(val); return true; } catch { return false; } })()), { message: "Evaluation System must be valid JSON or empty" }),
  scheduleSettingsStr: z.string().optional().refine(val => !val || (val && (() => { try { JSON.parse(val); return true; } catch { return false; } })()), { message: "Schedule Settings must be valid JSON or empty" }),
  headquarters: z.array(headquarterSchema).optional().default([]),
  institutionColor: z.string().optional().or(z.literal('')),
  educationalLevelSelection: z.string().optional().or(z.literal('')),
});

export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined> & { headquarters?: string[] | undefined };
  fieldValues?: Record<string, any>; 
  success: boolean;
  updatedInstitution?: NewInstitution; 
  restoredInstitution?: Institution; // For restore action
};

function parseHeadquartersFromFormData(rawData: { [k: string]: FormDataEntryValue | FormDataEntryValue[] }): NewHeadquarter[] {
    const rawHeadquartersObjects: { [key: string]: any } = {};
    Object.keys(rawData).forEach(key => {
        const match = key.match(/^headquarters\.(\d+)\.(.+)$/);
        if (match) {
            const index = parseInt(match[1], 10);
            const fieldName = match[2];
            if (!rawHeadquartersObjects[index]) {
                rawHeadquartersObjects[index] = {};
            }
            rawHeadquartersObjects[index][fieldName] = rawData[key];
        }
    });

    return Object.values(rawHeadquartersObjects).map((hq: any) => ({
        id: hq.id || undefined, 
        headquartersName: hq.headquartersName || "", 
        headquartersCode: hq.headquartersCode || "", 
        address: hq.address || undefined,
        contactPerson: hq.contactPerson || undefined,
        contactEmail: hq.contactEmail || undefined,
        contactPhone: hq.contactPhone || undefined,
        status: hq.status || "Active", 
    }));
}


export async function createInstitution(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const headquarters = parseHeadquartersFromFormData(rawData);
  
  const dataToValidate = {
    institutionName: formData.get("institutionName"),
    codeName: formData.get("codeName"),
    institutionLogo: formData.get("institutionLogo") || "", 
    modularCode: formData.get("modularCode"),
    address: formData.get("address") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    status: formData.get("status") || "Active",
    userId: formData.get("userId") || "", 
    uiSettingsStr: formData.get("uiSettingsStr") || undefined,
    evaluationSystemStr: formData.get("evaluationSystemStr") || undefined,
    scheduleSettingsStr: formData.get("scheduleSettingsStr") || undefined,
    headquarters: headquarters.length > 0 ? headquarters : [], 
    institutionColor: formData.get("institutionColor") || "",
    educationalLevelSelection: formData.get("educationalLevelSelection") || "",
  };

  const validatedFields = institutionSchemaBase.safeParse(dataToValidate);

  if (!validatedFields.success) {
    return {
      message: "Failed to create institution. Please check the errors below.",
      errors: validatedFields.error.flatten().fieldErrors,
      fieldValues: dataToValidate,
      success: false,
    };
  }

  try {
    const newInstitutionData: NewInstitution = {
      ...validatedFields.data,
      institutionLogo: validatedFields.data.institutionLogo || undefined, 
      userId: validatedFields.data.userId || undefined,
      headquarters: validatedFields.data.headquarters || [], 
      institutionColor: validatedFields.data.institutionColor || undefined,
      educationalLevelSelection: validatedFields.data.educationalLevelSelection || undefined,
    };
    await apiCreateInstitution(newInstitutionData);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "An unknown error occurred while creating the institution.",
      fieldValues: dataToValidate,
      success: false,
    };
  }

  revalidatePath("/admin/dashboard");
   return {
    message: "Institution created successfully!",
    fieldValues: {}, 
    success: true,
  };
}

export async function updateInstitution(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const headquarters = parseHeadquartersFromFormData(rawData);
  
  const dataToValidate = {
    institutionName: formData.get("institutionName"),
    codeName: formData.get("codeName"),
    institutionLogo: formData.get("institutionLogo") || "",
    modularCode: formData.get("modularCode"),
    address: formData.get("address") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    status: formData.get("status") || "Active",
    userId: formData.get("userId") || "",
    uiSettingsStr: formData.get("uiSettingsStr") || undefined,
    evaluationSystemStr: formData.get("evaluationSystemStr") || undefined,
    scheduleSettingsStr: formData.get("scheduleSettingsStr") || undefined,
    headquarters: headquarters.length > 0 ? headquarters : [],
    institutionColor: formData.get("institutionColor") || "",
    educationalLevelSelection: formData.get("educationalLevelSelection") || "",
  };

  const validatedFields = institutionSchemaBase.safeParse(dataToValidate);

  if (!validatedFields.success) {
    return {
      message: "Failed to update institution. Please check the errors below.",
      errors: validatedFields.error.flatten().fieldErrors,
      fieldValues: dataToValidate,
      success: false,
    };
  }
  
  let updatedInstitutionFromApi: Institution | undefined;
  try {
    const institutionToUpdate: Partial<NewInstitution> = {
        ...validatedFields.data,
        institutionLogo: validatedFields.data.institutionLogo || undefined,
        userId: validatedFields.data.userId || undefined,
        headquarters: validatedFields.data.headquarters || [],
        institutionColor: validatedFields.data.institutionColor || undefined,
        educationalLevelSelection: validatedFields.data.educationalLevelSelection || undefined,
    };
    updatedInstitutionFromApi = await apiUpdateInstitution(id, institutionToUpdate);
  } catch (error) {
     return {
      message: error instanceof Error ? error.message : "An unknown error occurred while updating the institution.",
      fieldValues: dataToValidate,
      success: false,
    };
  }

  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/dashboard/${id}/edit`);
  
  
  const formResetData: NewInstitution | undefined = updatedInstitutionFromApi ? {
      ...updatedInstitutionFromApi,
      id: updatedInstitutionFromApi.id,
      uiSettingsStr: updatedInstitutionFromApi.uiSettings ? JSON.stringify(updatedInstitutionFromApi.uiSettings, null, 2) : "",
      evaluationSystemStr: updatedInstitutionFromApi.evaluationSystem ? JSON.stringify(updatedInstitutionFromApi.evaluationSystem, null, 2) : "",
      scheduleSettingsStr: updatedInstitutionFromApi.scheduleSettings ? JSON.stringify(updatedInstitutionFromApi.scheduleSettings, null, 2) : "",
      headquarters: updatedInstitutionFromApi.headquarters.map(hq => ({...hq}))
  } : undefined;

  return {
    message: "Institution updated successfully!",
    success: true,
    updatedInstitution: formResetData, 
  };
}

export async function deleteInstitutionAction(id: string): Promise<{ success: boolean, message?: string }> {
  try {
    const success = await apiDeleteInstitution(id);
    if (success) {
      revalidatePath("/admin/dashboard");
      return { success: true };
    }
    return { success: false, message: "Failed to delete institution from API (API returned false)." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred during deletion." };
  }
}

export async function restoreInstitutionAction(id: string): Promise<FormState> {
  let restoredInstitution: Institution | undefined;
  try {
    restoredInstitution = await apiRestoreInstitution(id);
    if (!restoredInstitution) {
      return {
        message: "Failed to restore institution. Institution not found or API error.",
        success: false,
      };
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "An unknown error occurred during restoration.",
      success: false,
    };
  }

  revalidatePath("/admin/dashboard");
  return {
    message: `Institution "${restoredInstitution.institutionName}" restored successfully!`,
    success: true,
    restoredInstitution: restoredInstitution,
  };
}


export async function getInstitutionForEdit(id: string): Promise<NewInstitution | null> {
  const institutionFromApi = await getInstitutionById(id);
  if (!institutionFromApi) return null;

  return {
    ...institutionFromApi, 
    id: institutionFromApi.id, 
    createdAt: institutionFromApi.createdAt, 
    uiSettingsStr: institutionFromApi.uiSettings ? JSON.stringify(institutionFromApi.uiSettings, null, 2) : "",
    evaluationSystemStr: institutionFromApi.evaluationSystem ? JSON.stringify(institutionFromApi.evaluationSystem, null, 2) : "",
    scheduleSettingsStr: institutionFromApi.scheduleSettings ? JSON.stringify(institutionFromApi.scheduleSettings, null, 2) : "",
    headquarters: institutionFromApi.headquarters.map(hq => ({...hq})) 
  };
}
