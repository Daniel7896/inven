export const Theme = {
  colors: {
    background: '#0B111E',      // Ultra deep dark slate blue
    card: '#162235',            // Rich steel blue/slate for cards
    cardBorder: '#233550',      // Subtle grid border lines
    primary: '#6366F1',         // High-energy Electric Indigo
    secondary: '#10B981',       // Vibrant Mint/Emerald
    accent: '#F59E0B',          // Warning/low stock Amber
    danger: '#EF4444',          // Error/Alert Rose
    text: '#F3F4F6',            // Crisp Off-White
    textMuted: '#9CA3AF',       // Subdued Cool Gray
    textDark: '#111827',        // Solid black for contrasting items
    white: '#FFFFFF',
    border: '#1F2E45',          // Generic border color
    chartGradientStart: '#6366F1',
    chartGradientEnd: '#4F46E5',
    overlay: 'rgba(11, 17, 30, 0.85)' // Semi-transparent black overlay
  },
  roundness: {
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  }
};

export const Colors = {
  light: {
    background: Theme.colors.background,
    backgroundSelected: Theme.colors.primary,
    backgroundElement: Theme.colors.card,
    text: Theme.colors.text,
    textSecondary: Theme.colors.textMuted,
    link: Theme.colors.secondary,
    primary: Theme.colors.primary,
  },
  dark: {
    background: Theme.colors.background,
    backgroundSelected: Theme.colors.primary,
    backgroundElement: Theme.colors.card,
    text: Theme.colors.text,
    textSecondary: Theme.colors.textMuted,
    link: Theme.colors.secondary,
    primary: Theme.colors.primary,
  }
};

export type ThemeColor = keyof typeof Colors.light;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32
};

export const Fonts = {
  mono: 'System'
};

export const MaxContentWidth = 1200;
