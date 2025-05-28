"use client";

import React, { useState, useEffect } from "react";
import MapDisplay from "./MapDisplay";
import AudioEngine from "./AudioEngine";
import SynthControls from "./SynthControls";
import ParameterDisplay from "./ParameterDisplay";
import LocationSelector from "./LocationSelector";
import * as Tone from "tone";

type ArpMode = "up" | "down" | "updown" | "random";

interface AirQualityData {
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  so2: number;
  co: number;
  location: string;
  lastUpdated: string;
  sensors?: Array<{
    id: string;
    parameter: string;
    coordinates: { latitude: number; longitude: number } | null;
  }>;
  lat: number;
  lon: number;
}

const AirQualitySynthesizer: React.FC = () => {
  // Synthesizer state
  const [volume, setVolume] = useState<number[]>([0.8]);
  const [attack, setAttack] = useState<number[]>([0.1]);
  const [decay, setDecay] = useState<number[]>([0.3]);
  const [sustain, setSustain] = useState<number[]>([0.7]);
  const [release, setRelease] = useState<number[]>([0.5]);
  const [filterCutoff, setFilterCutoff] = useState<number[]>([1000]);
  const [filterRes, setFilterRes] = useState<number[]>([0.5]);
  const [filterRolloff, setFilterRolloff] = useState<number[]>([-12]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [arpRate, setArpRate] = useState<number[]>([350]);
  const [arpSteps, setArpSteps] = useState<number[]>([5]);
  const [arpMode, setArpMode] = useState<ArpMode>("up");
  const [arpNoteLength, setArpNoteLength] = useState<number[]>([0.25]);

  // Air quality state
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User location state
  const [userLocation, setUserLocation] = useState<[number, number]>([
    51.0501, -114.0853,
  ]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const [lat, lon] = userLocation;
        const url = `/api/airquality?lat=${lat}&lon=${lon}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch air quality data");
        const data = await res.json();
        if (isMounted) {
          setAirQualityData({
            ...data,
            location: "Current Location",
            lastUpdated: new Date().toLocaleTimeString(),
            lat,
            lon,
          });
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userLocation]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(
          "Unable to retrieve your location. Using default location."
        );
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AQsynth
          </h1>
          <p className="text-gray-300">Environmental Data Synthesizer</p>
        </div>

        {/* Main Layout: Map + Air Quality Data */}
        <div className="grid lg:grid-cols-12 gap-6 h-full">
          {/* Map Main Focus */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="h-80 flex items-center justify-center p-0 overflow-hidden relative">
              {locationLoading ? (
                <div className="text-gray-400 text-center w-full">
                  Loading map...
                </div>
              ) : (
                <MapDisplay
                  userLocation={userLocation}
                  sensors={airQualityData?.sensors || []}
                />
              )}
              {locationError && (
                <div className="absolute bottom-2 left-0 right-0 text-xs text-red-400 text-center">
                  {locationError}
                </div>
              )}
            </div>
            <SynthControls
              volume={volume}
              setVolume={setVolume}
              attack={attack}
              setAttack={setAttack}
              decay={decay}
              setDecay={setDecay}
              sustain={sustain}
              setSustain={setSustain}
              release={release}
              setRelease={setRelease}
              filterCutoff={filterCutoff}
              setFilterCutoff={setFilterCutoff}
              filterRes={filterRes}
              setFilterRes={setFilterRes}
              filterRolloff={filterRolloff}
              setFilterRolloff={setFilterRolloff}
              arpRate={arpRate}
              setArpRate={setArpRate}
              arpSteps={arpSteps}
              setArpSteps={setArpSteps}
              arpMode={arpMode}
              setArpMode={setArpMode}
              arpNoteLength={arpNoteLength}
              setArpNoteLength={setArpNoteLength}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
            />
          </div>
          {/* Air Quality Data Panel on Right */}
          <div className="lg:col-span-4">
            <ParameterDisplay
              airQualityData={airQualityData}
              loading={loading}
              error={error}
            />
          </div>
        </div>
        <AudioEngine
          synthParams={{
            volume,
            attack,
            decay,
            sustain,
            release,
            filterCutoff,
            filterRes,
            filterRolloff,
            arpRate,
            arpSteps,
            arpMode,
            arpNoteLength,
          }}
          airQualityData={airQualityData}
          isPlaying={isPlaying}
        />
        <LocationSelector />
      </div>
    </div>
  );
};

export default AirQualitySynthesizer;
