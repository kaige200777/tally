import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { importFromExcel } from '@/utils/excel';
import { ArrowLeft, Upload, Download, Database, AlertCircle } from 'lucide-react';
import type { Ledger } from '@/types';

export default function ImportExport() {
  const navigate = useNavigate();
  const { records, ledgers, exportToJsonFile, importFromJson, addRecord } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<string>('');

  const handleExportBackup = async () => {
    try {
      const filename = await exportToJsonFile();
      alert(`备份文件「${filename}」已保存到「记账本」目录`);
    } catch (error) {
      console.error('备份失败:', error);
      alert('备份失败，请重试');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedLedger) {
      setImportStatus('导入失败：请先选择目标账本');
      return;
    }

    setIsImporting(true);
    setImportStatus('正在导入...');

    try {
      const selectedLedgerData = ledgers.find(l => l.id === selectedLedger);
      const importedRecords = await importFromExcel(file, selectedLedgerData!);
      
      if (importedRecords.length === 0) {
        setImportStatus('导入失败：文件为空或格式错误');
        setIsImporting(false);
        return;
      }

      for (const record of importedRecords) {
        await addRecord(record);
      }

      setImportStatus(`成功导入 ${importedRecords.length} 条记录到「${selectedLedgerData?.name}」`);
    } catch (error) {
      setImportStatus('导入失败：' + (error as Error).message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('导入备份将覆盖当前所有数据，确定继续吗？')) {
      return;
    }

    setIsImporting(true);
    setImportStatus('正在导入...');

    try {
      const text = await file.text();
      await importFromJson(text);
      setImportStatus('备份恢复成功！');
    } catch (error) {
      setImportStatus('恢复失败：' + (error as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">数据管理</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Database className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">数据管理</h2>
                <p className="text-sm text-gray-500">支持 Excel 和 JSON 两种格式的数据导入导出</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExportBackup}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  <Download size={18} />
                  备份数据
                </button>
                
                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer text-sm">
                  <Upload size={18} />
                  恢复数据
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                    disabled={isImporting}
                  />
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedLedger}
                  onChange={(e) => setSelectedLedger(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择目标账本</option>
                  {ledgers.map((ledger: Ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.name} ({ledger.type === 'send' ? '送礼' : '收礼'})
                    </option>
                  ))}
                </select>
                <label className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg cursor-pointer text-sm transition ${
                  selectedLedger 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}>
                  <Upload size={18} />
                  选择文件
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="hidden"
                    disabled={isImporting || !selectedLedger}
                  />
                </label>
              </div>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>• <strong>导入 Excel</strong>：选择目标账本后导入，记录将追加到该账本中</p>
              <p>• <strong>数据备份</strong>：导出完整数据库为 JSON 格式，保存到「记账本」目录</p>
              <p>• <strong>数据恢复</strong>：从 JSON 备份恢复数据，会覆盖现有数据</p>
              <p>• <strong>导出 Excel</strong>：在查询记录页面中导出查询结果到「记账本」目录</p>
            </div>
          </div>

          {importStatus && (
            <div className={`rounded-xl p-4 ${
              importStatus.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {importStatus}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
