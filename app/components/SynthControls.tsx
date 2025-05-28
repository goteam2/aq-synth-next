"use client";
import React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Volume2,
  Play,
  Square,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Shuffle,
  Activity,
} from "lucide-react";
import { ArpMode } from "@/types/air-quality";

interface SynthControlsProps {
  volume: number[];
  setVolume: (v: number[]) => void;
  attack: number[];
  setAttack: (v: number[]) => void;
  decay: number[];
  setDecay: (v: number[]) => void;
  sustain: number[];
  setSustain: (v: number[]) => void;
  release: number[];
  setRelease: (v: number[]) => void;
  filterCutoff: number[];
  setFilterCutoff: (v: number[]) => void;
  filterRes: number[];
  setFilterRes: (v: number[]) => void;
  filterRolloff: number[];
  setFilterRolloff: (v: number[]) => void;
  arpRate: number[];
  setArpRate: (v: number[]) => void;
  arpSteps: number[];
  setArpSteps: (v: number[]) => void;
  arpMode: ArpMode;
  setArpMode: (m: ArpMode) => void;
  arpNoteLength: number[];
  setArpNoteLength: (v: number[]) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
}

const SynthControls: React.FC<SynthControlsProps> = (props) => {
  const {
    volume,
    setVolume,
    attack,
    setAttack,
    decay,
    setDecay,
    sustain,
    setSustain,
    release,
    setRelease,
    filterCutoff,
    setFilterCutoff,
    filterRes,
    setFilterRes,
    filterRolloff,
    setFilterRolloff,
    arpRate,
    setArpRate,
    arpSteps,
    setArpSteps,
    arpMode,
    setArpMode,
    arpNoteLength,
    setArpNoteLength,
    isPlaying,
    setIsPlaying,
  } = props;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 w-full">
        <Activity className="w-5 h-5 text-blue-400" />
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
            <span className="text-xs font-medium text-gray-300">ROLLOFF</span>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={filterRolloff[0] === -12 ? "outline" : "default"}
                onClick={() => setFilterRolloff([-12])}
                className="p-2 text-xs"
              >
                12db
              </Button>
              <Button
                size="sm"
                variant={filterRolloff[0] === -24 ? "outline" : "default"}
                onClick={() => setFilterRolloff([-24])}
                className="p-2 text-xs"
              >
                24dB
              </Button>
              <Button
                size="sm"
                variant={filterRolloff[0] === -48 ? "outline" : "default"}
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
            <span className="text-xs font-medium text-gray-300 mb-2">RATE</span>
            <Slider
              orientation="vertical"
              value={arpRate}
              onValueChange={setArpRate}
              min={50}
              max={1000}
              step={10}
              className="h-32"
            />
            <span className="text-xs text-gray-400 mt-2">{arpRate[0]} ms</span>
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
            <span className="text-xs font-medium text-gray-300">MODE</span>
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
                variant={arpMode === "updown" ? "outline" : "default"}
                onClick={() => setArpMode("updown")}
                className="p-2"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={arpMode === "random" ? "outline" : "default"}
                onClick={() => setArpMode("random")}
                className="p-2"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Waveform Visual Placeholder */}
      {/* <div className="h-32 bg-gray-900/50 rounded-lg border border-gray-700 p-4 flex items-center justify-center">
        <div className="w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded flex items-center justify-center">
          <div className="text-gray-400 text-sm">Waveform Visualization</div>
        </div>
      </div> */}
    </div>
  );
};

export default SynthControls;
