import React from 'react';

interface ErrorDisplayProps {
  message: string;
  title?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, title = "System Alert:" }) => (
  <div className="bg-red-100/80 backdrop-blur-md text-red-700 px-6 py-4 rounded-lg border border-red-300/70 shadow-lg dark:bg-red-950/40 dark:text-red-200 dark:border-red-800/60" role="alert">
    <div className="flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-red-500 dark:text-red-400 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <div>
        <strong className="font-bold text-red-800 dark:text-red-100">{title}</strong>
        <span className="block sm:inline ml-1 text-red-700 dark:text-red-200"> {message}</span>
      </div>
    </div>
  </div>
);

export default React.memo(ErrorDisplay);
