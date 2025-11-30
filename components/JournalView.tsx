
import React, { useState, useRef } from 'react';
import { Transaction, TransactionType, ActivityType, TaxCategory } from '../types';
import { Plus, Trash2, Wand2, Loader2, DownloadCloud, Filter, XCircle, FileText, FileSpreadsheet, X, AlertTriangle, Check } from 'lucide-react';
import { categorizeTransaction, parseDocument, parseTextData } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface JournalViewProps {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  removeTransaction: (id: string) => void;
}

interface ImportedTransaction extends Omit<Transaction, 'id'> {
  tempId: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  selected: boolean;
}

const JournalView: React.FC<JournalViewProps> = ({ transactions, addTransaction, removeTransaction }) => {
  const { t, language } = useLanguage();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [activity, setActivity] = useState<ActivityType>(ActivityType.MAIN);
  const [taxCat, setTaxCat] = useState<TaxCategory>(TaxCategory.NON_DEDUCTIBLE);
  const [variableSymbol, setVariableSymbol] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedData, setImportedData] = useState<ImportedTransaction[]>([]);

  const [filters, setFilters] = useState({
    date: '',
    description: '',
    activity: '',
    taxCategory: '',
    amount: '',
    type: ''
  });

  const filteredTransactions = transactions.filter(t => {
    const matchDate = t.date.includes(filters.date);
    const matchDesc = t.description.toLowerCase().includes(filters.description.toLowerCase()) || 
                      (t.variableSymbol && t.variableSymbol.includes(filters.description));
    const matchActivity = filters.activity ? t.activityType === filters.activity : true;
    const matchTax = filters.taxCategory ? t.taxCategory === filters.taxCategory : true;
    const matchAmount = filters.amount ? t.amount.toString().includes(filters.amount) : true;
    return matchDate && matchDesc && matchActivity && matchTax && matchAmount;
  });

  const clearFilters = () => {
    setFilters({ date: '', description: '', activity: '', taxCategory: '', amount: '', type: '' });
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== '');

  const handleAnalyze = async () => {
    if (!description) return;
    setIsAnalyzing(true);
    const suggestion = await categorizeTransaction(description, language);
    if (suggestion) {
      if (suggestion.suggestedType) setType(suggestion.suggestedType as TransactionType);
      if (suggestion.suggestedActivity) setActivity(suggestion.suggestedActivity as ActivityType);
      if (suggestion.suggestedTaxCategory) setTaxCat(suggestion.suggestedTaxCategory as TaxCategory);
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    addTransaction({
      id: Date.now().toString(),
      date,
      description,
      amount: Number(amount),
      type,
      activityType: activity,
      taxCategory: taxCat,
      variableSymbol
    });
    setDescription('');
    setAmount('');
    setVariableSymbol('');
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    const isImageOrPdf = file.type.startsWith('image/') || file.type === 'application/pdf';
    const isSpreadsheet = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');

    try {
      let rawData = [];
      if (isSpreadsheet) {
        const arrayBuffer = await file.arrayBuffer();
        // @ts-ignore
        const wb = window.XLSX.read(arrayBuffer, { type: 'array' });
        // @ts-ignore
        const csvText = window.XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
        rawData = await parseTextData(csvText);
      } else if (isImageOrPdf) {
        const reader = new FileReader();
        const base64Content = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        rawData = await parseDocument(base64Content, file.type);
      } else {
        alert("Unsupported format");
        setIsUploading(false);
        return;
      }
      
      const processed: ImportedTransaction[] = rawData.map((item: any, index: number) => {
        const dup = transactions.find(t => 
          t.date === item.date && Math.abs(t.amount) === Math.abs(item.amount) &&
          (t.variableSymbol === item.variableSymbol || t.description === item.description)
        );
        return {
          tempId: `import-${Date.now()}-${index}`,
          date: item.date,
          description: item.description,
          amount: item.amount,
          type: item.type as TransactionType,
          activityType: item.suggestedActivity as ActivityType,
          taxCategory: item.suggestedTaxCategory as TaxCategory,
          variableSymbol: item.variableSymbol || '',
          isDuplicate: !!dup,
          duplicateReason: dup ? 'Duplicate detected' : undefined,
          selected: !dup
        };
      });

      setImportedData(processed);
      setShowImportModal(true);

    } catch (err) {
      console.error(err);
      alert("Analysis failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const confirmImport = () => {
    const toImport = importedData.filter(t => t.selected);
    toImport.forEach(t => {
      const { tempId, isDuplicate, duplicateReason, selected, ...transactionData } = t;
      addTransaction({ ...transactionData, id: Date.now().toString() + Math.random() });
    });
    setShowImportModal(false);
    setImportedData([]);
  };

  // Helper to get translated enum label
  const getEnumLabel = (val: string) => {
    // Try to map enum value to a translation key if possible, or just return value
    // Since current enums are Czech strings, we can map them back to English if lang is en
    if (language === 'cs') return val;
    // Simple reverse mapping for EN
    if (val === TransactionType.INCOME) return t('INCOME');
    if (val === TransactionType.EXPENSE) return t('EXPENSE');
    if (val === ActivityType.MAIN) return t('MAIN');
    if (val === ActivityType.SECONDARY) return t('SECONDARY');
    if (val === TaxCategory.TAXABLE) return t('TAXABLE');
    if (val === TaxCategory.NON_TAXABLE) return t('NON_TAXABLE');
    if (val === TaxCategory.DEDUCTIBLE) return t('DEDUCTIBLE');
    if (val === TaxCategory.NON_DEDUCTIBLE) return t('NON_DEDUCTIBLE');
    return val;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
         <h2 className="text-xl font-bold text-slate-800">{t('journal_title')}</h2>
         
         <div 
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              relative group cursor-pointer transition-all duration-200 ease-in-out
              border-2 border-dashed rounded-xl px-6 py-4 flex items-center gap-4
              ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-300 bg-white hover:border-indigo-400'}
              ${isUploading ? 'opacity-70 pointer-events-none' : ''}
            `}
         >
           <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls, image/*, application/pdf" onChange={handleFileUpload} />
           <div className={`p-2 rounded-full transition-colors ${isDragging ? 'bg-blue-200' : 'bg-slate-100'}`}>
             {isUploading ? <Loader2 className="animate-spin" size={24} /> : <DownloadCloud size={24} />}
           </div>
           <div className="flex flex-col">
             <span className="text-sm font-semibold text-slate-700">{isUploading ? t('analyzing') : t('upload_title')}</span>
             <span className="text-xs text-slate-400">{isDragging ? t('upload_drag') : t('upload_click')}</span>
           </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 tracking-wider">{t('new_entry')}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('date')}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border-slate-300 border p-2 text-sm outline-none" />
          </div>
          <div className="lg:col-span-4 relative">
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('description')}</label>
            <div className="flex gap-2">
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('desc_placeholder')} className="w-full rounded-lg border-slate-300 border p-2 text-sm outline-none" />
              <button type="button" onClick={handleAnalyze} disabled={!description || isAnalyzing} className="bg-purple-100 text-purple-700 p-2 rounded-lg">
                {isAnalyzing ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18} />}
              </button>
            </div>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('amount')}</label>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-lg border-slate-300 border p-2 text-sm outline-none" />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('type')}</label>
            <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} className="w-full rounded-lg border-slate-300 border p-2 text-sm outline-none">
              {Object.values(TransactionType).map(v => <option key={v} value={v}>{getEnumLabel(v)}</option>)}
            </select>
          </div>
           <div className="lg:col-span-2 flex items-end">
             <button type="submit" className="w-full bg-slate-800 text-white p-2 rounded-lg flex items-center justify-center gap-2">
               <Plus size={18} /> {t('add_btn')}
             </button>
          </div>
          <div className="lg:col-span-4">
             <label className="block text-xs font-medium text-slate-500 mb-1">{t('var_symbol')}</label>
             <input type="text" value={variableSymbol} onChange={(e) => setVariableSymbol(e.target.value)} placeholder="VS" className="w-full rounded-lg border-slate-300 border p-2 text-sm outline-none" />
          </div>
          <div className="lg:col-span-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('activity')}</label>
            <select value={activity} onChange={(e) => setActivity(e.target.value as ActivityType)} className="w-full rounded-lg border-slate-300 border p-2 text-sm outline-none">
              {Object.values(ActivityType).map(v => <option key={v} value={v}>{getEnumLabel(v)}</option>)}
            </select>
          </div>
          <div className="lg:col-span-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('tax_mode')}</label>
            <select value={taxCat} onChange={(e) => setTaxCat(e.target.value as TaxCategory)} className="w-full rounded-lg border-slate-300 border p-2 text-sm outline-none">
              {Object.values(TaxCategory).map(v => <option key={v} value={v}>{getEnumLabel(v)}</option>)}
            </select>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {hasActiveFilters && (
            <div className="bg-blue-50 px-4 py-2 flex items-center justify-between text-sm text-blue-800 border-b border-blue-100">
               <span className="flex items-center gap-2"><Filter size={14}/> {t('filter_active')} ({filteredTransactions.length})</span>
               <button onClick={clearFilters} className="flex items-center gap-1 hover:text-blue-600 font-medium"><XCircle size={14}/> {t('filter_clear')}</button>
            </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="p-4 w-32">{t('date')}</th>
                <th className="p-4">{t('description')}</th>
                <th className="p-4 w-40">{t('activity')}</th>
                <th className="p-4 w-40">{t('tax_mode')}</th>
                <th className="p-4 text-right w-32">{t('amount')}</th>
                <th className="p-4 text-center w-20"></th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 pb-2"><input type="text" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} className="w-full text-xs p-1 border rounded" /></th>
                <th className="px-4 pb-2"><input type="text" placeholder={t('search_placeholder')} value={filters.description} onChange={(e) => setFilters({...filters, description: e.target.value})} className="w-full text-xs p-1 border rounded" /></th>
                <th className="px-4 pb-2">
                  <select value={filters.activity} onChange={(e) => setFilters({...filters, activity: e.target.value})} className="w-full text-xs p-1 border rounded">
                     <option value="">{t('all')}</option>
                     {Object.values(ActivityType).map(v => <option key={v} value={v}>{getEnumLabel(v)}</option>)}
                  </select>
                </th>
                <th className="px-4 pb-2">
                   <select value={filters.taxCategory} onChange={(e) => setFilters({...filters, taxCategory: e.target.value})} className="w-full text-xs p-1 border rounded">
                     <option value="">{t('all')}</option>
                     {Object.values(TaxCategory).map(v => <option key={v} value={v}>{getEnumLabel(v)}</option>)}
                  </select>
                </th>
                <th className="px-4 pb-2"><input type="text" value={filters.amount} onChange={(e) => setFilters({...filters, amount: e.target.value})} className="w-full text-xs p-1 border rounded text-right" /></th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">{transactions.length === 0 ? t('no_records') : t('no_results')}</td></tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-4 whitespace-nowrap text-slate-600">{t.date}{t.variableSymbol && <div className="text-xs text-slate-400">VS: {t.variableSymbol}</div>}</td>
                    <td className="p-4 font-medium text-slate-800">{t.description}</td>
                    <td className="p-4 text-slate-500"><span className="px-2 py-1 rounded text-xs bg-slate-100">{getEnumLabel(t.activityType)}</span></td>
                    <td className="p-4 text-slate-500 text-xs">{getEnumLabel(t.taxCategory)}</td>
                    <td className={`p-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString('cs-CZ')}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => removeTransaction(t.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><FileSpreadsheet size={24}/></div>
                 <div><h3 className="text-xl font-bold text-slate-800">{t('import_check')}</h3><p className="text-sm text-slate-500">{t('import_found').replace('{count}', String(importedData.length))}</p></div>
              </div>
              <button onClick={() => setShowImportModal(false)}><X size={24} /></button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
               <table className="w-full text-sm text-left">
                   <tbody className="divide-y divide-slate-100">
                     {importedData.map((t) => (
                       <tr key={t.tempId} className={`hover:bg-slate-50 ${t.isDuplicate ? 'bg-orange-50/50' : ''}`}>
                         <td className="p-3"><input type="checkbox" checked={t.selected} onChange={() => setImportedData(prev => prev.map(pt => pt.tempId === t.tempId ? { ...pt, selected: !pt.selected } : pt))} /></td>
                         <td className="p-3">{t.isDuplicate ? <div className="text-orange-600 flex items-center gap-1"><AlertTriangle size={14}/> {t('duplicate')}</div> : <div className="text-green-600 flex items-center gap-1"><Check size={14}/> {t('new')}</div>}</td>
                         <td className="p-3">{t.date}</td>
                         <td className="p-3 font-medium">{t.description}</td>
                         <td className="p-3 text-right">{t.amount}</td>
                       </tr>
                     ))}
                   </tbody>
               </table>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
               <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-slate-600">{t('cancel')}</button>
               <button onClick={confirmImport} className="px-6 py-2 bg-blue-600 text-white rounded-lg">{t('confirm_import')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalView;
