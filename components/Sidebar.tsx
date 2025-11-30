
import React from 'react';
import { LayoutDashboard, BookOpen, FileText, BrainCircuit, Info, ClipboardCheck, Stamp } from 'lucide-react';
import { View } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const { t } = useLanguage();

  const menuItems = [
    { id: View.GUIDE, label: t('menu_guide'), icon: Info },
    { id: View.CHECKLIST, label: t('menu_checklist'), icon: ClipboardCheck },
    { id: View.DOCUMENTS, label: t('menu_documents'), icon: Stamp },
    { id: View.DASHBOARD, label: t('menu_dashboard'), icon: LayoutDashboard },
    { id: View.JOURNAL, label: t('menu_journal'), icon: BookOpen },
    { id: View.REPORTS, label: t('menu_reports'), icon: FileText },
    { id: View.ADVISOR, label: t('menu_advisor'), icon: BrainCircuit },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl z-10 print:hidden">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-blue-400">Neziskovka</span>Pro
        </h1>
        <p className="text-xs text-slate-400 mt-1">{t('app_subtitle')}</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
        {t('version')}
      </div>
    </div>
  );
};

export default Sidebar;
