export enum BusinessType {
  COMPANY_BRAND = 'Company/Brand',
  PERSONAL_BRAND = 'Personal Brand',
}

export enum EmailType {
  STANDARD = 'Standard',
  AI_PERSONALIZED = 'AI Personalized',
  NOT_SENT = 'Not Sent',
}

export enum LeadStage {
  COLD = 'Cold', // New, replaces 'New'
  WARM = 'Warm', // Kept
  HOT = 'Hot', // Kept
  CLOSED = 'Closed', // Renamed from 'Closed - Won'
  FROZEN_LOST = 'Frozen - Lost', // Renamed from 'Closed - Lost'
  JUNK = 'Junk', // New stage
  // Removed: NEW, CONTACTED, NEGOTIATION
}

// Used for UI display of payment progress, derived from amounts
export enum PaymentProgressState {
  WAITING_FOR_ADVANCE = 'Waiting for Advance Payment',
  ADVANCE_PAID = 'Advance Payment Received',
  FULL_PAYMENT_RECEIVED = 'Full Payment Received',
}

export interface NextMeetingPlanData {
  objective: string;
  agenda: string[];
  objection_handling: string[];
  closing_technique: string;
  materials: string[];
}

export interface MeetingDetailsData {
  summary: string;
  lead_score: number;
  lead_quality: string;
  host_quality: string;
  host_quality_description:string;
  next_meeting_plan: NextMeetingPlanData;
  pro_tips: string[];
}

export interface PaymentDetails {
  totalAmountQuoted: number;
  amountPaid: number;
  paymentMode: string;
  paymentDate?: string; // Stores full ISO 8601 timestamp string (e.g., "2024-10-26T14:30:00.000Z")
}

export interface Lead {
  id: string; // Corresponds to "ID" (uppercase) in Supabase leads table
  name: string;
  typeOfBusiness: BusinessType;
  brandName: string;
  email: string;
  contactNumber?: string;
  website?: string;
  submissionDate: Date | undefined;
  emailSent: boolean;
  emailType: EmailType;
  emailSentDate?: Date;
  stage: LeadStage;
  meetingDate?: Date; 
  meetLink?: string; 
  AfterMeeting?: string; 
  emailResponse: boolean; 
  tags?: string[];

  paymentDetails?: PaymentDetails; 

  assignedToUserId?: string | null; 
  assignedToUserFullName?: string | null; 
  sticky_note?: string;
}

export interface ChartDataItem {
  name: string;
  value: number;
}

export interface TimeSeriesDataItem {
  date: string;
  count: number;
}

export interface GlobalMessageConfig {
  type: 'success' | 'error';
  message: string;
}

export type LeadUpdatePayload = Partial<Pick<Lead, 'stage' | 'meetLink' | 'paymentDetails' | 'tags' | 'meetingDate'>>;

export enum UserRole {
  SUPERUSER = 'superuser',
  BASIC_USER = 'basic_user',
}

export interface UserProfile {
  id: string; 
  email: string;
  full_name?: string;
  role: UserRole;
  designation?: string; 
  created_at?: string;
  updated_at?: string;
}

export interface NewLeadDataBase {
  name: string;
  typeOfBusiness: BusinessType;
  brandName: string;
  email: string;
  contactNumber?: string;
  countryCode?: string; // Added for unification
  website?: string;
  stage: LeadStage; 
  tags?: string[];
}

export interface NewLeadData extends NewLeadDataBase {
  assignedToUserIdForSuperuser?: string | null; // Added back as optional
}

// --- Activity Log Types ---
export enum ActivityLogActionType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LEAD_CREATED = 'LEAD_CREATED', // If frontend were to create directly, or n8n logs this.
  LEAD_STAGE_UPDATE = 'LEAD_STAGE_UPDATE',
  LEAD_DETAILS_UPDATE = 'LEAD_DETAILS_UPDATE',
  LEAD_PAYMENT_UPDATE = 'LEAD_PAYMENT_UPDATE',
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  LEAD_UNASSIGNED = 'LEAD_UNASSIGNED',
  LEAD_DELETED = 'LEAD_DELETED',
  MEETING_LINK_UPDATED = 'MEETING_LINK_UPDATED',
  LEAD_STICKY_NOTE_UPDATED = 'LEAD_STICKY_NOTE_UPDATED',
  // Add more specific actions as needed
}

export interface ActivityLog {
  id: string;
  user_id: string; // User who is the subject of the log or whose lead is affected
  timestamp: string; // ISO string
  action_type: ActivityLogActionType;
  details?: Record<string, any> | null; // JSONB
  target_lead_id?: string | null;
  actor_user_id: string; // User who performed the action
  actor_user_full_name?: string; // For display convenience
  actor_user_email?: string; // For display convenience
  target_lead_name?: string; // For display convenience
}
// --- End Activity Log Types ---

// --- Notification Types ---
export enum NotificationType {
  LEAD_DELETE_REQUEST = 'lead_delete_request',
  LEAD_DELETE_CONFIRMED = 'lead_delete_confirmed',
  LEAD_DELETE_REJECTED = 'lead_delete_rejected',
  GENERIC = 'generic',
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
  recipient_id: string;
  sender_id?: string;
  data?: Record<string, any>;
}

// For notification actions
export enum NotificationAction {
  CONFIRM = 'confirm',
  REJECT = 'reject',
}

// Page type for navigation
export type Page = 'dashboard' | 'leadFlow' | 'filteredLeads' | 'users' | 'userDetail' | 'settings';
