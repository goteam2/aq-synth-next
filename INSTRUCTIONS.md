# Air Quality Synthesizer LLM Agent Instructions

## System Overview

You are an AI assistant helping to build and maintain a generative ambient synthesizer that transforms real-time air quality data into musical expressions. The system uses Next.js 15 with App Router, deployed on Vercel, fetching data from OpenAQ API v3 and implementing audio synthesis with Tone.js.

## Core Objectives

1. Fetch air quality parameters from OpenAQ API v3
2. Map air quality metrics to synthesizer parameters
3. Generate continuous ambient music based on environmental data
4. Provide a responsive web interface with real-time audio playback
5. Ensure Vercel compatibility with serverless functions

## Technical Architecture

### Next.js 15 Implementation

- **Framework**: Next.js 15 with App Router
- **Deployment**: Vercel with serverless functions
- **Data Source**: OpenAQ API v3 (https://api.openaq.org/v3/)
- **Real-time Updates**: polling via API routes
- **Client State**: React hooks and Context API
- **Styling**: Tailwind CSS (recommended for Vercel)

### API Integration (OpenAQ v3)

- **Base URL**: `https://api.openaq.org/v3/`
- **Key Endpoints**:
  - `/locations` - Find monitoring locations
  - `/latest` - Get latest measurements
  - `/measurements` - Historical data
- **Authentication**: API key via headers
- **Rate Limiting**: Respect 10,000 requests/hour limit

### Audio Engine

- **Library**: Tone.js for web audio synthesis
- **Context**: Handle browser autoplay policies
- **Performance**: Optimize for mobile and desktop
- **Fallbacks**: Graceful degradation for unsupported browsers

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── air-quality/
│   │   │   └── route.ts          # Fetch from OpenAQ v3
│   │   └── locations/
│   │       └── route.ts          # Location search
│   ├── components/
│   │   ├── AudioEngine.tsx       # Tone.js synthesizer
│   │   ├── LocationSelector.tsx  # City/location picker
│   │   ├── ParameterDisplay.tsx  # Real-time data display
│   │   └── SynthControls.tsx     # Audio controls
│   ├── hooks/
│   │   ├── useAirQuality.ts      # Data fetching hook
│   │   ├── useAudioEngine.ts     # Tone.js management
│   │   └── useLocationSearch.ts  # Location search
│   ├── lib/
│   │   ├── air-quality-client.ts # OpenAQ v3 client
│   │   ├── audio-mappings.ts     # Data-to-audio mappings
│   │   └── utils.ts              # Helper functions
│   ├── types/
│   │   └── air-quality.ts        # TypeScript interfaces
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
└── next.config.js
```

## OpenAQ API v3 Integration

### Location Search

```typescript
// src/lib/air-quality-client.ts
export interface LocationSearchParams {
  country?: string;
  city?: string;
  coordinates?: [number, number];
  radius?: number;
  limit?: number;
}

export async function searchLocations(params: LocationSearchParams) {
  const url = new URL("https://api.openaq.org/v3/locations");

  if (params.coordinates) {
    url.searchParams.set("coordinates", params.coordinates.join(","));
    url.searchParams.set("radius", (params.radius || 25000).toString());
  }
  if (params.country) url.searchParams.set("countries", params.country);
  if (params.city) url.searchParams.set("cities", params.city);

  url.searchParams.set("limit", (params.limit || 100).toString());
  url.searchParams.set("order_by", "lastUpdated");
  url.searchParams.set("sort_order", "desc");

  const response = await fetch(url.toString(), {
    headers: {
      "X-API-Key": process.env.OPENAQ_API_KEY || "",
    },
  });

  return response.json();
}
```

### Latest Measurements

```typescript
export async function getLatestMeasurements(locationId: number) {
  const url = new URL("https://api.openaq.org/v3/latest");
  url.searchParams.set("locations_id", locationId.toString());
  url.searchParams.set("parameters_id", "1,2,3,5,6,7"); // PM2.5, PM10, NO2, O3, SO2, CO

  const response = await fetch(url.toString(), {
    headers: {
      "X-API-Key": process.env.OPENAQ_API_KEY || "",
    },
  });

  return response.json();
}
```

## Air Quality Parameters to Musical Mappings (Updated for v3)

### Parameter IDs (OpenAQ v3)

- **PM2.5**: ID 2 (μg/m³)
- **PM10**: ID 1 (μg/m³)
- **NO2**: ID 3 (ppm)
- **O3**: ID 5 (ppm)
- **SO2**: ID 6 (ppm)
- **CO**: ID 7 (ppm)

### Musical Mappings

```typescript
// src/lib/audio-mappings.ts
export interface AirQualityMappings {
  pm25: {
    parameter: "frequency";
    range: [65.41, 1046.5]; // C2-C6 Hz
    scale: "logarithmic";
    inputRange: [0, 500]; // μg/m³
  };
  pm10: {
    parameter: "filterCutoff";
    range: [200, 8000]; // Hz
    scale: "logarithmic";
    inputRange: [0, 600]; // μg/m³
  };
  no2: {
    parameter: "detune";
    range: [0, 50]; // cents
    scale: "linear";
    inputRange: [0, 0.2]; // ppm
  };
  o3: {
    parameter: "reverbWet";
    range: [0, 0.7]; // 0-70%
    scale: "linear";
    inputRange: [0, 0.2]; // ppm
  };
  so2: {
    parameter: "lfoRate";
    range: [0.1, 10]; // Hz
    scale: "exponential";
    inputRange: [0, 0.1]; // ppm
  };
  co: {
    parameter: "waveform";
    range: ["sine", "triangle", "sawtooth"];
    scale: "categorical";
    inputRange: [0, 30]; // ppm
  };
}
```

## Next.js 15 API Routes

### Air Quality Data Route

```typescript
// src/app/api/air-quality/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getLatestMeasurements } from "@/lib/air-quality-client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locationId = searchParams.get("locationId");

  if (!locationId) {
    return NextResponse.json(
      { error: "Location ID required" },
      { status: 400 }
    );
  }

  try {
    const data = await getLatestMeasurements(parseInt(locationId));

    // Transform v3 response to normalized format
    const normalized = normalizeAirQualityData(data);

    return NextResponse.json(normalized, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Air quality fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch air quality data" },
      { status: 500 }
    );
  }
}

