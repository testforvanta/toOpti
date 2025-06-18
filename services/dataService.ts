import { supabase } from './supabaseClient';
// Removed LeadFilters from this import
import { Lead, BusinessType, EmailType, LeadStage, LeadUpdatePayload, PaymentDetails, UserProfile, UserRole, NewLeadData, ActivityLog, ActivityLogActionType, ChartDataItem, Notification, NotificationType } from '../src/types'; 
import { CoreLeadDataUpdate } from '../App'; 


// Define the expected structure of a lead row from Supabase, matching user's table schema.
interface SupabaseLeadRow {
  ID: string; // Primary Key, ensure this matches your DB (ID vs id)
  Name: string;
  TypeofBusiness: string; 
  BrandName: string;
  Email: string;
  Contactnumber?: string | null; 
  WebSite?: string | null; // Updated to allow null
  SubmissionDate: string; 
  EmailSentType: string;  
  EmailSentDate?: string | null;  // Allow null from DB
  LeadStage?: string;      
  meetingDate?: string | null;    // Allow null
  meetLink?: string | null;       
  AfterMeeting?: any;   
  emailResponse?: boolean; 
  paymentDetails?: string | PaymentDetails; 
  assigned_to_user_id?: string | null;
  profiles?: { full_name: string, email: string } | null; 
  sticky_note?: string | null;
  tags?: string[] | null; // Added field
}

interface SupabaseProfileRow {
  id: string;
  full_name?: string | null;
  email: string; 
  role: string;  
  designation?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SupabaseActivityLogRow {
    id: string;
    user_id: string;
    timestamp: string;
    action_type: string;
    details?: Record<string, any> | null;
    target_lead_id?: string | null;
    actor_user_id: string;
    // For joined data to display actor email and lead name easily
    actor_profile?: { full_name: string, email: string }[] | null; // Expect full_name and email
    target_lead?: { Name: string }[] | null;
}


const parseDateString = (dateString?: string | null): Date | undefined => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date;
};

