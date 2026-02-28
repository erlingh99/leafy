import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlants } from '../hooks/usePlants';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translations } from '../translations/types';

const t = translations["en"];

describe('usePlants optimistic updates', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    // Disable background refetches so tests stay deterministic
                    staleTime: Infinity,
                    gcTime: Infinity,
                },
            },
        });
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [],
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    it('optimistically updates plant when watered', async () => {
        const mockPlants = [
            { id: '1', name: 'Aloe', watering_interval: 7, last_watered: '2023-01-01T00:00:00.000Z' },
        ];

        // Pre-populate cache so useQuery doesn't need to fetch
        queryClient.setQueryData(['plants'], mockPlants);

        const { result } = renderHook(() => usePlants(t), { wrapper });

        // Clear any background fetches that happened during render
        (global.fetch as ReturnType<typeof vi.fn>).mockClear();
        // Mock successful fetch for watering
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        });

        // Act: water plant
        act(() => {
            result.current.waterPlant('1');
        });

        // Verify optimistic update (last_watered should be updated immediately)
        await waitFor(() => {
            const updatedPlants = queryClient.getQueryData<Array<{ id: string; name: string; watering_interval: number; last_watered: string }>>(['plants']);
            expect(updatedPlants?.[0].last_watered).not.toBe('2023-01-01T00:00:00.000Z');
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/plants/water/1', expect.objectContaining({
            method: 'POST'
        }));
    });
});
