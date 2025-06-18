import React, { useState } from 'react';

interface DateFilterProps {
  onFilterChange: (startDate: string | undefined, endDate: string | undefined) => void;
}

const DateFilterBar: React.FC<DateFilterProps> = ({ onFilterChange }) => {
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || undefined;
    setStartDate(value);
    onFilterChange(value, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || undefined;
    setEndDate(value);
    onFilterChange(startDate, value);
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange(undefined, undefined);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
      <div className="flex flex-col md:flex-row gap-2 items-center w-full md:w-auto">
        <label className="text-gray-700 dark:text-gray-200 font-medium">From:</label>
        <input
          type="date"
          value={startDate || ''}
          onChange={handleStartDateChange}
          className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <label className="text-gray-700 dark:text-gray-200 font-medium">To:</label>
        <input
          type="date"
          value={endDate || ''}
          onChange={handleEndDateChange}
          className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <button
        onClick={handleClear}
        className="ml-0 md:ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Clear
      </button>
    </div>
  );
};

export default DateFilterBar;
