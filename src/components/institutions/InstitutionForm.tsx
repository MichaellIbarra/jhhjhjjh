
"use client";

import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useActionState } from "react"; 
import type { FormState as ServerFormState } from "@/lib/actions"; 
import type { NewInstitution, NewHeadquarter, Institution } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HeadquarterItem } from "./HeadquarterItem";
import { AlertTriangle, PlusCircle, Save, Trash2, Loader2, CheckCircle, RotateCcw, User } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from 'next/image';

// Zod schema for client-side validation
const headquarterClientSchema = z.object({
  id: z.string().optional().or(z.literal("").transform(() => undefined)), 
  headquartersName: z.string().min(1, "Headquarter name is required"),
  headquartersCode: z.string().min(1, "Headquarter code is required"),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email({ message: "Invalid email format" }).optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  status: z.string().default("Active"),
});

const institutionClientSchema = z.object({
  id: z.string().optional(), 
  institutionName: z.string().min(1, "Institution name is required"),
  codeName: z.string().min(1, "Code name is required"),
  institutionLogo: z.string().optional().or(z.literal('')), 
  modularCode: z.string().min(1, "Modular code is required"),
  address: z.string().optional(),
  contactEmail: z.string().email({ message: "Invalid email format" }).optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  status: z.string().default("Active"),
  userId: z.string().optional().or(z.literal('')), 
  uiSettingsStr: z.string().optional().refine(val => !val || (val && (() => { try { JSON.parse(val); return true; } catch { return false; } })()), { message: "UI Settings must be valid JSON or empty" }),
  evaluationSystemStr: z.string().optional().refine(val => !val || (val && (() => { try { JSON.parse(val); return true; } catch { return false; } })()), { message: "Evaluation System must be valid JSON or empty" }),
  scheduleSettingsStr: z.string().optional().refine(val => !val || (val && (() => { try { JSON.parse(val); return true; } catch { return false; } })()), { message: "Schedule Settings must be valid JSON or empty" }),
  headquarters: z.array(headquarterClientSchema).optional().default([]),
  institutionColor: z.string().optional().or(z.literal('')), 
  educationalLevelSelection: z.string().optional().or(z.literal('')),
});

type InstitutionFormData = z.infer<typeof institutionClientSchema>;

interface InstitutionFormProps {
  institution?: NewInstitution | Institution | null; 
  action: (prevState: ServerFormState, formData: FormData) => Promise<ServerFormState>;
  formType: "create" | "edit";
}

