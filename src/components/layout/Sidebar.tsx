import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MENU_ITEMS, getMenuIcon } from '../../utils/constants';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeMenu, 
  setActiveMenu,
  collapsed,
  setCollapsed 
}) => {
  const { language } = useLanguage();

  const menuItems = MENU_ITEMS.map(item => ({
    ...item,
    icon: getMenuIcon(item.id),
  }));

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white shadow-xl text-gray-800 transition-all duration-300 z-40 border-r border-gray-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 bg-white rounded-full p-1.5 shadow-lg border border-gray-200 hover:bg-gray-50 transition-all z-50"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* Menu Items */}
        <nav className="flex-1 py-8 px-3 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center px-4 py-3 mb-2 rounded-xl transition-all duration-200 group ${
                activeMenu === item.id
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className={`flex-shrink-0 transition-transform ${
                activeMenu === item.id ? 'scale-110' : 'group-hover:scale-110'
              }`}>
                {item.icon}
              </div>
              <span
                className={`ml-4 font-medium transition-all duration-300 whitespace-nowrap ${
                  collapsed ? 'opacity-0 w-0' : 'opacity-100'
                }`}
              >
                {item.label[language]}
              </span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div
          className={`p-4 border-t border-gray-200 text-xs text-gray-500 transition-all duration-300 ${
            collapsed ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <p className="text-center font-medium">© 2025 Searibu</p>
          <p className="text-center">ITB Geodesy Team</p>
        </div>
      </div>
    </div>
  );
};