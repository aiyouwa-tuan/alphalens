'use client';

import { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  X, 
  Calculator,
  DollarSign,
  Percent,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';

interface PositionSimulatorProps {
  ticker?: string;
  companyName?: string;
  currentShares?: number;
  avgCost?: number;
  currentPrice?: number;
  hasWashSaleRisk?: boolean;
  onClose?: () => void;
}

export default function PositionSimulator({
  ticker = 'AAPL',
  companyName = 'Apple Inc.',
  currentShares = 500,
  avgCost = 185.00,
  currentPrice = 170.00,
  hasWashSaleRisk = true,
  onClose,
}: PositionSimulatorProps) {
  // Simulation state
  const [targetBuyPrice, setTargetBuyPrice] = useState(165);
  const [additionalShares, setAdditionalShares] = useState(200);
  const [showWashSaleWarning, setShowWashSaleWarning] = useState(hasWashSaleRisk);

  // Calculations
  const calculations = useMemo(() => {
    // Current P&L
    const currentPnL = (currentPrice - avgCost) * currentShares;
    const currentPnLPercent = ((currentPrice - avgCost) / avgCost) * 100;

    // New position after averaging down
    const totalShares = currentShares + additionalShares;
    const totalCost = (avgCost * currentShares) + (targetBuyPrice * additionalShares);
    const newAvgCost = additionalShares > 0 ? totalCost / totalShares : avgCost;

    // New P&L at current price
    const newPnL = (currentPrice - newAvgCost) * totalShares;
    const newPnLPercent = ((currentPrice - newAvgCost) / newAvgCost) * 100;

    // Required rebound for breakeven
    const currentRebound = ((avgCost - currentPrice) / currentPrice) * 100;
    const newRebound = ((newAvgCost - currentPrice) / currentPrice) * 100;
    const reboundImprovement = currentRebound - newRebound;

    // Additional capital required
    const additionalCapital = targetBuyPrice * additionalShares;

    // Cost basis reduction
    const costReduction = avgCost - newAvgCost;
    const costReductionPercent = (costReduction / avgCost) * 100;

    return {
      currentPnL,
      currentPnLPercent,
      totalShares,
      newAvgCost,
      newPnL,
      newPnLPercent,
      currentRebound,
      newRebound,
      reboundImprovement,
      additionalCapital,
      costReduction,
      costReductionPercent,
    };
  }, [currentShares, avgCost, currentPrice, targetBuyPrice, additionalShares]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="terminal-panel w-full max-w-4xl">
      {/* Header */}
      <div className="terminal-panel-header">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[var(--text-accent)]" />
          <span className="title">Position Simulator</span>
          <span className="text-[var(--text-dim)]">|</span>
          <span className="text-[var(--text-primary)] font-bold">{ticker}</span>
          <span className="text-[var(--text-muted)]">{companyName}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-3 h-3 text-[var(--text-muted)]" />
          </button>
        )}
      </div>

      {/* Wash Sale Warning */}
      {showWashSaleWarning && (
        <div className="mx-2 mt-2 p-2 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--color-warning-text)] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] text-[var(--color-warning-text)] font-bold uppercase mb-0.5">
              Wash Sale Warning
            </p>
            <p className="font-mono text-[10px] text-[var(--text-muted)] leading-relaxed">
              You closed a loss position on {ticker} within the last 30 days. High-frequency scalping may trigger IRS Wash Sale rules, disallowing tax deductions on current losses.
            </p>
          </div>
          <button
            onClick={() => setShowWashSaleWarning(false)}
            className="p-1 hover:bg-[var(--color-warning)]/20 transition-colors flex-shrink-0"
          >
            <X className="w-3 h-3 text-[var(--color-warning-text)]" />
          </button>
        </div>
      )}

      {/* Dynamic Output Area - Prominent Center */}
      <div className="mx-2 mt-2 p-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
        <div className="grid grid-cols-3 gap-4">
          {/* New Average Cost */}
          <div className="text-center">
            <p className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-wider mb-1">
              New Avg Cost
            </p>
            <p className={`font-mono text-2xl font-bold ${additionalShares > 0 ? 'text-[var(--color-success-text)]' : 'text-[var(--text-primary)]'}`}>
              {formatCurrency(calculations.newAvgCost)}
            </p>
            {additionalShares > 0 && (
              <p className="font-mono text-[10px] text-[var(--color-success-text)] mt-0.5">
                -{formatCurrency(calculations.costReduction)} ({formatPercent(-calculations.costReductionPercent)})
              </p>
            )}
          </div>

          {/* Required Rebound */}
          <div className="text-center border-x border-[var(--border-subtle)] px-4">
            <p className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-wider mb-1">
              Rebound to Breakeven
            </p>
            <p className={`font-mono text-2xl font-bold ${calculations.newRebound < calculations.currentRebound ? 'text-[var(--color-success-text)]' : 'text-[var(--text-primary)]'}`}>
              +{calculations.newRebound.toFixed(2)}%
            </p>
            {additionalShares > 0 && (
              <p className="font-mono text-[10px] text-[var(--color-success-text)] mt-0.5">
                Down from +{calculations.currentRebound.toFixed(2)}%
              </p>
            )}
          </div>

          {/* Total Position */}
          <div className="text-center">
            <p className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-wider mb-1">
              Total Position
            </p>
            <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">
              {calculations.totalShares.toLocaleString()}
            </p>
            <p className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5">
              Capital: {formatCurrency(calculations.additionalCapital)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Two Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--border-subtle)] m-2">
        {/* Left Panel: Current Position */}
        <div className="bg-[var(--bg-panel)] p-3">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-subtle)]">
            <Layers className="w-3 h-3 text-[var(--text-accent)]" />
            <span className="font-mono text-[10px] text-[var(--text-accent)] uppercase font-bold">
              Current Position
            </span>
          </div>

          <div className="space-y-2">
            {/* Position Details */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--bg-subtle)] p-2">
                <p className="font-mono text-[9px] text-[var(--text-dim)] uppercase">Shares</p>
                <p className="font-mono text-sm font-bold text-[var(--text-primary)]">
                  {currentShares.toLocaleString()}
                </p>
              </div>
              <div className="bg-[var(--bg-subtle)] p-2">
                <p className="font-mono text-[9px] text-[var(--text-dim)] uppercase">Avg Cost</p>
                <p className="font-mono text-sm font-bold text-[var(--text-primary)]">
                  {formatCurrency(avgCost)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--bg-subtle)] p-2">
                <p className="font-mono text-[9px] text-[var(--text-dim)] uppercase">Current Price</p>
                <p className="font-mono text-sm font-bold text-[var(--text-primary)]">
                  {formatCurrency(currentPrice)}
                </p>
              </div>
              <div className="bg-[var(--bg-subtle)] p-2">
                <p className="font-mono text-[9px] text-[var(--text-dim)] uppercase">Market Value</p>
                <p className="font-mono text-sm font-bold text-[var(--text-primary)]">
                  {formatCurrency(currentPrice * currentShares)}
                </p>
              </div>
            </div>

            {/* Unrealized P&L */}
            <div className={`p-2 ${calculations.currentPnL >= 0 ? 'bg-[var(--color-success-bg)]' : 'bg-[var(--color-danger-bg)]'}`}>
              <p className="font-mono text-[9px] text-[var(--text-dim)] uppercase mb-1">Unrealized P&L</p>
              <div className="flex items-center gap-2">
                {calculations.currentPnL >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-[var(--color-success-text)]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[var(--color-danger-text)]" />
                )}
                <span className={`font-mono text-lg font-bold ${calculations.currentPnL >= 0 ? 'text-[var(--color-success-text)]' : 'text-[var(--color-danger-text)]'}`}>
                  {formatCurrency(calculations.currentPnL)}
                </span>
                <span className={`font-mono text-sm ${calculations.currentPnL >= 0 ? 'text-[var(--color-success-text)]' : 'text-[var(--color-danger-text)]'}`}>
                  ({formatPercent(calculations.currentPnLPercent)})
                </span>
              </div>
            </div>

            {/* Current breakeven info */}
            <div className="flex items-center gap-2 p-2 bg-[var(--bg-subtle)]">
              <Info className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                Needs <span className="text-[var(--color-warning-text)] font-bold">+{calculations.currentRebound.toFixed(2)}%</span> to breakeven
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Simulation */}
        <div className="bg-[var(--bg-panel)] p-3">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-subtle)]">
            <Calculator className="w-3 h-3 text-[var(--color-success-text)]" />
            <span className="font-mono text-[10px] text-[var(--color-success-text)] uppercase font-bold">
              Averaging Down Simulator
            </span>
          </div>

          <div className="space-y-4">
            {/* Target Buy Price */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-mono text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Target Buy Price
                </label>
                <div className="flex items-center gap-1 bg-[var(--bg-app)] border border-[var(--border-subtle)] px-2 py-1">
                  <span className="font-mono text-[10px] text-[var(--text-dim)]">$</span>
                  <input
                    type="number"
                    value={targetBuyPrice}
                    onChange={(e) => setTargetBuyPrice(Math.max(150, Math.min(170, Number(e.target.value))))}
                    className="w-16 bg-transparent font-mono text-sm text-[var(--text-primary)] focus:outline-none text-right"
                    min={150}
                    max={170}
                    step={0.5}
                  />
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={150}
                  max={170}
                  step={0.5}
                  value={targetBuyPrice}
                  onChange={(e) => setTargetBuyPrice(Number(e.target.value))}
                  className="w-full h-1 bg-[var(--bg-subtle)] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--text-accent)] [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-[8px] text-[var(--text-dim)]">$150</span>
                  <span className="font-mono text-[8px] text-[var(--text-dim)]">$170</span>
                </div>
              </div>
              {/* Discount indicator */}
              <div className="mt-1 flex items-center gap-1">
                <span className="font-mono text-[9px] text-[var(--text-muted)]">Discount from avg:</span>
                <span className="font-mono text-[9px] text-[var(--color-success-text)] font-bold">
                  -{((avgCost - targetBuyPrice) / avgCost * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Additional Shares */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-mono text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Additional Shares
                </label>
                <div className="flex items-center gap-1 bg-[var(--bg-app)] border border-[var(--border-subtle)] px-2 py-1">
                  <input
                    type="number"
                    value={additionalShares}
                    onChange={(e) => setAdditionalShares(Math.max(0, Math.min(1000, Number(e.target.value))))}
                    className="w-16 bg-transparent font-mono text-sm text-[var(--text-primary)] focus:outline-none text-right"
                    min={0}
                    max={1000}
                    step={10}
                  />
                  <span className="font-mono text-[10px] text-[var(--text-dim)]">shs</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={10}
                  value={additionalShares}
                  onChange={(e) => setAdditionalShares(Number(e.target.value))}
                  className="w-full h-1 bg-[var(--bg-subtle)] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--color-success-text)] [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-[8px] text-[var(--text-dim)]">0</span>
                  <span className="font-mono text-[8px] text-[var(--text-dim)]">1,000</span>
                </div>
              </div>
            </div>

            {/* Simulation Summary */}
            {additionalShares > 0 && (
              <div className="p-2 bg-[var(--color-success-bg)] border border-[var(--color-success)]/30 space-y-1">
                <p className="font-mono text-[9px] text-[var(--color-success-text)] uppercase font-bold">
                  Simulation Result
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-[var(--text-muted)]">Add Capital:</span>
                    <span className="font-mono text-[var(--text-primary)] ml-1 font-bold">
                      {formatCurrency(calculations.additionalCapital)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">New Shares:</span>
                    <span className="font-mono text-[var(--text-primary)] ml-1 font-bold">
                      {calculations.totalShares.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">New P&L:</span>
                    <span className={`font-mono ml-1 font-bold ${calculations.newPnL >= 0 ? 'text-[var(--color-success-text)]' : 'text-[var(--color-danger-text)]'}`}>
                      {formatCurrency(calculations.newPnL)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Improvement:</span>
                    <span className="font-mono text-[var(--color-success-text)] ml-1 font-bold">
                      -{calculations.reboundImprovement.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="m-2 mt-0 flex items-center justify-between p-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase">
            Simulation Mode
          </span>
          <span className="status-dot online" />
          <span className="font-mono text-[9px] text-[var(--color-success-text)]">
            ACTIVE
          </span>
        </div>
        <button className="flex items-center gap-1 px-3 py-1.5 bg-[var(--text-accent)] text-[var(--bg-app)] font-mono text-[10px] uppercase font-bold hover:opacity-90 transition-opacity">
          Enter Position Sandbox
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
