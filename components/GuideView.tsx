
import React from 'react';
import { Sparkles, ClipboardList, FileText, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const GuideView: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">{t('guide_title')}</h2>
        <p className="text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto text-lg">{t('guide_intro')}</p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 transition-transform hover:scale-105 duration-200">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-4">
               <Sparkles size={24} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{t('guide_point_1')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{t('guide_point_1_text')}</p>
          </div>
          
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 transition-transform hover:scale-105 duration-200">
             <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
               <ClipboardList size={24} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{t('guide_point_2')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{t('guide_point_2_text')}</p>
          </div>

          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 transition-transform hover:scale-105 duration-200">
             <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center text-emerald-600 mb-4">
               <FileText size={24} />
            </div>
             <h3 className="font-bold text-slate-900 mb-2">{t('guide_point_3')}</h3>
             <p className="text-sm text-slate-600 leading-relaxed">{t('guide_point_3_text')}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 text-slate-200 p-6 rounded-xl flex items-start gap-4">
        <AlertTriangle className="text-yellow-400 shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-white mb-1">{t('guide_warning')}</h4>
          <p className="text-sm opacity-90 leading-relaxed">{t('guide_warning_text')}</p>
        </div>
      </div>
    </div>
  );
};

export default GuideView;
