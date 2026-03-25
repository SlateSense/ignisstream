import { DefaultTheme } from '@react-navigation/native';

export const CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#7c3aed',
    background: '#ffffff',
    card: '#f9fafb',
    text: '#1f2937',
    border: '#e5e7eb',
    notification: '#ef4444',
  },
};

export const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#8b5cf6',
    background: '#111827',
    card: '#1f2937',
    text: '#f9fafb',
    border: '#374151',
    notification: '#ef4444',
  },
};
