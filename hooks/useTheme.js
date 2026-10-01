import { themes } from "@/lib/themes";

export function useTheme(type) {
  const defaultTheme = themes.gourmet;
  return themes[type] || defaultTheme;
}
