"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { buildLedger } from "@/lib/ingest";
import { Envelope, EnrichedSession } from "@/lib/types";
import demoEnvelopeRaw from "../../../../data/demo-sessions.json";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { formatClock, maskFencedLabel } from "@/lib/format";

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
  const [deathTime, setDeathTime] = useState<string>("2:47pm");

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
          const masked = maskFencedLabel(sess.label);
          setKillerName(masked);
          setDeathTime(formatClock(sess.started_at_ms));
          setIsPlaying(false);
        } else {
          // Filler never kills
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

  const isDead = blockStatus === "broken";
  const isAlive = blockStatus === "active";

  return (
    <div className="flex flex-col items-center gap-6 max-w-[720px] mx-auto pb-16 font-mono text-xs">
      <div className="w-full flex flex-col items-start gap-1 pb-3 border-b border-[#21262D]">
        <h1 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#E6EDF3]">
          FOCUS BLOCK (LIVE REPLAY)
        </h1>
        <p className="text-[11px] text-[#6E7681]">
          Creature grows on work-set occupancy; sink &gt;= {deathFloorSeconds}s kills it
        </p>
      </div>

      {/* Target Selector */}
      <div className="w-full flex items-center justify-between gap-4 py-2 border-b border-[#21262D]">
        <span className="text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
          Target Duration
        </span>
        <SegmentedControl
          options={targetOptions}
          value={targetMinutes}
          onChange={setTargetMinutes}
        />
      </div>

      {/* Creature Stage Area */}
      <div className="w-full rounded-[4px] border border-[#21262D] bg-[#0D1117] p-8 flex flex-col items-center justify-center relative min-h-[220px]">
        {/* Flat 1px-stroke line creature (56dp max, UI.md §2.4) */}
        <div className="w-16 h-16 flex items-center justify-center mb-4">
          {isDead ? (
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <polygon
                points="28,8 48,26 38,48 18,48 8,26"
                stroke="#6E7681"
                strokeWidth="1"
              />
              <line x1="20" y1="26" x2="36" y2="26" stroke="#6E7681" strokeWidth="1" />
              <line x1="20" y1="34" x2="36" y2="34" stroke="#6E7681" strokeWidth="1" />
            </svg>
          ) : isAlive ? (
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <polygon
                points="28,8 48,26 38,48 18,48 8,26"
                stroke="#D29922"
                strokeWidth="1"
              />
              <polygon
                points="28,18 38,28 32,40 24,40 18,28"
                stroke="#D29922"
                strokeWidth="1"
              />
            </svg>
          ) : (
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <ellipse
                cx="28"
                cy="28"
                rx="20"
                ry="20"
                stroke="#8B949E"
                strokeWidth="1"
              />
              <line x1="16" y1="28" x2="40" y2="28" stroke="#8B949E" strokeWidth="1" />
            </svg>
          )}
        </div>

        {/* Big Tabular Mono Clock */}
        <div className="text-4xl font-semibold text-[#E6EDF3] tnum tracking-tight">
          {clock}
        </div>

        {/* State description */}
        <div className="mt-2 text-center text-xs">
          {blockStatus === "idle" && (
            <span className="text-[#8B949E]">Waiting for focus block</span>
          )}
          {blockStatus === "active" && (
            <span className="text-[#D29922]">Focusing — attention holds</span>
          )}
          {blockStatus === "completed" && (
            <span className="text-[#D29922]">Target reached — block complete</span>
          )}
          {blockStatus === "broken" && (
            <span className="text-[#F85149]">
              {killerName === "private"
                ? `Killed by private — ${deathTime}`
                : `Killed by ${killerName || "sink"} — ${deathTime}`}
            </span>
          )}
          {blockStatus === "cancelled" && (
            <span className="text-[#8B949E]">Block cancelled</span>
          )}
        </div>

        {/* Current Replayed Session Under Test */}
        {currentSession && (
          <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[10px] text-[#6E7681]">
            <span>
              replaying: {maskFencedLabel(currentSession.label, currentSession.category === "private")}
            </span>
            <span>{currentSession.seconds}s</span>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {blockStatus === "idle" || blockStatus === "broken" || blockStatus === "completed" || blockStatus === "cancelled" ? (
          <Button variant="primary" onClick={handleStart} className="min-w-[120px]">
            {blockStatus === "idle" ? "Start Block" : "New Block"}
          </Button>
        ) : (
          <Button variant="secondary" onClick={handleEnd} className="min-w-[120px]">
            End Block
          </Button>
        )}

        {(blockStatus === "broken" || blockStatus === "completed" || blockStatus === "cancelled") && (
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>

      {/* Death Floor Settings Row */}
      <div className="w-full flex items-center justify-between gap-4 pt-4 border-t border-[#21262D]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
            Death Floor
          </span>
          <span className="text-[10px] text-[#6E7681]">
            Killer duration required to end a focus block (locked default: 5s)
          </span>
        </div>

        <SegmentedControl
          options={floorOptions}
          value={deathFloorSeconds}
          onChange={(val) => setDeathFloor(Number(val))}
        />
      </div>
    </div>
  );
}
