import { useColorScheme as useNativeColorScheme } from 'react-native';

// react-native >=0.83 types ColorSchemeName as "light" | "dark" | "unspecified".
// Normalize to the two schemes our Colors palette actually defines so callers
// can index Colors[scheme] without a type error.
export function useColorScheme(): 'light' | 'dark' {
  return useNativeColorScheme() === 'dark' ? 'dark' : 'light';
}
