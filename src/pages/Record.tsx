import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { OCCASIONS } from '@/types';
import type { Ledger } from '@/types';
import { ArrowLeft, Folder } from 'lucide-react';

const LAST_LEDGER_KEY = 'last_ledger_id';

export default function Record() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addRecord, ledgers } = useAppStore();
  
  const sendLedgers = ledgers.filter(l => l.type === 'send');
  const receiveLedgers = ledgers.filter(l => l.type === 'receive');
  
  const [ledgerId, setLedgerId] = useState('');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [occasion, setOccasion] = useState('其它');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const lastLedgerId = localStorage.getItem(LAST_LEDGER_KEY);
    if (lastLedgerId && ledgers.some(l => l.id === lastLedgerId)) {
      setLedgerId(lastLedgerId);
    }
  }, [ledgers]);

  const selectedLedger = ledgers.find(l => l.id === ledgerId);
  const isSend = selectedLedger?.type === 'send';

  const isFormValid = ledgerId && person.trim() && amount.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      await addRecord({
        ledgerId,
        person: person.trim(),
        amount: amount.trim(),
        date,
        occasion,
        remark: remark.trim()
      });
      
      localStorage.setItem(LAST_LEDGER_KEY, ledgerId);
      
      alert('记录添加成功！');
      navigate('/');
    } catch (error) {
      alert('添加失败，请重试');
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-xl font-bold text-gray-800">新增记录</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择账本
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">送礼账本</label>
                  <select
                    value={selectedLedger?.type === 'send' ? ledgerId : ''}
                    onChange={(e) => setLedgerId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      selectedLedger?.type === 'send' ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">请选择</option>
                    {sendLedgers.map((ledger) => (
                      <option key={ledger.id} value={ledger.id}>
                        {ledger.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">收礼账本</label>
                  <select
                    value={selectedLedger?.type === 'receive' ? ledgerId : ''}
                    onChange={(e) => setLedgerId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      selectedLedger?.type === 'receive' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">请选择</option>
                    {receiveLedgers.map((ledger) => (
                      <option key={ledger.id} value={ledger.id}>
                        {ledger.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {ledgers.length === 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  <Folder size={14} className="inline mr-1" />
                  暂无账本，请先在账本管理中创建账本
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isSend ? '送礼对象' : '送礼人'}
              </label>
              <input
                type="text"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`请输入${isSend ? '送礼对象' : '送礼人'}姓名`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                金额
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入金额（元）"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日期
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                场合
              </label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {OCCASIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="可选：添加备注说明"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`w-full py-3 rounded-lg font-medium text-white transition disabled:opacity-50 ${
                isSend
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isSubmitting ? '保存中...' : '保存记录'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
