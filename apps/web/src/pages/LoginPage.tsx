import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../auth/AuthContext';
import { Wrench, ChevronDown, LogIn, ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selected = DEMO_USERS.find((u) => u.id === selectedUser);

  const handleLogin = () => {
    if (!selectedUser) return;
    login(selectedUser);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-secondary-500 flex flex-col font-display">
      {/* Header */}
      <div className="px-6 py-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Wrench className="w-10 h-10 text-primary-500" />
              <span className="text-3xl font-black text-white tracking-tight">
                Service<span className="text-primary-500">Core</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Employee Time Tracking & Payroll Dashboard
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-xl font-bold text-secondary-500 mb-2">Sign In</h2>
            <p className="text-sm text-gray-500 mb-6">
              Select a demo account to explore the dashboard
            </p>

            {/* Demo User Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Demo Account
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-primary-500 transition-colors text-left"
                >
                  {selected ? (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: selected.avatar }}
                      >
                        {selected.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{selected.name}</div>
                        <div className="text-xs text-gray-500">{selected.email}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Select a demo user...</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {DEMO_USERS.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                          selectedUser === user.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: user.avatar }}
                        >
                          {user.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400 mt-1">{user.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected user info */}
            {selected && (
              <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-primary-800 mb-1">
                  <LogIn className="w-4 h-4" />
                  Ready to sign in as {selected.name}
                </div>
                <p className="text-xs text-primary-600">{selected.description}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={!selectedUser}
              className={`w-full py-3 rounded-lg font-bold uppercase tracking-wide text-sm transition-colors flex items-center justify-center gap-2 ${
                selectedUser
                  ? 'bg-primary-500 hover:bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In to Dashboard
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                This is a demo application. No real authentication is required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
