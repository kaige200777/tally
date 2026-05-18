import { create } from 'zustand';
import type { Record, Ledger, QueryParams, StatisticsResult } from '../types';
import * as db from '../utils/db';
import { createAppDirectory } from '../utils/filesystem';

interface AppState {
  isAuthenticated: boolean;
  records: Record[];
  ledgers: Ledger[];
  currentLedger: string | null;
  isLoading: boolean;
  error: string | null;
  
  initApp: () => Promise<void>;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  
  addRecord: (record: Omit<Record, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecord: (record: Record) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  queryRecords: (params: QueryParams) => Promise<Record[]>;
  getStatistics: (params: QueryParams) => Promise<StatisticsResult[]>;
  
  addLedger: (ledger: Ledger) => Promise<void>;
  updateLedger: (ledger: Ledger) => Promise<void>;
  deleteLedger: (id: string) => Promise<void>;
  
  exportToJson: () => Promise<string>;
  importFromJson: (data: string) => Promise<void>;
  exportToJsonFile: () => Promise<string>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  records: [],
  ledgers: [],
  currentLedger: null,
  isLoading: false,
  error: null,

  initApp: async () => {
    set({ isLoading: true, error: null });
    try {
      await db.initDB();
      await createAppDirectory();
      set({ isLoading: false });
    } catch (error) {
      set({ error: '初始化失败', isLoading: false });
    }
  },

  login: async (password: string) => {
    set({ isLoading: true, error: null });
    try {
      const DEFAULT_PASSWORD = '888888';
      const settings = await db.getSettings();
      
      if (!settings) {
        if (password === DEFAULT_PASSWORD) {
          await db.saveSettings({
            id: 'settings',
            password: password,
            createdAt: Date.now().toString()
          });
          const records = await db.getAllRecords();
          const ledgers = await db.getAllLedgers();
          set({ 
            isAuthenticated: true, 
            records, 
            ledgers,
            isLoading: false 
          });
          return true;
        } else {
          set({ error: '口令错误（初始口令为888888）', isLoading: false });
          return false;
        }
      } else {
        if (password === settings.password) {
          const records = await db.getAllRecords();
          const ledgers = await db.getAllLedgers();
          set({ 
            isAuthenticated: true, 
            records, 
            ledgers,
            isLoading: false 
          });
          return true;
        } else {
          set({ error: '口令错误', isLoading: false });
          return false;
        }
      }
    } catch (error) {
      set({ error: '登录失败', isLoading: false });
      return false;
    }
  },

  logout: () => {
    set({ isAuthenticated: false, records: [], ledgers: [] });
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      const settings = await db.getSettings();
      if (!settings) {
        set({ error: '未设置口令', isLoading: false });
        return false;
      }
      
      if (oldPassword !== settings.password) {
        set({ error: '原口令错误', isLoading: false });
        return false;
      }
      
      await db.saveSettings({
        ...settings,
        password: newPassword
      });
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: '修改失败', isLoading: false });
      return false;
    }
  },

  addRecord: async (recordData) => {
    set({ isLoading: true, error: null });
    try {
      const now = Date.now().toString();
      const record: Record = {
        ...recordData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      await db.addRecord(record);
      const records = await db.getAllRecords();
      set({ records, isLoading: false });
    } catch (error) {
      set({ error: '添加记录失败', isLoading: false });
    }
  },

  updateRecord: async (record) => {
    set({ isLoading: true, error: null });
    try {
      const updatedRecord = {
        ...record,
        updatedAt: Date.now().toString()
      };
      await db.addRecord(updatedRecord);
      const records = await db.getAllRecords();
      set({ records, isLoading: false });
    } catch (error) {
      set({ error: '更新记录失败', isLoading: false });
    }
  },

  deleteRecord: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.deleteRecord(id);
      const records = await db.getAllRecords();
      set({ records, isLoading: false });
    } catch (error) {
      set({ error: '删除记录失败', isLoading: false });
    }
  },

  queryRecords: async (params) => {
    const records = get().records.length > 0 ? get().records : await db.getAllRecords();
    return records.filter(record => {
      if (params.ledgerId && record.ledgerId !== params.ledgerId) return false;
      if (params.person && !record.person.includes(params.person)) return false;
      if (params.startDate && record.date < params.startDate) return false;
      if (params.endDate && record.date > params.endDate) return false;
      if (params.occasion && !record.occasion.includes(params.occasion)) return false;
      return true;
    });
  },

  getStatistics: async (params) => {
    const records = await get().queryRecords(params);
    const ledgers = get().ledgers;
    const personMap = new Map<string, StatisticsResult>();
    
    records.forEach(record => {
      const existing = personMap.get(record.person) || {
        person: record.person,
        sendCount: 0,
        sendTotal: 0,
        receiveCount: 0,
        receiveTotal: 0,
        balance: 0
      };
      
      const ledger = ledgers.find(l => l.id === record.ledgerId);
      const isSend = ledger?.type === 'send';
      
      if (isSend) {
        existing.sendCount++;
        existing.sendTotal += parseFloat(record.amount) || 0;
      } else {
        existing.receiveCount++;
        existing.receiveTotal += parseFloat(record.amount) || 0;
      }
      
      existing.balance = existing.receiveTotal - existing.sendTotal;
      personMap.set(record.person, existing);
    });
    
    return Array.from(personMap.values());
  },

  addLedger: async (ledger) => {
    set({ isLoading: true, error: null });
    try {
      await db.addLedger(ledger);
      const ledgers = await db.getAllLedgers();
      set({ ledgers, isLoading: false });
    } catch (error) {
      set({ error: '创建账本失败', isLoading: false });
    }
  },

  updateLedger: async (ledger) => {
    set({ isLoading: true, error: null });
    try {
      await db.updateLedger(ledger);
      const ledgers = await db.getAllLedgers();
      set({ ledgers, isLoading: false });
    } catch (error) {
      set({ error: '更新账本失败', isLoading: false });
    }
  },

  deleteLedger: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.deleteLedger(id);
      const ledgers = await db.getAllLedgers();
      set({ ledgers, isLoading: false });
    } catch (error) {
      set({ error: '删除账本失败', isLoading: false });
    }
  },

  exportToJson: async () => {
    return await db.exportDatabase();
  },

  importFromJson: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await db.importDatabase(data);
      const records = await db.getAllRecords();
      const ledgers = await db.getAllLedgers();
      set({ records, ledgers, isLoading: false });
    } catch (error) {
      set({ error: '导入失败', isLoading: false });
    }
  },

  exportToJsonFile: async () => {
    const data = await db.exportDatabase();
    const { saveFileToAppDir } = await import('../utils/filesystem');
    const filename = `记账本备份_${new Date().toISOString().split('T')[0]}.json`;
    await saveFileToAppDir(filename, data, false);
    return filename;
  }
}));
