
import type { Institution, NewInstitution, NewHeadquarter, Headquarter } from "@/lib/types";

const API_BASE_URL = "https://5711-179-6-1-114.ngrok-free.app/api/v1"; // Updated to match user's endpoint

// Helper to prepare payload: parse JSON strings and map status
function prepareInstitutionPayloadForApi(data: NewInstitution | Partial<NewInstitution>): any {
  const payload: any = { ...data };

  // Parse settings strings into objects
  if (typeof data.uiSettingsStr === 'string') {
    try {
      payload.uiSettings = data.uiSettingsStr ? JSON.parse(data.uiSettingsStr) : {};
    } catch (e) {
      console.error("Invalid UI Settings JSON:", data.uiSettingsStr, e);
      payload.uiSettings = {}; 
    }
  } else if (data.hasOwnProperty('uiSettings')) {
      payload.uiSettings = data.uiSettings;
  }
  delete payload.uiSettingsStr;

  if (typeof data.evaluationSystemStr === 'string') {
    try {
      payload.evaluationSystem = data.evaluationSystemStr ? JSON.parse(data.evaluationSystemStr) : {};
    } catch (e) {
      console.error("Invalid Evaluation System JSON:", data.evaluationSystemStr, e);
      payload.evaluationSystem = {};
    }
  } else if (data.hasOwnProperty('evaluationSystem')) {
      payload.evaluationSystem = data.evaluationSystem;
  }
  delete payload.evaluationSystemStr;

  if (typeof data.scheduleSettingsStr === 'string') {
    try {
      payload.scheduleSettings = data.scheduleSettingsStr ? JSON.parse(data.scheduleSettingsStr) : {};
    } catch (e) {
      console.error("Invalid Schedule Settings JSON:", data.scheduleSettingsStr, e);
      payload.scheduleSettings = {};
    }
  } else if (data.hasOwnProperty('scheduleSettings')) {
      payload.scheduleSettings = data.scheduleSettings;
  }
  delete payload.scheduleSettingsStr;

  // Map status "Active" to "A", "Inactive" to "I" for institution
  if (payload.status === "Active") {
    payload.status = "A";
  } else if (payload.status === "Inactive") {
    payload.status = "I";
  }


  // Map status for headquarters
  if (payload.headquarters && Array.isArray(payload.headquarters)) {
    payload.headquarters = payload.headquarters.map((hq: NewHeadquarter | Headquarter) => {
      const newHq = { ...hq };
      if (newHq.status === "Active") {
        newHq.status = "A";
      } else if (newHq.status === "Inactive") {
        newHq.status = "I";
      }
      
      // Omit 'id' if it's undefined, null, or an empty string (for new HQs)
      if (newHq.id === null || newHq.id === undefined || newHq.id === '') {
          delete newHq.id;
      }
      return newHq;
    });
  }
  
  if (data.institutionLogo === undefined && 'institutionLogo' in payload) {
    // Will be omitted by JSON.stringify
  } else if (data.institutionLogo === "" && 'institutionLogo' in payload) {
    payload.institutionLogo = "";
  }
  // Removed director specific fields as per previous request
  // delete payload.userId; // userId is part of the payload from form

  return payload;
}

// Helper to map status from API ("A", "I") to frontend ("Active", "Inactive")
export function mapApiResponseToFrontend(item: any): any { 
    const mappedItem = { ...item };
    if (mappedItem.status === "A") {
        mappedItem.status = "Active";
    } else if (mappedItem.status === "I") {
        mappedItem.status = "Inactive";
    }

    if (mappedItem.headquarters && Array.isArray(mappedItem.headquarters)) {
        mappedItem.headquarters = mappedItem.headquarters.map((hq: any) => {
            const mappedHq = { ...hq };
            if (mappedHq.status === "A") {
                mappedHq.status = "Active";
            } else if (mappedHq.status === "I") {
                mappedHq.status = "Inactive";
            }
            return mappedHq;
        });
    }
    return mappedItem;
}

