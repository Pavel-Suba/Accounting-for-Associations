
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import GuideView from './components/GuideView';
import Dashboard from './components/Dashboard';
import JournalView from './components/JournalView';
import ReportsView from './components/ReportsView';
import AdvisorView from './components/AdvisorView';
import ChecklistView from './components/ChecklistView';
import DocumentsView from './components/DocumentsView';
import ChatWidget from './components/ChatWidget';
import { View, Transaction, TransactionType, ActivityType, TaxCategory } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Globe } from 'lucide-react';

const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [currentView, setCurrentView] = useState<View>(View.GUIDE);
  
  // Mock data
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2024-01-15',
      description: 'Členské příspěvky 2024',
      amount: 15000,
      type: TransactionType.INCOME,
      activityType: ActivityType.MAIN,
      taxCategory: TaxCategory.NON_TAXABLE,
      variableSymbol: 'CASH'
    },
    {
      id: '2',
      date: '2024-02-10',
      description: 'Pronájem sálu na akci',
      amount: 5000,
      type: TransactionType.EXPENSE,
      activityType: ActivityType.MAIN,
      taxCategory: TaxCategory.NON_DEDUCTIBLE
    },
    {
      id: '3',
      date: '2024-03-05',
      description: 'Reklamní banner web',
      amount: 8000,
      type: TransactionType.INCOME,
      activityType: ActivityType.SECONDARY,
      taxCategory: TaxCategory.TAXABLE
    }
  ]);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [t, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const renderView = () => {
    switch (currentView) {
      case View.GUIDE: return <GuideView />;
      case View.CHECKLIST: return <ChecklistView />;
      case View.DOCUMENTS: return <DocumentsView transactions={transactions} setView={setCurrentView} />;
      case View.DASHBOARD: return <Dashboard transactions={transactions} />;
      case View.JOURNAL: return <JournalView transactions={transactions} addTransaction={addTransaction} removeTransaction={removeTransaction} />;
      case View.REPORTS: return <ReportsView transactions={transactions} />;
      case View.ADVISOR: return <AdvisorView transactions={transactions} />;
      default: return <Dashboard transactions={transactions} />;
    }
  };

  const getPageTitle = () => {
     switch(currentView) {
         case View.GUIDE: return t('app_title'); // Simplify for now
         case View.CHECKLIST: return t('checklist_title');
         case View.DOCUMENTS: return t('menu_documents');
         case View.DASHBOARD: return t('menu_dashboard');
         case View.JOURNAL: return t('journal_title');
         case View.REPORTS: return t('menu_reports');
         case View.ADVISOR: return t('menu_advisor');
         default: return t('app_title');
     }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 ml-64 p-8 print:ml-0 print:p-0">
        <header className="mb-8 flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold text-slate-800">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-4">
             {/* Language Switcher */}
             <button 
               onClick={() => setLanguage(language === 'cs' ? 'en' : 'cs')}
               className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
             >
               <Globe size={16} className="text-slate-500" />
               <span>{language === 'cs' ? 'CZ' : 'EN'}</span>
             </button>

             <div className="flex items-center gap-2">
               <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
               <span className="text-sm text-slate-500 font-medium">Online</span>
             </div>
          </div>
        </header>
        {renderView()}
      </main>
      
      <div className="print:hidden">
        <ChatWidget currentView={currentView} />
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);

export default App;
