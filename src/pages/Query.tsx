import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { OCCASIONS } from '@/types';
import type { Record as RecordType, Ledger } from '@/types';
import { ArrowLeft, Search, Edit2, Trash2, ArrowUpDown, Trash, Folder, Download } from 'lucide-react';
import { exportToExcelToAppDir } from '@/utils/excel';

export default function Query() {
  const navigate = useNavigate();
  const { queryRecords, updateRecord, deleteRecord, ledgers } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);

  const [filteredRecords, setFilteredRecords] = useState<RecordType[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [sortField, setSortField] = useState<keyof RecordType>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState({
    person: '',
    startDate: '',
    endDate: '',
    occasion: '',
    ledgerId: ''
  });

  const [editingRecord, setEditingRecord] = useState<RecordType | null>(null);

  const getLedgerById = (ledgerId: string): Ledger | undefined => {
    return ledgers.find(l => l.id === ledgerId);
  };

  const isSendRecord = (record: RecordType): boolean => {
    const ledger = getLedgerById(record.ledgerId);
    return ledger?.type === 'send';
  };

  const sortRecords = useCallback((recordsToSort: RecordType[]): RecordType[] => {
    return [...recordsToSort].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'amount') {
        aVal = String(parseFloat(aVal as string) || 0);
        bVal = String(parseFloat(bVal as string) || 0);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [sortField, sortOrder]);

  const refreshRecords = useCallback(async () => {
    try {
      const results = await queryRecords(filters);
      setFilteredRecords(sortRecords(results));
    } catch (err) {
      console.error('加载记录失败:', err);
    }
  }, [queryRecords, sortRecords, filters]);

  useEffect(() => {
    setFilteredRecords([]);
  }, []);

  const handleSort = (field: keyof RecordType) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSearch = async () => {
    const results = await queryRecords(filters);
    setFilteredRecords(sortRecords(results));
    setSelectedIds(new Set());
  };

  const handleExportExcel = async () => {
    if (filteredRecords.length === 0) {
      alert('暂无记录可导出');
      return;
    }
    
    setIsExporting(true);
    try {
      const uri = await exportToExcelToAppDir(filteredRecords, ledgers);
      if (uri.includes('/')) {
        alert(`Excel文件已导出到「记账本」目录`);
      } else {
        alert(`Excel文件已下载`);
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setFilters({
      person: '',
      startDate: '',
      endDate: '',
      occasion: '',
      ledgerId: ''
    });
    setSelectedIds(new Set());
    setFilteredRecords([]);
  };

  const handleEdit = (record: RecordType) => {
    setEditingRecord({ ...record });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    await updateRecord(editingRecord);
    setEditingRecord(null);
    refreshRecords();
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      await deleteRecord(id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refreshRecords();
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？此操作不可恢复。`)) return;

    setIsDeleting(true);
    try {
      for (const id of selectedIds) {
        await deleteRecord(id);
      }
      setSelectedIds(new Set());
      refreshRecords();
    } catch (err) {
      console.error('批量删除失败:', err);
      alert('批量删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const isAllSelected = filteredRecords.length > 0 && selectedIds.size === filteredRecords.length;

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
            <h1 className="text-xl font-bold text-gray-800">查询记录</h1>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBatchDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 text-sm"
              >
                <Trash size={16} />
                删除({selectedIds.size})
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {showFilters && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">对象姓名</label>
                <input
                  type="text"
                  value={filters.person}
                  onChange={(e) => setFilters({ ...filters, person: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="搜索姓名..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账本</label>
                <select
                  value={filters.ledgerId}
                  onChange={(e) => setFilters({ ...filters, ledgerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">全部账本</option>
                  {ledgers.map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.name} ({ledger.type === 'send' ? '送礼' : '收礼'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">场合</label>
                <select
                  value={filters.occasion}
                  onChange={(e) => setFilters({ ...filters, occasion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">全部场合</option>
                  {OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                重置
              </button>
              <button
                onClick={handleSearch}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                查询
              </button>
            </div>
          </div>
        )}

        {filteredRecords.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    {[
                      { key: 'ledger', label: '账本' },
                      { key: 'person', label: '对象' },
                      { key: 'amount', label: '金额' },
                      { key: 'date', label: '日期' },
                      { key: 'occasion', label: '场合' },
                      { key: 'actions', label: '操作' }
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => col.key !== 'actions' && handleSort(col.key as keyof RecordType)}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {col.key !== 'actions' && (
                            <ArrowUpDown size={12} className="opacity-50" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      onClick={() => handleEdit(record)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id)}
                          onChange={() => toggleSelect(record.id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          isSendRecord(record)
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {getLedgerById(record.ledgerId)?.name || '未知'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-800 whitespace-nowrap">{record.person}</td>
                      <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">¥{record.amount}</td>
                      <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">{record.date}</td>
                      <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">{record.occasion}</td>
                      <td className="px-3 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-500">送礼笔数</div>
                  <div className="text-sm font-semibold text-red-600">
                    {filteredRecords.filter(r => isSendRecord(r)).length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">送礼总额</div>
                  <div className="text-sm font-semibold text-red-600">
                    ¥{filteredRecords.filter(r => isSendRecord(r)).reduce((sum, r) => sum + parseFloat(r.amount) || 0, 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">收礼笔数</div>
                  <div className="text-sm font-semibold text-green-600">
                    {filteredRecords.filter(r => !isSendRecord(r)).length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">收礼总额</div>
                  <div className="text-sm font-semibold text-green-600">
                    ¥{filteredRecords.filter(r => !isSendRecord(r)).reduce((sum, r) => sum + parseFloat(r.amount) || 0, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Download size={18} />
                {isExporting ? '导出中...' : '导出 Excel'}
              </button>
            </div>
            
            <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
              <span>共 {filteredRecords.length} 条记录</span>
              {selectedIds.size > 0 && (
                <span className="text-blue-600">已选 {selectedIds.size} 条</span>
              )}
            </div>
          </div>
        )}

        {filteredRecords.length > 0 && (
          <p className="text-center text-gray-500 text-sm mt-4">
            提示：单击记录可快速编辑 | 勾选多条可批量删除 | 点击导出按钮将查询结果导出到「记账本」目录
          </p>
        )}
      </main>

      {editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">编辑记录</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账本</label>
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
                  isSendRecord(editingRecord)
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {getLedgerById(editingRecord.ledgerId)?.name || '未知'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isSendRecord(editingRecord) ? '送礼对象' : '送礼人'}
                </label>
                <input
                  type="text"
                  value={editingRecord.person}
                  onChange={(e) => setEditingRecord({ ...editingRecord, person: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
                <input
                  type="text"
                  value={editingRecord.amount}
                  onChange={(e) => setEditingRecord({ ...editingRecord, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">场合</label>
                <select
                  value={editingRecord.occasion}
                  onChange={(e) => setEditingRecord({ ...editingRecord, occasion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={editingRecord.remark}
                  onChange={(e) => setEditingRecord({ ...editingRecord, remark: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingRecord(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