export async function getAllInstitutions(): Promise<Institution[]> {
  const response = await fetch(`${API_BASE_URL}/institutions`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch institutions: ${response.status} ${response.statusText} - ${errorText}`);
  }
  const data: any[] = await response.json();
  return data.map(mapApiResponseToFrontend);
}

export async function getInstitutionById(id: string): Promise<Institution | undefined> {
  const response = await fetch(`${API_BASE_URL}/institutions/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      return undefined;
    }
    const errorText = await response.text();
    throw new Error(`Failed to fetch institution ${id}: ${response.status} ${response.statusText} - ${errorText}`);
  }
  const data: any = await response.json();
  return mapApiResponseToFrontend(data);
}

export async function createInstitution(institutionData: NewInstitution): Promise<Institution> {
  const payload = prepareInstitutionPayloadForApi(institutionData);

  const response = await fetch(`${API_BASE_URL}/institutions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Failed to create institution: ${response.status} ${response.statusText}`;
    try {
        const errorBody = await response.json();
        errorMessage = errorBody.message || errorBody.error || JSON.stringify(errorBody) || errorMessage;
    } catch (e) {
        const textError = await response.text().catch(() => ""); 
        errorMessage = `${errorMessage} - ${textError}`;
    }
    throw new Error(errorMessage);
  }
  const data: any = await response.json();
  return mapApiResponseToFrontend(data);
}

export async function updateInstitution(id: string, institutionData: Partial<NewInstitution>): Promise<Institution | undefined> {
  const payload = prepareInstitutionPayloadForApi(institutionData);
  
  delete payload.createdAt; 
  // id is in URL path, not in body for PUT
  // delete payload.id; // Keep id in payload as backend seems to expect it, or remove if API doesn't

  const response = await fetch(`${API_BASE_URL}/institutions/${id}`, {
    method: "PUT", 
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Failed to update institution ${id}: ${response.status} ${response.statusText}`;
    try {
        const errorBody = await response.json();
        errorMessage = errorBody.message || errorBody.error || JSON.stringify(errorBody) || errorMessage;
    } catch (e) {
        const textError = await response.text().catch(() => "");
        errorMessage = `${errorMessage} - ${textError}`;
    }
    if (response.status === 404) return undefined;
    throw new Error(errorMessage);
  }
  const data: any = await response.json();
  return mapApiResponseToFrontend(data);
}

export async function deleteInstitution(id: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/institutions/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    if (response.status === 404) { 
        console.warn(`Institution ${id} not found for deletion, or already deleted.`);
        return false; 
    }
    const errorText = await response.text();
    throw new Error(`Failed to delete institution ${id}: ${response.status} ${response.statusText} - ${errorText}`);
  }
  // For DELETE, a 204 No Content is a common success response, or 200 OK if it returns the deleted resource.
  // Checking for `response.ok` (status 200-299) is generally sufficient.
  return response.ok; 
}

export async function restoreInstitution(id: string): Promise<Institution | undefined> {
  const response = await fetch(`${API_BASE_URL}/institutions/restore/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to restore institution ${id}: ${response.status} ${response.statusText}`;
    try {
        const errorBody = await response.json(); // Attempt to parse error body
        errorMessage = errorBody.message || errorBody.error || JSON.stringify(errorBody) || errorMessage;
    } catch (e) {
        const textError = await response.text().catch(() => ""); // Fallback to text error
        errorMessage = `${errorMessage} - ${textError}`;
    }
    if (response.status === 404) return undefined;
    throw new Error(errorMessage);
  }

  // Check if the response has content before trying to parse JSON
  const responseText = await response.text();
  if (!responseText) {
    // If no content, but status is OK (e.g., 204 No Content or 200 OK with empty body),
    // we might need to fetch the institution again to get the updated state.
    // For now, we'll assume the revalidation by the server action will handle UI update.
    // Or, we can return a minimalist object indicating success if the API design implies this.
    // For this fix, let's try to fetch the updated institution after a successful restore if body is empty
     const updatedInstitution = await getInstitutionById(id);
     if (!updatedInstitution) {
       throw new Error(`Restored institution ${id} but could not fetch its updated details.`);
     }
     return updatedInstitution;
  }

  try {
    const data: any = JSON.parse(responseText);
    return mapApiResponseToFrontend(data);
  } catch (e) {
    console.error("Error parsing JSON from restoreInstitution response:", e, "Response text:", responseText);
    throw new Error("Failed to parse restore response, even though status was OK.");
  }
}