const mapSupabaseRowToLead = (dbLead: SupabaseLeadRow): Lead => {
    let leadId = dbLead.ID;
    if (!leadId) {
        leadId = crypto.randomUUID();
    }
    const submissionDateInstance = parseDateString(dbLead.SubmissionDate);
    const emailSentDateInstance = parseDateString(dbLead.EmailSentDate);
    const meetingDateInstance = parseDateString(dbLead.meetingDate); 
    const emailSent = !!(emailSentDateInstance);
    let parsedEmailType: EmailType;
    if (dbLead.EmailSentType === EmailType.NOT_SENT || !emailSent) {
        parsedEmailType = EmailType.NOT_SENT;
    } else {
        const apiEmailType = dbLead.EmailSentType as string; 
        if (Object.values(EmailType).includes(apiEmailType as EmailType)) {
            parsedEmailType = apiEmailType as EmailType;
        } else {
            parsedEmailType = EmailType.STANDARD; 
        }
    }
    let parsedTypeOfBusiness: BusinessType;
    const apiTypeOfBusiness = dbLead.TypeofBusiness as string; 
    if (Object.values(BusinessType).includes(apiTypeOfBusiness as BusinessType)) {
        parsedTypeOfBusiness = apiTypeOfBusiness as BusinessType;
    } else if (apiTypeOfBusiness === 'Company Brand') { 
        parsedTypeOfBusiness = BusinessType.COMPANY_BRAND;
    } else if (apiTypeOfBusiness === 'Personal Brand') { 
        parsedTypeOfBusiness = BusinessType.PERSONAL_BRAND;
    } else {
        parsedTypeOfBusiness = BusinessType.COMPANY_BRAND; 
    }
    let parsedLeadStage: LeadStage;
    const apiLeadStage = dbLead.LeadStage?.trim() as string | undefined; 
    switch (apiLeadStage?.toLowerCase()) {
        case 'cold': case 'new':
            parsedLeadStage = LeadStage.COLD;
            break;
        // Note: 'meeting scheduled' case will now fall into default if not explicitly handled,
        // or map to an existing stage if desired. Given it was removed from enum,
        // existing data with this value might need specific handling or will default to COLD.
        // For this subtask, we assume it will default to COLD as LeadStage.MEETING_SCHEDULED is gone.
        case 'warm':
            parsedLeadStage = LeadStage.WARM;
            break;
        case 'hot':
            parsedLeadStage = LeadStage.HOT;
            break;
        case 'closed': case 'closed - won': case 'closed won':
            parsedLeadStage = LeadStage.CLOSED;
            break;
        case 'frozen - lost': case 'closed - lost': case 'closed lost': case 'frozen lost':
            parsedLeadStage = LeadStage.FROZEN_LOST;
            break;
        case 'junk':
            parsedLeadStage = LeadStage.JUNK;
            break;
        default:
            parsedLeadStage = LeadStage.COLD; 
    }
    const meetLinkValue = dbLead.meetLink ? String(dbLead.meetLink).trim() : '';
    let parsedPaymentDetails: PaymentDetails | undefined = undefined;
    if (dbLead.paymentDetails) {
        if (typeof dbLead.paymentDetails === 'string') {
            try {
                parsedPaymentDetails = JSON.parse(dbLead.paymentDetails) as PaymentDetails;
            } catch (e) {
                parsedPaymentDetails = undefined;
            }
        } else if (typeof dbLead.paymentDetails === 'object' && dbLead.paymentDetails !== null) {
            parsedPaymentDetails = dbLead.paymentDetails as PaymentDetails;
        }
        if (parsedPaymentDetails && (
            typeof parsedPaymentDetails.totalAmountQuoted !== 'number' ||
            typeof parsedPaymentDetails.amountPaid !== 'number' ||
            typeof parsedPaymentDetails.paymentMode !== 'string'
        )) {
            parsedPaymentDetails = undefined; 
        }
        if (parsedPaymentDetails && parsedPaymentDetails.paymentDate) {
            const paymentDateInstance = parseDateString(parsedPaymentDetails.paymentDate);
            parsedPaymentDetails.paymentDate = paymentDateInstance ? paymentDateInstance.toISOString() : undefined;
        }
    }
    let afterMeetingProcessed: string | undefined = undefined;
    if (dbLead.AfterMeeting) {
        if (typeof dbLead.AfterMeeting === 'string') {
            afterMeetingProcessed = dbLead.AfterMeeting.trim();
        } else if (typeof dbLead.AfterMeeting === 'object') {
            try {
            afterMeetingProcessed = JSON.stringify(dbLead.AfterMeeting);
            } catch (e) {}
        }
        if (afterMeetingProcessed) {
            const trimmedContent = afterMeetingProcessed.trim();
            if (trimmedContent === '' || trimmedContent === '{}' || trimmedContent === '[]') {
                afterMeetingProcessed = undefined;
            } else {
                afterMeetingProcessed = trimmedContent; 
            }
        }
    }
    const emailResponseValue = dbLead.emailResponse === true;

    // New logic for tags:
    let parsedTags: string[] = []; // Default to empty array
    if (dbLead.tags) {
      if (Array.isArray(dbLead.tags)) {
        parsedTags = dbLead.tags;
      } else if (typeof dbLead.tags === 'string') {
        try {
          const potentiallyParsed = JSON.parse(dbLead.tags);
          if (Array.isArray(potentiallyParsed)) {
            parsedTags = potentiallyParsed;
          } else {
            // Log a warning if parsing doesn't result in an array
            console.warn(`Lead ID ${dbLead.ID}: 'tags' field was a string but did not parse into an array:`, dbLead.tags);
          }
        } catch (e) {
          // Log a warning if JSON parsing fails for a string field
          console.warn(`Lead ID ${dbLead.ID}: Failed to parse 'tags' field from string:`, dbLead.tags, e);
        }
      } else {
        // Log a warning if tags is neither array nor string nor null/undefined
        console.warn(`Lead ID ${dbLead.ID}: 'tags' field had an unexpected type:`, typeof dbLead.tags);
      }
    }

    return {
        id: leadId, 
        name: dbLead.Name || 'N/A', 
        typeOfBusiness: parsedTypeOfBusiness,
        brandName: dbLead.BrandName || 'N/A', 
        email: dbLead.Email || 'N/A', 
        contactNumber: dbLead.Contactnumber || undefined, 
        website: dbLead.WebSite || undefined,
        submissionDate: submissionDateInstance as Date | undefined,
        emailSent: emailSent,
        emailType: parsedEmailType,
        emailSentDate: emailSentDateInstance,
        stage: parsedLeadStage,
        meetingDate: meetingDateInstance,
        meetLink: meetLinkValue || undefined, 
        AfterMeeting: afterMeetingProcessed, 
        emailResponse: emailResponseValue,
        paymentDetails: parsedPaymentDetails,
        assignedToUserId: dbLead.assigned_to_user_id,
        assignedToUserFullName: dbLead.profiles?.full_name || null,
        sticky_note: dbLead.sticky_note || undefined,
        tags: parsedTags,
    };
};

