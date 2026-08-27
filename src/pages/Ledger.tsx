import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, ChevronRight, BarChart3, Download } from 'lucide-react';
import type { Ledger } from '@/types';
import type { Record as RecordType } from '@/types';
import { normalizeDate } from '@/lib/utils';
import { exportToExcelToAppDir } from '@/utils/excel';

export default function LedgerPage() {
  const navigate = useNavigate();
  const { ledgers, addLedger, updateLedger, deleteLedger, queryRecords } = useAppStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);
  const [newLedger, setNewLedger] = useState({
    name: '',
    type: 'send' as 'send' | 'receive'
  });
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);
  const [ledgerRecords, setLedgerRecords] = useState<RecordType[]>([]);

  const loadLedgerRecords = async (ledger: Ledger) => {
    const records = await queryRecords({ ledgerId: ledger.id });
    setLedgerRecords(records);
    setSelectedLedger(ledger);
  };

  const closeDetail = () => {
    setSelectedLedger(null);
    setLedgerRecords([]);
  };

  const getLedgerTotal = (): number => {
    return ledgerRecords.reduce((sum, r) => sum + parseFloat(r.amount) || 0, 0);
  };

  const handleAddLedger = async () => {
    if (!newLedger.name.trim()) {
      alert('请输入账本名称');
      return;
    }

    await addLedger({
      id: Date.now().toString(),
      name: newLedger.name.trim(),
      type: newLedger.type,
      createdAt: new Date().toISOString()
    });

    setNewLedger({ name: '', type: 'send' });
    setShowAddModal(false);
  };

  const handleUpdateLedger = async () => {
    if (!editingLedger || !editingLedger.name.trim()) {
      alert('请输入账本名称');
      return;
    }

    await updateLedger(editingLedger);
    setEditingLedger(null);
  };

  const handleDeleteLedger = async (id: string) => {
    if (confirm('确定要删除这个账本吗？')) {
      await deleteLedger(id);
    }
  };

  const handleExportLedger = async (ledger: Ledger) => {
    const records = await queryRecords({ ledgerId: ledger.id });
    if (records.length === 0) {
      alert('该账本暂无记录可导出');
      return;
    }
    try {
      await exportToExcelToAppDir(records, ledgers);
      alert(`账本「${ledger.name}」的 ${records.length} 条记录已导出`);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  const sendLedgers = ledgers.filter(l => l.type === 'send');
  const receiveLedgers = ledgers.filter(l => l.type === 'receive');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800">账本管理</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            新增账本
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-4 py-3 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="font-medium text-red-700">送礼账本</span>
                <span className="text-xs text-red-500 ml-auto">({sendLedgers.length}个)</span>
              </div>
            </div>
            <div className="p-4">
              {sendLedgers.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">暂无送礼账本</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {sendLedgers.map((ledger) => (
                    <div
                      key={ledger.id}
                      className="p-3 bg-red-50 rounded-lg hover:bg-red-100 transition cursor-pointer"
                    >
                      <div 
                        className="flex items-center justify-between"
                        onClick={() => loadLedgerRecords(ledger)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-gray-700">{ledger.name}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingLedger({ ...ledger }); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleExportLedger(ledger); }}
                          className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteLedger(ledger.id); }}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-4 py-3 bg-green-50 border-b border-green-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium text-green-700">收礼账本</span>
                <span className="text-xs text-green-500 ml-auto">({receiveLedgers.length}个)</span>
              </div>
            </div>
            <div className="p-4">
              {receiveLedgers.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">暂无收礼账本</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {receiveLedgers.map((ledger) => (
                    <div
                      key={ledger.id}
                      className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition cursor-pointer"
                    >
                      <div 
                        className="flex items-center justify-between"
                        onClick={() => loadLedgerRecords(ledger)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-gray-700">{ledger.name}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingLedger({ ...ledger }); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleExportLedger(ledger); }}
                          className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteLedger(ledger.id); }}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedLedger && (
          <div className={`bg-white rounded-xl shadow-md overflow-hidden ${
            selectedLedger.type === 'send' ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'
          }`}>
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 size={20} className={selectedLedger.type === 'send' ? 'text-red-500' : 'text-green-500'} />
                <div>
                  <h3 className="font-medium text-gray-800">{selectedLedger.name}</h3>
                  <span className={`text-xs ${
                    selectedLedger.type === 'send' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {selectedLedger.type === 'send' ? '送礼账本' : '收礼账本'}
                  </span>
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className={`p-3 rounded-lg ${
                  selectedLedger.type === 'send' ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  <div className="text-xs text-gray-500">记录总数</div>
                  <div className={`text-lg font-bold ${
                    selectedLedger.type === 'send' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {ledgerRecords.length} 条
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${
                  selectedLedger.type === 'send' ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  <div className="text-xs text-gray-500">金额总计</div>
                  <div className={`text-lg font-bold ${
                    selectedLedger.type === 'send' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ¥{getLedgerTotal().toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">对象</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">金额</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">日期</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">场合</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledgerRecords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-sm">
                          该账本暂无记录
                        </td>
                      </tr>
                    ) : (
                      ledgerRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-800">{record.person}</td>
                          <td className={`px-3 py-2 text-sm font-medium text-right ${
                            selectedLedger.type === 'send' ? 'text-red-600' : 'text-green-600'
                          }`}>¥{record.amount}</td>
                          <td className="px-3 py-2 text-sm text-gray-600 text-right">{normalizeDate(record.date)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{record.occasion}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">新增账本</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账本名称</label>
                <input
                  type="text"
                  value={newLedger.name}
                  onChange={(e) => setNewLedger({ ...newLedger, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="如：亲戚送礼"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">账本类型</label>
                <div className="flex gap-3">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition ${
                      newLedger.type === 'send'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="send"
                      checked={newLedger.type === 'send'}
                      onChange={(e) => setNewLedger({ ...newLedger, type: e.target.value as 'send' })}
                      className="hidden"
                    />
                    <div className={`w-3 h-3 rounded-full ${newLedger.type === 'send' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                    送礼账本
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition ${
                      newLedger.type === 'receive'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="receive"
                      checked={newLedger.type === 'receive'}
                      onChange={(e) => setNewLedger({ ...newLedger, type: e.target.value as 'receive' })}
                      className="hidden"
                    />
                    <div className={`w-3 h-3 rounded-full ${newLedger.type === 'receive' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    收礼账本
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <X size={18} />
                取消
              </button>
              <button
                onClick={handleAddLedger}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {editingLedger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">编辑账本</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账本名称</label>
                <input
                  type="text"
                  value={editingLedger.name}
                  onChange={(e) => setEditingLedger({ ...editingLedger, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账本类型</label>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  editingLedger.type === 'send'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {editingLedger.type === 'send' ? '送礼账本' : '收礼账本'}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingLedger(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <X size={18} />
                取消
              </button>
              <button
                onClick={handleUpdateLedger}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}