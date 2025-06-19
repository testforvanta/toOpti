import React, { useEffect } from 'react';
import { BusinessListing } from '../types';
import { useTheme } from '../context/ThemeContext'; // Assuming you have a ThemeContext

interface ServiceDetailCardProps {
  service: BusinessListing | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatPrice = (price?: number): string => {
  if (price === undefined || price === null) return 'N/A';
  // Assuming price is in a standard currency format, adjust as needed
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); // Example: USD
};

const ServiceDetailCard: React.FC<ServiceDetailCardProps> = ({ service, isOpen, onClose }) => {
  const { theme } = useTheme();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus on the card or a close button when it opens
      const cardElement = document.getElementById('service-detail-card');
      if (cardElement) {
        setTimeout(() => cardElement.focus(), 100);
      }
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !service) {
    return null;
  }

  const cardBgClass = theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200';
  const textColorClass = theme === 'dark' ? 'text-zinc-100' : 'text-gray-800';
  const labelColorClass = theme === 'dark' ? 'text-zinc-400' : 'text-gray-500';
  const valueColorClass = theme === 'dark' ? 'text-zinc-200' : 'text-gray-700';

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-modal-backdrop-appear" // Higher z-index than LeadDetailModal
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-detail-card-title"
      onClick={onClose} // Close if backdrop is clicked
    >
      <div
        id="service-detail-card"
        tabIndex={-1} // Make it focusable
        className={`rounded-xl md:rounded-2xl shadow-soft-dreamy dark:shadow-dark-soft-dreamy w-11/12 sm:max-w-md md:max-w-lg max-h-[80vh] overflow-y-auto p-6 md:p-8 space-y-5 transform animate-modal-content-appear modal-scrollable ${cardBgClass}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the card
      >
        <div className="flex justify-between items-start">
          <h2 id="service-detail-card-title" className={`text-xl md:text-2xl font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
            {service.name}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 -mr-2 -mt-1 rounded-full focus:outline-none focus:ring-2 ${theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 focus:ring-blue-400 focus:ring-offset-zinc-800' : 'text-gray-400 hover:text-gray-700 focus:ring-blue-500 focus:ring-offset-white'}`}
            aria-label="Close service details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row">
            <span className={`text-sm font-medium min-w-[100px] sm:min-w-[120px] mb-0.5 sm:mb-0 ${labelColorClass}`}>Type:</span>
            <span className={`text-sm capitalize ${valueColorClass}`}>{service.type}</span>
          </div>
          {service.description && (
            <div className="flex flex-col sm:flex-row">
              <span className={`text-sm font-medium min-w-[100px] sm:min-w-[120px] mb-0.5 sm:mb-0 ${labelColorClass}`}>Description:</span>
              <p className={`text-sm whitespace-pre-wrap ${valueColorClass}`}>{service.description}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row">
            <span className={`text-sm font-medium min-w-[100px] sm:min-w-[120px] mb-0.5 sm:mb-0 ${labelColorClass}`}>Price:</span>
            <span className={`text-sm ${valueColorClass}`}>{formatPrice(service.price)}</span>
          </div>
          {service.created_at && (
             <div className="flex flex-col sm:flex-row">
                <span className={`text-sm font-medium min-w-[100px] sm:min-w-[120px] mb-0.5 sm:mb-0 ${labelColorClass}`}>Listed On:</span>
                <span className={`text-sm ${valueColorClass}`}>{new Date(service.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-row-reverse pt-4 mt-4 border-t dark:border-zinc-700 border-gray-200">
            <button
                onClick={onClose}
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                            ${theme === 'dark'
                                ? 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-400 focus:ring-offset-zinc-800'
                                : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500 focus:ring-offset-white'}`}
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailCard;
