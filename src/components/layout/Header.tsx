import React from 'react';
import { LogIn } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Header: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="fixed top-0 right-0 left-20 bg-white/95 backdrop-blur-sm shadow-sm z-30 px-8 py-3 border-b border-gray-200">
      <div className="flex justify-between items-center">
        {/* Logo - Centered */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.svg" 
              alt="Searibu Logo" 
              className="h-10 w-auto object-contain"
              onError={(e) => {
                // Fallback to text if image not found
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="hidden text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              SEARIBU
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Language Switch */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium ${
                language === 'en'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('id')}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium ${
                language === 'id'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ID
            </button>
          </div>

          {/* Sign In Button */}
          <button className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md">
            <LogIn className="w-4 h-4" />
            <span className="font-medium text-sm">{language === 'en' ? 'Sign In' : 'Masuk'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};