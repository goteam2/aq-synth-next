"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Wind,
  Activity,
  Zap,
  Volume2,
  Play,
  Square,
  Settings,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Shuffle,
} from "lucide-react";
import * as Tone from "tone";
import MapClient from "./MapClient";

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
  const [filterRolloff, setFilterRolloff] = useState<number[]>([-12]); // dB/oct
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Arpeggiator state
  const [arpRate, setArpRate] = useState<number[]>([350]); // ms between notes
  const [arpSteps, setArpSteps] = useState<number[]>([5]); // number of notes
  const [arpMode, setArpMode] = useState<ArpMode>("up");
  const [arpNoteLength, setArpNoteLength] = useState<number[]>([0.25]); // note length in seconds

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

  // Tone.js Refs
  const synthRef = React.useRef<Tone.PolySynth | null>(null);
  const filterRef = React.useRef<Tone.Filter | null>(null);
  const volumeRef = React.useRef<Tone.Volume | null>(null);
  const playingRef = React.useRef<boolean>(false);

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
    const interval = setInterval(fetchData, 60000); // poll every 60s
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

  const getAQIColor = (value: number, pollutant: string): string => {
    // Simplified AQI color coding
    if (pollutant === "pm25") {
      if (value <= 12) return "bg-green-500";
      if (value <= 35.4) return "bg-yellow-500";
      if (value <= 55.4) return "bg-orange-500";
      return "bg-red-500";
    }
    return "bg-blue-500";
  };

  // Map air quality data to synth params
  function mapToSynthParams(data: AirQualityData) {
    // Example mapping, adjust as needed
    const baseFreq = 261.63 + ((data.pm25 ?? 0) / 500) * (1046.5 - 261.63);
    const filterCutoff = 200 + ((data.pm10 ?? 0) / 600) * (8000 - 200);
    const detune = ((data.no2 ?? 0) / 200) * 50;
    let waveform: Tone.ToneOscillatorType = "sine";
    if (data.co > 6) waveform = "sawtooth";
    else if (data.co > 2) waveform = "triangle";
    return { baseFreq, filterCutoff, detune, waveform };
  }

  // Setup Tone.js synth
  useEffect(() => {
    if (!synthRef.current) {
      const filter = new Tone.Filter(
        filterCutoff[0],
        "lowpass",
        filterRolloff[0] as -12 | -24 | -48
      ).toDestination();
      const volumeNode = new Tone.Volume(Tone.gainToDb(volume[0])).connect(
        filter
      );
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: attack[0],
          decay: decay[0],
          sustain: sustain[0],
          release: release[0],
        },
      }).connect(volumeNode);
      synthRef.current = synth;
      filterRef.current = filter;
      volumeRef.current = volumeNode;
    }
    return () => {
      synthRef.current?.dispose();
      filterRef.current?.dispose();
      volumeRef.current?.dispose();
      synthRef.current = null;
      filterRef.current = null;
      volumeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update synth params when UI changes
  useEffect(() => {
    if (!synthRef.current || !filterRef.current || !volumeRef.current) return;
    synthRef.current.set({
      envelope: {
        attack: attack[0],
        decay: decay[0],
        sustain: sustain[0],
        release: release[0],
      },
    });
    filterRef.current.frequency.value = filterCutoff[0];
    filterRef.current.Q.value = filterRes[0] * 20; // Q: 0-20
    volumeRef.current.volume.value = Tone.gainToDb(volume[0]);
  }, [attack, decay, sustain, release, filterCutoff, filterRes, volume]);

  // Update synth params from air quality data
  useEffect(() => {
    if (!airQualityData || !synthRef.current || !filterRef.current) return;
    const {
      baseFreq,
      filterCutoff: cutoff,
      detune,
      waveform,
    } = mapToSynthParams(airQualityData);
    synthRef.current.set({ oscillator: { type: waveform }, detune });
    filterRef.current.frequency.value = cutoff;
  }, [airQualityData]);

  // Play/stop logic
  useEffect(() => {
    playingRef.current = isPlaying;
    let interval: NodeJS.Timeout | null = null;
    async function startSynth() {
      await Tone.start();
      if (!synthRef.current) return;
      // Arpeggiator notes
      const baseNotes = ["C4", "E4", "G4", "B4", "C5"];
      const notes = baseNotes.slice(0, arpSteps[0]);
      let idx = 0;
      let direction = 1;

      interval = setInterval(() => {
        if (!playingRef.current || !synthRef.current) return;

        let noteIndex: number;
        switch (arpMode) {
          case "up":
            noteIndex = idx % notes.length;
            break;
          case "down":
            noteIndex = notes.length - 1 - (idx % notes.length);
            break;
          case "updown":
            noteIndex =
              idx % (notes.length * 2) >= notes.length
                ? notes.length * 2 - 1 - (idx % (notes.length * 2))
                : idx % (notes.length * 2);
            break;
          case "random":
            noteIndex = Math.floor(Math.random() * notes.length);
            break;
        }

        synthRef.current.triggerAttackRelease(
          notes[noteIndex],
          `${arpNoteLength[0]}s`
        );
        idx++;
      }, arpRate[0]);
    }
    if (isPlaying) {
      startSynth();
    } else {
      if (interval) clearInterval(interval);
      synthRef.current?.releaseAll();
    }
    return () => {
      if (interval) clearInterval(interval);
      synthRef.current?.releaseAll();
    };
  }, [isPlaying, arpRate, arpSteps, arpMode, arpNoteLength]);

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
            <div className="h-80  flex items-center justify-center p-0 overflow-hidden relative">
              {locationLoading ? (
                <div className="text-gray-400 text-center w-full">
                  Loading map...
                </div>
              ) : (
                <MapClient
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

            {/* Synth Controls Below Map */}
            <Card className="bg-gray-800/80 backdrop-blur border-gray-700">
              {/* <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-400" />
                  Juno-Style Synthesizer
                </CardTitle>
              </CardHeader> */}
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 w-full">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      Synth Params
                    </h3>
                    {/* Transport Controls */}
                    <Button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`size-10 rounded-full border border-gray-700 cursor-pointer ms-auto ${
                        isPlaying
                          ? "bg-red-600/60 hover:bg-red-700"
                          : "bg-transparent hover:bg-green-700"
                      }`}
                    >
                      {isPlaying ? (
                        <Square className="size-4" />
                      ) : (
                        <Play className="size-4" />
                      )}
                    </Button>
                    <Volume2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <Slider
                      value={volume}
                      onValueChange={setVolume}
                      max={1}
                      step={0.01}
                      className="w-48"
                    />
                  </div>
                  <Activity className="w-5 h-5 text-blue-400" />

                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* ADSR Envelope */}
                    <div className="grid grid-cols-4 gap-8 p-6 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-300 mb-2">
                          ATTACK
                        </span>
                        <Slider
                          orientation="vertical"
                          value={attack}
                          onValueChange={setAttack}
                          min={0}
                          max={2}
                          step={0.01}
                          className="h-32"
                        />
                        <span className="text-xs text-gray-400 mt-2">
                          {attack[0].toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-300 mb-2">
                          DECAY
                        </span>
                        <Slider
                          orientation="vertical"
                          value={decay}
                          onValueChange={setDecay}
                          min={0}
                          max={2}
                          step={0.01}
                          className="h-32"
                        />
                        <span className="text-xs text-gray-400 mt-2">
                          {decay[0].toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-300 mb-2">
                          SUSTAIN
                        </span>
                        <Slider
                          orientation="vertical"
                          value={sustain}
                          onValueChange={setSustain}
                          min={0}
                          max={1}
                          step={0.01}
                          className="h-32"
                        />
                        <span className="text-xs text-gray-400 mt-2">
                          {sustain[0].toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-300 mb-2">
                          RELEASE
                        </span>
                        <Slider
                          orientation="vertical"
                          value={release}
                          onValueChange={setRelease}
                          min={0}
                          max={5}
                          step={0.01}
                          className="h-32"
                        />
                        <span className="text-xs text-gray-400 mt-2">
                          {release[0].toFixed(2)}s
                        </span>
                      </div>
                    </div>
                    {/* Filter Controls */}
                    <div className="grid grid-cols-2 gap-8 p-6 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-300 mb-2">
                          CUTOFF
                        </span>
                        <Slider
                          orientation="vertical"
                          value={filterCutoff}
                          onValueChange={setFilterCutoff}
                          min={20}
                          max={20000}
                          step={1}
                          className="h-32"
                        />
                        <span className="text-xs text-gray-400 mt-2">
                          {filterCutoff[0].toFixed(0)} Hz
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-300 mb-2">
                          RESONANCE
                        </span>
                        <Slider
                          orientation="vertical"
                          value={filterRes}
                          onValueChange={setFilterRes}
                          min={0}
                          max={1}
                          step={0.01}
                          className="h-32"
                        />
                        <span className="text-xs text-gray-400 mt-2">
                          {filterRes[0].toFixed(2)}
                        </span>
                      </div>
                      <div className="col-span-2 flex flex-col items-center gap-2 mt-4">
                        <span className="text-xs font-medium text-gray-300">
                          ROLLOFF
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            variant={
                              filterRolloff[0] === -12 ? "outline" : "default"
                            }
                            onClick={() => setFilterRolloff([-12])}
                            className="p-2 text-xs"
                          >
                            12db
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              filterRolloff[0] === -24 ? "outline" : "default"
                            }
                            onClick={() => setFilterRolloff([-24])}
                            className="p-2 text-xs"
                          >
                            24dB
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              filterRolloff[0] === -48 ? "outline" : "default"
                            }
                            onClick={() => setFilterRolloff([-48])}
                            className="p-2 text-xs"
                          >
                            48 dB
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Arpeggiator Controls */}
                    <div className="grid grid-cols-3 gap-8 p-6 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-300 mb-2">
                          RATE
                        </span>
                        <Slider
                          orientation="vertical"
                          value={arpRate}
                          onValueChange={setArpRate}
                          min={50}
                          max={1000}
                          step={10}
                          className="h-32"
                        />
                        <span className="text-xs text-gray-400 mt-2">
                          {arpRate[0]} ms
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-300 mb-2">
                          STEPS
                        </span>
                        <Slider
                          orientation="vertical"
                          value={arpSteps}
                          onValueChange={setArpSteps}
                          min={2}
                          max={5}
                          step={1}
                          className="h-32"
                        />
                        <span className="text-xs text-gray-400 mt-2">
                          {arpSteps[0]} notes
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-300 mb-2">
                          NOTE LENGTH
                        </span>
                        <Slider
                          orientation="vertical"
                          value={arpNoteLength}
                          onValueChange={setArpNoteLength}
                          min={0.05}
                          max={3}
                          step={0.01}
                          className="h-32"
                        />
                        <span className="text-xs text-gray-400 mt-2">
                          {arpNoteLength[0].toFixed(2)}s
                        </span>
                      </div>
                      <div className="col-span-3 flex flex-col items-center gap-2 mt-4">
                        <span className="text-xs font-medium text-gray-300">
                          MODE
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          <Button
                            size="sm"
                            variant={arpMode === "up" ? "outline" : "default"}
                            onClick={() => setArpMode("up")}
                            className="p-2"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={arpMode === "down" ? "outline" : "default"}
                            onClick={() => setArpMode("down")}
                            className="p-2"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              arpMode === "updown" ? "outline" : "default"
                            }
                            onClick={() => setArpMode("updown")}
                            className="p-2"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              arpMode === "random" ? "outline" : "default"
                            }
                            onClick={() => setArpMode("random")}
                            className="p-2"
                          >
                            <Shuffle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Waveform Visual */}
                <div className="h-32 bg-gray-900/50 rounded-lg border border-gray-700 p-4 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded flex items-center justify-center">
                    <div className="text-gray-400 text-sm">
                      Waveform Visualization
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Air Quality Data Panel on Right */}
          <div className="lg:col-span-4 space-y-6 flex flex-col">
            {/* Location Info */}
            <Card className="bg-gray-800/80 backdrop-blur border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-400" />
                  Location Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && (
                  <div className="text-gray-400">
                    Loading air quality data...
                  </div>
                )}
                {error && <div className="text-red-400">{error}</div>}
                {airQualityData && (
                  <div className="space-y-2">
                    <div className="text-white font-medium">
                      {airQualityData.location}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Updated {airQualityData.lastUpdated}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-green-400 border-green-400"
                    >
                      <Wind className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Air Quality Readings */}
            <Card className="bg-gray-800/80 backdrop-blur border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Air Quality Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading && (
                  <div className="text-gray-400">
                    Loading air quality data...
                  </div>
                )}
                {error && <div className="text-red-400">{error}</div>}
                {airQualityData && (
                  <>
                    {/* PM2.5 */}
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div>
                        <div className="text-white font-medium">PM2.5</div>
                        <div className="text-xs text-gray-400">
                          Fine Particles
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {airQualityData.pm25}
                        </div>
                        <div className="text-xs text-gray-400">μg/m³</div>
                        <div
                          className={`w-2 h-2 rounded-full ${getAQIColor(
                            airQualityData.pm25,
                            "pm25"
                          )} mt-1`}
                        ></div>
                      </div>
                    </div>

                    {/* PM10 */}
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div>
                        <div className="text-white font-medium">PM10</div>
                        <div className="text-xs text-gray-400">
                          Coarse Particles
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {airQualityData.pm10}
                        </div>
                        <div className="text-xs text-gray-400">μg/m³</div>
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                      </div>
                    </div>

                    {/* NO2 */}
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div>
                        <div className="text-white font-medium">NO₂</div>
                        <div className="text-xs text-gray-400">
                          Nitrogen Dioxide
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {airQualityData.no2}
                        </div>
                        <div className="text-xs text-gray-400">ppb</div>
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                      </div>
                    </div>

                    {/* O3 */}
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div>
                        <div className="text-white font-medium">O₃</div>
                        <div className="text-xs text-gray-400">Ozone</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {airQualityData.o3}
                        </div>
                        <div className="text-xs text-gray-400">ppb</div>
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                      </div>
                    </div>

                    {/* SO2 */}
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div>
                        <div className="text-white font-medium">SO₂</div>
                        <div className="text-xs text-gray-400">
                          Sulfur Dioxide
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {airQualityData.so2}
                        </div>
                        <div className="text-xs text-gray-400">ppb</div>
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                      </div>
                    </div>

                    {/* CO */}
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div>
                        <div className="text-white font-medium">CO</div>
                        <div className="text-xs text-gray-400">
                          Carbon Monoxide
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {airQualityData.co}
                        </div>
                        <div className="text-xs text-gray-400">ppm</div>
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirQualitySynthesizer;
