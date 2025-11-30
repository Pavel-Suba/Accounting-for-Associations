
import React, { useState, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { getAccountingAdvice } from '../services/geminiService';
import { Transaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AdvisorViewProps {
  transactions: Transaction[];
}

const AdvisorView: React.FC<AdvisorViewProps> = ({ transactions }) => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'bot', text: string}[]>([]);

  // Initialize chat with welcome message when component mounts or language changes
  useEffect(() => {
    setChatHistory([{ role: 'bot', text: t('advisor_welcome') }]);
  }, [language, t]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    // Prepare context summary for the AI
    const income = transactions.reduce((acc, t) => t.type === 'Příjem' ? acc + t.amount : acc, 0);
    const expense = transactions.reduce((acc, t) => t.type === 'Výdaj' ? acc + t.amount : acc, 0);
    
    // Localize context so AI understands better in English
    const context = language === 'en' 
      ? `Current accounting status: Income: ${income}, Expenses: ${expense}, Transaction count: ${transactions.length}.`
      : `Aktuální stav účetnictví: Příjmy: ${income}, Výdaje: ${expense}, Počet transakcí: ${transactions.length}.`;

    const response = await getAccountingAdvice(userMsg, context, language);
    
    setChatHistory(prev => [...prev, { role: 'bot', text: response || (language === 'en' ? 'Sorry, I did not understand.' : 'Omlouvám se, nerozuměl jsem.') }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0">
               <Bot size={16} />
             </div>
             <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none border border-slate-100 flex items-center gap-2 text-slate-500 text-sm">
               <Loader2 className="animate-spin" size={14} /> {t('advisor_thinking')}
             </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('advisor_placeholder')}
            className="flex-1 rounded-lg border-slate-300 border p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !query}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-lg transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">{t('advisor_disclaimer')}</p>
      </div>
    </div>
  );
};

export default AdvisorView;
