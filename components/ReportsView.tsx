
import React, { useState } from 'react';
import { Transaction, TransactionType, ActivityType } from '../types';
import { Download, Printer, FileText, FileCode, Loader2, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ReportsViewProps {
  transactions: Transaction[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ transactions }) => {
  const { t } = useLanguage();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const profit = totalIncome - totalExpense;
  const mainActivityProfit = transactions.filter(t => t.activityType === ActivityType.MAIN).reduce((sum, t) => sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0);
  const secondaryActivityProfit = transactions.filter(t => t.activityType === ActivityType.SECONDARY).reduce((sum, t) => sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0);
  const taxBase = secondaryActivityProfit > 0 ? secondaryActivityProfit : 0;
  const estimatedTax = taxBase * 0.19;

  const handleExportXML = () => {
    // XML structure remains simplified
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?><Pisemnost><Data><Prijmy>${totalIncome}</Prijmy><Vydaje>${totalExpense}</Vydaje></Data></Pisemnost>`;
    const blob = new Blob([xmlContent], { type: 'text/xml;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tax_data.xml';
    link.click();
  };

  const handleExportXLSX = () => {
    // @ts-ignore
    if (!window.XLSX) return;
    const summaryData = [[t('economic_result'), profit]];
    // @ts-ignore
    const wb = window.XLSX.utils.book_new();
    // @ts-ignore
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(summaryData), "Summary");
    // @ts-ignore
    window.XLSX.writeFile(wb, "accounting.xlsx");
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    // @ts-ignore
    if (!window.pdfMake) { setIsGeneratingPdf(false); return; }

    const docDefinition = {
      content: [
        { text: t('print_title'), style: 'header' },
        { text: t('income_statement'), style: 'sectionHeader' },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [{ text: 'Item', bold: true }, { text: t('amount'), bold: true }],
              [t('total_income'), totalIncome],
              [t('total_expenses'), totalExpense],
              [{ text: t('economic_result'), bold: true }, { text: profit, bold: true }]
            ]
          }
        }
      ],
      styles: {
        header: { fontSize: 22, bold: true },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 10] }
      },
      defaultStyle: { font: 'Roboto' }
    };

    // @ts-ignore
    window.pdfMake.createPdf(docDefinition).download('report.pdf');
    setIsGeneratingPdf(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:animate-none">
      <div className="bg-slate-800 text-white p-6 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-lg print:hidden gap-4">
        <div>
          <h2 className="text-xl font-bold">{t('reports_title')}</h2>
          <p className="text-slate-400 text-sm">{t('reports_subtitle')}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg"><Printer size={18} /> {t('btn_print')}</button>
          <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-lg">{isGeneratingPdf ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />} {t('btn_pdf')}</button>
          <button onClick={handleExportXLSX} className="flex items-center gap-2 bg-emerald-600 px-4 py-2 rounded-lg"><FileSpreadsheet size={18} /> {t('btn_excel')}</button>
          <button onClick={handleExportXML} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg"><FileCode size={18} /> {t('btn_xml')}</button>
        </div>
      </div>

      <div id="report-content" className="bg-white/0 p-1 print:p-0">
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{t('print_title')}</h1>
          <hr className="mt-4 border-slate-300"/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block print:space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-slate-300">
            <h3 className="font-bold text-slate-800 mb-4">{t('income_statement')}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg print:bg-white"><span className="text-green-800 font-medium">{t('total_income')}</span><span className="font-bold">{totalIncome.toLocaleString()}</span></div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg print:bg-white"><span className="text-red-800 font-medium">{t('total_expenses')}</span><span className="font-bold">{totalExpense.toLocaleString()}</span></div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center"><span className="text-slate-600 font-bold">{t('economic_result')}</span><span className="text-xl font-bold">{profit.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-slate-300">
             <h3 className="font-bold text-slate-800 mb-4">{t('tax_liability')}</h3>
             <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>{t('result_main')}</span><span>{mainActivityProfit.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>{t('result_secondary')}</span><span>{secondaryActivityProfit.toLocaleString()}</span></div>
                <div className="h-px bg-slate-100 my-2"></div>
                <div className="flex justify-between items-center"><span className="text-slate-800 font-bold">{t('est_tax')}</span><div className="text-right"><span className="block text-xl font-bold text-purple-700">{estimatedTax.toLocaleString()}</span><span className="text-xs text-slate-400 print:hidden">{t('est_tax_note')}</span></div></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
