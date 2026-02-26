import { Home, Map, Info, BookOpen } from 'lucide-react';
import React from 'react';
import { MenuItem } from '../types';

export const MENU_ITEMS: Omit<MenuItem, 'icon'>[] = [
  {
    id: 'home',
    label: { en: 'Home', id: 'Beranda' },
    path: '/',
  },
  {
    id: 'webgis',
    label: { en: 'WebGIS', id: 'WebGIS' },
    path: '/webgis',
  },
  {
    id: 'about',
    label: { en: 'About Us', id: 'Tentang Kami' },
    path: '/about',
  },
  {
    id: 'guide',
    label: { en: 'User Guide', id: 'Panduan Penggunaan' },
    path: '/guide',
  },
];

export const getMenuIcon = (id: string): React.ReactNode => {
  const icons: { [key: string]: React.ReactNode } = {
    home: React.createElement(Home, { className: 'w-6 h-6' }),
    webgis: React.createElement(Map, { className: 'w-6 h-6' }),
    about: React.createElement(Info, { className: 'w-6 h-6' }),
    guide: React.createElement(BookOpen, { className: 'w-6 h-6' }),
  };
  return icons[id];
};