export function InstitutionForm({ institution, action, formType }: InstitutionFormProps) {
  const router = useRouter();
  const [initialState, setInitialState] = useState<ServerFormState>({ message: "", success: false });
  // The first argument to action.bind should be `null` or `undefined` if no specific `this` context is needed for the action.
  // The second argument `institution?.id || ""` correctly pre-fills the `id` for the server action.
  const [formState, formAction] = useActionState(action.bind(null, institution?.id || ""), initialState); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(institution?.institutionLogo || null);


  const defaultValues = useMemo(() => {
    if (institution) {
      return {
        ...institution,
        institutionName: institution.institutionName || "",
        codeName: institution.codeName || "",
        institutionLogo: institution.institutionLogo || "",
        modularCode: institution.modularCode || "",
        address: institution.address || "",
        contactEmail: institution.contactEmail || "",
        contactPhone: institution.contactPhone || "",
        status: institution.status || "Active",
        userId: institution.userId || "", 
        uiSettingsStr: institution.uiSettingsStr || (institution.uiSettings ? JSON.stringify(institution.uiSettings, null, 2) : ""),
        evaluationSystemStr: institution.evaluationSystemStr || (institution.evaluationSystem ? JSON.stringify(institution.evaluationSystem, null, 2) : ""),
        scheduleSettingsStr: institution.scheduleSettingsStr || (institution.scheduleSettings ? JSON.stringify(institution.scheduleSettings, null, 2) : ""),
        headquarters: (institution.headquarters || []).map(hq => ({
            ...hq,
            status: hq.status || "Active",
        })),
        institutionColor: institution.institutionColor || "",
        educationalLevelSelection: institution.educationalLevelSelection || "",
      };
    }
    return {
      institutionName: "",
      codeName: "",
      institutionLogo: "",
      modularCode: "",
      address: "",
      contactEmail: "",
      contactPhone: "",
      status: "Active",
      userId: "", 
      uiSettingsStr: "",
      evaluationSystemStr: "",
      scheduleSettingsStr: "",
      headquarters: [],
      institutionColor: "#3498db", 
      educationalLevelSelection: "",
    };
  }, [institution]);


  const methods = useForm<InstitutionFormData>({
    resolver: zodResolver(institutionClientSchema),
    defaultValues: defaultValues,
  });

  const { register, control, handleSubmit, formState: { errors, isDirty }, reset, watch, setValue } = methods;
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "headquarters",
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (formState.success && formType === "create") {
      reset(defaultValues); 
       timeoutId = setTimeout(() => {
         router.push("/admin/dashboard"); 
      }, 1500);
    }
    if (formState.success && formType === "edit" && formState.updatedInstitution) {
        reset(formState.updatedInstitution);
        setLogoPreview(formState.updatedInstitution.institutionLogo || null);
    }
    if (formState.message) { 
        setIsSubmitting(false);
    }
    return () => clearTimeout(timeoutId); 
  }, [formState, reset, formType, router, defaultValues]);
  
   useEffect(() => {
    reset(defaultValues);
    setLogoPreview(defaultValues.institutionLogo || null);
  }, [institution, reset, defaultValues]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "institutionLogo") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setValue(fieldName, base64String, { shouldValidate: true, shouldDirty: true });
        if (fieldName === "institutionLogo") {
          setLogoPreview(base64String);
        }
      };
      reader.readAsDataURL(file);
    } else { 
        setValue(fieldName, "", { shouldValidate: true, shouldDirty: true });
        if (fieldName === "institutionLogo") {
            setLogoPreview(null);
        }
    }
  };


  const onSubmit = async (data: InstitutionFormData) => {
    console.log("InstitutionForm onSubmit called with data:", data); // DEBUG
    setIsSubmitting(true);
    console.log("InstitutionForm isSubmitting set to true"); // DEBUG
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'institutionLogo') {
            if (typeof value === 'string' && value.startsWith('data:image')) {
                formData.append(key, value);
            } else if (typeof value === 'string') { 
                formData.append(key, value);
            }
        } else if (key === "headquarters" && Array.isArray(value)) {
            value.forEach((hq, index) => {
            Object.entries(hq).forEach(([hqKey, hqValue]) => {
                if (hqValue !== undefined && hqValue !== null) {
                formData.append(`headquarters.${index}.${hqKey}`, String(hqValue));
                }
            });
            });
        } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });
    console.log("InstitutionForm FormData prepared, calling formAction (server action)..."); // DEBUG
    await formAction(formData);
    console.log("InstitutionForm formAction completed."); // DEBUG
  };

  const watchedInstitutionColor = watch("institutionColor");

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {formState.message && !formState.success && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formState.message}</AlertDescription>
          </Alert>
        )}
        {formState.message && formState.success && (
          <Alert variant="default" className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-700 dark:text-green-300">Success!</AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-400">{formState.message}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Datos de la Institución</CardTitle>
            <CardDescription>Información principal de la institución educativa.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="institutionName">Nombre de la Institución*</Label>
              <Input id="institutionName" {...register("institutionName")} className={cn(errors.institutionName && "border-destructive")}/>
              {errors.institutionName && <p className="text-xs text-destructive mt-1">{errors.institutionName.message}</p>}
              {formState.errors?.institutionName && <p className="text-xs text-destructive mt-1">{formState.errors.institutionName[0]}</p>}
            </div>
            <div>
              <Label htmlFor="codeName">Nombre Corto/Código*</Label>
              <Input id="codeName" {...register("codeName")} className={cn(errors.codeName && "border-destructive")} />
              {errors.codeName && <p className="text-xs text-destructive mt-1">{errors.codeName.message}</p>}
              {formState.errors?.codeName && <p className="text-xs text-destructive mt-1">{formState.errors.codeName[0]}</p>}
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="institutionLogoFile">Logo de la Institución (Archivo)</Label>
              <Input 
                id="institutionLogoFile" 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, "institutionLogo")} 
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {logoPreview && <Image src={logoPreview} alt="Logo Preview" width={64} height={64} className="mt-2 h-16 w-16 object-contain border rounded-md" data-ai-hint="logo building"/>}
              {errors.institutionLogo && <p className="text-xs text-destructive mt-1">{errors.institutionLogo.message}</p>}
            </div>

            <div>
              <Label htmlFor="institutionColor">Color Institucional</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="institutionColor" 
                  type="color" 
                  {...register("institutionColor")} 
                  className="p-1 h-10 w-14 block bg-white border border-gray-300 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none"
                />
                <Input 
                    type="text"
                    value={watchedInstitutionColor || ""}
                    onChange={(e) => setValue("institutionColor", e.target.value, { shouldValidate: true, shouldDirty: true })}
                    placeholder="#3498db"
                    className="h-10"
                />
              </div>
              {errors.institutionColor && <p className="text-xs text-destructive mt-1">{errors.institutionColor.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="educationalLevelSelection">Niveles Educativos que Ofrece</Label>
              <Input id="educationalLevelSelection" {...register("educationalLevelSelection")} placeholder="Ej: Primaria y Secundaria" className={cn(errors.educationalLevelSelection && "border-destructive")} />
              {errors.educationalLevelSelection && <p className="text-xs text-destructive mt-1">{errors.educationalLevelSelection.message}</p>}
            </div>

            <div>
              <Label htmlFor="modularCode">Código Modular*</Label>
              <Input id="modularCode" {...register("modularCode")} className={cn(errors.modularCode && "border-destructive")} />
              {errors.modularCode && <p className="text-xs text-destructive mt-1">{errors.modularCode.message}</p>}
              {formState.errors?.modularCode && <p className="text-xs text-destructive mt-1">{formState.errors.modularCode[0]}</p>}
            </div>
             <div>
              <Label htmlFor="status">Estado</Label>
              <Select onValueChange={(value) => methods.setValue("status", value)} defaultValue={methods.getValues("status") || "Active"}>
                <SelectTrigger id="status" className={cn(errors.status && "border-destructive")}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Activo</SelectItem>
                  <SelectItem value="Inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-destructive mt-1">{errors.status.message}</p>}
              {formState.errors?.status && <p className="text-xs text-destructive mt-1">{formState.errors.status[0]}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Dirección Principal</Label>
              <Input id="address" {...register("address")} />
            </div>
            <div>
              <Label htmlFor="contactEmail">Email de Contacto (Institución)</Label>
              <Input id="contactEmail" type="email" {...register("contactEmail")} className={cn(errors.contactEmail && "border-destructive")} />
              {errors.contactEmail && <p className="text-xs text-destructive mt-1">{errors.contactEmail.message}</p>}
              {formState.errors?.contactEmail && <p className="text-xs text-destructive mt-1">{formState.errors.contactEmail[0]}</p>}
            </div>
            <div>
              <Label htmlFor="contactPhone">Teléfono de Contacto (Institución)</Label>
              <Input id="contactPhone" {...register("contactPhone")} />
            </div>
            <div>
              <Label htmlFor="userId" className="flex items-center gap-1">
                <User className="h-4 w-4 text-muted-foreground"/>
                Director User ID (Opcional)
              </Label>
              <Input id="userId" {...register("userId")} placeholder="Ej: 18" className={cn(errors.userId && "border-destructive")}/>
              {errors.userId && <p className="text-xs text-destructive mt-1">{errors.userId.message}</p>}
              {formState.errors?.userId && <p className="text-xs text-destructive mt-1">{formState.errors.userId[0]}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ajustes de Configuración (JSON)</CardTitle>
            <CardDescription>Ingrese los ajustes como objetos JSON válidos o déjelos vacíos.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="uiSettingsStr">Ajustes de UI</Label>
              <Textarea id="uiSettingsStr" {...register("uiSettingsStr")} rows={3} placeholder='{ "themeColor": "#FF0000", "font": "Arial" }' className={cn(errors.uiSettingsStr && "border-destructive")}/>
              {errors.uiSettingsStr && <p className="text-xs text-destructive mt-1">{errors.uiSettingsStr.message}</p>}
              {formState.errors?.uiSettingsStr && <p className="text-xs text-destructive mt-1">{formState.errors.uiSettingsStr[0]}</p>}
            </div>
            <div>
              <Label htmlFor="evaluationSystemStr">Sistema de Evaluación</Label>
              <Textarea id="evaluationSystemStr" {...register("evaluationSystemStr")} rows={3} placeholder='{ "type": "numerical", "scale": "0-20" }' className={cn(errors.evaluationSystemStr && "border-destructive")}/>
              {errors.evaluationSystemStr && <p className="text-xs text-destructive mt-1">{errors.evaluationSystemStr.message}</p>}
               {formState.errors?.evaluationSystemStr && <p className="text-xs text-destructive mt-1">{formState.errors.evaluationSystemStr[0]}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="scheduleSettingsStr">Ajustes de Horario</Label>
              <Textarea id="scheduleSettingsStr" {...register("scheduleSettingsStr")} rows={3} placeholder='{ "schoolYearStart": "2024-03-01", "schoolYearEnd": "2024-12-15" }' className={cn(errors.scheduleSettingsStr && "border-destructive")}/>
              {errors.scheduleSettingsStr && <p className="text-xs text-destructive mt-1">{errors.scheduleSettingsStr.message}</p>}
              {formState.errors?.scheduleSettingsStr && <p className="text-xs text-destructive mt-1">{formState.errors.scheduleSettingsStr[0]}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Sedes (Headquarters)</CardTitle>
                <CardDescription>Gestione las sedes para esta institución.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ headquartersName: "", headquartersCode: "", status: "Active" })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Sede
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aún no se han agregado sedes.</p>
            )}
            {fields.map((field, index) => (
              <HeadquarterItem
                key={field.id}
                index={index}
                onRemove={() => remove(index)}
                isEditable={true}
              />
            ))}
             {errors.headquarters && typeof errors.headquarters === 'string' && <p className="text-xs text-destructive mt-1">{errors.headquarters}</p>}
             {typeof errors.headquarters === 'object' && !Array.isArray(errors.headquarters) && (errors.headquarters as any).message && (
                <p className="text-xs text-destructive mt-1">{(errors.headquarters as any).message}</p>
             )}
             {formState.errors?.headquarters && typeof formState.errors.headquarters === 'string' && <p className="text-xs text-destructive mt-1">{formState.errors.headquarters[0]}</p>}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/dashboard")} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || (!isDirty && formType === 'edit')}>
            {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : formType === "create" ? (
                <PlusCircle className="mr-2 h-4 w-4" />
            ) : (
                <Save className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? "Guardando..." : formType === "create" ? "Crear Institución" : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
