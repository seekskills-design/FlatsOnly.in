import { useState, useEffect } from "react";
import { X, AlertCircle, XCircle } from "lucide-react";
import { Button } from "./ui/Button";

export function SafetyPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hasSeenSafetyPopup");
    if (!hasSeenPopup) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenSafetyPopup", "true");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300 relative flex flex-col md:flex-row">
        
        {/* Left side - Illustration */}
        <div className="bg-[#fff0f0] p-12 flex items-center justify-center md:w-2/5 min-h-[300px] md:min-h-[400px] overflow-hidden">
          <div className="relative">
            {/* Phone illustration */}
            <div className="w-32 h-64 bg-white rounded-[2rem] border-[6px] border-gray-800 shadow-sm flex items-center justify-center relative z-10 transform -rotate-12">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-200 rounded-full"></div>
              <span className="text-5xl font-bold text-gray-800">₹</span>
            </div>
            {/* Red alert circle */}
            <div className="absolute -bottom-4 -right-6 w-20 h-20 bg-[#d32f2f] rounded-full flex items-center justify-center shadow-lg z-20 border-[6px] border-white">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            {/* Decorative background circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[#ffe5e5] rounded-full z-0"></div>
          </div>
        </div>

        {/* Right side - Content */}
        <div className="p-8 md:p-12 md:w-3/5 flex flex-col justify-center relative">
          <button 
            onClick={handleClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl md:text-3xl font-bold text-[#091e42] mb-6 md:mb-8 leading-tight pr-8">
            Never pay booking amount without visiting the property
          </h2>

          <div className="mb-8 md:mb-10">
            <h3 className="text-[#d32f2f] font-bold text-sm md:text-base tracking-wider uppercase mb-4 md:mb-6">
              SCAMMERS WILL ASK FOR :
            </h3>
            
            <ul className="flex flex-col gap-4">
              <li className="flex items-center gap-3 text-[#091e42] font-medium text-base">
                <XCircle className="w-6 h-6 text-[#d32f2f] shrink-0" />
                Property visit charges
              </li>
              <li className="flex items-center gap-3 text-[#091e42] font-medium text-base">
                <XCircle className="w-6 h-6 text-[#d32f2f] shrink-0" />
                Gate pass booking
              </li>
              <li className="flex items-center gap-3 text-[#091e42] font-medium text-base">
                <XCircle className="w-6 h-6 text-[#d32f2f] shrink-0" />
                Refundable booking amount
              </li>
            </ul>
          </div>

          <Button 
            onClick={handleClose}
            className="w-full sm:w-auto self-start bg-[#0078d4] hover:bg-[#005a9e] text-white px-10 py-6 text-lg rounded-md shadow-sm font-semibold"
          >
            Ok, understood
          </Button>
        </div>
      </div>
    </div>
  );
}
