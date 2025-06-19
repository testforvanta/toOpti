import React, { useEffect } from 'react';
import { GlobalMessageConfig } from '../../../types'; // Import type

interface GlobalMessageDisplayProps {
  messageConfig: GlobalMessageConfig | null;
  onClose: () => void;
}

const GlobalMessageDisplay: React.FC<GlobalMessageDisplayProps> = ({ messageConfig, onClose }) => {
    if (!messageConfig) return null;
    
    const baseClasses = "fixed top-20 left-1/2 -translate-x-1/2 w-auto max-w-md z-[60] p-4 rounded-lg text-sm shadow-md flex justify-between items-center transition-all duration-300 ease-in-out animate-slide-down-fade-in";
    
    let typeClasses = "";
    if (messageConfig.type === 'success') {
      typeClasses = "bg-green-50 text-green-700 border border-green-300/80 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700/60";
    } else { // error
      typeClasses = "bg-red-50 text-red-700 border border-red-300/80 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700/60";
    }
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-close after 5 seconds
        return () => clearTimeout(timer);
    }, [messageConfig, onClose]);

    return (
        <div className={`${baseClasses} ${typeClasses}`} role="alert">
            <span>{messageConfig.message}</span>
            <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none" aria-label="Close message">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
  };

export default React.memo(GlobalMessageDisplay);
