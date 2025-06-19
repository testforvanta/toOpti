import { LeadStage } from '../src/types';

// Ensure this URL is configured correctly, possibly via environment variables in a real app
const N8N_EXPORT_LEAD_WEBHOOK_URL = 'http://localhost:5678/webhook/emailLeads'; // Updated webhook URL

interface ExportPayload {
  userEmail: string;
  startDate: string;
  endDate: string;
  stages: LeadStage[];
  // You can add more specific details if your n8n workflow expects them
  // e.g., specific fields to export, format preferences, etc.
}

/**
 * Triggers an n8n workflow to export leads based on specified criteria.
 * @param userEmail The email of the user initiating the export.
 * @param startDate The start date for the export range (YYYY-MM-DD).
 * @param endDate The end date for the export range (YYYY-MM-DD).
 * @param stages An array of LeadStage enums to filter the leads for export.
 * @returns A promise that resolves if the webhook call is successful, or rejects with an error.
 */
export const exportLeadsToN8N = async (
  userEmail: string,
  startDate: string,
  endDate: string,
  stages: LeadStage[]
): Promise<{ success: boolean; message: string }> => {
  if (N8N_EXPORT_LEAD_WEBHOOK_URL.includes('YOUR_N8N_WEBHOOK_URL_HERE') || !N8N_EXPORT_LEAD_WEBHOOK_URL) {
    console.error("N8N export webhook URL is not configured.");
    return { success: false, message: "Export service is not configured. Please contact support." };
  }

  const payload: ExportPayload = {
    userEmail,
    startDate,
    endDate,
    stages,
  };

  try {
    const response = await fetch(N8N_EXPORT_LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `n8n export webhook call failed: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMessage += ` - ${errorBody.message || JSON.stringify(errorBody)}`;
      } catch (e) {
        // Failed to parse error body, use the original status text
      }
      console.error(errorMessage);
      return { success: false, message: `Failed to start export process: Server responded with an error. (${response.status})` };
    }

    // Assuming n8n workflow acknowledges the request immediately
    // and processes the export asynchronously.
    return { success: true, message: "Export process started successfully. You will receive an email with the CSV shortly." };

  } catch (error) {
    console.error('Error calling n8n export webhook:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to start export process: ${message}` };
  }
};
