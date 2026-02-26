export interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: { en: string; id: string };
  path: string;
}

export type Language = 'en' | 'id';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export interface Content {
  en: {
    [key: string]: string;
  };
  id: {
    [key: string]: string;
  };
}

export type BasemapType = 'osm' | 'satellite';

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'tile' | 'geojson' | 'marker';
}