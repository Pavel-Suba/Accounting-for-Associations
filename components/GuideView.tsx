
import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const GuideView: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('guide_title')}</h2>
        <p className="text-slate-600 mb-6 leading-relaxed">{t('guide_intro')}</p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3"><CheckCircle size={20} /> 1. {t('guide_point_1')}</h3>
            <p className="text-sm text-blue-800">{t('guide_point_1_text')}</p>
          </div>
          <div className="bg-green-50 p-5 rounded-xl border border-green-100">
            <h3 className="font-semibold text-green-900 flex items-center gap-2 mb-3"><CheckCircle size={20} /> 2. {t('guide_point_2')}</h3>
            <p className="text-sm text-green-800">{t('guide_point_2_text')}</p>
          </div>
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
             <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-3"><CheckCircle size={20} /> 3. {t('guide_point_3')}</h3>
             <p className="text-sm text-amber-800">{t('guide_point_3_text')}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 text-slate-200 p-6 rounded-xl flex items-start gap-4">
        <AlertTriangle className="text-yellow-400 shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-white mb-1">{t('guide_warning')}</h4>
          <p className="text-sm opacity-90">{t('guide_warning_text')}</p>
        </div>
      </div>
    </div>
  );
};

export default GuideView;
