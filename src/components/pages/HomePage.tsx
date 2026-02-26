import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowRight } from 'lucide-react';
import { Content } from '../../types';

const HOME_CONTENT: Content = {
  en: {
    title: 'Tide & Weather Insights',
    subtitle: 'Crafted for Safe and Meaningful Island Journeys',
    description:
      'Discover real-time tides, trusted forecasts, and curated marine activity recommendations across the Seribu Islands.',
    button: 'EXPLORE NOW',
  },
  id: {
    title: 'Informasi Pasang Surut & Cuaca',
    subtitle: 'Dirancang untuk Perjalanan Pulau yang Aman dan Bermakna',
    description:
      'Temukan informasi pasang surut real-time, prakiraan terpercaya, dan rekomendasi aktivitas laut yang dikurasi di Kepulauan Seribu.',
    button: 'JELAJAHI SEKARANG',
  },
};

export const HomePage: React.FC = () => {
  const { language } = useLanguage();
  const content = HOME_CONTENT[language];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-20"
        style={{
          backgroundImage: 'url("/background.png")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-blue-50/60 to-indigo-100/80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-8 max-w-5xl animate-fade-in">
        <div className="inline-block mb-6 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
          {language === 'en' ? 'Welcome to Searibu' : 'Selamat Datang di Searibu'}
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 mb-6 leading-tight">
          {content.title}
        </h1>
        
        <h2 className="text-xl md:text-2xl text-gray-700 font-medium mb-8 max-w-3xl mx-auto">
          {content.subtitle}
        </h2>
        
        <p className="text-base md:text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          {content.description}
        </p>
        
        <button className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-base font-semibold rounded-xl hover:from-indigo-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
          {content.button}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-200/30 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-3xl"></div>
    </div>
  );
};