export const fetchLeads = async (
  currentUserId?: string,
  currentUserRole?: UserRole,
  startDate?: string, 
  endDate?: string    
): Promise<Lead[]> => {
  try {
    let query = supabase
      .from('leads')
      .select('*, sticky_note, tags, profiles:assigned_to_user_id (full_name, email)')
      .order('SubmissionDate', { ascending: false });

    if (currentUserRole === UserRole.BASIC_USER && currentUserId) {
      query = query.eq('assigned_to_user_id', currentUserId); 
    }

    if (startDate) {
      query = query.gte('SubmissionDate', startDate);
    }
    if (endDate) {
      query = query.lte('SubmissionDate', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch leads. ${error.message}`);
    }

    if (!data) { 
      return []; 
    }
    
    const leadsData = data as SupabaseLeadRow[];
    return leadsData.map(mapSupabaseRowToLead);

  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('An unknown error occurred while fetching leads.');
  }
};

export const updateLeadDetails = async (leadId: string, updates: LeadUpdatePayload, actorUserId: string, currentLeadData?: Lead): Promise<void> => {
  const supabaseUpdatePayload: {
    LeadStage?: LeadStage;
    meetLink?: string | null;
    paymentDetails?: PaymentDetails | null;
    tags?: string[] | null; 
    meetingDate?: string | null; 
  } = {};

  let actionType: ActivityLogActionType | null = null;
  let logDetails: Record<string, any> = { leadId };

  if (updates.stage && currentLeadData && updates.stage !== currentLeadData.stage) {
    supabaseUpdatePayload.LeadStage = updates.stage;
    actionType = ActivityLogActionType.LEAD_STAGE_UPDATE;
    logDetails.oldStage = currentLeadData.stage;
    logDetails.newStage = updates.stage;
  }
  if (updates.meetLink !== undefined) { 
    supabaseUpdatePayload.meetLink = updates.meetLink === '' ? null : updates.meetLink;
    if (currentLeadData && updates.meetLink !== currentLeadData.meetLink) {
        actionType = ActivityLogActionType.MEETING_LINK_UPDATED; 
        logDetails.oldMeetLink = currentLeadData.meetLink;
        logDetails.newMeetLink = updates.meetLink;
    }
  }
  
  if (updates.hasOwnProperty('paymentDetails')) { 
    const newPaymentDetails = updates.paymentDetails;
    if (newPaymentDetails === null || newPaymentDetails === undefined) {
      supabaseUpdatePayload.paymentDetails = null;
    } else {
      const detailsToSave: PaymentDetails = { ...newPaymentDetails }; 
      if (detailsToSave.paymentDate) {
         const paymentDateInstance = parseDateString(detailsToSave.paymentDate);
         detailsToSave.paymentDate = paymentDateInstance ? paymentDateInstance.toISOString() : undefined;
      }
      supabaseUpdatePayload.paymentDetails = detailsToSave;
    }
    if (JSON.stringify(newPaymentDetails) !== JSON.stringify(currentLeadData?.paymentDetails)) {
        actionType = ActivityLogActionType.LEAD_PAYMENT_UPDATE;
        logDetails.oldPaymentDetails = currentLeadData?.paymentDetails;
        logDetails.newPaymentDetails = newPaymentDetails;
    }
  }

  if (updates.tags !== undefined) {
    supabaseUpdatePayload.tags = updates.tags;
    if (currentLeadData && JSON.stringify(updates.tags) !== JSON.stringify(currentLeadData.tags)) {
      logDetails.oldTags = currentLeadData.tags;
      logDetails.newTags = updates.tags;
      if (!actionType) actionType = ActivityLogActionType.LEAD_DETAILS_UPDATE;
    }
  }

  if (updates.meetingDate !== undefined) {
      if (updates.meetingDate === null) {
          supabaseUpdatePayload.meetingDate = null;
      } else {
          const dateInstance = updates.meetingDate instanceof Date ? updates.meetingDate : parseDateString(updates.meetingDate as unknown as string);
          supabaseUpdatePayload.meetingDate = dateInstance ? dateInstance.toISOString() : null;
      }

      if (currentLeadData && supabaseUpdatePayload.meetingDate !== (currentLeadData.meetingDate ? currentLeadData.meetingDate.toISOString() : null)) {
          logDetails.oldMeetingDate = currentLeadData.meetingDate;
          logDetails.newMeetingDate = supabaseUpdatePayload.meetingDate;
           if (!actionType) actionType = ActivityLogActionType.LEAD_DETAILS_UPDATE;
      }
  }

  if (Object.keys(supabaseUpdatePayload).length === 0) {
    return;
  }

  try {
    const { error } = await supabase
      .from('leads')
      .update(supabaseUpdatePayload) 
      .eq('ID', leadId); 

    if (error) {
      throw new Error(`Failed to update lead. ${error.message}`);
    }
    if (actionType) {
        await logUserActivity(currentLeadData?.assignedToUserId || actorUserId, actionType, actorUserId, logDetails, leadId);
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('An unknown error occurred while updating lead details.');
  }
};

export const updateCoreLeadDetails = async (leadId: string, updates: CoreLeadDataUpdate, actorUserId: string, currentLeadData?: Lead): Promise<void> => {
  const supabasePayload: Partial<SupabaseLeadRow> = {};
  const changedFields: Record<string, { old: any; new: any }> = {};

  const processUpdate = (
    updateKey: keyof CoreLeadDataUpdate,
    dbKey: keyof SupabaseLeadRow,
    currentLeadValue: any 
  ) => {
    if (updates.hasOwnProperty(updateKey)) {
      const newValue = updates[updateKey];
      if (newValue !== currentLeadValue) { 
        if ((dbKey === 'Contactnumber' || dbKey === 'WebSite') && (newValue === '' || newValue === undefined || newValue === null)) {
          (supabasePayload as any)[dbKey] = null;
        } else if (newValue !== undefined) {
          (supabasePayload as any)[dbKey] = newValue;
        } else if (dbKey === 'Contactnumber' || dbKey === 'WebSite') { 
           (supabasePayload as any)[dbKey] = null;
        }
        
        if (currentLeadData) { 
          changedFields[updateKey as string] = { old: currentLeadData[updateKey as keyof Lead], new: newValue };
        }
      }
    }
  };

  processUpdate('name', 'Name', currentLeadData?.name);
  processUpdate('brandName', 'BrandName', currentLeadData?.brandName);
  processUpdate('email', 'Email', currentLeadData?.email);
  processUpdate('contactNumber', 'Contactnumber', currentLeadData?.contactNumber);
  processUpdate('website', 'WebSite', currentLeadData?.website);
  processUpdate('typeOfBusiness', 'TypeofBusiness', currentLeadData?.typeOfBusiness);
  
  if (Object.keys(supabasePayload).length === 0) {
    return;
  }

  try {
    const { error: updateError } = await supabase
      .from('leads')
      .update(supabasePayload)
      .eq('ID', leadId);

    if (updateError) {
      throw new Error(`Failed to update core details. ${updateError.message}`);
    }
    await logUserActivity(currentLeadData?.assignedToUserId || actorUserId, ActivityLogActionType.LEAD_DETAILS_UPDATE, actorUserId, { leadId, changedFields }, leadId);

  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('An unknown error occurred while updating core lead details.');
  }
};

export const deleteLeadById = async (leadId: string, actorUserId: string, leadName?: string, assignedToUserIdBeforeDelete?: string | null): Promise<void> => {
  try {
    // Log activity BEFORE deleting the lead to avoid FK constraint error
    await logUserActivity(
      assignedToUserIdBeforeDelete || actorUserId,
      ActivityLogActionType.LEAD_DELETED,
      actorUserId,
      { leadId, leadName: leadName || "Unknown" },
      leadId
    );

    console.log('Attempting to delete lead with ID:', leadId, typeof leadId);
    const { error, count, data } = await supabase
      .from('leads')
      .delete({ count: 'exact' })
      .eq('ID', leadId);
    console.log('Supabase delete response:', { error, count, data });

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Failed to delete lead. ${error.message}`);
    }
    if (count === 0) {
      console.warn('No rows deleted. The lead ID may not exist or RLS is blocking the operation.');
    }
  } catch (error) {
    console.error('deleteLeadById error:', error);
    if (error instanceof Error) throw error;
    throw new Error('An unknown error occurred while deleting the lead.');
  }
};

