
"use client";

import type { NewHeadquarter } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface HeadquarterItemProps {
  index: number;
  onRemove?: (index: number) => void;
  isEditable?: boolean;
  // No headquarter prop, fields are registered with react-hook-form
}

export function HeadquarterItem({ index, onRemove, isEditable = true }: HeadquarterItemProps) {
  const { register, formState: { errors }, control } = useFormContext(); // Get methods from FormProvider

  const fieldErrors = errors.headquarters?.[index] as Record<string, any> | undefined;

  return (
    <Card className="mb-4 border-accent/50 shadow-sm">
      <CardHeader className="py-3 px-4 bg-muted/10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md text-primary">
            Headquarter Details {/* Using index as name might change if user types */}
          </CardTitle>
          {isEditable && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-label="Remove headquarter"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
        {/* Hidden ID field for existing headquarters */}
        <input type="hidden" {...register(`headquarters.${index}.id`)} />

        <div>
          <Label htmlFor={`headquarters.${index}.headquartersName`}>Headquarter Name*</Label>
          <Input
            id={`headquarters.${index}.headquartersName`}
            {...register(`headquarters.${index}.headquartersName`)}
            placeholder="Main Campus"
            disabled={!isEditable}
            className={cn(fieldErrors?.headquartersName && "border-destructive")}
          />
          {fieldErrors?.headquartersName && <p className="text-xs text-destructive mt-1">{fieldErrors.headquartersName.message}</p>}
        </div>
        <div>
          <Label htmlFor={`headquarters.${index}.headquartersCode`}>Headquarter Code*</Label>
          <Input
            id={`headquarters.${index}.headquartersCode`}
            {...register(`headquarters.${index}.headquartersCode`)}
            placeholder="HQ-001"
            disabled={!isEditable}
            className={cn(fieldErrors?.headquartersCode && "border-destructive")}
          />
          {fieldErrors?.headquartersCode && <p className="text-xs text-destructive mt-1">{fieldErrors.headquartersCode.message}</p>}
        </div>
        <div className="md:col-span-2">
          <Label htmlFor={`headquarters.${index}.address`}>Address</Label>
          <Input
            id={`headquarters.${index}.address`}
            {...register(`headquarters.${index}.address`)}
            placeholder="123 Main St"
            disabled={!isEditable}
          />
        </div>
        <div>
          <Label htmlFor={`headquarters.${index}.contactPerson`}>Contact Person</Label>
          <Input
            id={`headquarters.${index}.contactPerson`}
            {...register(`headquarters.${index}.contactPerson`)}
            placeholder="John Doe"
            disabled={!isEditable}
          />
        </div>
        <div>
          <Label htmlFor={`headquarters.${index}.contactEmail`}>Contact Email</Label>
          <Input
            id={`headquarters.${index}.contactEmail`}
            type="email"
            {...register(`headquarters.${index}.contactEmail`)}
            placeholder="contact@example.com"
            disabled={!isEditable}
             className={cn(fieldErrors?.contactEmail && "border-destructive")}
          />
          {fieldErrors?.contactEmail && <p className="text-xs text-destructive mt-1">{fieldErrors.contactEmail.message}</p>}
        </div>
        <div>
          <Label htmlFor={`headquarters.${index}.contactPhone`}>Contact Phone</Label>
          <Input
            id={`headquarters.${index}.contactPhone`}
            {...register(`headquarters.${index}.contactPhone`)}
            placeholder="555-1234"
            disabled={!isEditable}
          />
        </div>
        <div>
          <Label htmlFor={`headquarters.${index}.status`}>Status</Label>
          <Select
            defaultValue="Active"
            onValueChange={(value) => control.setValue(`headquarters.${index}.status`, value)} // Use control for Select with react-hook-form
            disabled={!isEditable}
          >
            <SelectTrigger id={`headquarters.${index}.status`}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

    