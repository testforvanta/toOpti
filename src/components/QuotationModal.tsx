import React,
{
  useState,
  useEffect,
  useRef
} from 'react';
import {
  Lead,
  BusinessListing,
  UserProfile
} from '../types';
import {
  fetchBusinessListings
} from '../../services/businessSettingsService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  useTheme
} from '../context/ThemeContext'; // Assuming you have a theme context for styling

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  actorUserProfile: UserProfile | null; // To know who is performing the action
  n8nWebhookUrl: string;
}

const QuotationModal: React.FC < QuotationModalProps > = ({
  isOpen,
  onClose,
  lead,
  actorUserProfile,
  n8nWebhookUrl
}) => {
  const [price, setPrice] = useState < string > ('');
  const [selectedServiceId, setSelectedServiceId] = useState < string > ('');
  const [serviceDescription, setServiceDescription] = useState < string > ('');
  const [availableServices, setAvailableServices] = useState < BusinessListing[] > ([]);
  const [isLoadingServices, setIsLoadingServices] = useState < boolean > (false);
  const [serviceFetchError, setServiceFetchError] = useState < string | null > (null);
  const [pdfUrl, setPdfUrl] = useState < string | null > (null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState < boolean > (false);
  const [isSending, setIsSending] = useState < boolean > (false);
  const [sendError, setSendError] = useState < string | null > (null);
  const [sendSuccess, setSendSuccess] = useState < boolean > (false);

  const {
    theme
  } = useTheme(); // For styling consistency
  const pdfContentRef = useRef < HTMLDivElement > (null); // Ref for the content to be converted to PDF

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setPrice('');
      setSelectedServiceId('');
      setServiceDescription('');
      setPdfUrl(null);
      setIsGeneratingPdf(false);
      setIsSending(false);
      setSendError(null);
      setSendSuccess(false);

      // Fetch available services
      setIsLoadingServices(true);
      setServiceFetchError(null);
      fetchBusinessListings()
        .then(data => {
          setAvailableServices(data || []);
          // Pre-select service if lead has one
          if (lead?.selected_services?. [0] && data) {
            const leadService = data.find(s => s.name === lead.selected_services[0]);
            if (leadService) {
              setSelectedServiceId(leadService.id);
              setServiceDescription(leadService.description || '');
            }
          }
        })
        .catch(err => {
          console.error("Failed to fetch business listings:", err);
          setServiceFetchError(err.message || "Error fetching services.");
        })
        .finally(() => {
          setIsLoadingServices(false);
        });
    }
  }, [isOpen, lead]);

  useEffect(() => {
    if (selectedServiceId) {
      const service = availableServices.find(s => s.id === selectedServiceId);
      if (service) {
        setServiceDescription(service.description || '');
        if (service.price) {
          // setPrice(service.price.toString()); // Optionally pre-fill price if available
        }
      }
    } else {
      setServiceDescription('');
    }
  }, [selectedServiceId, availableServices]);


  const handleConfirmAndGeneratePdf = async () => {
    if (!lead || !pdfContentRef.current || !selectedServiceId) {
      setSendError("Missing lead data, PDF content reference, or service selection.");
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        setSendError("Please enter a valid price.");
        return;
    }

    setIsGeneratingPdf(true);
    setSendError(null);
    setPdfUrl(null);

    try {
      const canvas = await html2canvas(pdfContentRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // If you have external images
        backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', // Match modal background
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt', // points
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 40; // 40 points margin
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2);

      const imgProps = pdf.getImageProperties(imgData);
      const imgAspectRatio = imgProps.width / imgProps.height;

      let newImgWidth = contentWidth;
      let newImgHeight = newImgWidth / imgAspectRatio;

      if (newImgHeight > contentHeight) {
        newImgHeight = contentHeight;
        newImgWidth = newImgHeight * imgAspectRatio;
      }

      const x = (pdfWidth - newImgWidth) / 2; // Centered
      const y = margin;


      pdf.addImage(imgData, 'PNG', x, y, newImgWidth, newImgHeight);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

    } catch (error) {
      console.error("Error generating PDF:", error);
      setSendError(error instanceof Error ? error.message : "Failed to generate PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendToClient = async () => {
    if (!lead || !pdfUrl || !actorUserProfile || !selectedServiceId) {
      setSendError("Missing data for sending quotation.");
      return;
    }
    if (!price || isNaN(parseFloat(price))) {
        setSendError("Invalid price.");
        return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      // Fetch blob again to convert to base64 for JSON payload
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Pdf = reader.result as string;
        const selectedService = availableServices.find(s => s.id === selectedServiceId);

        const payload = {
          lead_id: lead.id,
          customer_name: lead.name,
          brand_name: lead.brandName,
          email: lead.email,
          contact_number: lead.contactNumber,
          price: parseFloat(price),
          service_name: selectedService?.name || 'N/A',
          service_type: selectedService?.type || 'N/A',
          service_description: serviceDescription,
          quotation_pdf_base64: base64Pdf, // Send PDF as base64
          quoted_by_user_id: actorUserProfile.id,
          quoted_by_user_name: actorUserProfile.full_name || actorUserProfile.email,
          quote_date: new Date().toISOString(),
        };

        const postResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!postResponse.ok) {
          const errorData = await postResponse.text();
          throw new Error(`Webhook failed with status ${postResponse.status}: ${errorData}`);
        }
        setSendSuccess(true);
        // Optionally close modal after a delay or show success message longer
        setTimeout(() => {
             onClose(); // Close modal on success
        }, 2000);
      };
      reader.onerror = (error) => {
          console.error("Error converting PDF blob to base64:", error);
          setSendError("Failed to process PDF for sending.");
          setIsSending(false);
      }

    } catch (error) {
      console.error("Error sending quotation:", error);
      setSendError(error instanceof Error ? error.message : "An unknown error occurred while sending.");
      setIsSending(false);
    }
  };

  const modalContentClass = theme === 'dark' ?
    'bg-zinc-900 text-zinc-200 border-zinc-700' :
    'bg-white text-gray-800 border-gray-300';
  const inputClass = theme === 'dark' ?
    'bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-blue-500 focus:border-blue-500' :
    'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500';
  const labelClass = theme === 'dark' ? 'text-zinc-400' : 'text-gray-600';
  const buttonClassBase = "px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2";
  const primaryButtonClass = `${buttonClassBase} text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus:ring-offset-zinc-900`;
  const secondaryButtonClass = `${buttonClassBase} ${theme === 'dark' ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200 focus:ring-zinc-500' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-400'} dark:focus:ring-offset-zinc-900`;
  const greenButtonClass = `${buttonClassBase} text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-400 dark:focus:ring-offset-zinc-900`;


  if (!isOpen || !lead) return null;

  // PDF Content Styling - make it look professional
  const pdfThemeStyle = theme === 'dark' ? {
      backgroundColor: '#1f2937', // zinc-800
      color: '#e5e7eb', // zinc-200
      borderColor: '#374151' // zinc-700
  } : {
      backgroundColor: '#ffffff',
      color: '#1f2937', // gray-800
      borderColor: '#d1d5db' // gray-300
  };

  const selectedServiceForPdf = availableServices.find(s => s.id === selectedServiceId);


  return (
    <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-modal-backdrop-appear">
      <div className={`rounded-xl md:rounded-2xl shadow-soft-dreamy dark:shadow-dark-soft-dreamy w-full max-w-lg max-h-[90vh] flex flex-col ${modalContentClass} transform animate-modal-content-appear`}>
        <div className="flex justify-between items-center p-5 md:p-6 border-b dark:border-zinc-800">
          <h2 className="text-lg md:text-xl font-semibold text-blue-600 dark:text-blue-400">Quote a Price for {lead.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-900">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {!pdfUrl ? (
          <div className="p-5 md:p-6 space-y-4 overflow-y-auto modal-scrollable">
            {/* Customer Details (Read-only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><strong className={labelClass}>Customer:</strong> {lead.name}</div>
              <div><strong className={labelClass}>Brand:</strong> {lead.brandName}</div>
              <div><strong className={labelClass}>Email:</strong> {lead.email}</div>
              <div><strong className={labelClass}>Contact:</strong> {lead.contactNumber || 'N/A'}</div>
            </div>
            <hr className="dark:border-zinc-700/50"/>

            {/* Service Selection */}
            <div>
              <label htmlFor="service" className={`block text-sm font-medium mb-1 ${labelClass}`}>Service/Product</label>
              {isLoadingServices ? <p className="text-xs">Loading services...</p> : serviceFetchError ? <p className="text-xs text-red-500">{serviceFetchError}</p> : (
                <select
                  id="service"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className={`w-full p-2.5 border rounded-md shadow-sm text-sm ${inputClass}`}
                  disabled={availableServices.length === 0}
                >
                  <option value="" disabled>{availableServices.length === 0 ? "No services available" : "Select a service..."}</option>
                  {availableServices.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.type}) {service.price ? `- $${service.price}`: ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Service Description */}
            <div>
              <label htmlFor="serviceDescription" className={`block text-sm font-medium mb-1 ${labelClass}`}>Service Description</label>
              <textarea
                id="serviceDescription"
                rows={4}
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                className={`w-full p-2.5 border rounded-md shadow-sm text-sm ${inputClass}`}
                placeholder="Enter service description (will be pre-filled if service is selected)"
              />
            </div>

            {/* Price Input */}
            <div>
              <label htmlFor="price" className={`block text-sm font-medium mb-1 ${labelClass}`}>Price (USD)</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`w-full p-2.5 border rounded-md shadow-sm text-sm ${inputClass}`}
                placeholder="e.g., 299.99"
                min="0.01"
                step="0.01"
              />
            </div>
          </div>
        ) : (
            // PDF Preview and Send Section
            <div className="p-5 md:p-6 flex-grow flex flex-col items-center justify-center overflow-y-auto">
                <h3 className="text-md font-semibold mb-3 text-center">Quotation PDF Generated</h3>
                <div className="w-full max-w-md aspect-[1/1.414] border dark:border-zinc-700 shadow-lg mb-4"> {/* A4 Aspect ratio for iframe */}
                    <iframe src={pdfUrl} title="Quotation PDF Preview" className="w-full h-full" />
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 text-center">Review the PDF above. If it looks good, send it to the client.</p>
            </div>
        )}

        {/* Hidden div for PDF generation content */}
        <div ref={pdfContentRef} style={{ position: 'absolute', left: '-9999px', width: '800px', padding: '40px', background: pdfThemeStyle.backgroundColor, color: pdfThemeStyle.color, fontFamily: 'sans-serif' }}>
            <div style={{ borderBottom: `2px solid ${pdfThemeStyle.borderColor}`, paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: theme === 'dark' ? '#60a5fa' : '#2563eb', marginBottom: '5px' }}>Quotation</h1>
                <p style={{ fontSize: '14px' }}>Date: {new Date().toLocaleDateString()}</p>
            </div>
            <div style={{ marginBottom: '30px', fontSize: '14px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'semibold', borderBottom: `1px solid ${pdfThemeStyle.borderColor}`, paddingBottom: '5px', marginBottom: '10px' }}>Client Details:</h2>
                <p><strong>Name:</strong> {lead?.name}</p>
                <p><strong>Brand:</strong> {lead?.brandName}</p>
                <p><strong>Email:</strong> {lead?.email}</p>
                <p><strong>Contact:</strong> {lead?.contactNumber || 'N/A'}</p>
            </div>
            <div style={{ marginBottom: '30px', fontSize: '14px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'semibold', borderBottom: `1px solid ${pdfThemeStyle.borderColor}`, paddingBottom: '5px', marginBottom: '10px' }}>Service Details:</h2>
                <p><strong>Service:</strong> {selectedServiceForPdf?.name || 'N/A'} ({selectedServiceForPdf?.type || 'N/A'})</p>
                <p style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }}><strong>Description:</strong><br/>{serviceDescription || 'No description provided.'}</p>
            </div>
             <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: `2px solid ${pdfThemeStyle.borderColor}`, fontSize: '16px', textAlign: 'right' }}>
                <p style={{ fontSize: '20px', fontWeight: 'bold' }}><strong>Total Price:</strong> ${parseFloat(price).toFixed(2)} USD</p>
            </div>
            <div style={{ marginTop: '40px', fontSize: '12px', color: theme === 'dark' ? '#a1a1aa' : '#71717a', textAlign: 'center' }}>
                <p>Thank you for your business!</p>
                {actorUserProfile?.full_name && <p>Quoted by: {actorUserProfile.full_name}</p>}
            </div>
        </div>


        {/* Modal Actions */}
        <div className="p-5 md:p-6 border-t dark:border-zinc-800 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          {sendError && <p className="text-xs text-red-500 dark:text-red-400 text-left w-full sm:w-auto sm:flex-grow mr-3 self-center">{sendError}</p>}
          {sendSuccess && <p className="text-xs text-green-500 dark:text-green-400 text-left w-full sm:w-auto sm:flex-grow mr-3 self-center">Quotation sent successfully!</p>}

          {!pdfUrl ? (
            <>
              <button type="button" onClick={onClose} className={secondaryButtonClass} disabled={isGeneratingPdf}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAndGeneratePdf}
                className={primaryButtonClass}
                disabled={isGeneratingPdf || isLoadingServices || !selectedServiceId || !price}
              >
                {isGeneratingPdf ? 'Generating PDF...' : 'Confirm & Generate PDF'}
              </button>
            </>
          ) : (
            <>
             <button type="button" onClick={() => setPdfUrl(null)} className={secondaryButtonClass} disabled={isSending}>
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSendToClient}
                className={greenButtonClass}
                disabled={isSending || sendSuccess}
              >
                {isSending ? 'Sending...' : sendSuccess ? 'Sent!' : 'Send to Client'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationModal;
