import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';

export default function Login() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState('');
  const { login, initApp, isLoading, error: storeError } = useAppStore();

  useEffect(() => {
    initApp();
  }, [initApp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isNewUser) {
      if (password !== confirmPassword) {
        setError('两次输入的口令不一致');
        return;
      }
      if (password.length < 4) {
        setError('口令长度至少4位');
        return;
      }
    }

    const success = await login(password);
    if (!success) {
      setError('口令错误，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">记账本</h1>
          <p className="text-gray-500">管理您的礼尚往来</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isNewUser ? '设置口令' : '输入口令'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="请输入口令"
              required
            />
          </div>

          {isNewUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认口令
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="请再次输入口令"
                required
              />
            </div>
          )}

          {(error || storeError) && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error || storeError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? '处理中...' : isNewUser ? '创建口令' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsNewUser(!isNewUser);
              setPassword('');
              setConfirmPassword('');
              setError('');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isNewUser ? '返回登录' : '首次使用？设置口令'}
          </button>
        </div>
      </div>
    </div>
  );
}
