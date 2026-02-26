import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Info } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-700 rounded-full mb-6 animate-pulse">
          <Info className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-teal-900 mb-4">
          {language === 'en' ? 'About Us' : 'Tentang Kami'}
        </h2>
        <p className="text-xl text-gray-600">
          {language === 'en' ? 'Coming Soon' : 'Segera Hadir'}
        </p>
      </div>
    </div>
  );
};
