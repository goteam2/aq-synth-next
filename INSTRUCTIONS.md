# Air Quality Synthesizer LLM Agent Instructions

## System Overview

You are an AI assistant helping to build and maintain a generative ambient synthesizer that transforms real-time air quality data into musical expressions. The system consists of a Node.js backend that fetches data from OpenAQ API and a web frontend using Tone.js for audio synthesis.

## Core Objectives

1. Fetch air quality parameters from OpenAQ API
2. Map air quality metrics to synthesizer parameters
3. Generate continuous ambient music based on environmental data
4. Provide a responsive web interface for audio playback

## Technical Architecture

### Backend (Node.js)

- **Framework**: Express.js for API endpoints
- **Data Source**: OpenAQ API v3 (https://api.openaq.org/
- **WebSocket**: Socket.io for real-time data streaming
- **Polling**: Fetch air quality data every 5-10 minutes
- **Error Handling**: Implement retry logic for API failures

### Frontend (Web)

- **Audio Engine**: Tone.js for synthesis and effects
- **Framework**: Vanilla JS or React (user preference)
- **Real-time Updates**: Socket.io client for receiving data
- **Visualization**: Optional canvas/SVG for data visualization

## Air Quality Parameters to Musical Mappings

### Primary Mappings

1. **PM2.5 (Particulate Matter)**

   - Maps to: Base frequency/pitch
   - Range: 0-500 μg/m³ → C2-C6 (65.41 Hz - 1046.50 Hz)
   - Higher pollution = higher pitch (creates tension)

2. **PM10**

   - Maps to: Filter cutoff frequency
   - Range: 0-600 μg/m³ → 200-8000 Hz
   - Higher values = more filtered/muffled sound

3. **NO2 (Nitrogen Dioxide)**

   - Maps to: Oscillator detune
   - Range: 0-200 ppb → 0-50 cents detune
   - Creates chorus/beating effects

4. **O3 (Ozone)**

   - Maps to: Reverb wet/dry mix
   - Range: 0-200 ppb → 0-70% wet signal
   - Higher ozone = more spacious sound

5. **SO2 (Sulfur Dioxide)**

   - Maps to: LFO rate for tremolo/vibrato
   - Range: 0-100 ppb → 0.1-10 Hz
   - Adds movement to the sound

6. **CO (Carbon Monoxide)**
   - Maps to: Harmonic content/waveform selection
   - Low CO: Sine wave (pure)
   - Medium CO: Triangle wave
   - High CO: Sawtooth wave (harsh)

### Secondary Mappings

- **Temperature** (if available): Attack/release times
- **Humidity** (if available): Delay feedback amount
- **Wind Speed** (if available): Panning automation speed

## Implementation Guidelines

### 1. Data Fetching Module

```javascript
// Example structure
class AirQualityFetcher {
  constructor(location, pollInterval) {
    this.location = location;
    this.pollInterval = pollInterval;
  }

  async fetchData() {
    // Implement OpenAQ API call
    // Handle rate limiting
    // Parse and validate data
  }
}
```

### 2. Data Processing Pipeline

- Normalize all values to 0-1 range
- Apply smoothing/interpolation for gradual changes
- Implement min/max clamping for safety
- Log scale conversion where appropriate (frequency parameters)

### 3. Synthesizer Design

```javascript
// Tone.js synth structure
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
```

### 4. Musical Considerations

- Use pentatonic or modal scales to ensure consonance
- Implement chord progressions that evolve with data
- Add drone notes for ambient foundation
- Consider generative rhythm patterns based on data volatility

## Error Handling & Edge Cases

### API Failures

- Cache last known good values
- Implement exponential backoff
- Provide fallback local data
- Alert user of connection issues

### Missing Data Points

- Use interpolation between known values
- Apply default values for missing parameters
- Never let audio engine receive null/undefined

### Audio Context Issues

- Handle browser autoplay policies
- Implement user gesture requirement
- Provide clear play/pause controls
- Handle audio context suspension

## Performance Optimization

### Backend

- Implement data caching strategy
- Batch API requests when possible
- Use connection pooling
- Compress WebSocket messages

### Frontend

- Limit polyphony (max 4-6 voices)
- Use Web Workers for data processing
- Implement efficient event throttling
- Monitor CPU usage and adapt complexity

## Testing Strategy

### Unit Tests

- Data normalization functions
- Scale/frequency conversions
- API response parsing
- WebSocket message handling

### Integration Tests

- End-to-end data flow
- Audio parameter updates
- Error recovery mechanisms
- Performance under load

### User Testing

- Audio quality across devices
- Latency perception
- UI responsiveness
- Browser compatibility

## Deployment Considerations

### Environment Variables

```
OPENAQ_API_KEY=your_api_key
LOCATION_LAT=latitude
LOCATION_LON=longitude
POLL_INTERVAL=300000
PORT=3000
```

### Security

- Implement rate limiting
- Validate all inputs
- Use HTTPS for API calls
- Sanitize location parameters

### Monitoring

- Log API response times
- Track audio dropouts
- Monitor WebSocket connections
- Alert on data anomalies

## Example User Interactions

### Commands the system should handle:

1. "Change location to [city name]"
2. "Adjust sensitivity of mappings"
3. "Switch to different scale/mode"
4. "Enable/disable specific parameters"
5. "Export current audio settings"
6. "View historical data trends"

## Troubleshooting Guide

### Common Issues:

1. **No sound output**

   - Check audio context state
   - Verify user interaction occurred
   - Ensure data is being received

2. **Choppy audio**

   - Reduce polyphony
   - Increase buffer size
   - Check CPU usage

3. **Data not updating**

   - Verify API key validity
   - Check network connectivity
   - Inspect CORS settings

4. **Extreme parameter values**
   - Review normalization logic
   - Check for data outliers
   - Implement safety limits

## Extension Ideas

- Multi-location comparison mode
- Historical playback feature
- User-defined mapping curves
- MIDI output support
- Recording/export functionality
- Mobile app version
- VR visualization mode

## Code Quality Standards

- Use ESLint for consistency
- Implement comprehensive error handling
- Document all mapping decisions
- Create modular, testable components
- Follow semantic versioning
- Maintain detailed changelog

Remember: The goal is to create an immersive sonic representation of air quality that is both informative and aesthetically pleasing. The music should feel organic and responsive while maintaining musicality even with extreme data values.
