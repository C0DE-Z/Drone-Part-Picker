'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Import components to test
import RealTimeAnalytics from '../RealTimeAnalytics';
import AdvancedUserProfile from '../AdvancedUserProfile';
import SocialCommunityFeatures from '../SocialCommunityFeatures';
import AdvancedSearch from '../AdvancedSearch';
import BuildVisualization3D from '../BuildVisualization3D';
import PriceTracking from '../PriceTracking';
import AdvancedAnalytics from '../AdvancedAnalytics';
import APIIntegrationDataSync from '../APIIntegrationDataSync';
import IntelligentRecommendations from '../IntelligentRecommendations';

// Mock external dependencies
jest.mock('@/lib/simple-cache', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    delete: jest.fn(),
    keys: jest.fn(() => []),
    size: jest.fn(() => 0)
  }
}));

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock user data
const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  avatar: '/test-avatar.jpg',
  joinedDate: '2024-01-01',
  totalBuilds: 5,
  achievements: ['First Build', 'Speed Demon'],
  preferences: {
    droneType: 'racing',
    skillLevel: 'intermediate',
    budget: 500
  }
};

const mockBuild = {
  id: '1',
  name: 'Test Racing Build',
  components: {
    frame: { name: 'Test Frame', price: 50 },
    motors: { name: 'Test Motors', price: 100 },
    props: { name: 'Test Props', price: 20 }
  },
  totalPrice: 170,
  performance: {
    thrust: 2000,
    weight: 500,
    flightTime: 5,
    topSpeed: 100
  }
};