function normalizeAirQualityData(apiResponse: any) {
  const measurements = apiResponse.results || [];
  const normalized: Record<string, number> = {};

  measurements.forEach((measurement: any) => {
    const parameterName = measurement.parameter?.name?.toLowerCase();
    if (parameterName && measurement.value !== null) {
      normalized[parameterName.replace(".", "")] = measurement.value;
    }
  });

  return {
    data: normalized,
    location: measurements[0]?.location?.name || "Unknown",
    lastUpdated: measurements[0]?.datetime || new Date().toISOString(),
  };
}
```

## React Components

### Audio Engine Component

```typescript
// src/components/AudioEngine.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { useAirQuality } from "@/hooks/useAirQuality";

interface AudioEngineProps {
  locationId?: number;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
}

export default function AudioEngine({
  locationId,
  isPlaying,
  onPlayStateChange,
}: AudioEngineProps) {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const effectsRef = useRef<{
    filter: Tone.Filter;
    reverb: Tone.Reverb;
    delay: Tone.FeedbackDelay;
  } | null>(null);

  const { data: airQuality, isLoading, error } = useAirQuality(locationId);
  const [audioContext, setAudioContext] = useState<
    "suspended" | "running" | "closed"
  >("suspended");

  // Initialize Tone.js
  useEffect(() => {
    const initAudio = async () => {
      if (typeof window === "undefined") return;

      // Create synth and effects
      const synth = new Tone.PolySynth({
        oscillator: { type: "sine" },
        envelope: {
          attack: 2,
          decay: 1,
          sustain: 0.5,
          release: 8,
        },
      });

      const filter = new Tone.Filter(800, "lowpass");
      const reverb = new Tone.Reverb(3);
      const delay = new Tone.FeedbackDelay(0.25, 0.5);

      // Connect effects chain
      synth.connect(filter);
      filter.connect(delay);
      delay.connect(reverb);
      reverb.toDestination();

      synthRef.current = synth;
      effectsRef.current = { filter, reverb, delay };

      setAudioContext(Tone.context.state);
    };

    initAudio();

    return () => {
      synthRef.current?.dispose();
      effectsRef.current?.filter.dispose();
      effectsRef.current?.reverb.dispose();
      effectsRef.current?.delay.dispose();
    };
  }, []);

  // Handle play/pause
  useEffect(() => {
    if (!synthRef.current || !effectsRef.current) return;

    const handlePlayPause = async () => {
      if (isPlaying) {
        if (Tone.context.state === "suspended") {
          await Tone.start();
          setAudioContext("running");
        }
        startAmbientGeneration();
      } else {
        stopAmbientGeneration();
      }
    };

    handlePlayPause();
  }, [isPlaying]);

  // Update audio parameters based on air quality data
  useEffect(() => {
    if (!airQuality?.data || !synthRef.current || !effectsRef.current) return;

    updateAudioParameters(airQuality.data);
  }, [airQuality]);

  const startAmbientGeneration = () => {
    // Implementation for continuous ambient generation
  };

  const stopAmbientGeneration = () => {
    // Stop all audio generation
  };

  const updateAudioParameters = (data: Record<string, number>) => {
    // Apply air quality data to audio parameters
  };

  if (error) {
    return (
      <div className="text-red-500">Audio engine error: {error.message}</div>
    );
  }

  return (
    <div className="audio-engine">
      <button
        onClick={async () => {
          if (audioContext === "suspended") {
            await Tone.start();
            setAudioContext("running");
          }
          onPlayStateChange(!isPlaying);
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={isLoading}
      >
        {isPlaying ? "Pause" : "Play"} Ambient Audio
      </button>

      {audioContext === "suspended" && (
        <p className="text-sm text-gray-600 mt-2">
          Click play to start audio (browser policy requirement)
        </p>
      )}
    </div>
  );
}
```

## Vercel Deployment Configuration

### Environment Variables

```bash
# .env.local
OPENAQ_API_KEY=your_openaq_v3_api_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["tone"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

## Performance Optimization for Vercel

### API Route Caching

- Use `revalidate` in API routes for ISR
- Implement proper cache headers
- Use Vercel's Edge Cache for global distribution

### Client-Side Optimization

- Lazy load Tone.js components
- Implement service worker for offline capability
- Use React.memo for expensive components
- Debounce parameter updates

### Memory Management

- Dispose of Tone.js nodes properly
- Limit concurrent audio nodes
- Use Web Workers for data processing
- Implement efficient state management

## Error Handling & Monitoring

### API Error Handling

```typescript
// Custom error class for air quality API
export class AirQualityError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "AirQualityError";
  }
}

// Error boundary for audio components
export function AudioErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  // Implementation
}
```

### Vercel Analytics Integration

- Add `@vercel/analytics` for performance monitoring
- Track audio engagement metrics
- Monitor API response times
- Set up error alerting

## Testing Strategy

### Unit Tests (Jest + Testing Library)

```typescript
// src/__tests__/audio-mappings.test.ts
import { normalizeValue, mapToFrequency } from "@/lib/audio-mappings";

describe("Audio Mappings", () => {
  test("normalizes PM2.5 values correctly", () => {
    expect(normalizeValue(50, [0, 500])).toBe(0.1);
  });

  test("maps values to frequency range", () => {
    const freq = mapToFrequency(0.5, [100, 1000]);
    expect(freq).toBeCloseTo(316.23, 1); // geometric mean
  });
});
```

### Integration Tests

- Test API routes with mock data
- Verify audio parameter updates
- Test location search functionality
- Validate error recovery

### E2E Tests (Playwright)

```typescript
// tests/e2e/air-quality-synth.spec.ts
import { test, expect } from "@playwright/test";

test("loads air quality data and plays audio", async ({ page }) => {
  await page.goto("/");

  // Select location
  await page.click('[data-testid="location-selector"]');
  await page.fill("input", "New York");
  await page.click('[data-testid="location-option-0"]');

  // Start audio
  await page.click('[data-testid="play-button"]');

  // Verify audio context started
  const audioStatus = await page.textContent('[data-testid="audio-status"]');
  expect(audioStatus).toContain("Playing");
});
```

## Deployment Checklist

### Pre-deployment

- [ ] Environment variables configured
- [ ] API key valid and has sufficient quota
- [ ] All TypeScript errors resolved
- [ ] Tests passing
- [ ] Bundle size optimized
- [ ] Error boundaries implemented

### Post-deployment

- [ ] Verify API routes work in production
- [ ] Test audio functionality across browsers
- [ ] Monitor error rates and performance
- [ ] Set up monitoring alerts
- [ ] Test mobile responsiveness

## Extension Ideas for Future Development

### Advanced Features

- **Historical Playback**: Sonify air quality trends over time
- **Multi-city Comparison**: Layer audio from multiple locations
- **User Customization**: Allow custom parameter mappings
- **Social Sharing**: Share audio snapshots with location data
- **PWA Support**: Offline capability with service workers
- **WebRTC Integration**: Real-time collaboration features

### Technical Enhancements

- **Edge Functions**: Move data processing to Vercel Edge
- **WebAssembly**: High-performance audio processing
- **WebGPU**: GPU-accelerated visualizations
- **Machine Learning**: Predictive audio generation
- **Blockchain Integration**: NFT creation from air quality audio

## Best Practices Summary

1. **API Integration**: Always handle OpenAQ v3 rate limits and implement proper error recovery
2. **Audio Performance**: Dispose of Tone.js resources properly and limit polyphony
3. **Vercel Optimization**: Use appropriate caching strategies and monitor function duration
4. **User Experience**: Handle browser autoplay policies gracefully
5. **Type Safety**: Maintain comprehensive TypeScript interfaces
6. **Testing**: Test both audio functionality and API integration thoroughly
7. **Monitoring**: Implement proper error tracking and performance monitoring

Remember: The goal is to create an immersive, real-time sonic representation of environmental data that runs efficiently on Vercel's serverless platform while providing a smooth, responsive user experience across all devices.
