import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from '@/pages/Index';
import { describe, it, expect, vi } from 'vitest';

const mockWaterAll = vi.fn();

// Mock usePlants
vi.mock('@/hooks/usePlants', () => ({
    usePlants: () => ({
        plants: [{ id: '1', name: 'Plant 1', watering_interval: 7, last_watered: new Date().toISOString() }],
        needsWater: () => true,
        getDaysUntilWatering: () => -1,
        waterAllPlants: mockWaterAll,
        waterPlant: vi.fn(),
        addPlant: vi.fn(),
        updatePlant: vi.fn(),
        deletePlant: vi.fn(),
        fetchSpecies: vi.fn(),
    }),
}));

// Mock useSubscription
vi.mock('@/hooks/useSubscription', () => ({
    useSubscription: () => ({
        subscriptions: [],
        addSubscription: vi.fn(),
        updateSubscription: vi.fn(),
        deleteSubscription: vi.fn(),
    }),
}));

const queryClient = new QueryClient();

describe('Index Component', () => {
    it('renders the Water All button and responds to clicks', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <Index />
            </QueryClientProvider>
        );

        const waterAllButton = screen.getByText('Water All');
        expect(waterAllButton).toBeInTheDocument();

        // Simulate click
        fireEvent.click(waterAllButton);
        expect(mockWaterAll).toHaveBeenCalled();
    });
});
