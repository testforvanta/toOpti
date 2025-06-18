import React, { useState, useEffect, FormEvent } from 'react';

interface MeetLinkInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (meetLink: string) => void;
  leadName: string;
}

const MeetLinkInputModal: React.FC<MeetLinkInputModalProps> = ({ isOpen, onClose, onSubmit, leadName }) => {
  const [meetLink, setMeetLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMeetLink('');
      setError(null);
      setIsSubmitting(false);
      const inputElement = document.getElementById('meet-link-input');
      if (inputElement) {
        setTimeout(() => inputElement.focus(), 100);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, isSubmitting]);

  const validateLink = (link: string): boolean => {
    if (!link.trim()) {
      setError('Meeting link cannot be empty.');
      return false;
    }
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      setError('Meeting link must start with http:// or https://');
      return false;
    }
    try {
      new URL(link); // Test if it's a valid URL structure
    } catch (_) {
      setError('Invalid URL format.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateLink(meetLink)) {
      setIsSubmitting(true); // Visual feedback, actual submission handled by parent
      onSubmit(meetLink.trim());
      // Parent component will handle closing the modal upon successful submission.
    }
  };

  if (!isOpen) return null;
  
  const inputBaseClass = "w-full p-2.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors duration-150 shadow-sm focus:shadow dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:placeholder-zinc-500";
  const errorTextClass = "text-red-500 dark:text-red-400 text-xs mt-1";

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-modal-backdrop-appear" // Higher z-index
      role="dialog"
      aria-modal="true"
      aria-labelledby="meet-link-modal-title"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl shadow-soft-dreamy dark:shadow-dark-soft-dreamy w-full max-w-md max-h-[90vh] overflow-y-auto transform animate-modal-content-appear"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 md:p-8 space-y-5">
            <div className="flex justify-between items-start">
              <h2 id="meet-link-modal-title" className="text-lg md:text-xl font-semibold text-blue-600 dark:text-blue-400">
                Meeting Link for <span className="text-orange-500 dark:text-orange-400">{leadName}</span>
              </h2>
              <button
                type="button"
                onClick={isSubmitting ? undefined : onClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-1 -mr-2 -mt-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 disabled:opacity-50"
                aria-label="Close meeting link input"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-zinc-300">
              Please provide the meeting link for this lead. The stage will be updated to "Meeting Scheduled".
            </p>
            <div>
              <label htmlFor="meet-link-input" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Meeting URL <span className="text-red-500 dark:text-red-400">*</span></label>
              <input
                type="url"
                id="meet-link-input"
                value={meetLink}
                onChange={(e) => {
                  setMeetLink(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://meet.google.com/xyz-abcd-efg"
                className={`${inputBaseClass} ${error ? 'border-red-500 dark:border-red-400 ring-red-500 dark:ring-red-400' : ''}`}
                required
                disabled={isSubmitting}
              />
              {error && <p className={errorTextClass}>{error}</p>}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-800/60 px-6 py-4 md:px-8 md:py-5 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0 rounded-b-xl md:rounded-b-2xl border-t border-gray-200/80 dark:border-zinc-700/70">
            <button
              type="button"
              onClick={isSubmitting ? undefined : onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 dark:text-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-zinc-500 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 transition-all shadow-sm hover:shadow-md disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !meetLink.trim()}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-900 transition-all disabled:bg-blue-400 dark:disabled:bg-blue-700 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit Link & Update Stage"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetLinkInputModal;
