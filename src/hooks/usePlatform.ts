import { useQuery } from '@tanstack/react-query';
import { platform } from '@tauri-apps/plugin-os';

export function usePlatform() {
  const { data: platformType, ...rest } = useQuery({
    queryKey: ['platform'],
    queryFn: async () => {
      try {
        return await platform();
      } catch {
        // Fallback to browser detection if Tauri API fails
        return typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
          ? 'Darwin'
          : 'Unknown';
      }
    },
    staleTime: Infinity, // Platform doesn't change during runtime
  });

  const isMacOS = platformType === 'macos';

  return {
    platform: platformType,
    isMacOS,
    ...rest,
  };
}