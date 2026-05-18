import * as XLSX from 'xlsx';
import type { Record } from '../types';
import type { Ledger } from '../types';
import { saveFileToAppDir } from './filesystem';

export const exportToExcel = (records: Record[], ledgers: Ledger[], filename: string = '记账本记录.xlsx'): void => {
  const headers = ['类型', '对象/送礼人', '金额/物品', '日期', '场合', '备注', '创建时间'];
  
  const data = records.map(record => {
    const ledger = ledgers.find(l => l.id === record.ledgerId);
    const typeStr = ledger?.type === 'send' ? '送礼' : '收礼';
    return [
      typeStr,
      record.person,
      record.amount,
      record.date,
      record.occasion,
      record.remark,
      new Date(parseInt(record.createdAt)).toLocaleString()
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '记录');
  
  XLSX.writeFile(workbook, filename);
};

export const exportToExcelToAppDir = async (records: Record[], ledgers: Ledger[]): Promise<string> => {
  const headers = ['类型', '对象/送礼人', '金额/物品', '日期', '场合', '备注', '创建时间'];
  
  const data = records.map(record => {
    const ledger = ledgers.find(l => l.id === record.ledgerId);
    const typeStr = ledger?.type === 'send' ? '送礼' : '收礼';
    return [
      typeStr,
      record.person,
      record.amount,
      record.date,
      record.occasion,
      record.remark,
      new Date(parseInt(record.createdAt)).toLocaleString()
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '记录');
  
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const filename = `记账本记录_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  const uri = await saveFileToAppDir(filename, new Uint8Array(excelBuffer), true);
  return uri;
};

export const importFromExcel = (file: File, ledger: Ledger): Promise<Record[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (!jsonData || jsonData.length <= 1) {
          resolve([]);
          return;
        }
        
        const headers = jsonData[0] as string[];
        const hasTypeColumn = headers.some(h => String(h).includes('类型') || String(h).includes('送礼') || String(h).includes('收礼'));
        
        const records: Record[] = jsonData.slice(1).map((row: unknown[], index: number) => {
          const rowArray = row as string[];
          const person = rowArray[1] || '';
          const amount = rowArray[2] || '';
          const date = rowArray[3] || new Date().toISOString().split('T')[0];
          const occasion = rowArray[4] || '其它';
          const remark = rowArray[5] || '';
          const now = Date.now().toString();
          
          return {
            id: `import_${now}_${index}`,
            ledgerId: ledger.id,
            person: String(person).trim(),
            amount: String(amount).trim(),
            date: String(date),
            occasion: String(occasion),
            remark: String(remark).trim(),
            createdAt: now,
            updatedAt: now
          };
        }).filter(r => r.person && r.amount);
        
        resolve(records);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsBinaryString(file);
  });
};
