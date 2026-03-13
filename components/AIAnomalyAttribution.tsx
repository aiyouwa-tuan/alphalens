"use client";

import { useState } from "react";
import {
  Sparkles,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  UserX,
  Globe,
  ShieldCheck,
  FlaskConical,
  ChevronRight,
  Info,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */
interface AttributionFactor {
  id: string;
  label: string;
  detail: string;
  weight: number;          // 0-100
  colorVar: string;        // CSS variable name for dot & bar segment
  barColor: string;        // Tailwind bg class for bar
  dotClass: string;        // Tailwind class for dot
  textClass: string;       // Tailwind class for weight text
  icon: React.ReactNode;
  isNeutral?: boolean;     // e.g. "no abnormal activity"
}

interface AIAnomalyAttributionProps {
  ticker?: string;
  companyName?: string;
  price?: string;
  changePct?: number;       // signed float, e.g. -6.50
  aiSummary?: string;
  factors?: AttributionFactor[];
  onEnterSandbox?: () => void;
}

/* ─── Default Data ───────────────────────────────────────── */
const DEFAULT_FACTORS: AttributionFactor[] = [
  {
    id: "fundamental",
    label: "Q3 Delivery Miss",
    detail: "Goldman Sachs lowered price target to $175",
    weight: 40,
    colorVar: "--color-danger-text",
    barColor: "bg-[#ff5252]",
    dotClass: "bg-[#ff5252]",
    textClass: "text-[#ff5252]",
    icon: <BarChart3 className="w-3 h-3" />,
  },
  {
    id: "corporate",
    label: "Powertrain VP Departure Confirmed",
    detail: "Key executive exits raise execution risk concerns",
    weight: 35,
    colorVar: "--color-warning",
    barColor: "bg-[#ff9500]",
    dotClass: "bg-[#ff9500]",
    textClass: "text-[#ff9500]",
    icon: <UserX className="w-3 h-3" />,
  },
  {
    id: "macro",
    label: "Macro — Nasdaq 100 Pullback",
    detail: "Broad tech-sector risk-off rotation",
    weight: 25,
    colorVar: "--text-muted",
    barColor: "bg-[#555555]",
    dotClass: "bg-[#555555]",
    textClass: "text-[#888888]",
    icon: <Globe className="w-3 h-3" />,
  },
  {
    id: "options",
    label: "No Abnormal Put Options Sweeps Detected",
    detail: "Options flow within 1σ of 30-day average",
    weight: 0,
    colorVar: "--color-success-text",
    barColor: "",
    dotClass: "border border-[#00e676] bg-transparent",
    textClass: "text-[#00e676]",
    icon: <ShieldCheck className="w-3 h-3" />,
    isNeutral: true,
  },
];

/* ─── Bar Segment ────────────────────────────────────────── */
function BarSegment({
  factor,
  isFirst,
  isLast,
  hovered,
  onHover,
}: {
  factor: AttributionFactor;
  isFirst: boolean;
  isLast: boolean;
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  if (factor.weight === 0) return null;
  return (
    <div
      className={`relative h-full flex items-center justify-center cursor-default transition-all duration-200 group
        ${factor.barColor}
        ${isFirst ? "rounded-l-[2px]" : ""}
        ${isLast ? "rounded-r-[2px]" : ""}
        ${hovered ? "brightness-125" : ""}
      `}
      style={{ width: `${factor.weight}%` }}
      onMouseEnter={() => onHover(factor.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Divider */}
      {!isLast && (
        <div className="absolute right-0 top-0 h-full w-px bg-[var(--bg-panel)] opacity-60 z-10" />
      )}
      {/* Weight label inside bar if wide enough */}
      {factor.weight >= 20 && (
        <span className="font-mono text-[9px] font-bold text-[var(--bg-app)] select-none z-10">
          {factor.weight}%
        </span>
      )}
      {/* Tooltip on hover */}
      {hovered && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[var(--bg-elevated,#1f1f1f)] border border-[var(--border-active,#2a2a2a)] px-2 py-1 whitespace-nowrap z-20 pointer-events-none">
          <span className="font-mono text-[10px] text-[var(--text-primary)]">
            {factor.label.split(" — ")[0]}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Factor Row ─────────────────────────────────────────── */
function FactorRow({
  factor,
  hovered,
  onHover,
}: {
  factor: AttributionFactor;
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 py-2 px-3 border-b border-[var(--border-subtle)] last:border-0 cursor-default transition-colors duration-150
        ${hovered ? "bg-[var(--bg-hover,#1a1a1a)]" : ""}
      `}
      onMouseEnter={() => onHover(factor.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Dot */}
      <div className="flex-shrink-0 mt-[3px]">
        <div
          className={`w-2.5 h-2.5 rounded-full ${factor.dotClass}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-mono text-[11px] font-semibold leading-tight
              ${factor.isNeutral ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"}
            `}
          >
            {factor.label}
          </span>
          <span className={`font-mono text-[11px] font-bold tabular-nums flex-shrink-0 ${factor.textClass}`}>
            {factor.weight}%
          </span>
        </div>
        <p className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
          {factor.detail}
        </p>
      </div>

      {/* Icon */}
      <div className={`flex-shrink-0 mt-[2px] ${factor.textClass} opacity-70`}>
        {factor.icon}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function AIAnomalyAttribution({
  ticker = "TSLA",
  companyName = "Tesla, Inc.",
  price = "$198.45",
  changePct = -6.5,
  aiSummary = "Decline primarily driven by Q3 delivery misses and key executive departure, amplified by macroeconomic tech selloff.",
  factors = DEFAULT_FACTORS,
  onEnterSandbox,
}: AIAnomalyAttributionProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sandboxPulse, setSandboxPulse] = useState(false);

  const isNegative = changePct < 0;
  const displayChange = `${isNegative ? "" : "+"}${changePct.toFixed(2)}%`;

  const barFactors = factors.filter((f) => f.weight > 0);

  const handleSandbox = () => {
    setSandboxPulse(true);
    setTimeout(() => setSandboxPulse(false), 600);
    onEnterSandbox?.();
  };

  return (
    <div
      className="w-full max-w-sm bg-[var(--bg-panel,#0f0f0f)] border border-[var(--border-subtle,#1a1a1a)] flex flex-col anim-fade-scale"
      style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
    >
      {/* ── TOP ACCENT LINE (danger) ── */}
      <div className="h-[2px] w-full bg-[var(--color-danger,#ff3b30)]" />

      {/* ── HEADER ──────────────────────────────────────── */}
      <div className="flex items-start justify-between px-3 pt-3 pb-2.5 border-b border-[var(--border-subtle)]">
        {/* Left: ticker + company + price */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[15px] font-bold text-[var(--text-primary)] tracking-wide">
              {ticker}
            </span>
            <span className="font-mono text-[10px] text-[var(--text-muted)] font-normal">
              {companyName}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono text-[18px] font-bold text-[var(--text-primary)] tabular-nums">
              {price}
            </span>
            <span
              className={`font-mono text-[13px] font-bold tabular-nums flex items-center gap-1 ${
                isNegative
                  ? "text-[var(--color-danger-text,#ff5252)]"
                  : "text-[var(--color-success-text,#00e676)]"
              }`}
            >
              <TrendingDown className={`w-3.5 h-3.5 ${!isNegative ? "rotate-180" : ""}`} />
              {displayChange}
            </span>
          </div>
        </div>

        {/* Right: AI badge + alert icon */}
        <div className="flex flex-col items-end gap-1.5">
          {/* AI Summarized badge */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[var(--bg-subtle,#141414)] border border-[var(--border-active,#2a2a2a)]">
            <Sparkles className="w-2.5 h-2.5 text-[var(--text-accent,#ff9500)]" />
            <span className="font-mono text-[8px] font-semibold uppercase tracking-wider text-[var(--text-accent,#ff9500)]">
              AI Summarized
            </span>
          </div>
          {/* Anomaly indicator */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[rgba(255,59,48,0.08)] border border-[rgba(255,59,48,0.25)]">
            <AlertTriangle className="w-2.5 h-2.5 text-[var(--color-danger-text,#ff5252)]" />
            <span className="font-mono text-[8px] font-semibold uppercase tracking-wider text-[var(--color-danger-text,#ff5252)]">
              Anomaly
            </span>
          </div>
        </div>
      </div>

      {/* ── AI CONCLUSION ────────────────────────────────── */}
      <div className="px-3 py-2.5 border-b border-[var(--border-subtle)]">
        <div className="flex gap-2">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-[1px] text-[var(--text-accent,#ff9500)] opacity-80" />
          <p className="font-mono text-[11px] text-[var(--text-secondary,#888888)] leading-relaxed">
            {aiSummary}
          </p>
        </div>
      </div>

      {/* ── ATTRIBUTION BAR ──────────────────────────────── */}
      <div className="px-3 pt-2.5 pb-2 border-b border-[var(--border-subtle)]">
        {/* Label row */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Attribution Weights
          </span>
          <Info className="w-3 h-3 text-[var(--text-dim,#333)] cursor-default" />
        </div>

        {/* Stacked bar */}
        <div className="relative h-[18px] w-full flex overflow-hidden bg-[var(--bg-subtle)] rounded-[2px]">
          {barFactors.map((f, idx) => (
            <BarSegment
              key={f.id}
              factor={f}
              isFirst={idx === 0}
              isLast={idx === barFactors.length - 1}
              hovered={hoveredId === f.id}
              onHover={setHoveredId}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {barFactors.map((f) => (
            <div key={f.id} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-sm ${f.dotClass}`} />
              <span className="font-mono text-[8px] text-[var(--text-muted)] capitalize">
                {f.id === "fundamental"
                  ? "Fundamental"
                  : f.id === "corporate"
                  ? "Corp. Action"
                  : "Macro / Beta"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FACTOR LIST ──────────────────────────────────── */}
      <div className="flex flex-col border-b border-[var(--border-subtle)]">
        {factors.map((f) => (
          <FactorRow
            key={f.id}
            factor={f}
            hovered={hoveredId === f.id}
            onHover={setHoveredId}
          />
        ))}
      </div>

      {/* ── ACTION FOOTER ────────────────────────────────── */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-3 bg-[var(--bg-subtle,#141414)]">
        <span className="font-mono text-[9px] text-[var(--text-dim,#333)] flex items-center gap-1">
          <FlaskConical className="w-3 h-3" />
          Position simulator
        </span>

        <button
          onClick={handleSandbox}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide border transition-all duration-150
            bg-[rgba(255,149,0,0.06)]
            border-[rgba(255,149,0,0.3)]
            text-[#ff9500]
            hover:bg-[rgba(255,149,0,0.14)]
            hover:border-[rgba(255,149,0,0.6)]
            active:scale-[0.97]
            ${sandboxPulse ? "scale-[0.97] brightness-125" : ""}
          `}
        >
          <FlaskConical className="w-3 h-3" />
          Enter Position Sandbox
          <ChevronRight className="w-3 h-3 opacity-60" />
        </button>
      </div>
    </div>
  );
}
