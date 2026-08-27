import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { Plus, Search, Download, Folder, BookOpen, LogOut } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { logout, changePassword } = useAppStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogout = () => {
    logout();
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('新口令不一致');
      return;
    }
    if (newPassword.length < 4) {
      alert('口令长度至少4位');
      return;
    }
    
    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      alert('口令修改成功，请重新登录');
      logout();
    } else {
      alert('原口令错误');
    }
  };

  const menuItems = [
    { name: '新增记录', icon: Plus, path: '/record', color: 'bg-green-500' },
    { name: '查询记录', icon: Search, path: '/query', color: 'bg-blue-500' },
    { name: '账本管理', icon: Folder, path: '/ledger', color: 'bg-orange-500' },
    { name: '数据管理', icon: Download, path: '/import-export', color: 'bg-indigo-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">记账本</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-2 text-gray-600 hover:text-blue-600 transition"
              title="修改口令"
            >
              <BookOpen size={24} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 transition"
              title="退出"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path, { state: { type: item.name } })}
              className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className={`${item.color} p-4 rounded-full`}>
                <item.icon className="text-white" size={28} />
              </div>
              <span className="font-medium text-gray-700">{item.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">使用说明</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500">1.</span>
              <span>首次使用请先设置登录口令</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">2.</span>
              <span>点击"新增记录"可添加送礼或收礼信息</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">3.</span>
              <span>使用"查询记录"可按条件筛选和编辑记录</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">4.</span>
              <span>点击"账本管理"可创建送礼和收礼账本</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">5.</span>
              <span>支持Excel格式的数据导入导出</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">6.</span>
              <span>向作者捐赠</span>
            </li>
          </ul>
          <div className="mt-4 flex flex-col items-center">
            <img src="/3.png" alt="捐赠二维码" className="w-48 h-48 object-contain rounded-lg" />
            <p className="text-xs text-gray-400 mt-2">扫码捐赠，支持作者持续开发</p>
          </div>
        </div>
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">修改口令</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">原口令</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新口令</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">确认新口令</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
