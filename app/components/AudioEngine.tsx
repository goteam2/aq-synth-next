"use client";
import React, { useEffect, useRef } from "react";
import * as Tone from "tone";
import { ArpMode, AirQualityData } from "@/types/air-quality";

interface AudioEngineProps {
  synthParams: {
    volume: number[];
    attack: number[];
    decay: number[];
    sustain: number[];
    release: number[];
    filterCutoff: number[];
    filterRes: number[];
    filterRolloff: number[];
    arpRate: number[];
    arpSteps: number[];
    arpMode: ArpMode;
    arpNoteLength: number[];
  };
  airQualityData: AirQualityData | null;
  isPlaying: boolean;
}

const AudioEngine: React.FC<AudioEngineProps> = ({
  synthParams,
  airQualityData,
  isPlaying,
}) => {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const volumeRef = useRef<Tone.Volume | null>(null);
  const playingRef = useRef<boolean>(false);

  const padSynthRef = useRef<Tone.PolySynth | null>(null);
  const padFilterRef = useRef<Tone.Filter | null>(null);
  const padVolumeRef = useRef<Tone.Volume | null>(null);
  const padIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const bassSynthRef = useRef<Tone.MonoSynth | null>(null);
  const bassFilterRef = useRef<Tone.Filter | null>(null);
  const bassVolumeRef = useRef<Tone.Volume | null>(null);
  const bassIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Setup Tone.js synth
  useEffect(() => {
    // Main arp synth
    if (!synthRef.current) {
      const filter = new Tone.Filter(
        synthParams.filterCutoff[0],
        "lowpass",
        synthParams.filterRolloff[0] as -12 | -24 | -48
      ).toDestination();
      const volumeNode = new Tone.Volume(
        Tone.gainToDb(synthParams.volume[0])
      ).connect(filter);
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: synthParams.attack[0],
          decay: synthParams.decay[0],
          sustain: synthParams.sustain[0],
          release: synthParams.release[0],
        },
      }).connect(volumeNode);
      synthRef.current = synth;
      filterRef.current = filter;
      volumeRef.current = volumeNode;
    }
    // Pad synth
    if (!padSynthRef.current) {
      const padFilter = new Tone.Filter(1200, "lowpass").toDestination();
      const padVolume = new Tone.Volume(-12).connect(padFilter);
      const padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 2, decay: 1, sustain: 0.7, release: 3 },
      }).connect(padVolume);
      padSynthRef.current = padSynth;
      padFilterRef.current = padFilter;
      padVolumeRef.current = padVolume;
    }
    // Bass synth
    if (!bassSynthRef.current) {
      const bassFilter = new Tone.Filter(400, "lowpass").toDestination();
      const bassVolume = new Tone.Volume(-8).connect(bassFilter);
      const bassSynth = new Tone.MonoSynth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.2, decay: 0.3, sustain: 0.6, release: 1.5 },
      }).connect(bassVolume);
      bassSynthRef.current = bassSynth;
      bassFilterRef.current = bassFilter;
      bassVolumeRef.current = bassVolume;
    }
    return () => {
      synthRef.current?.dispose();
      filterRef.current?.dispose();
      volumeRef.current?.dispose();
      padSynthRef.current?.dispose();
      padFilterRef.current?.dispose();
      padVolumeRef.current?.dispose();
      bassSynthRef.current?.dispose();
      bassFilterRef.current?.dispose();
      bassVolumeRef.current?.dispose();
      synthRef.current = null;
      filterRef.current = null;
      volumeRef.current = null;
      padSynthRef.current = null;
      padFilterRef.current = null;
      padVolumeRef.current = null;
      bassSynthRef.current = null;
      bassFilterRef.current = null;
      bassVolumeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update synth params when UI changes
  useEffect(() => {
    if (!synthRef.current || !filterRef.current || !volumeRef.current) return;
    synthRef.current.set({
      envelope: {
        attack: synthParams.attack[0],
        decay: synthParams.decay[0],
        sustain: synthParams.sustain[0],
        release: synthParams.release[0],
      },
    });
    filterRef.current.frequency.value = synthParams.filterCutoff[0];
    filterRef.current.Q.value = synthParams.filterRes[0] * 20; // Q: 0-20
    volumeRef.current.volume.value = Tone.gainToDb(synthParams.volume[0]);
  }, [
    synthParams.attack,
    synthParams.decay,
    synthParams.sustain,
    synthParams.release,
    synthParams.filterCutoff,
    synthParams.filterRes,
    synthParams.volume,
  ]);

  // Map air quality data to synth params
  function mapToSynthParams(data: AirQualityData) {
    const baseFreq = 261.63 + ((data.pm25 ?? 0) / 500) * (1046.5 - 261.63);
    const filterCutoff = 200 + ((data.pm10 ?? 0) / 600) * (8000 - 200);
    const detune = ((data.no2 ?? 0) / 200) * 50;
    let waveform: Tone.ToneOscillatorType = "sine";
    if (data.co > 6) waveform = "sawtooth";
    else if (data.co > 2) waveform = "triangle";
    return { baseFreq, filterCutoff, detune, waveform };
  }

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
    // --- PAD and BASS intervals ---
    function getRandomFromArray<T>(arr: T[]): T {
      return arr[Math.floor(Math.random() * arr.length)];
    }
    // C major scale for now
    const root = "C";
    const scale = ["C", "D", "E", "F", "G", "A", "B"];
    const octaves = [3, 4, 5];
    const padChords = [
      ["C", "E", "G", "B"],
      ["D", "F", "A", "C"],
      ["E", "G", "B", "D"],
      ["F", "A", "C", "E"],
      ["G", "B", "D", "F"],
      ["A", "C", "E", "G"],
      ["B", "D", "F", "A"],
    ];
    async function startSynth() {
      await Tone.start();
      if (!synthRef.current) return;
      // Arpeggiator notes
      const baseNotes = ["C4", "E4", "G4", "B4", "C5"];
      const notes = baseNotes.slice(0, synthParams.arpSteps[0]);
      let idx = 0;
      let direction = 1;

      // --- ARP ---
      function scheduleNextArpNote() {
        if (!playingRef.current || !synthRef.current) return;
        let noteIndex;
        switch (synthParams.arpMode) {
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
          `${synthParams.arpNoteLength[0]}s`
        );
        idx++;
        // Randomize next trigger: at least a half note (in seconds) between
        // We'll use Tone.Time for musical time, but for now, base on arpRate and note length
        // Half note in seconds: Tone.Time('0.5n').toSeconds()
        const minGap = Tone.Time("0.5n").toSeconds();
        const maxGap = minGap * 2.5; // up to 2.5x a half note
        const nextGap = Math.random() * (maxGap - minGap) + minGap;
        interval = setTimeout(scheduleNextArpNote, nextGap * 1000);
      }
      if (isPlaying) {
        scheduleNextArpNote();
      }

      // --- PAD ---
      if (padIntervalRef.current) clearInterval(padIntervalRef.current);
      padIntervalRef.current = setInterval(() => {
        if (!playingRef.current || !padSynthRef.current) return;
        // Pick a random chord and octave
        const chord = getRandomFromArray(padChords);
        const octave = getRandomFromArray([4, 5]);
        // Randomize note length between 2s and 6s
        const length = (Math.random() * 4 + 2).toFixed(2);
        // Transpose chord to octave
        const notes = chord.map((n) => `${n}${octave}`);
        padSynthRef.current.triggerAttackRelease(notes, `${length}s`);
      }, Math.random() * 4000 + 4000); // every 4-8s

      // --- BASS ---
      if (bassIntervalRef.current) clearInterval(bassIntervalRef.current);
      bassIntervalRef.current = setInterval(() => {
        if (!playingRef.current || !bassSynthRef.current) return;
        // Pick a random root note from scale
        const note = getRandomFromArray(scale);
        // Randomize octave (2 or 3)
        const octave = getRandomFromArray([2, 3]);
        // Randomize note length between 0.5s and 2s
        const length = (Math.random() * 1.5 + 0.5).toFixed(2);
        bassSynthRef.current.triggerAttackRelease(
          `${note}${octave}`,
          `${length}s`
        );
      }, Math.random() * 2000 + 2000); // every 2-4s
    }
    if (isPlaying) {
      startSynth();
    } else {
      if (interval) clearTimeout(interval);
      if (padIntervalRef.current) clearInterval(padIntervalRef.current);
      if (bassIntervalRef.current) clearInterval(bassIntervalRef.current);
      synthRef.current?.releaseAll();
      padSynthRef.current?.releaseAll && padSynthRef.current.releaseAll();
      bassSynthRef.current?.triggerRelease &&
        bassSynthRef.current.triggerRelease();
    }
    return () => {
      if (interval) clearTimeout(interval);
      if (padIntervalRef.current) clearInterval(padIntervalRef.current);
      if (bassIntervalRef.current) clearInterval(bassIntervalRef.current);
      synthRef.current?.releaseAll();
      padSynthRef.current?.releaseAll && padSynthRef.current.releaseAll();
      bassSynthRef.current?.triggerRelease &&
        bassSynthRef.current.triggerRelease();
    };
  }, [
    isPlaying,
    synthParams.arpRate,
    synthParams.arpSteps,
    synthParams.arpMode,
    synthParams.arpNoteLength,
  ]);

  return null;
};

export default AudioEngine;
