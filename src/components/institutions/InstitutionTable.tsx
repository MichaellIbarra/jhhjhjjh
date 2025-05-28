
"use client";

import type { Institution } from "@/lib/types";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Pencil, Trash2, AlertTriangle, Info, MoreHorizontal, Search, Building, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteInstitutionAction, restoreInstitutionAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface InstitutionTableProps {
  institutions: Institution[];
}

export function InstitutionTable({ institutions: initialInstitutions }: InstitutionTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [institutions, setInstitutions] = useState(initialInstitutions);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setInstitutions(initialInstitutions);
  }, [initialInstitutions]);

  const filteredInstitutions = useMemo(() => {
    if (!institutions) return [];
    return institutions.filter(
      (inst) =>
        (inst.institutionName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.codeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.modularCode || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [institutions, searchTerm]);

  const handleDelete = async (id: string) => {
    const result = await deleteInstitutionAction(id);
    if (result.success) {
      setInstitutions(prev => prev.map(inst => inst.id === id ? {...inst, status: "Inactive"} : inst )); // Optimistically update status
      toast({
        title: "Institution Deactivated",
        description: "The institution has been marked as inactive.",
      });
    } else {
      toast({
        title: "Error Deactivating Institution",
        description: result.message || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (id: string) => {
    const result = await restoreInstitutionAction(id);
    if (result.success && result.restoredInstitution) {
      setInstitutions(prev => prev.map(inst => inst.id === id ? result.restoredInstitution! : inst));
      toast({
        title: "Institution Restored",
        description: `Institution "${result.restoredInstitution.institutionName}" has been restored.`,
      });
    } else {
      toast({
        title: "Error Restoring Institution",
        description: result.message || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };
  
  if (!initialInstitutions || initialInstitutions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg shadow-sm bg-card min-h-[200px]">
        <Info className="w-12 h-12 text-primary mb-3" />
        <h2 className="text-xl font-semibold mb-1">No Institutions to Display</h2>
        <p className="text-muted-foreground">
          Please add an institution to see it listed here.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search institutions (Name, Code, Modular)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="rounded-md border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] sm:w-[80px] px-2 sm:px-4">Logo</TableHead>
              <TableHead className="px-2 sm:px-4">Name</TableHead>
              <TableHead className="hidden md:table-cell px-2 sm:px-4">Code Name</TableHead>
              <TableHead className="hidden lg:table-cell px-2 sm:px-4">Modular Code</TableHead>
              <TableHead className="px-2 sm:px-4">Status</TableHead>
              <TableHead className="text-right w-[100px] sm:w-[130px] px-2 sm:px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstitutions.length > 0 ? (
              filteredInstitutions.map((institution) => (
                <TableRow key={institution.id}>
                  <TableCell className="px-2 sm:px-4">
                    {institution.institutionLogo && institution.institutionLogo !== "string" && institution.institutionLogo.startsWith('data:image') ? (
                       <Image
                        src={institution.institutionLogo}
                        alt={institution.institutionName}
                        width={40}
                        height={40}
                        className="rounded-sm object-contain border bg-muted"
                        data-ai-hint="logo building"
                      />
                    ) : institution.institutionLogo && institution.institutionLogo !== "string" ? (
                      <Image
                        src={institution.institutionLogo} // Assumes it's a valid URL if not data URI
                        alt={institution.institutionName}
                        width={40}
                        height={40}
                        className="rounded-sm object-contain border bg-muted"
                        data-ai-hint="logo building"
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40.png'; e.currentTarget.alt = 'Error loading logo';}}
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-sm border text-muted-foreground" data-ai-hint="logo building placeholder">
                        <Building className="h-5 w-5"/>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium px-2 sm:px-4 py-2 align-top">
                    <span className="line-clamp-2 sm:line-clamp-none">{institution.institutionName}</span>
                    <dl className="md:hidden mt-1 text-xs text-muted-foreground">
                      <dt className="sr-only">Code Name</dt>
                      <dd>Code: {institution.codeName}</dd>
                      <dt className="sr-only">Modular Code</dt>
                      <dd className="lg:hidden">Modular: {institution.modularCode}</dd>
                    </dl>
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-2 sm:px-4 py-2 align-top">{institution.codeName}</TableCell>
                  <TableCell className="hidden lg:table-cell px-2 sm:px-4 py-2 align-top">{institution.modularCode}</TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 align-top">
                     <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${institution.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                        {institution.status || 'N/A'}
                     </span>
                  </TableCell>
                  <TableCell className="text-right px-2 sm:px-4 py-2 align-top">
                    <div className="hidden sm:flex sm:items-center sm:justify-end sm:space-x-1 md:space-x-2">
                      {institution.status === "Inactive" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Restore">
                              <RotateCcw className="h-4 w-4 text-blue-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Restore Institution</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to restore the institution "{institution.institutionName}"? This will set its status to "Active".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRestore(institution.id)}>
                                Restore
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button variant="ghost" size="icon" asChild title="Edit">
                        <Link href={`/admin/dashboard/${institution.id}/edit`}>
                          <Pencil className="h-4 w-4 text-yellow-600" />
                        </Link>
                      </Button>
                      {institution.status === "Active" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Deactivate">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                <AlertTriangle className="inline-block mr-2 h-5 w-5 text-destructive" />
                                Deactivate Institution?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to deactivate the institution "{institution.institutionName}"? This will mark it as "Inactive".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(institution.id)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <div className="sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {institution.status === "Inactive" && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center text-blue-600 hover:text-blue-700 focus:text-blue-700">
                                    <RotateCcw className="mr-2 h-4 w-4" /> Restore
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                               <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Restore Institution</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to restore the institution "{institution.institutionName}"? This will set its status to "Active".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRestore(institution.id)}>
                                      Restore
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/dashboard/${institution.id}/edit`} className="flex items-center">
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          {institution.status === "Active" && (
                            <>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10">
                                      <Trash2 className="mr-2 h-4 w-4" /> Deactivate
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      <AlertTriangle className="inline-block mr-2 h-5 w-5 text-destructive" />
                                      Deactivate Institution?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to deactivate the institution "{institution.institutionName}"? This will mark it as "Inactive".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(institution.id)}
                                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    >
                                      Deactivate
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No institutions match your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

