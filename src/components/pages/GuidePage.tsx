import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { BookOpen } from 'lucide-react';

export const GuidePage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-600 rounded-full mb-6 animate-bounce">
          <BookOpen className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-orange-900 mb-4">
          {language === 'en' ? 'User Guide' : 'Panduan Penggunaan'}
        </h2>
        <p className="text-xl text-gray-600">
          {language === 'en' ? 'Coming Soon' : 'Segera Hadir'}
        </p>
      </div>
    </div>
  );
};
