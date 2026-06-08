import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

export const getDateLocale = (language: 'en' | 'zh') => {
  return language === 'zh' ? zhCN : enUS;
};

// Returns date string like "2026年04月30日" or "MMM dd, yyyy"
export const formatDate = (date: Date | string | number, language: 'en' | 'zh', showTime = false) => {
  const d = new Date(date);
  const locale = getDateLocale(language);
  
  if (language === 'zh') {
    return format(d, showTime ? 'yyyy年MM月dd日 HH:mm' : 'yyyy年MM月dd日', { locale });
  } else {
    // We use MMM dd, yyyy for table dates in English
    return format(d, showTime ? 'MMM dd, yyyy, hh:mm a' : 'MMM dd, yyyy', { locale });
  }
};

// Returns month string like "2026年04月" or "April 2026"
export const formatMonth = (date: Date | string | number, language: 'en' | 'zh') => {
  const d = new Date(date);
  const locale = getDateLocale(language);
  
  if (language === 'zh') {
    return format(d, 'yyyy年MM月', { locale });
  } else {
    return format(d, 'MMMM yyyy', { locale });
  }
};

// For reports, short dates like 'MMM dd' or 'MM月dd日'
export const formatShortDate = (date: Date | string | number, language: 'en' | 'zh') => {
  const d = new Date(date);
  const locale = getDateLocale(language);
  
  if (language === 'zh') {
    return format(d, 'MM月dd日', { locale });
  } else {
    return format(d, 'MMM dd', { locale });
  }
};

// Time only: "02:30 PM" or "14:30"
export const formatTime = (date: Date | string | number, language: 'en' | 'zh') => {
  const d = new Date(date);
  const locale = getDateLocale(language);
  
  if (language === 'zh') {
    return format(d, 'HH:mm', { locale });
  } else {
    return format(d, 'hh:mm a', { locale });
  }
};
