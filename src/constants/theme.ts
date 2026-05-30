const DarkColors = {
  primary: '#208AEF',
  primaryLight: '#E6F4FE',
  primaryDark: '#1A6EC0',
  background: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#21262D',
  card: '#1C2128',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  border: '#30363D',
  error: '#F85149',
  success: '#3FB950',
  warning: '#D29922',
  white: '#FFFFFF',
  black: '#000000',
  tabBar: '#161B22',
  tabBarBorder: '#21262D',
};

let activeColors = DarkColors;

export function updateActiveColors(newColors: typeof DarkColors) {
  activeColors = newColors;
}

// Export Colors as a Proxy that dynamically resolves properties to the current activeColors
export const Colors = new Proxy(DarkColors, {
  get(target, prop) {
    return activeColors[prop as keyof typeof activeColors];
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};
