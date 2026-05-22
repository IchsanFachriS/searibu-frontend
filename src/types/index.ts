export type Language    = "en" | "id";
export type BasemapType = "osm" | "satellite";
export type Plan        = "free" | "pro_monthly" | "pro_annual";
export type SubStatus   = "active" | "expired" | "cancelled";
export type ProFeature  = "s104_export" | "forecast_14d" | "activity_full" | "luwes_overlay";
export type UserRole    = "general" | "researcher";

export interface LanguageContextType {
  language:    Language;
  setLanguage: (lang: Language) => void;
}

export interface Subscription {
  plan:       Plan;
  status:     SubStatus;
  expires_at: string | null;
  starts_at?: string | null;
  user_id?:   number;
}

export interface AuthUser {
  id:          number;
  full_name:   string;
  email:       string;
  role:        UserRole;
  is_admin:    boolean;
  created_at:  string;
  last_login?: string;
  avatar?:     string;
}