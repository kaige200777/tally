export interface Record {
  id: string;
  ledgerId: string;
  person: string;
  amount: string;
  date: string;
  occasion: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ledger {
  id: string;
  name: string;
  type: 'send' | 'receive';
  createdAt: string;
}

export interface Settings {
  id: string;
  password: string;
  createdAt: string;
}

export interface QueryParams {
  person?: string;
  startDate?: string;
  endDate?: string;
  occasion?: string;
  ledgerId?: string;
}

export interface StatisticsResult {
  person: string;
  sendCount: number;
  sendTotal: number;
  receiveCount: number;
  receiveTotal: number;
  balance: number;
}

export const OCCASIONS = [
  '结婚',
  '嫁女',
  '接媳',
  '白事',
  '满月',
  '乔迁',
  '其它'
];