const N8N_ADD_LEAD_WEBHOOK_URL = 'http://localhost:5678/webhook/addLead'; 

export const addLead = async (
  leadData: NewLeadData, 
  triggeredByUserId: string, 
  triggeredByUserRole: UserRole
): Promise<void> => { 
  if (N8N_ADD_LEAD_WEBHOOK_URL.includes('YOUR_N8N_WEBHOOK_URL_HERE')) { 
    throw new Error("Application is not configured. The n8n add lead webhook URL is a placeholder.");
  }

  const payloadToN8n = {
    ...leadData, 
    submissionDate: new Date().toISOString(),
    triggeredByUserId: triggeredByUserId,
    triggeredByUserRole: triggeredByUserRole,
  };

  try {
    const response = await fetch(N8N_ADD_LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadToN8n),
    });

    if (!response.ok) {
      let errorMessage = `n8n webhook call failed: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMessage += ` - ${errorBody.message || JSON.stringify(errorBody)}`;
      } catch (e) { /* Failed to parse error body */ }
      throw new Error(errorMessage);
    }
    
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('An unknown error occurred while submitting the lead.');
  }
};


export const fetchUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, designation, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch user profiles. ${error.message}`);
    if (!data) return [];

    return data.map((dbProfile: SupabaseProfileRow) => ({
      id: dbProfile.id,
      full_name: dbProfile.full_name || undefined,
      email: dbProfile.email,
      role: Object.values(UserRole).includes(dbProfile.role as UserRole) ? dbProfile.role as UserRole : UserRole.BASIC_USER,
      designation: dbProfile.designation || undefined,
      created_at: dbProfile.created_at,
      updated_at: dbProfile.updated_at,
    }));
  } catch (error) {
    console.error('Data Service Error: fetchUserProfiles.', error);
    throw error;
  }
};

