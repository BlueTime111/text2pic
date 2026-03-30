import { create } from 'zustand';
import type { Size } from '../types';

interface ThemeState {
  templateName: string;
  theme: string;
  isDarkMode: boolean;
  fontSize: number;
  textColor: string;
  customColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  sizeName: string;
  size: Size;
  
  setTemplateName: (name: string) => void;
  setTheme: (theme: string) => void;
  toggleDarkMode: () => void;
  setFontSize: (size: number) => void;
  setTextColor: (color: string) => void;
  setCustomColor: (color: string) => void;
  setFontFamily: (font: 'sans' | 'serif' | 'mono') => void;
  setSizeName: (name: string) => void;
  setSize: (size: Size) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  templateName: localStorage.getItem('text2img_template') || 'default',
  theme: localStorage.getItem('text2img_theme') || 'light',
  isDarkMode: false,
  fontSize: parseInt(localStorage.getItem('text2pic_fontSize') || '17'),
  textColor: '',
  customColor: localStorage.getItem('text2img_customColor') || '#ffffff',
  fontFamily: 'sans',
  sizeName: 'mobile',
  size: { width: 375, height: 'auto' },

  setTemplateName: (name) => {
    localStorage.setItem('text2img_template', name);
    set({ templateName: name });
  },
  setTheme: (theme) => {
    localStorage.setItem('text2img_theme', theme);
    set({ theme });
  },
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setFontSize: (size) => {
    const finalSize = Math.max(12, Math.min(size, 40));
    localStorage.setItem('text2pic_fontSize', finalSize.toString());
    set({ fontSize: finalSize });
  },
  setTextColor: (color) => set({ textColor: color }),
  setCustomColor: (color) => {
    localStorage.setItem('text2img_customColor', color);
    set({ customColor: color });
  },
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setSizeName: (name) => set({ sizeName: name }),
  setSize: (size) => set({ size })
}));
