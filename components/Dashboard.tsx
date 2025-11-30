
import React from 'react';
import { Transaction, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const { t } = useLanguage();

  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const data = [
    { name: t('total_income'), value: totalIncome },
    { name: t('total_expenses'), value: totalExpense },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t('total_income')}</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalIncome.toLocaleString('cs-CZ')} Kč</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t('total_expenses')}</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalExpense.toLocaleString('cs-CZ')} Kč</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t('current_balance')}</p>
              <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-slate-800' : 'text-orange-600'}`}>
                {balance.toLocaleString('cs-CZ')} Kč
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[300px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">{t('financial_overview')}</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip 
                  formatter={(value: number) => `${value.toLocaleString('cs-CZ')} Kč`}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#16a34a' : '#dc2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 text-white p-6 rounded-xl shadow-sm flex flex-col justify-center space-y-4">
           <div className="flex items-center gap-2 text-yellow-400 font-bold text-lg">
             <AlertCircle size={24} /> {t('tips_title')}
           </div>
           <p className="text-slate-300 leading-relaxed">
             {t('tips_text')}
           </p>
           <div className="pt-4 border-t border-slate-700">
             <p className="text-sm font-medium text-slate-400">{t('deadline_alert')}</p>
             <p className="font-bold">{t('deadline_dppo')}</p>
           </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