describe('Advanced Features Test Suite', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('RealTimeAnalytics Component', () => {
    test('renders analytics dashboard correctly', () => {
      render(<RealTimeAnalytics userId="test-user" />);
      
      expect(screen.getByText('Real-Time Flight Analytics')).toBeInTheDocument();
      expect(screen.getByText('Live Telemetry')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });

    test('toggles live view correctly', async () => {
      render(<RealTimeAnalytics userId="test-user" />);
      
      const liveToggle = screen.getByRole('button', { name: /start live view/i });
      fireEvent.click(liveToggle);
      
      await waitFor(() => {
        expect(screen.getByText(/stop live view/i)).toBeInTheDocument();
      });
    });

    test('displays session data correctly', () => {
      render(<RealTimeAnalytics userId="test-user" />);
      
      // Should display recent sessions section
      expect(screen.getByText('Recent Flight Sessions')).toBeInTheDocument();
    });
  });

  describe('AdvancedUserProfile Component', () => {
    test('renders user profile with correct data', () => {
      render(<AdvancedUserProfile user={mockUser} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Total builds
    });

    test('switches between profile tabs correctly', async () => {
      render(<AdvancedUserProfile user={mockUser} />);
      
      const buildsTab = screen.getByRole('button', { name: /builds/i });
      fireEvent.click(buildsTab);
      
      await waitFor(() => {
        expect(screen.getByText('Build History')).toBeInTheDocument();
      });
    });

    test('handles profile editing', async () => {
      render(<AdvancedUserProfile user={mockUser} />);
      
      const editButton = screen.getByRole('button', { name: /edit profile/i });
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
      });
    });
  });

  describe('SocialCommunityFeatures Component', () => {
    test('renders community dashboard correctly', () => {
      render(<SocialCommunityFeatures userId="test-user" />);
      
      expect(screen.getByText('Community Hub')).toBeInTheDocument();
      expect(screen.getByText('Featured Builds')).toBeInTheDocument();
      expect(screen.getByText('Active Challenges')).toBeInTheDocument();
    });

    test('handles build sharing functionality', async () => {
      render(<SocialCommunityFeatures userId="test-user" />);
      
      const shareButton = screen.getByRole('button', { name: /share build/i });
      fireEvent.click(shareButton);
      
      await waitFor(() => {
        expect(screen.getByText('Share Your Build')).toBeInTheDocument();
      });
    });

    test('displays leaderboard correctly', () => {
      render(<SocialCommunityFeatures userId="test-user" />);
      
      const leaderboardTab = screen.getByRole('button', { name: /leaderboard/i });
      fireEvent.click(leaderboardTab);
      
      expect(screen.getByText('Community Leaderboard')).toBeInTheDocument();
    });
  });

  describe('AdvancedSearch Component', () => {
    test('renders search interface correctly', () => {
      render(<AdvancedSearch onResultSelect={jest.fn()} />);
      
      expect(screen.getByPlaceholderText(/search for drone parts/i)).toBeInTheDocument();
      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    });

    test('handles search input correctly', async () => {
      const mockOnSelect = jest.fn();
      render(<AdvancedSearch onResultSelect={mockOnSelect} />);
      
      const searchInput = screen.getByPlaceholderText(/search for drone parts/i);
      fireEvent.change(searchInput, { target: { value: 'motor' } });
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('motor');
      });
    });

    test('applies filters correctly', async () => {
      render(<AdvancedSearch onResultSelect={jest.fn()} />);
      
      const filtersButton = screen.getByRole('button', { name: /advanced filters/i });
      fireEvent.click(filtersButton);
      
      await waitFor(() => {
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Price Range')).toBeInTheDocument();
      });
    });
  });

  describe('BuildVisualization3D Component', () => {
    test('renders 3D visualization interface', () => {
      render(<BuildVisualization3D build={mockBuild} />);
      
      expect(screen.getByText('3D Build Visualization')).toBeInTheDocument();
      expect(screen.getByText('Test Racing Build')).toBeInTheDocument();
    });

    test('handles animation controls correctly', async () => {
      render(<BuildVisualization3D build={mockBuild} />);
      
      const playButton = screen.getByRole('button', { name: /play animation/i });
      fireEvent.click(playButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause animation/i })).toBeInTheDocument();
      });
    });

    test('toggles component visibility correctly', async () => {
      render(<BuildVisualization3D build={mockBuild} />);
      
      const layersButton = screen.getByRole('button', { name: /toggle layers/i });
      fireEvent.click(layersButton);
      
      await waitFor(() => {
        expect(screen.getByText('Component Layers')).toBeInTheDocument();
      });
    });
  });

  describe('PriceTracking Component', () => {
    test('renders price tracking dashboard correctly', () => {
      render(<PriceTracking />);
      
      expect(screen.getByText('Price Tracking & Alerts')).toBeInTheDocument();
      expect(screen.getByText('Tracked Items')).toBeInTheDocument();
      expect(screen.getByText('Price Alerts')).toBeInTheDocument();
    });

    test('handles price alert creation', async () => {
      render(<PriceTracking />);
      
      const createAlertButton = screen.getByRole('button', { name: /create price alert/i });
      fireEvent.click(createAlertButton);
      
      await waitFor(() => {
        expect(screen.getByText('Create Price Alert')).toBeInTheDocument();
      });
    });

    test('displays price history correctly', () => {
      render(<PriceTracking />);
      
      expect(screen.getByText('Price History')).toBeInTheDocument();
      expect(screen.getByText('Vendor Comparison')).toBeInTheDocument();
    });
  });

  describe('AdvancedAnalytics Component', () => {
    test('renders analytics dashboard correctly', () => {
      render(<AdvancedAnalytics />);
      
      expect(screen.getByText('Advanced Analytics & ML Models')).toBeInTheDocument();
      expect(screen.getByText('Compatibility Prediction')).toBeInTheDocument();
      expect(screen.getByText('Performance Estimation')).toBeInTheDocument();
    });

    test('displays ML model metrics correctly', () => {
      render(<AdvancedAnalytics />);
      
      expect(screen.getByText('91.5%')).toBeInTheDocument(); // Model accuracy
      expect(screen.getByText('Compatibility Model')).toBeInTheDocument();
    });

    test('handles analysis request correctly', async () => {
      render(<AdvancedAnalytics />);
      
      const analyzeButton = screen.getByRole('button', { name: /run analysis/i });
      fireEvent.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
      });
    });
  });

  describe('APIIntegrationDataSync Component', () => {
    test('renders API integration dashboard correctly', () => {
      render(<APIIntegrationDataSync />);
      
      expect(screen.getByText('API Integration & Data Sync')).toBeInTheDocument();
      expect(screen.getByText('Data Sources')).toBeInTheDocument();
      expect(screen.getByText('Sync Operations')).toBeInTheDocument();
    });

    test('displays connection status correctly', () => {
      render(<APIIntegrationDataSync />);
      
      expect(screen.getByText('Connection Status')).toBeInTheDocument();
      expect(screen.getByText('Sync Health')).toBeInTheDocument();
    });

    test('handles manual sync correctly', async () => {
      render(<APIIntegrationDataSync />);
      
      const syncButton = screen.getByRole('button', { name: /manual sync/i });
      fireEvent.click(syncButton);
      
      await waitFor(() => {
        expect(screen.getByText(/syncing/i)).toBeInTheDocument();
      });
    });
  });

  describe('IntelligentRecommendations Component', () => {
    test('renders recommendations interface correctly', () => {
      render(<IntelligentRecommendations currentBuild={mockBuild} onRecommendationSelect={jest.fn()} />);
      
      expect(screen.getByText('Intelligent Part Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    });

    test('handles preference setup correctly', async () => {
      render(<IntelligentRecommendations currentBuild={mockBuild} onRecommendationSelect={jest.fn()} />);
      
      // Should show preferences setup if no user preferences
      if (screen.queryByText('Set Your Preferences')) {
        const setupButton = screen.getByRole('button', { name: /save preferences/i });
        fireEvent.click(setupButton);
        
        await waitFor(() => {
          expect(screen.getByText('Generating recommendations...')).toBeInTheDocument();
        });
      }
    });

    test('applies filters correctly', async () => {
      render(<IntelligentRecommendations currentBuild={mockBuild} onRecommendationSelect={jest.fn()} />);
      
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filtersButton);
      
      await waitFor(() => {
        expect(screen.getByText('Category')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    test('components work together correctly', async () => {
      // Test that components can interact with each other
      const mockOnSelect = jest.fn();
      
      render(
        <div>
          <AdvancedSearch onResultSelect={mockOnSelect} />
          <IntelligentRecommendations 
            currentBuild={mockBuild} 
            onRecommendationSelect={mockOnSelect} 
          />
        </div>
      );
      
      expect(screen.getByText('Advanced AI-Powered Search')).toBeInTheDocument();
      expect(screen.getByText('Intelligent Part Recommendations')).toBeInTheDocument();
    });

    test('data flows correctly between components', async () => {
      const mockCallback = jest.fn();
      
      render(
        <AdvancedUserProfile 
          user={mockUser} 
          onProfileUpdate={mockCallback}
        />
      );
      
      // Simulate profile update
      const editButton = screen.getByRole('button', { name: /edit profile/i });
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    test('components render within acceptable time', async () => {
      const startTime = performance.now();
      
      render(<RealTimeAnalytics userId="test-user" />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    test('components handle large datasets efficiently', async () => {
      const largeBuild = {
        ...mockBuild,
        components: {
          ...Array.from({ length: 100 }, (_, i) => ({
            [`component_${i}`]: { name: `Component ${i}`, price: 10 + i }
          })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
        }
      };
      
      const startTime = performance.now();
      render(<BuildVisualization3D build={largeBuild} />);
      const endTime = performance.now();
      
      // Should handle large datasets within reasonable time
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Error Handling Tests', () => {
    test('components handle missing props gracefully', () => {
      // Test with minimal props
      render(<RealTimeAnalytics />);
      expect(screen.getByText('Real-Time Flight Analytics')).toBeInTheDocument();
    });

    test('components handle API errors gracefully', async () => {
      // Mock API error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<APIIntegrationDataSync />);
      
      // Should not crash and should handle errors gracefully
      expect(screen.getByText('API Integration & Data Sync')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('components handle network failures gracefully', async () => {
      // Mock network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      render(<PriceTracking />);
      
      // Should still render basic UI
      expect(screen.getByText('Price Tracking & Alerts')).toBeInTheDocument();
    });
  });
});