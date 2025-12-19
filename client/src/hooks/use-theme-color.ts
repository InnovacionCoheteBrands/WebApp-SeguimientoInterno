import { useEffect, useMemo, useState } from "react";

type ThemeColorMap = Record<string, string>;

const STORAGE_KEY = "theme-color";
const PRESET_COLORS: ThemeColorMap = {
  yellow: "43 96% 56%",
  royalBlue: "221 83% 53%",
  orange: "24 95% 53%",
  violet: "270 95% 60%",
  emerald: "142 71% 45%",
};

const DEFAULT_COLOR = PRESET_COLORS.yellow;

const setCssPrimary = (hslValue: string) => {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--primary", hslValue);
  document.documentElement.style.setProperty("--ring", hslValue);
};

export function useThemeColor() {
  const [themeColor, setThemeColor] = useState<string>(DEFAULT_COLOR);

  // Apply stored preference on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = stored || DEFAULT_COLOR;
    setThemeColor(initial);
    setCssPrimary(initial);
    if (!stored) {
      window.localStorage.setItem(STORAGE_KEY, initial);
    }
  }, []);

  // Persist and sync DOM whenever the color changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    setCssPrimary(themeColor);
    window.localStorage.setItem(STORAGE_KEY, themeColor);
  }, [themeColor]);

  const presetList = useMemo(
    () =>
      [
        { key: "yellow", label: "Amarillo (Default)", value: PRESET_COLORS.yellow },
        { key: "royalBlue", label: "Azul Real", value: PRESET_COLORS.royalBlue },
        { key: "orange", label: "Naranja Vibrante", value: PRESET_COLORS.orange },
        { key: "violet", label: "Violeta", value: PRESET_COLORS.violet },
        { key: "emerald", label: "Verde Esmeralda", value: PRESET_COLORS.emerald },
      ] as const,
    []
  );

  const activeKey = useMemo(
    () => presetList.find((option) => option.value === themeColor)?.key || null,
    [presetList, themeColor]
  );

  return {
    themeColor,
    setThemeColor,
    presetColors: PRESET_COLORS,
    presetOptions: presetList,
    activeKey,
  };
}