export const fetchBasicUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, designation')
      .eq('role', UserRole.BASIC_USER)
      .order('full_name', { ascending: true });

    if (error) throw new Error(`Failed to fetch basic user profiles. ${error.message}`);
    if (!data) return [];
    
    return data.map((dbProfile: SupabaseProfileRow) => ({
      id: dbProfile.id,
      full_name: dbProfile.full_name || dbProfile.email, 
      email: dbProfile.email,
      role: UserRole.BASIC_USER, 
      designation: dbProfile.designation || undefined,
    }));
  } catch (error) {
    console.error('Data Service Error: fetchBasicUserProfiles.', error);
    throw error;
  }
};

export const assignLeadToUser = async (leadId: string, targetUserId: string | null, actorUserId: string, currentAssignedUserId?: string | null, assignedToFullName?: string | null): Promise<void> => {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to_user_id: targetUserId })
      .eq('ID', leadId);

    if (error) {
      throw new Error(`Failed to assign lead. ${error.message}`);
    }
    
    const actionType = targetUserId ? ActivityLogActionType.LEAD_ASSIGNED : ActivityLogActionType.LEAD_UNASSIGNED;
    const logDetails: Record<string, any> = { leadId, newAssignedUserId: targetUserId, newAssignedToFullName: assignedToFullName || null };
    if (currentAssignedUserId !== undefined) {
        logDetails.previousAssignedUserId = currentAssignedUserId;
    }
    await logUserActivity(targetUserId || currentAssignedUserId || actorUserId, actionType, actorUserId, logDetails, leadId);

  } catch (error) {
    console.error('Data Service Error: Unexpected error in assignLeadToUser.', error);
    if (error instanceof Error) throw error;
    throw new Error('An unknown error occurred while assigning the lead.');
  }
};

