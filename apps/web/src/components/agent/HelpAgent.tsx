import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, MessageSquare, Map } from 'lucide-react';
import { ChatBot } from './ChatBot';
import { GuidedTour } from './GuidedTour';
import { useAppStore } from '../../store/useAppStore';

type Tab = 'chat' | 'tour';

export function HelpAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const { showGuidedTour, setShowGuidedTour } = useAppStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const bubble = document.getElementById('help-bubble');
        if (bubble && bubble.contains(e.target as Node)) return;
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const startTour = () => {
    setIsOpen(false);
    setShowGuidedTour(true);
  };

  return (
    <>
      {/* Tour Overlay — uses Zustand state so it persists across view changes */}
      {showGuidedTour && <GuidedTour onClose={() => setShowGuidedTour(false)} />}

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-20 right-4 md:right-6 w-[380px] h-[520px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[9990] flex flex-col overflow-hidden animate-slide-up"
        >
          <div className="bg-secondary-500 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-500" />
              <span className="font-bold text-sm">ServiceCore Help</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === 'chat'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI Chat
            </button>
            <button
              onClick={() => {
                setActiveTab('tour');
                startTour();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === 'tour'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Guided Tour
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && <ChatBot />}
            {activeTab === 'tour' && (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <Map className="w-12 h-12 text-primary-500 mb-4" />
                <h3 className="font-bold text-secondary-500 mb-2">Guided Tour</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Take a step-by-step tour of all ServiceCore features.
                </p>
                <button
                  onClick={startTour}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors"
                >
                  Start Tour
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Bubble */}
      {!showGuidedTour && (
        <button
          id="help-bubble"
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-[9991] transition-all duration-200 ${
            isOpen
              ? 'bg-gray-600 hover:bg-gray-700 rotate-90'
              : 'bg-primary-500 hover:bg-primary-600 animate-bounce-gentle'
          }`}
          title="Help & AI Assistant"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <HelpCircle className="w-7 h-7 text-white" />
          )}
        </button>
      )}
    </>
  );
}
