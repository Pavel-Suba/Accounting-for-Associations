
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { FileText, Users, Calculator, Wand2, Download, Printer, Loader2, FileCheck, Landmark } from 'lucide-react';
import { generateMeetingMinutes } from '../services/geminiService';
import ReportsView from './ReportsView';
import { useLanguage } from '../contexts/LanguageContext';

interface DocumentsViewProps {
  transactions: Transaction[];
  setView: (view: any) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ transactions, setView }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'MINUTES' | 'INVENTORY' | 'REPORTS'>('MINUTES');

  // Meeting Minutes State
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingType, setMeetingType] = useState('Členské schůze');
  const [attendees, setAttendees] = useState('');
  const [meetingPoints, setMeetingPoints] = useState('');
  const [generatedMinutes, setGeneratedMinutes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Inventory State
  const cashBalance = transactions.reduce((sum, t) => t.variableSymbol === 'CASH' || !t.variableSymbol ? sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount) : sum, 0); // Simplified logic
  const bankBalance = transactions.reduce((sum, t) => t.variableSymbol && t.variableSymbol !== 'CASH' ? sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount) : sum, 0);
  const [assets, setAssets] = useState<{name: string, value: number}[]>([{name: 'Notebook', value: 15000}]);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetValue, setNewAssetValue] = useState('');

  const handleGenerateMinutes = async () => {
    if (!attendees || !meetingPoints) return;
    setIsGenerating(true);
    const result = await generateMeetingMinutes({
        date: meetingDate,
        type: meetingType,
        attendees,
        points: meetingPoints
    }, language);
    setGeneratedMinutes(result || (language === 'en' ? "Generation error." : "Chyba generování."));
    setIsGenerating(false);
  };

  const handleDownloadMinutes = () => {
    // @ts-ignore
    if (!window.pdfMake) return;
    
    const docDefinition = {
      content: [
        { text: generatedMinutes, fontSize: 11, lineHeight: 1.5 }
      ],
      defaultStyle: { font: 'Roboto' }
    };
    // @ts-ignore
    window.pdfMake.createPdf(docDefinition).download(`Minutes_${meetingDate}.pdf`);
  };

  const handleAddAsset = () => {
    if (newAssetName && newAssetValue) {
        setAssets([...assets, {name: newAssetName, value: Number(newAssetValue)}]);
        setNewAssetName('');
        setNewAssetValue('');
    }
  };

  const handleDownloadInventory = () => {
    // @ts-ignore
    if (!window.pdfMake) return;

    const docDefinition = {
        content: [
            { text: t('inventory_subtitle'), style: 'header' },
            { text: `${t('date')}: ${new Date().toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-US')}`, margin: [0, 0, 0, 20] },
            
            { text: `1. ${t('financial_assets')}`, style: 'subheader' },
            {
                table: {
                    widths: ['*', 'auto'],
                    body: [
                        [t('cash'), { text: `${cashBalance} ${language === 'cs' ? 'Kč' : 'CZK'}`, alignment: 'right' }],
                        [t('bank'), { text: `${bankBalance} ${language === 'cs' ? 'Kč' : 'CZK'}`, alignment: 'right' }],
                        [{text: t('total'), bold: true}, { text: `${cashBalance + bankBalance} ${language === 'cs' ? 'Kč' : 'CZK'}`, alignment: 'right', bold: true }]
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 20]
            },

            { text: `2. ${t('tangible_assets')}`, style: 'subheader' },
            {
                table: {
                    widths: ['*', 'auto'],
                    body: [
                        [{text: t('item'), bold: true}, {text: t('value'), bold: true, alignment: 'right'}],
                        ...assets.map(a => [a.name, {text: `${a.value} ${language === 'cs' ? 'Kč' : 'CZK'}`, alignment: 'right'}]),
                        [{text: t('total'), bold: true}, { text: `${assets.reduce((s, a) => s + a.value, 0)} ${language === 'cs' ? 'Kč' : 'CZK'}`, alignment: 'right', bold: true }]
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 20]
            },

            { text: '................................................', alignment: 'right', margin: [0, 40, 0, 0] }
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
            subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
        },
        defaultStyle: { font: 'Roboto' }
    };
    // @ts-ignore
    window.pdfMake.createPdf(docDefinition).download(`Inventory_${new Date().getFullYear()}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{t('docs_title')}</h2>
            <p className="text-slate-500">{t('docs_subtitle')}</p>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 flex-wrap">
        <button 
          onClick={() => setActiveTab('MINUTES')}
          className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'MINUTES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={18} /> {t('tab_minutes')}
        </button>
        <button 
          onClick={() => setActiveTab('INVENTORY')}
          className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'INVENTORY' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Calculator size={18} /> {t('tab_inventory')}
        </button>
        <button 
          onClick={() => setActiveTab('REPORTS')}
          className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'REPORTS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Landmark size={18} /> {t('tab_reports')}
        </button>
      </div>

      {/* Content Minutes */}
      {activeTab === 'MINUTES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-700">{t('input_data')}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">{t('date')}</label>
                        <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">{t('org_type')}</label>
                        <select value={meetingType} onChange={e => setMeetingType(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                            <option>Členská schůze</option>
                            <option>Výbor</option>
                            <option>Předsednictvo</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{t('attendees')}</label>
                    <input type="text" value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="Jan Novák, Petr Svoboda..." className="w-full border rounded-lg p-2 text-sm" />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{t('points')}</label>
                    <textarea 
                        value={meetingPoints} 
                        onChange={e => setMeetingPoints(e.target.value)} 
                        rows={6}
                        placeholder={t('points_placeholder')}
                        className="w-full border rounded-lg p-2 text-sm"
                    />
                </div>

                <button 
                    onClick={handleGenerateMinutes}
                    disabled={isGenerating || !meetingPoints}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18} />}
                    {t('generate_btn')}
                </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-slate-700">{t('preview')}</h3>
                     {generatedMinutes && (
                         <button onClick={handleDownloadMinutes} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                             <Download size={14} /> {t('download_pdf')}
                         </button>
                     )}
                </div>
                <div className="flex-1 bg-white border border-slate-200 p-8 shadow-sm rounded-lg min-h-[400px] whitespace-pre-wrap text-sm font-serif text-slate-800">
                    {generatedMinutes ? generatedMinutes : <span className="text-slate-400 italic">...</span>}
                </div>
            </div>
        </div>
      )}

      {/* Content Inventory */}
      {activeTab === 'INVENTORY' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{t('inventory_subtitle')}</h3>
                    <p className="text-sm text-slate-500">31.12. {new Date().getFullYear()}</p>
                  </div>
                  <button onClick={handleDownloadInventory} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700">
                      <FileCheck size={18} /> {t('generate_protocol')}
                  </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                  <div>
                      <h4 className="font-medium text-slate-600 mb-3 border-b pb-2">1. {t('financial_assets')}</h4>
                      <table className="w-full text-sm">
                          <tbody>
                              <tr className="border-b border-slate-100">
                                  <td className="py-2 text-slate-600">{t('cash')}</td>
                                  <td className="py-2 text-right font-medium">{cashBalance.toLocaleString(language === 'cs' ? 'cs-CZ' : 'en-US')} {language === 'cs' ? 'Kč' : 'CZK'}</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                  <td className="py-2 text-slate-600">{t('bank')}</td>
                                  <td className="py-2 text-right font-medium">{bankBalance.toLocaleString(language === 'cs' ? 'cs-CZ' : 'en-US')} {language === 'cs' ? 'Kč' : 'CZK'}</td>
                              </tr>
                              <tr className="bg-slate-50">
                                  <td className="py-2 pl-2 font-bold text-slate-800">{t('total')}</td>
                                  <td className="py-2 pr-2 text-right font-bold text-slate-800">{(cashBalance + bankBalance).toLocaleString(language === 'cs' ? 'cs-CZ' : 'en-US')} {language === 'cs' ? 'Kč' : 'CZK'}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>

                  <div>
                      <h4 className="font-medium text-slate-600 mb-3 border-b pb-2">2. {t('tangible_assets')}</h4>
                      <div className="space-y-2 mb-4">
                          {assets.map((a, i) => (
                              <div key={i} className="flex justify-between text-sm bg-slate-50 p-2 rounded">
                                  <span>{a.name}</span>
                                  <span className="font-medium">{a.value.toLocaleString(language === 'cs' ? 'cs-CZ' : 'en-US')} {language === 'cs' ? 'Kč' : 'CZK'}</span>
                              </div>
                          ))}
                      </div>
                      
                      <div className="flex gap-2 items-end">
                          <div className="flex-1">
                              <label className="text-xs text-slate-500">{t('item')}</label>
                              <input type="text" value={newAssetName} onChange={e => setNewAssetName(e.target.value)} className="w-full border rounded p-1 text-sm" />
                          </div>
                          <div className="w-24">
                              <label className="text-xs text-slate-500">{t('value')}</label>
                              <input type="number" value={newAssetValue} onChange={e => setNewAssetValue(e.target.value)} className="w-full border rounded p-1 text-sm" />
                          </div>
                          <button onClick={handleAddAsset} className="bg-blue-100 text-blue-700 p-1.5 rounded hover:bg-blue-200">
                              {t('add_btn')}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Content Reports */}
      {activeTab === 'REPORTS' && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
              <ReportsView transactions={transactions} />
          </div>
      )}
    </div>
  );
};

export default DocumentsView;
