import React, { useState, useEffect } from 'react';
import { Lead, LeadStage, MeetingDetailsData, LeadUpdatePayload, PaymentProgressState, PaymentDetails, UserProfile, UserRole, NotificationType } from '../types';
import MeetingDetailsDisplayModal from './MeetingDetailsDisplayModal'; 
import MeetLinkInputModal from './MeetLinkInputModal'; 
import PaymentDetailsInputModal from './PaymentDetailsInputModal';
import EditLeadDetailsModal from './EditLeadDetailsModal'; 
import WhatsAppIcon from './shared/WhatsAppIcon'; 
import { sanitizePhoneNumberForWhatsApp } from '../../utils/phoneNumberUtils';
import { CoreLeadDataUpdate } from '../App'; 
import { updateLeadStickyNote } from '../../services/dataService';
import { useTheme } from '../context/ThemeContext';
import { LIGHT_LEAD_STAGE_CHART_COLORS, DARK_LEAD_STAGE_CHART_COLORS } from '../constants';
import MeetingScheduledTagIcon from './shared/MeetingScheduledTagIcon';
import { useNotifications } from '../context/NotificationContext';


interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLeadDetails: (leadId: string, updates: LeadUpdatePayload, actorUserId: string, currentLeadData: Lead) => Promise<void>;
  userProfile: UserProfile | null; 
  actorUserProfile: UserProfile | null; 
  onDeleteLead: (leadId: string, actorUserId: string, leadName: string, currentAssignedUserId?: string | null) => Promise<void>; 
  onUpdateCoreLeadDetails: (leadId: string, updates: CoreLeadDataUpdate, actorUserId: string, currentLeadData: Lead) => Promise<void>; 
  onAssignLead: (leadId: string, targetUserId: string | null, actorUserId: string, currentAssignedUserId?: string | null, assignedToFullName?: string | null) => Promise<void>; 
  basicUsers: UserProfile[]; 
  isLoadingBasicUsers: boolean; 
  userProfiles: UserProfile[]; // NEW PROP
}

const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return 'N/A';
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); 
};

