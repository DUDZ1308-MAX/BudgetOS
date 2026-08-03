import { useQuery } from '@tanstack/react-query';
import { fetchForecastData } from '@/services/forecast/forecastData';

export function useForecastData(userId: string | undefined) {
  return useQuery({
    queryKey: ['cash-flow-forecast', userId],
    queryFn: () => fetchForecastData(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
