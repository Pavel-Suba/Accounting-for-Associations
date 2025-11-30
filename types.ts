
export enum TransactionType {
  INCOME = 'Příjem',
  EXPENSE = 'Výdaj'
}

export enum ActivityType {
  MAIN = 'Hlavní činnost (Poslání)',
  SECONDARY = 'Hospodářská činnost (Vedlejší)'
}

export enum TaxCategory {
  TAXABLE = 'Zdaňované',
  NON_TAXABLE = 'Osvobozené',
  DEDUCTIBLE = 'Daňově uznatelné',
  NON_DEDUCTIBLE = 'Daňově neuznatelné'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  activityType: ActivityType;
  taxCategory: TaxCategory;
  note?: string;
  variableSymbol?: string;
}

export interface FinancialState {
  cash: number;
  bank: number;
  transactions: Transaction[];
}

export enum View {
  GUIDE = 'GUIDE',
  CHECKLIST = 'CHECKLIST',
  DOCUMENTS = 'DOCUMENTS',
  DASHBOARD = 'DASHBOARD',
  JOURNAL = 'JOURNAL',
  REPORTS = 'REPORTS',
  ADVISOR = 'ADVISOR'
}

export type Language = 'cs' | 'en';
