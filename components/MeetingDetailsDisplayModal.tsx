import React, { useEffect, useState } from 'react';
import { MeetingDetailsData } from '../src/types';

interface MeetingDetailsDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingDetails: MeetingDetailsData | null;
  parsingError: string | null;
  leadName: string;
}

// Chevron icon for accordion
const ChevronDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);


type AccordionSection = 'summary' | 'assessment' | 'nextMeeting' | 'proTips';

const MeetingDetailsDisplayModal: React.FC<MeetingDetailsDisplayModalProps> = ({
  isOpen,
  onClose,
  meetingDetails,
  parsingError,
  leadName,
}) => {

  const [openSections, setOpenSections] = useState<Record<AccordionSection, boolean>>({
    summary: true, // Summary open by default
    assessment: false,
    nextMeeting: false,
    proTips: false,
  });

  const toggleSection = (section: AccordionSection) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Reset open sections when modal is opened or details change
      setOpenSections({ summary: true, assessment: false, nextMeeting: false, proTips: false });
      
      const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const modal = document.getElementById('meeting-details-display-modal-content');
      if (modal) {
        const firstFocusableElement = modal.querySelectorAll(focusableElements)[0] as HTMLElement; // Usually the close button
        if (firstFocusableElement) {
          setTimeout(() => firstFocusableElement.focus(), 100); 
        }
      }
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, meetingDetails]); // Added meetingDetails to deps for reset

  if (!isOpen) {
    return null;
  }

  const accordionHeaderClass = "flex justify-between items-center w-full p-3 md:p-4 text-left text-md md:text-lg font-semibold text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-zinc-800/70 hover:bg-gray-100 dark:hover:bg-zinc-700/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 transition-colors";
  const accordionContentClass = "p-3 md:p-4 border border-t-0 border-gray-200 dark:border-zinc-700/80 rounded-b-lg bg-white dark:bg-zinc-900";
  
  const detailItemClass = "flex flex-col sm:flex-row py-1.5";
  const detailLabelClass = "text-xs uppercase font-bold text-sky-400 dark:text-sky-300 min-w-[140px] sm:min-w-[160px] mb-0.5 sm:mb-0 shrink-0 tracking-wide"; // Changed font-semibold to font-bold
  const detailValueClass = "text-sm text-gray-800 dark:text-zinc-200 break-words leading-relaxed";
  const listClass = "list-disc list-outside pl-5 space-y-1 text-sm text-gray-700 dark:text-zinc-300 leading-relaxed";


  const renderAccordionItem = (
    sectionKey: AccordionSection,
    title: string,
    content: React.ReactNode
  ) => (
    <div className="border border-gray-200/80 dark:border-zinc-700/80 rounded-lg shadow-sm overflow-hidden">
      <h3>
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          aria-expanded={openSections[sectionKey]}
          aria-controls={`accordion-content-${sectionKey}`}
          className={accordionHeaderClass}
        >
          <span>{title}</span>
          <ChevronDownIcon className={`w-5 h-5 transform transition-transform duration-200 ${openSections[sectionKey] ? 'rotate-180' : 'rotate-0'}`} />
        </button>
      </h3>
      {openSections[sectionKey] && (
        <div id={`accordion-content-${sectionKey}`} className={accordionContentClass}>
          {content}
        </div>
      )}
    </div>
  );


  return (
    <div
      className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-modal-backdrop-appear" // Higher z-index
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-details-display-modal-title"
      onClick={onClose}
    >
      <div
        id="meeting-details-display-modal-content"
        className="bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl shadow-soft-dreamy dark:shadow-dark-soft-dreamy w-11/12 sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 transform animate-modal-content-appear"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 id="meeting-details-display-modal-title" className="text-xl md:text-2xl font-semibold text-blue-600 dark:text-blue-400 pr-4">
            Meeting Analysis: <span className="text-orange-500 dark:text-orange-400">{leadName}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-1 -mr-2 -mt-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-900"
            aria-label="Close meeting details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {parsingError && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-md border border-red-200 dark:border-red-700/50">
                <strong className="font-medium">Parsing Error:</strong> {parsingError}
            </div>
          )}
          {!parsingError && !meetingDetails && (
             <p className="text-gray-500 dark:text-zinc-400 text-sm py-4 text-center">No specific meeting details were found for this lead.</p>
          )}
          {meetingDetails && (
            <div className="space-y-3">
              {renderAccordionItem('summary', 'Call Summary', (
                <p className={`${detailValueClass} leading-relaxed`}>{meetingDetails.summary || 'Not available'}</p>
              ))}
              
              {renderAccordionItem('assessment', 'Lead & Host Assessment', (
                <div className="space-y-1.5">
                  <div className={detailItemClass}>
                    <span className={detailLabelClass}>Lead Score:</span>
                    <span className={detailValueClass}>{meetingDetails.lead_score ?? 'N/A'}</span>
                  </div>
                  <div className={detailItemClass}>
                    <span className={detailLabelClass}>Lead Quality:</span>
                    <span className={detailValueClass}>{meetingDetails.lead_quality || 'N/A'}</span>
                  </div>
                  <div className={detailItemClass}>
                    <span className={detailLabelClass}>Host Quality:</span>
                    <span className={detailValueClass}>{meetingDetails.host_quality || 'N/A'}</span>
                  </div>
                  <div className={detailItemClass}>
                      <span className={detailLabelClass}>Host Perf. Notes:</span>
                      <p className={`${detailValueClass} leading-relaxed`}>{meetingDetails.host_quality_description || 'Not available'}</p>
                  </div>
                </div>
              ))}


              {meetingDetails.next_meeting_plan && renderAccordionItem('nextMeeting', 'Next Meeting Plan', (
                <div className="space-y-3">
                  <div className={detailItemClass}>
                    <span className={detailLabelClass}>Objective:</span>
                    <span className={detailValueClass}>{meetingDetails.next_meeting_plan.objective || 'Not available'}</span>
                  </div>
                  {meetingDetails.next_meeting_plan.agenda && meetingDetails.next_meeting_plan.agenda.length > 0 && (
                    <div className={detailItemClass}>
                      <span className={detailLabelClass}>Agenda:</span>
                      <ul className={`${listClass} ${detailValueClass}`}>
                        {meetingDetails.next_meeting_plan.agenda.map((item, i) => <li key={`agenda-${i}`}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {meetingDetails.next_meeting_plan.objection_handling && meetingDetails.next_meeting_plan.objection_handling.length > 0 && (
                     <div className={detailItemClass}>
                      <span className={detailLabelClass}>Objection Handling:</span>
                      <ul className={`${listClass} ${detailValueClass}`}>
                        {meetingDetails.next_meeting_plan.objection_handling.map((item, i) => <li key={`objection-${i}`}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className={detailItemClass}>
                    <span className={detailLabelClass}>Closing Technique:</span>
                    <span className={detailValueClass}>{meetingDetails.next_meeting_plan.closing_technique || 'Not available'}</span>
                  </div>
                   {meetingDetails.next_meeting_plan.materials && meetingDetails.next_meeting_plan.materials.length > 0 && (
                    <div className={detailItemClass}>
                      <span className={detailLabelClass}>Materials:</span>
                      <ul className={`${listClass} ${detailValueClass}`}>
                        {meetingDetails.next_meeting_plan.materials.map((item, i) => <li key={`material-${i}`}>{item}</li>)}
                      </ul>
                    </div>
                   )}
                </div>
              ))}

              {meetingDetails.pro_tips && meetingDetails.pro_tips.length > 0 && renderAccordionItem('proTips', 'Pro Tips & Feedback', (
                <ul className={`${listClass} ${detailValueClass}`}>
                  {meetingDetails.pro_tips.map((tip, i) => <li key={`tip-${i}`}>{tip}</li>)}
                </ul>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-row-reverse pt-4 md:pt-5 mt-4 border-t border-gray-200/80 dark:border-zinc-700/70">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300/70 dark:text-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:border-zinc-600/70 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-zinc-500 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 transition-all shadow-sm hover:shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailsDisplayModal;