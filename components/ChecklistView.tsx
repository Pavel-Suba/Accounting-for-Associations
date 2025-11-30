
import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, ExternalLink, RefreshCw, Loader2, Book, AlertCircle, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { checkLegislativeUpdates } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface TodoItem {
  id: string;
  text: string;
  category: 'START' | 'ONGOING' | 'END';
  checked: boolean;
}

const DEFAULT_TODOS: TodoItem[] = [
  { id: '1', category: 'START', text: 'Svolat členskou schůzi a schválit plán činnosti na rok.', checked: false },
  { id: '2', category: 'START', text: 'Zkontrolovat platnost údajů ve Veřejném rejstříku (statutární orgán).', checked: false },
  { id: '3', category: 'START', text: 'Zaplatit členství v asociacích (pokud existují).', checked: false },
  { id: '4', category: 'ONGOING', text: 'Průběžně evidovat všechny příjmy a výdaje v Peněžním deníku.', checked: false },
  { id: '5', category: 'ONGOING', text: 'Archivovat originály dokladů (faktury, účtenky) po dobu 5 let.', checked: false },
  { id: '6', category: 'ONGOING', text: 'Rozlišovat hlavní (poslání) a vedlejší (hospodářskou) činnost na dokladech.', checked: false },
  { id: '7', category: 'END', text: 'Provést inventarizaci majetku a pokladny k 31.12.', checked: false },
  { id: '8', category: 'END', text: 'Sestavit Přehled o majetku a závazcích (Rozvaha).', checked: false },
  { id: '9', category: 'END', text: 'Podat Daňové přiznání (DPPO) do 31.3. (i když je daň nula, pokud má spolek datovku/registraci).', checked: false },
  { id: '10', category: 'END', text: 'Zveřejnit účetní závěrku ve Sbírce listin rejstříkového soudu.', checked: false },
];

const ChecklistView: React.FC = () => {
  const { t, language } = useLanguage();
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('nz_todos');
    return saved ? JSON.parse(saved) : DEFAULT_TODOS;
  });

  const [aiUpdate, setAiUpdate] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    localStorage.setItem('nz_todos', JSON.stringify(todos));
  }, [todos]);

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  const handleCheckUpdates = async () => {
    setIsLoadingAi(true);
    const result = await checkLegislativeUpdates(language);
    setAiUpdate(result || (language === 'en' ? "Failed to load data." : "Nepodařilo se načíst data."));
    setIsLoadingAi(false);
  };

  const getCategoryTitle = (cat: 'START' | 'ONGOING' | 'END') => {
      switch(cat) {
          case 'START': return t('cat_start');
          case 'ONGOING': return t('cat_ongoing');
          case 'END': return t('cat_end');
          default: return cat;
      }
  };

  const renderCategory = (cat: 'START' | 'ONGOING' | 'END', colorClass: string) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6`}>
      <div className={`p-4 ${colorClass} font-bold text-slate-800 flex items-center gap-2`}>
        <CheckSquare size={18} /> {getCategoryTitle(cat)}
      </div>
      <div className="divide-y divide-slate-100">
        {todos.filter(t => t.category === cat).map(todo => (
          <div 
            key={todo.id} 
            onClick={() => toggleTodo(todo.id)}
            className="p-4 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className={`mt-0.5 ${todo.checked ? 'text-green-600' : 'text-slate-300'}`}>
              {todo.checked ? <CheckSquare size={20} /> : <Square size={20} />}
            </div>
            <span className={`text-sm ${todo.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
              {todo.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">{t('checklist_title')}</h2>
           <p className="text-slate-500">{t('checklist_subtitle')}</p>
        </div>
        <button 
          onClick={handleCheckUpdates}
          disabled={isLoadingAi}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70"
        >
          {isLoadingAi ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          {t('ai_check_legis')} {new Date().getFullYear()}
        </button>
      </div>

      {/* AI Updates Section */}
      {aiUpdate && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-4 text-indigo-900 font-bold">
            <Bot size={20} /> {t('ai_news_title')}
          </div>
          <div className="prose prose-sm prose-indigo max-w-none bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
            <ReactMarkdown>{aiUpdate}</ReactMarkdown>
          </div>
          <p className="text-xs text-indigo-400 mt-2">
            {t('ai_disclaimer')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Checklist Column */}
        <div className="lg:col-span-2">
           {renderCategory('START', 'bg-blue-50')}
           {renderCategory('ONGOING', 'bg-amber-50')}
           {renderCategory('END', 'bg-green-50')}
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Book size={20} /> {t('legal_laws')}
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <a href="https://www.zakonyprolidi.cz/cs/2013-89" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-2 group">
                  <ExternalLink size={14} className="group-hover:text-blue-400" />
                  Občanský zákoník (č. 89/2012 Sb.)
                </a>
              </li>
              <li>
                <a href="https://www.zakonyprolidi.cz/cs/1991-563" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-2 group">
                  <ExternalLink size={14} className="group-hover:text-blue-400" />
                  Zákon o účetnictví (č. 563/1991 Sb.)
                </a>
              </li>
              <li>
                <a href="https://www.zakonyprolidi.cz/cs/1992-586" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-2 group">
                  <ExternalLink size={14} className="group-hover:text-blue-400" />
                  Zákon o daních z příjmů (č. 586/1992 Sb.)
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <AlertCircle size={20} className="text-orange-500" />
              {t('common_errors')}
            </h3>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
              <li>Nerozlišování hlavní a vedlejší činnosti.</li>
              <li>Chybějící inventarizace majetku.</li>
              <li>Nepodání daňového přiznání.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChecklistView;