export const logUserActivity = async (
  userId: string, 
  actionType: ActivityLogActionType,
  actorUserId: string, 
  details?: Record<string, any> | null,
  targetLeadId?: string | null
): Promise<void> => {
  try {
    const logEntry = {
      user_id: userId,
      action_type: actionType,
      actor_user_id: actorUserId,
      details: details || null,
      target_lead_id: targetLeadId || null,
      timestamp: new Date().toISOString(),
    };
    const { error: insertError } = await supabase.from('activity_logs').insert(logEntry);
    if (insertError) {
      console.error('Supabase Error: Failed to log user activity.', insertError);
    }
  } catch (errCatch) { 
    console.error('Data Service Error: Unexpected error in logUserActivity.', errCatch);
  }
};

export const fetchActivityLogsForUser = async (userId: string): Promise<ActivityLog[]> => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        user_id,
        timestamp,
        action_type,
        details,
        target_lead_id,
        actor_user_id,
        actor_profile:actor_user_id (full_name, email),
        target_lead:target_lead_id (Name)
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`Failed to fetch activity logs. ${error && error.message ? error.message : ''}`);
    }
    if (!data) return [];

    const activityLogsData = data as SupabaseActivityLogRow[];

    return activityLogsData.map((log: SupabaseActivityLogRow) => ({
      id: log.id,
      user_id: log.user_id,
      timestamp: log.timestamp,
      action_type: log.action_type as ActivityLogActionType, 
      details: log.details,
      target_lead_id: log.target_lead_id,
      actor_user_id: log.actor_user_id,
      actor_user_full_name: log.actor_profile?.[0]?.full_name, 
      actor_user_email: log.actor_profile?.[0]?.email,
      target_lead_name: log.target_lead?.[0]?.Name,
    }));
  } catch (error) {
    console.error('Data Service Error: fetchActivityLogsForUser.', error);
    throw error; 
  }
};

export const updateLeadStickyNote = async (leadId: string, stickyNoteContent: string, actorUserId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ sticky_note: stickyNoteContent }) 
      .eq('ID', leadId);

    if (error) {
      throw new Error(`Failed to update sticky note. ${error && error.message ? error.message : ''}`);
    }
  } catch (error) {
    console.error('Data Service Error: Unexpected error in updateLeadStickyNote.', error);
    if (error instanceof Error) throw error;
    throw new Error('An unknown error occurred while updating the sticky note.');
  }
};

