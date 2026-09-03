"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { Envelope, EnrichedSession } from "@/lib/types";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";

const demoEnvelope = demoEnvelopeRaw as unknown as Envelope;

export default function BlockPage() {
  const { settings, setDeathFloor, seedPins, overrides } = useAppStore();

  const ledger = useMemo(() => {
    return buildLedger(demoEnvelope, seedPins, overrides);
  }, [seedPins, overrides]);

  const [targetMinutes, setTargetMinutes] = useState<number | "open">(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [eventIndex, setEventIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [blockStatus, setBlockStatus] = useState<"idle" | "active" | "completed" | "broken" | "cancelled">("idle");
  const [killerName, setKillerName] = useState<string | null>(null);

  const deathFloorSeconds = settings.deathFloor || 5;

  // Filter sessions that have positive duration
  const sessions = useMemo(() => {
    return ledger.filter((s) => s.seconds > 0);
  }, [ledger]);

  const currentSession: EnrichedSession | undefined = sessions[eventIndex];

  // Advance replay
  useEffect(() => {
    if (!isPlaying || blockStatus !== "active") return;

    const interval = setInterval(() => {
      setEventIndex((prev) => {
        if (prev >= sessions.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        const sess = sessions[next];

        // Step block state machine
        if (sess.category === "work") {
          setElapsedSeconds((e) => e + Math.min(60, sess.seconds));
        } else if (sess.category === "sink" && sess.seconds >= deathFloorSeconds) {
          // Rule A: sink >= floor kills the creature
          setBlockStatus("broken");
          setKillerName(sess.label);
          setIsPlaying(false);
        } else {
          // Unknown / filler never kills
          setElapsedSeconds((e) => e + Math.min(15, sess.seconds));
        }

        // Target reached check
        if (targetMinutes !== "open" && elapsedSeconds >= targetMinutes * 60) {
          setBlockStatus("completed");
          setIsPlaying(false);
        }

        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, blockStatus, sessions, deathFloorSeconds, elapsedSeconds, targetMinutes]);

  const handleStart = () => {
    setBlockStatus("active");
    setElapsedSeconds(0);
    setKillerName(null);
    setIsPlaying(true);
  };

  const handleEnd = () => {
    setBlockStatus("cancelled");
    setIsPlaying(false);
  };

  const handleReset = () => {
    setBlockStatus("idle");
    setElapsedSeconds(0);
    setKillerName(null);
    setIsPlaying(false);
    setEventIndex(0);
  };

  // Format elapsed clock
  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const clock = `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  const targetOptions = [
    { label: "15m", value: 15 },
    { label: "25m", value: 25 },
    { label: "45m", value: 45 },
    { label: "Open", value: "open" as const },
  ];

  const floorOptions = [
    { label: "3s", value: 3 },
    { label: "5s", value: 5 },
    { label: "10s", value: 10 },
  ];

  return (
    <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto pb-16">
      <div className="w-full flex flex-col items-center text-center gap-2">
        <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
          Focus Block (Replay Engine)
        </h1>
        <p className="text-xs text-[#94A3B8] font-mono">
          State machine driven by recorded events
        </p>
      </div>

      {/* Target Selector */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B]">
          Target Duration
        </span>
        <SegmentedControl
          options={targetOptions}
          value={targetMinutes}
          onChange={setTargetMinutes}
        />
      </div>

      {/* Creature Stage Area */}
      <div className="w-full aspect-[16/9] rounded-2xl border border-[#222735] bg-[#12151D] p-8 flex flex-col items-center justify-center relative overflow-hidden">
        {blockStatus === "broken" ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <div className="w-24 h-24 rounded-full bg-[#F43F5E]/10 border border-[#F43F5E]/40 flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-14 h-14 text-[#F43F5E]">
                <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="24" y1="26" x2="28" y2="30" stroke="currentColor" strokeWidth="2" />
                <line x1="28" y1="26" x2="24" y2="30" stroke="currentColor" strokeWidth="2" />
                <line x1="36" y1="26" x2="40" y2="30" stroke="currentColor" strokeWidth="2" />
                <line x1="40" y1="26" x2="36" y2="30" stroke="currentColor" strokeWidth="2" />
                <path d="M26 40 Q32 36 38 40" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div className="text-center font-mono">
              <span className="text-sm font-bold text-[#F43F5E] block">Broken</span>
              <span className="text-xs text-[#94A3B8]">
                Fell on confirmed killer: {killerName || "sink"} (≥{deathFloorSeconds}s)
              </span>
            </div>
          </div>
        ) : blockStatus === "completed" ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <div className="w-24 h-24 rounded-full bg-[#22D3EE]/10 border border-[#222735] flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-14 h-14 text-[#22D3EE]">
                <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="24" cy="28" r="2.5" fill="currentColor" />
                <circle cx="40" cy="28" r="2.5" fill="currentColor" />
                <path d="M26 38 Q32 46 38 38" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div className="text-center font-mono">
              <span className="text-sm font-bold text-[#22D3EE] block">Completed</span>
              <span className="text-xs text-[#94A3B8]">
                Target reached · {Math.round(elapsedSeconds / 60)} min
              </span>
            </div>
          </div>
        ) : blockStatus === "active" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center animate-pulse">
              <svg viewBox="0 0 64 64" className="w-14 h-14 text-[#22D3EE]">
                <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="25" cy="28" r="2.5" fill="currentColor" />
                <circle cx="39" cy="28" r="2.5" fill="currentColor" />
                <path d="M26 38 Q32 44 38 38" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div className="text-xs font-mono text-[#22D3EE]">
              Focus block active · Replaying event {eventIndex + 1}/{sessions.length}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#1E2538] border border-[#333D52] flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-14 h-14 text-[#94A3B8]">
                <ellipse cx="32" cy="34" rx="20" ry="24" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M32 14 L30 22 L34 28" fill="none" stroke="#64748B" strokeWidth="1.5" strokeOpacity="0.6" />
              </svg>
            </div>
            <div className="text-xs font-mono text-[#64748B]">
              Ready to start focus block
            </div>
          </div>
        )}

        {/* Current Replay Session Stamp */}
        {currentSession && (
          <div className="absolute top-4 left-4 text-[10px] font-mono text-[#64748B]">
            Current: {currentSession.label} ({currentSession.category}, {currentSession.seconds}s)
          </div>
        )}
      </div>

      {/* Clock Hero */}
      <div className="text-5xl font-mono font-bold tracking-tight text-[#F8FAFC]">
        {clock}
      </div>

      {/* Replay Scrubber */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex justify-between text-[11px] font-mono text-[#64748B]">
          <span>Replay timeline</span>
          <span>
            {eventIndex >= sessions.length - 1 ? "End of replay" : `${eventIndex + 1} / ${sessions.length}`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={sessions.length - 1}
          value={eventIndex}
          onChange={(e) => {
            const idx = Number(e.target.value);
            setEventIndex(idx);
          }}
          className="w-full h-2 bg-[#1E2538] rounded-lg appearance-none cursor-pointer accent-[#22D3EE]"
        />
      </div>

      {/* Death Floor Setting */}
      <div className="flex flex-col items-center gap-2 border-t border-[#222735] pt-6 w-full">
        <span className="text-xs font-mono text-[#94A3B8]">
          Death floor — when a killer ends a block
        </span>
        <SegmentedControl
          options={floorOptions}
          value={deathFloorSeconds}
          onChange={(v) => setDeathFloor(Number(v))}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-2">
        {blockStatus === "idle" && (
          <Button variant="primary" onClick={handleStart} className="min-w-[160px]">
            Start block
          </Button>
        )}
        {blockStatus === "active" && (
          <Button variant="secondary" onClick={handleEnd} className="min-w-[160px]">
            End block
          </Button>
        )}
        {(blockStatus === "broken" || blockStatus === "completed" || blockStatus === "cancelled") && (
          <Button variant="primary" onClick={handleReset} className="min-w-[160px]">
            New block
          </Button>
        )}
      </div>
    </div>
  );
}
