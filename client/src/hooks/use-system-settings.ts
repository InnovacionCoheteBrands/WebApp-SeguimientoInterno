import { useQuery } from "@tanstack/react-query";
import { fetchSystemSettings } from "@/lib/api";
import type { SystemSettingsResponse } from "@/lib/system-settings";
import { normalizeSystemSettings } from "@/lib/system-settings";

export function useSystemSettings() {
  return useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      try {
        const data = (await fetchSystemSettings()) as SystemSettingsResponse;
        return normalizeSystemSettings(data);
      } catch {
        // Keep app usable even if settings endpoint fails
        return normalizeSystemSettings(null);
      }
    },
    retry: false,
    staleTime: 1000 * 30,
  });
}