export const fetchUserLeadStageCountsForMonthEnd = async (userId: string, month: string): Promise<ChartDataItem[]> => {
  const year = parseInt(month.split('-')[0]);
  const monthIndex = parseInt(month.split('-')[1]) - 1; // Month is 0-indexed in JavaScript Date

  // Start of the selected month
  const firstDayOfMonth = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  // End of the selected month (last millisecond)
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  
  const startDateISO = firstDayOfMonth.toISOString();
  const endDateISO = lastDayOfMonth.toISOString();

  try {
    // Fetch all leads for the user that were created (or submitted) on or before the end of the specified month.
    // We also need their initial stage at creation.
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('ID, LeadStage, SubmissionDate') // Select only necessary fields
      .eq('assigned_to_user_id', userId)
      .lte('SubmissionDate', endDateISO);

    if (leadsError) {
      console.error('Error fetching leads for stage count:', leadsError);
      throw new Error(`Failed to fetch leads. ${leadsError.message}`);
    }
    if (!leadsData) {
        return []; // No leads for this user or period
    }

    // Fetch all LEAD_STAGE_UPDATE activity logs for these leads that occurred on or before the end of the specified month.
    // We are fetching for the actor_user_id to ensure these are changes made by the specified user.
    // If the responsibility for stage changes can be by other users, this might need adjustment (e.g. filter by target_lead_id list).
    // For now, assuming productivity is measured by actions of `actor_user_id`.
    // However, the problem asks for the state of leads *assigned* to a user, so the stage updates should be for the *lead*, not necessarily by the *user*.
    // Let's fetch logs based on target_lead_id.

    const leadIds = leadsData.map(l => l.ID);
    if (leadIds.length === 0) return [];

    const { data: activityLogsData, error: activityLogsError } = await supabase
        .from('activity_logs')
        .select('target_lead_id, details, timestamp')
        .in('target_lead_id', leadIds) // Filter by the leads assigned to the user
        .eq('action_type', ActivityLogActionType.LEAD_STAGE_UPDATE)
        .lte('timestamp', endDateISO) // Logs up to the end of the month
        .order('timestamp', { ascending: true }); // Important for chronological processing

    if (activityLogsError) {
        console.error('Error fetching activity logs for stage count:', activityLogsError);
        throw new Error(`Failed to fetch activity logs. ${activityLogsError.message}`);
    }

    // Group activity logs by lead ID
    const logsByLeadId = new Map<string, any[]>();
    if (activityLogsData) {
        for (const log of activityLogsData) {
            if (!log.target_lead_id) continue;
            if (!logsByLeadId.has(log.target_lead_id)) {
                logsByLeadId.set(log.target_lead_id, []);
            }
            logsByLeadId.get(log.target_lead_id)!.push(log);
        }
    }
    
    const stageCounts: { [key in LeadStage]?: number } = {};
    Object.values(LeadStage).forEach(stage => stageCounts[stage] = 0); // Initialize all stages to 0

    for (const lead of leadsData) {
        let currentStage = lead.LeadStage as LeadStage; // Initial stage from the leads table
        const leadSubmissionDate = new Date(lead.SubmissionDate);

        // Determine the stage of the lead at the START of the month if it was created before the month.
        // This is important if its initial stage in `leads` table is not the actual stage at month start.
        const leadSpecificLogs = logsByLeadId.get(lead.ID) || [];

        let stageAtMonthStart = lead.LeadStage as LeadStage;
        if (leadSubmissionDate < firstDayOfMonth) { // Lead was created before the target month
            for (const log of leadSpecificLogs) {
                const logTimestamp = new Date(log.timestamp);
                if (logTimestamp < firstDayOfMonth) { // Log is before the start of the target month
                    if (log.details && typeof log.details === 'object' && 'newStage' in log.details) {
                        stageAtMonthStart = (log.details as any).newStage as LeadStage;
                    }
                } else {
                    break; // Logs are sorted, so we can stop
                }
            }
            currentStage = stageAtMonthStart; // This is the stage entering the month
        } else {
            // Lead was created within the target month. Its initial stage is correct as `currentStage`.
        }


        // Now, apply logs that happened *within* the month
        for (const log of leadSpecificLogs) {
            const logTimestamp = new Date(log.timestamp);
            // Only consider logs within the month for stage changes *during* the month affecting month-end state.
            // The stageAtMonthStart logic already handled pre-month logs.
            if (logTimestamp >= firstDayOfMonth && logTimestamp <= lastDayOfMonth) {
                 if (log.details && typeof log.details === 'object' && 'newStage' in log.details) {
                    currentStage = (log.details as any).newStage as LeadStage;
                }
            }
        }
        // After processing all relevant logs, currentStage holds the stage at month end (or the latest known stage if no logs in month)
        if (stageCounts[currentStage] !== undefined) {
            stageCounts[currentStage]!++;
        } else {
            // This case should ideally not happen if LeadStage enum is comprehensive
            // and DB data is clean. For safety, can log or assign to a default.
            console.warn(`Lead ${lead.ID} has an unhandled stage: ${currentStage} at month end.`);
        }
    }

    const result: ChartDataItem[] = Object.entries(stageCounts)
      .map(([name, value]) => ({ name: name as LeadStage, value: value || 0 }))
      .filter(item => item.value > 0); // Filter out stages with zero counts

    return result;

  } catch (error) {
    console.error('Data Service Error: fetchUserLeadStageCountsForMonthEnd.', error);
    if (error instanceof Error) throw error;
    throw new Error('An unknown error occurred while fetching user lead stage counts.');
  }
};

// --- Notification Service Functions ---

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{ ...notification }])
    .select()
    .single();
  if (error) throw new Error(`Failed to create notification: ${error.message}`);
  return data as Notification;
};

export const fetchNotificationsForUser = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);
  return (data as Notification[]) || [];
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) throw new Error(`Failed to mark notification as read: ${error.message}`);
};

export const updateNotification = async (notificationId: string, updates: Partial<Notification>): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update(updates)
    .eq('id', notificationId);
  if (error) throw new Error(`Failed to update notification: ${error.message}`);
};

export const deleteAllNotificationsForUser = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('recipient_id', userId);
  if (error) throw new Error(`Failed to delete notifications: ${error.message}`);
};