const formatDateTimeString = (isoTimestamp?: string): string => {
    if (!isoTimestamp) return 'N/A';
    try {
        const date = new Date(isoTimestamp);
        if (isNaN(date.getTime())) return 'Invalid Timestamp';
        return date.toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
    } catch (e) {
        return 'Invalid Timestamp';
    }
};

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ 
    lead, 
    isOpen, 
    onClose, 
    onUpdateLeadDetails, 
    userProfile,
    actorUserProfile, 
    onDeleteLead,
    onUpdateCoreLeadDetails,
    onAssignLead,
    basicUsers,
    isLoadingBasicUsers,
    userProfiles,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  const [parsedMeetingDetails, setParsedMeetingDetails] = useState<MeetingDetailsData | null>(null);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isMeetingDetailsDisplayModalOpen, setIsMeetingDetailsDisplayModalOpen] = useState(false);

  const [isMeetLinkModalOpen, setIsMeetLinkModalOpen] = useState(false);
  const [targetStageForMeetLink, setTargetStageForMeetLink] = useState<LeadStage | null>(null);
  const [meetLinkModalPurpose, setMeetLinkModalPurpose] = useState<'stage' | 'tag' | null>(null); // New state

  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
  const [paymentModalMode, setPaymentModalMode] = useState<'initial' | 'update'>('initial');
  
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false); 
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(''); 

  const [isEditingStickyNote, setIsEditingStickyNote] = useState(false);
  const [currentStickyNote, setCurrentStickyNote] = useState('');

  const isSuperUser = userProfile?.role === UserRole.SUPERUSER;
  const isLeadAssignedToCurrentUser = lead && userProfile && userProfile.role === UserRole.BASIC_USER 
                                    ? lead.assignedToUserId === userProfile.id 
                                    : false;
  const canEditLead = isSuperUser || isLeadAssignedToCurrentUser;

  const { theme } = useTheme();
  const { sendNotification } = useNotifications();
  const [showDeleteReasonModal, setShowDeleteReasonModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteRequestLoading, setDeleteRequestLoading] = useState(false);
  const [deleteRequestError, setDeleteRequestError] = useState<string | null>(null);

  const getButtonHoverClass = (stage: LeadStage): string => {
    switch (stage) {
      case LeadStage.COLD: return 'hover:bg-blue-200 dark:hover:bg-blue-700';
      case LeadStage.MEETING_SCHEDULED: return 'hover:bg-indigo-200 dark:hover:bg-indigo-600';
      case LeadStage.WARM: return 'hover:bg-amber-200 dark:hover:bg-amber-600';
      case LeadStage.HOT: return 'hover:bg-orange-200 dark:hover:bg-orange-600';
      case LeadStage.CLOSED: return 'hover:bg-green-200 dark:hover:bg-green-600';
      case LeadStage.FROZEN_LOST: return 'hover:bg-sky-100 dark:hover:bg-sky-600';
      case LeadStage.JUNK: return 'hover:bg-gray-300 dark:hover:bg-gray-600';
      default: return 'hover:bg-gray-200 dark:hover:bg-gray-700';
    }
  };

  useEffect(() => {
    if (isOpen && lead) {
        setSelectedAssigneeId(lead.assignedToUserId || '');
        setCurrentStickyNote(lead.sticky_note || '');
        setIsEditingStickyNote(false);
    }
  }, [isOpen, lead]);


  useEffect(() => {
    if (lead) {
      setUpdateError(null);
      setParsedMeetingDetails(null);
      setParsingError(null);
      setIsMeetingDetailsDisplayModalOpen(false); 
      setIsMeetLinkModalOpen(false); 
      setTargetStageForMeetLink(null);
      setMeetLinkModalPurpose(null);
      setIsPaymentDetailsModalOpen(false); 
      setIsEditLeadModalOpen(false); 
      setSelectedAssigneeId(lead.assignedToUserId || '');
    }
  }, [lead, isOpen]); 

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isEditLeadModalOpen) setIsEditLeadModalOpen(false);
        else if (isPaymentDetailsModalOpen) setIsPaymentDetailsModalOpen(false);
        else if (isMeetLinkModalOpen) { setIsMeetLinkModalOpen(false); setMeetLinkModalPurpose(null); }
        else if (isMeetingDetailsDisplayModalOpen) setIsMeetingDetailsDisplayModalOpen(false);
        else onClose(); 
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      if (!isMeetingDetailsDisplayModalOpen && !isMeetLinkModalOpen && !isPaymentDetailsModalOpen && !isEditLeadModalOpen) { 
        const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const modal = document.getElementById('lead-detail-modal-content');
        if (modal) {
          const firstFocusableElement = modal.querySelectorAll(focusableElements)[0] as HTMLElement;
          if (firstFocusableElement) {
              setTimeout(() => firstFocusableElement.focus(), 100); 
          }
        }
      }
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, isMeetingDetailsDisplayModalOpen, isMeetLinkModalOpen, isPaymentDetailsModalOpen, isEditLeadModalOpen]);

  if (!isOpen || !lead) {
    return null;
  }

  const handleToggleMeetingScheduledTag = async () => {
    if (!lead || !canEditLead || !actorUserProfile?.id) {
      setUpdateError("Action restricted: Missing lead data, permission, or actor information.");
      return;
    }
    setIsUpdating(true);
    setUpdateError(null);

    const isCurrentlyTagged = lead.tags?.includes("Meeting Scheduled");
    let newTags: string[];
    let newMeetLink: string | null = lead.meetLink || null;
    let newMeetingDate: Date | null = lead.meetingDate || null;

    if (isCurrentlyTagged) {
      // Turning OFF
      newTags = lead.tags?.filter(tag => tag !== "Meeting Scheduled") || [];
      newMeetLink = null; // Clear meet link
      newMeetingDate = null; // Clear meeting date
      try {
        await onUpdateLeadDetails(lead.id, { tags: newTags, meetLink: newMeetLink, meetingDate: newMeetingDate }, actorUserProfile.id, lead);
      } catch (error) {
        setUpdateError(error instanceof Error ? error.message : "Failed to turn off 'Meeting Scheduled' tag.");
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Turning ON - Open MeetLinkInputModal
      setMeetLinkModalPurpose('tag');
      setIsMeetLinkModalOpen(true);
      setIsUpdating(false); // Stop loading indicator while modal is open
    }
  };

  const handleMeetLinkSubmittedForTag = async (submittedMeetLink: string) => {
    if (!lead || !canEditLead || !actorUserProfile?.id) {
      setUpdateError("Action restricted: Missing lead data, permission, or actor information.");
      setIsMeetLinkModalOpen(false);
      setMeetLinkModalPurpose(null);
      return;
    }
    
    setIsUpdating(true);
    setUpdateError(null);
    setIsMeetLinkModalOpen(false);
    setMeetLinkModalPurpose(null);

    const newTags = [...(lead.tags || []).filter(tag => tag !== "Meeting Scheduled"), "Meeting Scheduled"];
    
    try {
      await onUpdateLeadDetails(
        lead.id, 
        { 
          tags: newTags, 
          meetLink: submittedMeetLink, 
          meetingDate: new Date() // Set current date/time for meetingDate
        }, 
        actorUserProfile.id, 
        lead
      );
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Failed to turn on 'Meeting Scheduled' tag and save link.");
    } finally {
      setIsUpdating(false);
    }
  };

  const openPaymentModalForUpdate = () => {
    if (!canEditLead) return; 
    setIsPaymentDetailsModalOpen(true);
  };
  
  const handleOpenEditLeadModal = () => {
    if (!canEditLead || !lead) return; 
    setIsEditLeadModalOpen(true);
  };

  const handleSaveCoreLeadDetails = async (updates: CoreLeadDataUpdate) => {
    if (!lead || !canEditLead || !actorUserProfile?.id) {
        setUpdateError("Cannot save: Missing lead data, permission, or actor information.");
        return;
    }
    setIsUpdating(true);
    setUpdateError(null);
    try {
        await onUpdateCoreLeadDetails(lead.id, updates, actorUserProfile.id, lead);
        setIsEditLeadModalOpen(false);
    } catch (error) {
        setUpdateError(error instanceof Error ? error.message : "Error during core details update.");
    } finally {
        setIsUpdating(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!isSuperUser || !lead || !actorUserProfile?.id) {
      setUpdateError("Deletion restricted or actor information missing.");
      return;
    }
    const confirmation = window.confirm(`Are you sure you want to delete the lead "${lead.name}"? This action cannot be undone.`);
    if (confirmation) {
      setIsUpdating(true);
      setUpdateError(null);
      try {
        await onDeleteLead(lead.id, actorUserProfile.id, lead.name, lead.assignedToUserId);
      } catch (error) {
        setUpdateError(error instanceof Error ? error.message : "Error during deletion.");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Handler for basic user delete request
  const handleRequestDelete = async () => {
    if (!lead || !userProfile || !actorUserProfile) return;
    setDeleteRequestLoading(true);
    setDeleteRequestError(null);
    try {
      // Use provided SuperUser ID directly
      const superUserIds = ['bfbb3bd8-1041-487b-af60-0f263956008c'];
      await Promise.all(superUserIds.map((superUserId) =>
        sendNotification({
          type: NotificationType.LEAD_DELETE_REQUEST,
          message: `User ${actorUserProfile.full_name || actorUserProfile.email} requests to delete lead "${lead.name}".\nReason: ${deleteReason || 'No reason provided.'}`,
          recipient_id: superUserId,
          sender_id: actorUserProfile.id,
          data: { leadId: lead.id, leadName: lead.name, reason: deleteReason, requestedBy: actorUserProfile.full_name || actorUserProfile.email },
        })
      ));
      setShowDeleteReasonModal(false);
      setDeleteReason('');
      // Optionally show a local success message
    } catch (err) {
      setDeleteRequestError(err instanceof Error ? err.message : 'Failed to send delete request.');
    } finally {
      setDeleteRequestLoading(false);
    }
  };

  const handleAssignmentChange = async () => {
    if (!isSuperUser || !lead || isUpdating || !actorUserProfile?.id) {
        setUpdateError("Assignment restricted or actor information missing.");
        return;
    }
    setIsUpdating(true);
    setUpdateError(null);
    const targetUser = basicUsers.find(u => u.id === selectedAssigneeId);
    const targetUserName = targetUser?.full_name || targetUser?.email || null;
    try {
      await onAssignLead(lead.id, selectedAssigneeId || null, actorUserProfile.id, lead.assignedToUserId, targetUserName);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Failed to update assignment.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStageUpdate = async (newStage: LeadStage) => {
    if (!canEditLead || newStage === lead.stage || isUpdating || !actorUserProfile?.id) return;
    setUpdateError(null);

    // The LeadStage.MEETING_SCHEDULED enum member is removed.
    // This specific 'if' block might become dead code or needs re-evaluation if
    // another stage should trigger meet link input.
    // For now, the primary way to add a meet link is via the new Tag toggle.
    if (newStage === LeadStage.MEETING_SCHEDULED) { // This will likely not be true anymore
      setMeetLinkModalPurpose('stage'); 
      setTargetStageForMeetLink(newStage);
      setIsMeetLinkModalOpen(true);
    } else if (newStage === LeadStage.CLOSED) {
      if (lead.paymentDetails && typeof lead.paymentDetails.totalAmountQuoted === 'number') {
        if (lead.paymentDetails.amountPaid >= lead.paymentDetails.totalAmountQuoted) {
          setIsUpdating(true);
          try {
            await onUpdateLeadDetails(lead.id, { stage: newStage }, actorUserProfile.id, lead);
          } catch (error) {
            setUpdateError(error instanceof Error ? error.message : "Error updating stage.");
          } finally {
            setIsUpdating(false);
          }
        } else {
          setPaymentModalMode('update');
          setIsPaymentDetailsModalOpen(true);
        }
      } else {
        setPaymentModalMode('initial');
        setIsPaymentDetailsModalOpen(true);
      }
    } else { 
      setIsUpdating(true);
      try {
        await onUpdateLeadDetails(lead.id, { stage: newStage }, actorUserProfile.id, lead);
      } catch (error) {
        setUpdateError(error instanceof Error ? error.message : "Error updating stage.");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // This function is now primarily for stage-triggered meet link submissions (if any remain)
  const handleMeetLinkSubmitted = async (meetLink: string) => {
    setIsMeetLinkModalOpen(false); 
    setMeetLinkModalPurpose(null);
    if (!targetStageForMeetLink || !canEditLead || !actorUserProfile?.id) return;
    
    setIsUpdating(true);
    setUpdateError(null);
    try {
      // If setting meeting date for a stage change, use current date.
      // This might need more specific logic if different stages require different date handling.
      await onUpdateLeadDetails(lead.id, { stage: targetStageForMeetLink, meetLink: meetLink, meetingDate: new Date() }, actorUserProfile.id, lead);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Error updating stage and link.");
    } finally {
      setIsUpdating(false);
      setTargetStageForMeetLink(null);
    }
  };

  const handlePaymentDetailsSubmitted = async (paymentData: { 
    totalAmountQuoted: number, 
    amountPaid: number, 
    paymentMode: string,
  }) => {
    setIsPaymentDetailsModalOpen(false);
    if (!canEditLead || !actorUserProfile?.id) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const paymentTimestamp = new Date().toISOString(); 
      const newPaymentDetails: PaymentDetails = { ...paymentData, paymentDate: paymentTimestamp };
      await onUpdateLeadDetails(lead.id, { stage: LeadStage.CLOSED, paymentDetails: newPaymentDetails }, actorUserProfile.id, lead);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Error updating payment details.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenMeetingDetailsDisplayModal = () => {
    if (!lead.AfterMeeting) {
      setParsingError("No meeting details available for this lead.");
      setParsedMeetingDetails(null);
    } else {
      try {
        let jsonStr = lead.AfterMeeting.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) jsonStr = match[2].trim();
        setParsedMeetingDetails(JSON.parse(jsonStr));
        setParsingError(null);
      } catch (error) {
        setParsingError("Failed to parse meeting details. Data might be malformed.");
        setParsedMeetingDetails(null);
      }
    }
    setIsMeetingDetailsDisplayModalOpen(true);
  };
  
  const detailItemClass = "py-2.5 border-b border-gray-200/80 dark:border-zinc-800/70 flex flex-col sm:flex-row sm:items-start";
  const labelClass = "text-xs sm:text-sm font-medium text-gray-500 dark:text-zinc-400 min-w-[100px] sm:min-w-[140px] mb-0.5 sm:mb-0 shrink-0";
  const valueClass = "text-sm text-gray-800 dark:text-zinc-200 break-words";

  const getPaymentProgress = (): { state: PaymentProgressState, message: string } | null => {
    if (!lead || !lead.paymentDetails || typeof lead.paymentDetails.totalAmountQuoted !== 'number') return null;
    const { amountPaid, totalAmountQuoted } = lead.paymentDetails;
    if (amountPaid <= 0) return { state: PaymentProgressState.WAITING_FOR_ADVANCE, message: PaymentProgressState.WAITING_FOR_ADVANCE };
    if (amountPaid < totalAmountQuoted) return { state: PaymentProgressState.ADVANCE_PAID, message: `${PaymentProgressState.ADVANCE_PAID}: ${formatCurrency(amountPaid)}` };
    return { state: PaymentProgressState.FULL_PAYMENT_RECEIVED, message: PaymentProgressState.FULL_PAYMENT_RECEIVED };
  };

  const paymentProgress = getPaymentProgress();
  
  const progressLineClass = (segment: 1 | 2) => {
    if (!paymentProgress) return 'flex-1 h-0.5 bg-gray-300 dark:bg-zinc-600';
    if (segment === 1) {
      if (paymentProgress.state === PaymentProgressState.ADVANCE_PAID || paymentProgress.state === PaymentProgressState.FULL_PAYMENT_RECEIVED) {
        return paymentProgress.state === PaymentProgressState.FULL_PAYMENT_RECEIVED ? 'flex-1 h-0.5 bg-green-500 dark:bg-green-400' : 'flex-1 h-0.5 bg-yellow-400 dark:bg-yellow-400';
      }
      return 'flex-1 h-0.5 bg-gray-300 dark:bg-zinc-600';
    } else {
      if (paymentProgress.state === PaymentProgressState.FULL_PAYMENT_RECEIVED) {
        return 'flex-1 h-0.5 bg-green-500 dark:bg-green-400';
      }
      return 'flex-1 h-0.5 bg-gray-300 dark:bg-zinc-600';
    }
  };
  
  const progressDotClass = (dot: 'due' | 'advance' | 'full') => {
    if (!paymentProgress) return 'w-3 h-3 rounded-full border-2 bg-gray-300 border-gray-400 dark:bg-zinc-600 dark:border-zinc-500';
    if (dot === 'due') {
      return paymentProgress.state === PaymentProgressState.WAITING_FOR_ADVANCE
        ? 'w-3 h-3 rounded-full border-2 bg-yellow-400 border-yellow-500 dark:bg-yellow-400 dark:border-yellow-400'
        : 'w-3 h-3 rounded-full border-2 bg-green-500 border-green-600 dark:bg-green-400 dark:border-green-500';
    }
    if (dot === 'advance') {
      if (paymentProgress.state === PaymentProgressState.ADVANCE_PAID) return 'w-3 h-3 rounded-full border-2 bg-yellow-400 border-yellow-500 dark:bg-yellow-400 dark:border-yellow-400';
      if (paymentProgress.state === PaymentProgressState.FULL_PAYMENT_RECEIVED) return 'w-3 h-3 rounded-full border-2 bg-green-500 border-green-600 dark:bg-green-400 dark:border-green-500';
      return 'w-3 h-3 rounded-full border-2 bg-gray-300 border-gray-400 dark:bg-zinc-600 dark:border-zinc-500';
    }
    return paymentProgress.state === PaymentProgressState.FULL_PAYMENT_RECEIVED
      ? 'w-3 h-3 rounded-full border-2 bg-green-500 border-green-600 dark:bg-green-400 dark:border-green-500'
      : 'w-3 h-3 rounded-full border-2 bg-gray-300 border-gray-400 dark:bg-zinc-600 dark:border-zinc-500';
  };
  
  const canAddOrUpdateExistingPayment = canEditLead && lead.paymentDetails && 
                                  typeof lead.paymentDetails.totalAmountQuoted === 'number' &&
                                  lead.paymentDetails.amountPaid < lead.paymentDetails.totalAmountQuoted;
  const canAddInitialPaymentForClosedLead = canEditLead && lead.stage === LeadStage.CLOSED && !lead.paymentDetails;

  const handleWhatsAppClickInModal = (e: React.MouseEvent, phoneNumber?: string) => {
    e.stopPropagation();
    if (phoneNumber) {
      const sanitizedNumber = sanitizePhoneNumberForWhatsApp(phoneNumber);
      if (sanitizedNumber) window.open(`https://wa.me/${sanitizedNumber}`, '_blank', 'noopener,noreferrer');
      else alert("Invalid phone number for WhatsApp.");
    }
  };

  const SuperUserOrAssignedDiagnosticMessage = () => {
    if (isSuperUser) return null; 
    if (lead && lead.assignedToUserId && !isLeadAssignedToCurrentUser) {
      return (
        <div className="my-3 p-3 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-300 dark:border-blue-700/50 rounded-lg text-xs" role="alert">
          This lead is assigned to <strong className="font-semibold">{lead.assignedToUserFullName || 'another user'}</strong>. You have read-only access for some actions.
        </div>
      );
    }
    if (lead && !lead.assignedToUserId) {
         return (
        <div className="my-3 p-3 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700/50 rounded-lg text-xs" role="alert">
          This lead is currently <strong className="font-semibold">unassigned</strong>. Editing features are disabled for your role. A Superuser can assign this lead.
        </div>
      );
    }
    return null; 
  };

  const handleEditStickyNote = () => {
    if (!canEditLead) return;
    setIsEditingStickyNote(true);
  };

  const handleCancelStickyNoteEdit = () => {
    setIsEditingStickyNote(false);
    setCurrentStickyNote(lead?.sticky_note || '');
  };

  const handleSaveStickyNote = async () => {
    if (!lead || !actorUserProfile?.id || !canEditLead) {
      setUpdateError("Cannot save note: Missing lead data, permission, or actor information.");
      return;
    }
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await updateLeadStickyNote(lead.id, currentStickyNote, actorUserProfile.id);
      setIsEditingStickyNote(false);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Failed to save sticky note.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-modal-backdrop-appear"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-detail-modal-title"
        onClick={isMeetingDetailsDisplayModalOpen || isMeetLinkModalOpen || isPaymentDetailsModalOpen || isEditLeadModalOpen ? undefined : onClose} 
      >
        <div 
          id="lead-detail-modal-content"
          className="bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl shadow-soft-dreamy dark:shadow-dark-soft-dreamy w-11/12 sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5 md:space-y-6 transform animate-modal-content-appear modal-scrollable"
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2"> 
              <h2 id="lead-detail-modal-title" className="text-xl md:text-2xl font-semibold text-blue-600 dark:text-blue-400">{lead.name}</h2>
              <button 
                onClick={handleToggleMeetingScheduledTag}
                disabled={!canEditLead || isUpdating}
                className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-zinc-900
                            ${lead.tags?.includes("Meeting Scheduled") 
                              ? 'focus:ring-indigo-500' 
                              : 'focus:ring-gray-400'}
                            ${!canEditLead || isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={lead.tags?.includes("Meeting Scheduled") ? "Turn OFF Meeting Scheduled Tag" : "Turn ON Meeting Scheduled Tag"}
                aria-pressed={lead.tags?.includes("Meeting Scheduled")}
              >
                {lead.tags?.includes("Meeting Scheduled") ? (
                  <MeetingScheduledTagIcon /> 
                ) : (
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700"
                    title="Meeting Scheduled Tag is OFF"
                  >
                    M
                  </div>
                )}
              </button>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-1 -mr-2 -mt-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-900"
              aria-label="Close lead details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <SuperUserOrAssignedDiagnosticMessage />

          <div className="space-y-2.5">
            <div className={detailItemClass}><span className={labelClass}>Brand:</span> <span className={valueClass}>{lead.brandName}</span></div>
            <div className={detailItemClass}><span className={labelClass}>Business Type:</span> <span className={valueClass}>{lead.typeOfBusiness}</span></div>
            <div className={detailItemClass}><span className={labelClass}>Email:</span> <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 text-sm break-all">{lead.email}</a></div>
            <div className={detailItemClass}>
              <span className={labelClass}>Contact No.:</span>
              <span className={`${valueClass} flex items-center`}>
                {lead.contactNumber || 'N/A'}
                {lead.contactNumber && (
                  <button onClick={(e) => handleWhatsAppClickInModal(e, lead.contactNumber)} className="ml-2 p-1 rounded-full text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-700/50 transition-colors focus:outline-none focus:ring-1 focus:ring-green-500" aria-label={`Chat on WhatsApp`} title="Open WhatsApp chat">
                    <WhatsAppIcon className="w-4 h-4" />
                  </button>
                )}
              </span>
            </div>
            <div className={detailItemClass}><span className={labelClass}>Website:</span> {lead.website ? <a href={lead.website.startsWith('http') ? lead.website : `http://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline dark:text-purple-400 dark:hover:text-purple-300 text-sm break-all">{lead.website}</a> : <span className="text-sm text-gray-400 dark:text-zinc-500 italic">Not provided</span>}</div>
            <div className={detailItemClass}><span className={labelClass}>Submitted:</span> <span className={valueClass}>{new Date(lead.submissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
            <div className={detailItemClass}><span className={labelClass}>Email Status:</span> <span className={valueClass}>{lead.emailSent ? `Sent (${lead.emailType})` : 'Not Sent'}</span></div>
             {(lead.meetLink || lead.meetingDate) && lead.tags?.includes("Meeting Scheduled") && (
                <>
                  {lead.meetingDate && (
                    <div className={detailItemClass}>
                        <span className={labelClass}>Meeting Date:</span>
                        <span className={valueClass}>{formatDateTimeString(lead.meetingDate.toISOString())}</span>
                    </div>
                  )}
                  {lead.meetLink && (
                    <div className={detailItemClass}>
                        <span className={labelClass}>Meeting Link:</span>
                        <a href={lead.meetLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline dark:text-green-400 dark:hover:text-green-300 text-sm break-all">{lead.meetLink}</a>
                    </div>
                  )}
                </>
            )}
             {isSuperUser && ( 
                <div className={detailItemClass.replace('border-b-0', '')}>
                    <span className={labelClass}>Assigned To:</span>
                    <span className={valueClass}>{lead.assignedToUserFullName || <span className="italic text-gray-400 dark:text-zinc-500">Unassigned</span>}</span>
                </div>
            )}
          </div>
           
            {(canEditLead || isSuperUser) && (
                <div className="pt-3 border-t border-gray-200/80 dark:border-zinc-800/70 flex space-x-2">
                    {canEditLead && ( 
                         <button onClick={handleOpenEditLeadModal} className="flex-1 p-2.5 text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-lg dark:text-yellow-200 dark:bg-yellow-700/50 dark:hover:bg-yellow-600/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors" aria-label="Edit core lead details">
                            Edit Lead Details
                        </button>
                    )}
                    {isSuperUser && canEditLead && (
                        <button
                          type="button"
                          onClick={handleDeleteConfirmed}
                          className="flex-1 p-2.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg dark:text-red-200 dark:bg-red-700/30 dark:hover:bg-red-700/50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                          disabled={isUpdating}
                          aria-label="Delete this lead permanently"
                        >
                          {isUpdating ? 'Deleting...' : 'Delete Lead'}
                        </button>
                    )}
                    {userProfile?.role === UserRole.BASIC_USER && isLeadAssignedToCurrentUser && (
                      <button
                        className="flex-1 p-2.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg dark:text-red-200 dark:bg-red-700/30 dark:hover:bg-red-700/50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        onClick={() => setShowDeleteReasonModal(true)}
                      >
                        Request Lead Deletion
                      </button>
                    )}
                </div>
            )}

            {isSuperUser && ( 
                <div className="pt-4 mt-3 space-y-3 border-t border-gray-200/80 dark:border-zinc-800/70 bg-gray-50/50 dark:bg-zinc-800/30 p-4 rounded-lg">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-zinc-100">Manual Assignment</h3>
                    {isLoadingBasicUsers ? (
                        <p className="text-sm text-gray-500 dark:text-zinc-400">Loading users...</p>
                    ) : (
                    <div className="flex items-center space-x-2">
                        <select 
                            value={selectedAssigneeId} 
                            onChange={(e) => setSelectedAssigneeId(e.target.value)}
                            className="flex-grow p-2.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-300 focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:focus:ring-blue-400"
                            aria-label="Select user to assign lead"
                            disabled={isUpdating}
                        >
                            <option value="">Unassign / Select User</option>
                            {basicUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role})</option>
                            ))}
                        </select>
                        <button 
                            onClick={handleAssignmentChange} 
                            disabled={isUpdating || selectedAssigneeId === (lead.assignedToUserId || '')}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg dark:bg-blue-500 dark:hover:bg-blue-400 disabled:opacity-50"
                        >
                            {isUpdating ? 'Assigning...' : 'Save'}
                        </button>
                    </div>
                    )}
                </div>
            )}
          
          {lead.AfterMeeting && (
              <div className="pt-3 border-t border-gray-200/80 dark:border-zinc-800/70">
                  <button onClick={handleOpenMeetingDetailsDisplayModal} className="w-full flex justify-center items-center p-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:text-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                      View Meeting Analysis
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                  </button>
              </div>
          )}

          {lead.paymentDetails && (
            <div className="pt-4 mt-3 space-y-3 border-t border-gray-200/80 dark:border-zinc-800/70">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-semibold text-gray-800 dark:text-zinc-100 mb-2">Payment Information</h3>
                {canAddOrUpdateExistingPayment && (
                    <button onClick={openPaymentModalForUpdate} disabled={!canEditLead || isUpdating} className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-md dark:text-blue-300 dark:bg-blue-700/50 dark:hover:bg-blue-600/50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Add or update payment details" aria-disabled={!canEditLead} title={!canEditLead ? "Payment updates restricted" : "Add or update payment"}>
                        Add/Update Payment
                    </button>
                )}
              </div>
              <div className={detailItemClass.replace('border-b', 'border-b-0 sm:border-b')}><span className={labelClass}>Total Quoted:</span> <span className={`${valueClass} font-medium`}>{formatCurrency(lead.paymentDetails.totalAmountQuoted)}</span></div>
              <div className={detailItemClass.replace('border-b', 'border-b-0 sm:border-b')}><span className={labelClass}>Amount Paid:</span> <span className={`${valueClass} font-medium text-green-600 dark:text-green-400`}>{formatCurrency(lead.paymentDetails.amountPaid)}</span></div>
              <div className={detailItemClass.replace('border-b', 'border-b-0 sm:border-b')}><span className={labelClass}>Payment Mode:</span> <span className={valueClass}>{lead.paymentDetails.paymentMode || 'N/A'}</span></div>
               <div className={detailItemClass.replace('border-b', 'border-b-0')}><span className={labelClass}>Last Payment Timestamp:</span> <span className={valueClass}>{formatDateTimeString(lead.paymentDetails.paymentDate)}</span></div>
              {paymentProgress && (
                <div className="pt-3 mt-2">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-zinc-300 mb-2.5">Payment Progress:</h4>
                  <div className="flex items-center space-x-0 w-full max-w-md mx-auto">
                    <div className="flex flex-col items-center text-center w-1/3">
                      <div className={progressDotClass('due')} />
                      <p className={`text-xs mt-1.5 ${paymentProgress.state === PaymentProgressState.WAITING_FOR_ADVANCE ? 'text-yellow-600 dark:text-yellow-400 font-semibold' : paymentProgress.state === PaymentProgressState.FULL_PAYMENT_RECEIVED ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-zinc-400'}`}>Advance Due</p>
                    </div>
                    <div className={progressLineClass(1)} />
                    <div className="flex flex-col items-center text-center w-1/3">
                      <div className={progressDotClass('advance')} />
                      <p className={`text-xs mt-1.5 ${paymentProgress.state === PaymentProgressState.ADVANCE_PAID ? 'text-yellow-600 dark:text-yellow-400 font-semibold' : paymentProgress.state === PaymentProgressState.FULL_PAYMENT_RECEIVED ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-zinc-400'}`}>{PaymentProgressState.ADVANCE_PAID.replace('Received', 'Rcvd.')}<br/>{lead.paymentDetails?.amountPaid && lead.paymentDetails.amountPaid > 0 && lead.paymentDetails.amountPaid < (lead.paymentDetails.totalAmountQuoted || Infinity) ? `(${formatCurrency(lead.paymentDetails.amountPaid)})` : ''}</p>
                    </div>
                    <div className={progressLineClass(2)} />
                    <div className="flex flex-col items-center text-center w-1/3">
                      <div className={progressDotClass('full')} />
                      <p className={`text-xs mt-1.5 ${paymentProgress.state === PaymentProgressState.FULL_PAYMENT_RECEIVED ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-zinc-400'}`}>Full Payment</p>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-500 dark:text-zinc-400 mt-2">{paymentProgress.message}</p>
                </div>
              )}
            </div>
          )}
          {lead.stage === LeadStage.CLOSED && !lead.paymentDetails && (
             <div className="pt-4 mt-3 space-y-3 border-t border-gray-200/80 dark:border-zinc-800/70">
                <p className="text-sm text-gray-500 dark:text-zinc-400 text-center">Payment details not yet recorded for this closed lead.</p>
                 {canAddInitialPaymentForClosedLead && (
                     <button onClick={() => { setPaymentModalMode('initial'); setIsPaymentDetailsModalOpen(true); }} disabled={isUpdating} className="w-full mt-2 px-3 py-2 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md dark:text-green-200 dark:bg-green-700/50 dark:hover:bg-green-600/50 transition-colors shadow-sm disabled:opacity-50" aria-label="Add payment details for closed lead">
                        Add Payment Details
                    </button>
                 )}
             </div>
          )}

          <div className="pt-4 mt-3 space-y-2 border-t border-gray-200/80 dark:border-zinc-800/70">
            <h3 className="text-md font-semibold text-gray-800 dark:text-zinc-100 mb-1.5">Sticky Note</h3>
            {!isEditingStickyNote ? (
              <div className={`p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700/60 min-h-[70px] shadow-sm`}>
                <p className="text-sm text-gray-700 dark:text-zinc-200 whitespace-pre-wrap">
                  {currentStickyNote || <span className="italic text-gray-400 dark:text-zinc-500">No note yet.</span>}
                </p>
                {canEditLead && (
                  <button
                    onClick={handleEditStickyNote}
                    disabled={isUpdating}
                    className="mt-2.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md dark:text-blue-200 dark:bg-blue-700/60 dark:hover:bg-blue-600/60 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Edit Note
                  </button>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  value={currentStickyNote}
                  onChange={(e) => setCurrentStickyNote(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-sm text-gray-700 dark:text-zinc-100 min-h-[100px] focus:ring-1 focus:ring-yellow-500 shadow-inner"
                  rows={4}
                  aria-label="Sticky note content"
                  disabled={isUpdating}
                />
                <div className="mt-2.5 space-x-2">
                  <button
                    onClick={handleSaveStickyNote}
                    disabled={isUpdating}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md dark:bg-green-500 dark:hover:bg-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save Note'}
                  </button>
                  <button
                    onClick={handleCancelStickyNoteEdit}
                    disabled={isUpdating}
                    className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md dark:text-zinc-200 dark:bg-zinc-600 dark:hover:bg-zinc-505 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-gray-200/80 dark:border-zinc-800/70 mt-4">
            <h3 className="text-sm md:text-md font-medium text-gray-800 dark:text-zinc-200 mb-1">Update Lead Stage:</h3>
            {isUpdating && <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center mb-2"><svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" fill="currentColor"></path></svg>Processing...</p>}
            <div className="flex flex-wrap justify-start gap-2 w-full max-w-md mx-auto">
              {Object.values(LeadStage).filter(stage => typeof stage === 'string').map((stageValue) => (
                <button
                  key={stageValue}
                  type="button"
                  onClick={() => handleStageUpdate(stageValue)}
                  disabled={isUpdating || stageValue === lead.stage || !canEditLead}
                  className={`w-40 p-2.5 text-xs sm:text-sm font-medium rounded-md border transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 focus:ring-blue-500 ${
                    stageValue === lead.stage 
                      ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500 cursor-default shadow-md' 
                      : `${getButtonHoverClass(stageValue)} bg-white text-gray-700 border-gray-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 ${!canEditLead ? 'opacity-60 cursor-not-allowed !bg-gray-100 dark:!bg-zinc-800' : 'shadow-sm hover:shadow'}`
                  } ${isUpdating && stageValue !== lead.stage ? 'opacity-60 cursor-not-allowed' : ''}`}
                  aria-pressed={stageValue === lead.stage}
                  aria-disabled={!canEditLead && stageValue !== lead.stage}
                    title={!canEditLead && stageValue !== lead.stage ? "Stage updates restricted" : ""}
                  >
                    {stageValue.replace('_', ' ').replace('-', ' - ')}
                  </button>
                ))}
            </div> 
        </div> 

          {updateError && <div className="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-200 p-3.5 rounded-md text-sm border border-red-200/80 dark:border-red-800/60 shadow-sm mt-3" role="alert"><p><strong className="font-semibold">Update Failed:</strong> {updateError}</p></div>}

          <div className="flex flex-row-reverse pt-3 md:pt-4 mt-2">
             {/* Remove Close and Delete Lead buttons for all users */}
          </div>
        </div>
      </div>
      
      <MeetingDetailsDisplayModal isOpen={isMeetingDetailsDisplayModalOpen} onClose={() => setIsMeetingDetailsDisplayModalOpen(false)} meetingDetails={parsedMeetingDetails} parsingError={parsingError} leadName={lead.name || "Lead"} />
      
      <MeetLinkInputModal 
          isOpen={isMeetLinkModalOpen} 
          onClose={() => { setIsMeetLinkModalOpen(false); setMeetLinkModalPurpose(null); }} 
          onSubmit={meetLinkModalPurpose === 'tag' ? handleMeetLinkSubmittedForTag : handleMeetLinkSubmitted}
          leadName={lead.name || "Selected Lead"} 
      />

      {lead && <PaymentDetailsInputModal isOpen={isPaymentDetailsModalOpen} onClose={() => setIsPaymentDetailsModalOpen(false)} onSubmit={handlePaymentDetailsSubmitted} leadName={lead.name || "Selected Lead"} currentTotalAmountQuoted={lead.paymentDetails?.totalAmountQuoted} currentAmountPaid={lead.paymentDetails?.amountPaid} currentPaymentMode={lead.paymentDetails?.paymentMode} existingPaymentDateForDisplay={lead.paymentDetails?.paymentDate ? formatDateTimeString(lead.paymentDetails.paymentDate) : undefined} isSuperUser={canEditLead} />}
      {lead && canEditLead && <EditLeadDetailsModal isOpen={isEditLeadModalOpen} onClose={() => setIsEditLeadModalOpen(false)} currentLead={lead} onSave={handleSaveCoreLeadDetails} />}

      {/* Basic user delete button */}
      {userProfile?.role === UserRole.BASIC_USER && isLeadAssignedToCurrentUser && (
        <button
          className="mt-4 px-4 py-2 rounded-lg shadow bg-red-600 text-white font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-all"
          onClick={() => setShowDeleteReasonModal(true)}
        >
          Request Lead Deletion
        </button>
      )}
      {/* Delete reason modal */}
      {showDeleteReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-2 text-red-600 dark:text-red-300">Request Lead Deletion</h2>
            <label className="block mb-2 text-gray-700 dark:text-zinc-200">Reason (optional):</label>
            <textarea
              className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded mb-4 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
              rows={3}
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              placeholder="Enter reason for deletion (optional)"
            />
            {deleteRequestError && <div className="text-red-500 mb-2">{deleteRequestError}</div>}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 rounded hover:bg-gray-300 dark:hover:bg-zinc-600"
                onClick={() => setShowDeleteReasonModal(false)}
                disabled={deleteRequestLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleRequestDelete}
                disabled={deleteRequestLoading}
              >
                {deleteRequestLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeadDetailModal;