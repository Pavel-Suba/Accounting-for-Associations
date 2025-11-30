import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Image as ImageIcon, Trash2, GripHorizontal } from 'lucide-react';
import { getAssistantResponse } from '../services/geminiService';
import { View } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatWidgetProps {
  currentView: View;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
  image?: string; // base64 preview
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ currentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Ahoj! Jsem tvůj průvodce aplikací.  \n**Co mohu udělat:**  \n* Poradit s účtováním  \n* Vysvětlit ovládání  \n* Analyzovat nahraný obrázek (např. screenshot)' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Dragging State
  const [position, setPosition] = useState({ x: -24, y: -24 }); // Relative to bottom-right initially via CSS, but we'll switch to fixed
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle Drag Events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (chatWindowRef.current) {
      const rect = chatWindowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Calculate new position based on mouse - offset
        // We are using fixed positioning, so we need left/top coordinates
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Simple bounds check (optional, prevents dragging off screen completely)
        const maxX = window.innerWidth - 100;
        const maxY = window.innerHeight - 50;

        if (chatWindowRef.current) {
             chatWindowRef.current.style.left = `${newX}px`;
             chatWindowRef.current.style.top = `${newY}px`;
             chatWindowRef.current.style.bottom = 'auto';
             chatWindowRef.current.style.right = 'auto';
             chatWindowRef.current.style.transform = 'none'; // reset centered transforms if any
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSend = async () => {
    if (!inputValue.trim() && !attachedImage) return;

    const userText = inputValue;
    const userImage = attachedImage;

    setInputValue('');
    setAttachedImage(null);

    setMessages(prev => [...prev, { role: 'user', text: userText, image: userImage || undefined }]);
    setIsLoading(true);

    const response = await getAssistantResponse(userText, currentView, userImage || undefined);
    
    setMessages(prev => [...prev, { role: 'bot', text: response || 'Nerozuměl jsem.' }]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent pasting the file object string into textarea
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            setAttachedImage(readerEvent.target?.result as string);
          };
          reader.readAsDataURL(blob);
        }
        return; // Only process the first image found
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        setAttachedImage(readerEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      {/* Floating Button (only visible when chat is closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 print:hidden">
          <button
            onClick={() => {
                setIsOpen(true);
                // Reset position to default if needed, or keep last position
            }}
            className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 transition-all duration-300"
          >
             <MessageCircle size={28} />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatWindowRef}
          className="fixed z-50 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:hidden"
          style={{ 
            bottom: '24px', 
            right: '24px',
            // If dragging happened, these are overridden by inline styles set in useEffect
          }}
        >
          {/* Header (Draggable Handle) */}
          <div 
            onMouseDown={handleMouseDown}
            className={`bg-slate-900 text-white p-3 flex justify-between items-center cursor-move select-none ${isDragging ? 'cursor-grabbing' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-blue-400" />
              <div className="flex flex-col">
                 <h3 className="font-semibold text-sm leading-tight">AI Průvodce</h3>
                 <span className="text-[10px] text-slate-400">Gemini 2.5 Flash</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <GripHorizontal size={18} className="text-slate-600 mr-2" />
                <button 
                  onClick={() => setIsOpen(false)}
                  onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking close
                  className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1 rounded-full"
                >
                  <X size={16} />
                </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                
                <div className={`max-w-[85%] flex flex-col gap-2`}>
                   {/* Attached Image in History */}
                   {msg.image && (
                     <img 
                       src={msg.image} 
                       alt="Uploaded context" 
                       className="rounded-lg border border-slate-200 max-h-40 object-cover w-full bg-white" 
                     />
                   )}
                   
                   {/* Text Content */}
                   {msg.text && (
                     <div className={`p-3 rounded-xl text-sm leading-relaxed shadow-sm markdown-body ${
                       msg.role === 'user' 
                         ? 'bg-blue-600 text-white rounded-tr-none' 
                         : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                     }`}>
                       <ReactMarkdown>{msg.text}</ReactMarkdown>
                     </div>
                   )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-slate-700"/>
                </div>
                <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl rounded-tl-none flex items-center gap-2 text-slate-500 text-xs shadow-sm">
                  <Loader2 className="animate-spin" size={14} /> Píše...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2">
            {/* Image Preview Area */}
            {attachedImage && (
              <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                <img src={attachedImage} alt="Preview" className="h-12 w-12 object-cover rounded-md" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">Obrázek připraven</p>
                </div>
                <button 
                  onClick={() => setAttachedImage(null)}
                  className="p-1 hover:bg-slate-200 rounded-full text-slate-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            <div className="flex gap-2 items-end">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageSelect}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Nahrát obrázek (Screenshot)"
              >
                <ImageIcon size={20} />
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Napište dotaz nebo vložte obrázek (Ctrl+V)..."
                  rows={1}
                  className="w-full text-sm bg-slate-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-lg px-3 py-2.5 outline-none transition-all resize-none"
                  style={{ minHeight: '40px', maxHeight: '100px' }}
                />
              </div>

              <button 
                onClick={handleSend}
                disabled={(!inputValue && !attachedImage) || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-lg transition-colors shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;