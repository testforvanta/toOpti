import React, { useState, useEffect, FormEvent } from 'react';
import { BusinessType, LeadStage, UserProfile, UserRole, NewLeadData } from '../types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (leadData: NewLeadData) => Promise<void>;
  userProfile: UserProfile; // Added: Current user's profile
  basicUserProfilesList: UserProfile[]; // Added: List of basic users for assignment
  isLoadingBasicUsers: boolean; // Added: Loading state for basic users list
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddLead,
  userProfile,
  basicUserProfilesList,
  isLoadingBasicUsers
}) => {
  const initialFormDataBase: Omit<NewLeadData, 'assignedToUserIdForSuperuser'> = { // Base type without the optional field
    name: '',
    brandName: '',
    email: '',
    contactNumber: '',
    website: '',
    typeOfBusiness: BusinessType.COMPANY_BRAND,
    stage: LeadStage.COLD,
  };

  const [formData, setFormData] = useState<NewLeadData>(() => ({
    ...initialFormDataBase,
    assignedToUserIdForSuperuser: userProfile.role === UserRole.SUPERUSER ? '' : undefined,
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof NewLeadData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const isSuperUser = userProfile.role === UserRole.SUPERUSER;

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialFormDataBase,
        assignedToUserIdForSuperuser: isSuperUser ? '' : undefined,
      });
      setErrors({});
      setIsSaving(false);
      setSubmissionError(null);
      
      const firstInput = document.getElementById('lead-name-input');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [isOpen, isSuperUser]); 

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, isSaving]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof NewLeadData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setSubmissionError(null); 
  };

  const validateField = (name: keyof NewLeadData, value: string): string | undefined => {
    switch (name) {
      case 'name':
        return value.trim() ? undefined : 'Lead name is required.';
      case 'brandName':
        return value.trim() ? undefined : 'Brand name is required.';
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Email address is invalid.';
        return undefined;
      case 'website':
        const trimmedValue = value.trim();
        if (!trimmedValue) {
          return undefined; 
        }
        if (trimmedValue.startsWith('http://localhost') || trimmedValue.startsWith('https://localhost')) {
            return undefined; 
        }
        try {
            let testUrl = trimmedValue;
            if (!trimmedValue.startsWith('http://') && !trimmedValue.startsWith('https://') && trimmedValue.includes('.')) {
                testUrl = `http://${trimmedValue}`;
            }
            const parsedUrl = new URL(testUrl);
            if (parsedUrl.hostname && (parsedUrl.hostname.includes('.') || parsedUrl.hostname === 'localhost')) {
                 return undefined; 
            }
        } catch (e) {
            // URL constructor failed
        }
        return 'Website URL is invalid. Example: https://example.com or www.example.com.';
      default:
        return undefined;
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewLeadData, string>> = {};
    const fieldsToValidate: Array<keyof Omit<NewLeadData, 'assignedToUserIdForSuperuser'>> = ['name', 'brandName', 'email', 'website'];
    fieldsToValidate.forEach(key => {
      const error = validateField(key, String(formData[key as keyof NewLeadData] ?? ''));
      if (error) {
        newErrors[key] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    if (!validateForm()) {
      return;
    }
    setIsSaving(true);
    
    const leadPayload: NewLeadData = { ...formData };
    if (isSuperUser) {
      leadPayload.assignedToUserIdForSuperuser = formData.assignedToUserIdForSuperuser || null;
    } else {
      delete leadPayload.assignedToUserIdForSuperuser;
    }

    try {
      await onAddLead(leadPayload);
    } catch (error) {
      console.error("AddLeadModal: Failed to add lead", error);
      setSubmissionError(error instanceof Error ? error.message : "An unknown error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputBaseClass = "w-full p-2.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors duration-150 shadow-sm focus:shadow dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:placeholder-zinc-500";
  const errorTextClass = "text-red-500 dark:text-red-400 text-xs mt-1";

  return (
    <div 
      className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-modal-backdrop-appear"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-lead-modal-title"
      onClick={isSaving ? undefined : onClose} 
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl shadow-soft-dreamy dark:shadow-dark-soft-dreamy w-full max-w-lg max-h-[90vh] overflow-y-auto transform animate-modal-content-appear modal-scrollable"
        onClick={(e) => e.stopPropagation()} 
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 md:p-8 space-y-5">
            <div className="flex justify-between items-start">
              <h2 id="add-lead-modal-title" className="text-xl md:text-2xl font-semibold text-blue-600 dark:text-blue-400">Add New Lead</h2>
              <button 
                type="button"
                onClick={isSaving ? undefined : onClose}
                disabled={isSaving}
                className="text-gray-400 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-1 -mr-2 -mt-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 disabled:opacity-50"
                aria-label="Close add lead form"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submissionError && (
              <div className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200 p-3 rounded-md text-sm border border-red-200/80 dark:border-red-800/60" role="alert">
                {submissionError}
              </div>
            )}
            
            <div>
              <label htmlFor="lead-name-input" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Lead Name <span className="text-red-500 dark:text-red-400">*</span></label>
              <input type="text" name="name" id="lead-name-input" value={formData.name} onChange={handleChange} className={`${inputBaseClass} ${errors.name ? 'border-red-500 dark:border-red-400 ring-red-500 dark:ring-red-400' : ''}`} required />
              {errors.name && <p className={errorTextClass}>{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="lead-brandName-input" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Brand Name <span className="text-red-500 dark:text-red-400">*</span></label>
              <input type="text" name="brandName" id="lead-brandName-input" value={formData.brandName} onChange={handleChange} className={`${inputBaseClass} ${errors.brandName ? 'border-red-500 dark:border-red-400 ring-red-500 dark:ring-red-400' : ''}`} required />
              {errors.brandName && <p className={errorTextClass}>{errors.brandName}</p>}
            </div>
            <div>
              <label htmlFor="lead-email-input" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Email <span className="text-red-500 dark:text-red-400">*</span></label>
              <input type="email" name="email" id="lead-email-input" value={formData.email} onChange={handleChange} className={`${inputBaseClass} ${errors.email ? 'border-red-500 dark:border-red-400 ring-red-500 dark:ring-red-400' : ''}`} required />
              {errors.email && <p className={errorTextClass}>{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="lead-contactNumber-input" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Contact Number</label>
              <input type="tel" name="contactNumber" id="lead-contactNumber-input" value={formData.contactNumber || ''} onChange={handleChange} className={inputBaseClass} />
            </div>
            <div>
              <label htmlFor="lead-website-input" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Website</label>
              <input type="url" name="website" id="lead-website-input" value={formData.website || ''} onChange={handleChange} placeholder="e.g., https://example.com or www.example.com" className={`${inputBaseClass} ${errors.website ? 'border-red-500 dark:border-red-400 ring-red-500 dark:ring-red-400' : ''}`} />
              {errors.website && <p className={errorTextClass}>{errors.website}</p>}
            </div>
            <div>
              <label htmlFor="lead-typeOfBusiness-select" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Type of Business <span className="text-red-500 dark:text-red-400">*</span></label>
              <select name="typeOfBusiness" id="lead-typeOfBusiness-select" value={formData.typeOfBusiness} onChange={handleChange} className={`${inputBaseClass} pr-8`}>
                {Object.values(BusinessType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lead-stage-select" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Initial Stage <span className="text-red-500 dark:text-red-400">*</span></label>
              <select name="stage" id="lead-stage-select" value={formData.stage} onChange={handleChange} className={`${inputBaseClass} pr-8`}>
                {Object.values(LeadStage).map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            {isSuperUser && (
              <div>
                <label htmlFor="lead-assignTo-select" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Assign To (Optional)</label>
                <select 
                  name="assignedToUserIdForSuperuser" 
                  id="lead-assignTo-select" 
                  value={formData.assignedToUserIdForSuperuser || ''} 
                  onChange={handleChange} 
                  className={`${inputBaseClass} pr-8`}
                  disabled={isLoadingBasicUsers || isSaving}
                >
                  <option value="">Unassigned / Select Basic User</option>
                  {isLoadingBasicUsers ? (
                    <option disabled>Loading users...</option>
                  ) : (
                    basicUserProfilesList.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                    ))
                  )}
                </select>
                {basicUserProfilesList.length === 0 && !isLoadingBasicUsers && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">No basic users available for assignment.</p>}
              </div>
            )}


          </div>

          <div className="bg-gray-50 dark:bg-zinc-800/60 px-6 py-4 md:px-8 md:py-5 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0 rounded-b-xl md:rounded-b-2xl border-t border-gray-200/80 dark:border-zinc-700/70">
            <button 
              type="button" 
              onClick={isSaving ? undefined : onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 dark:text-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-zinc-500 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 transition-all shadow-sm hover:shadow-md disabled:opacity-60"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-offset-zinc-900 transition-all disabled:bg-green-400 dark:disabled:bg-green-700 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Lead"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;
