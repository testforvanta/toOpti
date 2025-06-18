
import React, { useState, useEffect, FormEvent } from 'react';

interface PaymentDetailsInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentData: { 
    totalAmountQuoted: number, 
    amountPaid: number, // This should be the new *total* amount paid
    paymentMode: string,
    // paymentDate is no longer passed from here
  }) => void;
  leadName: string;
  currentTotalAmountQuoted?: number;
  currentAmountPaid?: number;
  currentPaymentMode?: string;
  existingPaymentDateForDisplay?: string; 
  isSuperUser: boolean; // Added for disabling fields
}

const formatCurrencyForDisplay = (amount?: number): string => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};


const PaymentDetailsInputModal: React.FC<PaymentDetailsInputModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    leadName,
    currentTotalAmountQuoted,
    currentAmountPaid,
    currentPaymentMode,
    existingPaymentDateForDisplay,
    isSuperUser 
}) => {
  const isUpdateMode = currentTotalAmountQuoted !== undefined;

  const [totalAmountQuotedStr, setTotalAmountQuotedStr] = useState<string>('');
  const [amountForThisTransactionStr, setAmountForThisTransactionStr] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('');
  
  const [errors, setErrors] = useState<Partial<Record<'totalAmountQuoted' | 'amountForThisTransaction' | 'paymentMode', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setErrors({});
      
      if (isUpdateMode) {
        setTotalAmountQuotedStr(String(currentTotalAmountQuoted || ''));
        setAmountForThisTransactionStr(''); 
      } else {
        setTotalAmountQuotedStr('');
        setAmountForThisTransactionStr('');
      }
      setPaymentMode(currentPaymentMode || '');
      
      const firstInput = document.getElementById(isUpdateMode ? 'payment-amountForThisTransaction-input' : 'payment-totalAmountQuoted-input');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [isOpen, isUpdateMode, currentTotalAmountQuoted, currentAmountPaid, currentPaymentMode, existingPaymentDateForDisplay]);

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

  const validate = (): boolean => {
    if (!isSuperUser) return false; // Don't validate if not superuser as submit will be disabled

    const newErrors: Partial<Record<'totalAmountQuoted' | 'amountForThisTransaction' | 'paymentMode', string>> = {};
    
    const effectiveTotalQuotedNum = parseFloat(isUpdateMode && currentTotalAmountQuoted !== undefined ? String(currentTotalAmountQuoted) : totalAmountQuotedStr);
    const transactionAmountNum = parseFloat(amountForThisTransactionStr);
    const currentPaidNum = currentAmountPaid || 0;

    if (!isUpdateMode) {
      if (!totalAmountQuotedStr.trim() || isNaN(effectiveTotalQuotedNum) || effectiveTotalQuotedNum <= 0) {
        newErrors.totalAmountQuoted = 'Total quoted amount must be a positive number.';
      }
    }

    if (!amountForThisTransactionStr.trim() || isNaN(transactionAmountNum) || transactionAmountNum < 0) {
      newErrors.amountForThisTransaction = 'Amount for this transaction must be a non-negative number.';
    } else {
        const newTotalPaid = isUpdateMode ? currentPaidNum + transactionAmountNum : transactionAmountNum;
        if (newTotalPaid > effectiveTotalQuotedNum && !newErrors.totalAmountQuoted) {
            newErrors.amountForThisTransaction = 'Total amount paid cannot exceed total quoted amount.';
        }
    }
    
    if (!paymentMode.trim()) {
      newErrors.paymentMode = 'Payment mode is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSetAsFullPayment = () => {
    if (!isSuperUser) return;
    const effectiveTotalQuotedNum = parseFloat(isUpdateMode && currentTotalAmountQuoted !== undefined ? String(currentTotalAmountQuoted) : totalAmountQuotedStr);
    const currentPaidNum = currentAmountPaid || 0;

    if (isNaN(effectiveTotalQuotedNum) || effectiveTotalQuotedNum <=0) {
        setErrors(prev => ({...prev, totalAmountQuoted: 'Valid total quoted amount is needed first.'}));
        return;
    }
    setErrors(prev => ({...prev, totalAmountQuoted: undefined, amountForThisTransaction: undefined}));


    if (isUpdateMode) {
      const remainingAmount = Math.max(0, effectiveTotalQuotedNum - currentPaidNum);
      setAmountForThisTransactionStr(remainingAmount.toFixed(2));
    } else {
      setAmountForThisTransactionStr(effectiveTotalQuotedNum.toFixed(2));
    }
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isSuperUser) return; 

    if (validate()) {
      setIsSubmitting(true); 
      
      const effectiveTotalQuotedNum = parseFloat(isUpdateMode && currentTotalAmountQuoted !== undefined ? String(currentTotalAmountQuoted) : totalAmountQuotedStr);
      const transactionAmountNum = parseFloat(amountForThisTransactionStr);
      const currentPaidNum = currentAmountPaid || 0;
      
      const newTotalAmountPaid = isUpdateMode ? currentPaidNum + transactionAmountNum : transactionAmountNum;

      onSubmit({
        totalAmountQuoted: effectiveTotalQuotedNum,
        amountPaid: Math.min(newTotalAmountPaid, effectiveTotalQuotedNum),
        paymentMode: paymentMode.trim(),
      });
    }
  };

  if (!isOpen) return null;
  
  const inputBaseClass = "w-full p-2.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors duration-150 shadow-sm focus:shadow dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:placeholder-zinc-500";
  const errorTextClass = "text-red-500 dark:text-red-400 text-xs mt-1";
  const readOnlyDisplayClass = "w-full p-2.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
  const disabledInputClass = "!bg-gray-200 dark:!bg-zinc-700 !cursor-not-allowed !text-gray-500 dark:!text-zinc-400";


  const paymentModeOptions = [
    "Bank Transfer", "UPI", "Credit/Debit Card", "Cash", "Cheque", "Online Gateway (Stripe, PayPal, etc.)", "Other"
  ];

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-modal-backdrop-appear"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-details-modal-title"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl shadow-soft-dreamy dark:shadow-dark-soft-dreamy w-11/12 sm:max-w-md max-h-[90vh] overflow-y-auto transform animate-modal-content-appear"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 md:p-8 space-y-5">
            <div className="flex justify-between items-start">
              <h2 id="payment-details-modal-title" className="text-lg md:text-xl font-semibold text-blue-600 dark:text-blue-400">
                {isUpdateMode ? "Add/Update Payment for " : "Record Payment for "} 
                <span className="text-orange-500 dark:text-orange-400">{leadName}</span>
              </h2>
              <button
                type="button"
                onClick={isSubmitting ? undefined : onClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-1 -mr-2 -mt-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 disabled:opacity-50"
                aria-label="Close payment details input"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {!isSuperUser && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md border border-yellow-300 dark:border-yellow-700/50">
                    Payment modifications are restricted to Superusers.
                </p>
            )}
            
            {isUpdateMode && currentTotalAmountQuoted !== undefined ? (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Total Amount Quoted (USD)</label>
                    <div className={readOnlyDisplayClass}>{formatCurrencyForDisplay(currentTotalAmountQuoted)}</div>
                     {currentAmountPaid !== undefined && (
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                            Currently Paid: {formatCurrencyForDisplay(currentAmountPaid)}
                        </p>
                    )}
                 </div>
            ) : (
                <div>
                    <label htmlFor="payment-totalAmountQuoted-input" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Total Amount Quoted (USD) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <input
                        type="number"
                        id="payment-totalAmountQuoted-input"
                        value={totalAmountQuotedStr}
                        onChange={(e) => {
                        setTotalAmountQuotedStr(e.target.value);
                        if (errors.totalAmountQuoted) setErrors(prev => ({...prev, totalAmountQuoted: undefined}));
                        }}
                        placeholder="e.g., 1000"
                        className={`${inputBaseClass} ${errors.totalAmountQuoted ? 'border-red-500 dark:border-red-400 ring-red-500 dark:ring-red-400' : ''} ${!isSuperUser ? disabledInputClass : ''}`}
                        required
                        disabled={isSubmitting || !isSuperUser}
                        step="0.01"
                        min="0.01"
                    />
                    {errors.totalAmountQuoted && <p className={errorTextClass}>{errors.totalAmountQuoted}</p>}
                </div>
            )}
            
            <div>
                <label htmlFor="payment-amountForThisTransaction-input" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {isUpdateMode ? "Additional Amount Paid Now (USD)" : "Initial Amount Paid (USD)"} <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <div className="flex items-center space-x-2">
                    <input
                        type="number"
                        id="payment-amountForThisTransaction-input"
                        value={amountForThisTransactionStr}
                        onChange={(e) => {
                            setAmountForThisTransactionStr(e.target.value);
                            if (errors.amountForThisTransaction) setErrors(prev => ({...prev, amountForThisTransaction: undefined}));
                        }}
                        placeholder="e.g., 500"
                        className={`${inputBaseClass} ${errors.amountForThisTransaction ? 'border-red-500 dark:border-red-400 ring-red-500 dark:ring-red-400' : ''} ${!isSuperUser ? disabledInputClass : ''}`}
                        required
                        disabled={isSubmitting || !isSuperUser}
                        step="0.01"
                        min="0"
                    />
                    <button 
                        type="button" 
                        onClick={handleSetAsFullPayment} 
                        disabled={isSubmitting || (isUpdateMode ? currentTotalAmountQuoted === undefined : !totalAmountQuotedStr.trim() || parseFloat(totalAmountQuotedStr) <= 0) || !isSuperUser}
                        className="px-3 py-2.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md dark:text-green-200 dark:bg-green-700/60 dark:hover:bg-green-600/60 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Set amount to pay off the remaining balance or full quoted amount"
                    >
                        Set Full
                    </button>
                </div>
                {errors.amountForThisTransaction && <p className={errorTextClass}>{errors.amountForThisTransaction}</p>}
            </div>

            {isUpdateMode && existingPaymentDateForDisplay && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Timestamp of Last Transaction</label>
                    <div className={readOnlyDisplayClass}>{existingPaymentDateForDisplay}</div>
                 </div>
            )}

            <div>
              <label htmlFor="payment-paymentMode-select" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Payment Mode <span className="text-red-500 dark:text-red-400">*</span></label>
              <select 
                id="payment-paymentMode-select"
                value={paymentMode} 
                onChange={(e) => {
                  setPaymentMode(e.target.value);
                  if (errors.paymentMode) setErrors(prev => ({...prev, paymentMode: undefined}));
                }} 
                className={`${inputBaseClass} pr-8 ${errors.paymentMode ? 'border-red-500 dark:border-red-400 ring-red-500 dark:ring-red-400' : ''} ${!isSuperUser ? disabledInputClass : ''}`}
                required
                disabled={isSubmitting || !isSuperUser}
              >
                <option value="" disabled>Select payment mode</option>
                {paymentModeOptions.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
              {errors.paymentMode && <p className={errorTextClass}>{errors.paymentMode}</p>}
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
              disabled={isSubmitting || !isSuperUser}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-900 transition-all disabled:bg-blue-400 dark:disabled:bg-blue-700 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                isUpdateMode ? "Save Payment" : "Save & Close Lead"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentDetailsInputModal;
