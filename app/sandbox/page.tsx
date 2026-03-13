"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Search, TrendingUp, TrendingDown, RefreshCw,
    Loader2, BarChart2
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
interface AnomalyFactor {
    name: string;
    reason: string;
    probability: number;
    color: "red" | "orange" | "amber" | "gray" | "blue";
}

interface AnomalyResult {
    ticker: string;
    name: string;
    currentPrice: number;
    changePercent: number;
    period: string;
    direction: "up" | "down";
    diagnosis: string;
    factors: AnomalyFactor[];
    generatedAt: string;
}

interface SearchSuggestion {
    symbol: string;
    name: string;
    exchange?: string;
}

// ────────────────────────────────────────────────────────────
// Color helpers
// ────────────────────────────────────────────────────────────
const factorColors: Record<string, { bg: string; bar: string; dot: string }> = {
    red: { bg: "bg-red-500/10", bar: "bg-red-500", dot: "bg-red-500" },
    orange: { bg: "bg-orange-500/10", bar: "bg-orange-500", dot: "bg-orange-500" },
    amber: { bg: "bg-amber-500/10", bar: "bg-amber-400", dot: "bg-amber-400" },
    gray: { bg: "bg-slate-500/10", bar: "bg-slate-400", dot: "bg-slate-400" },
    blue: { bg: "bg-blue-500/10", bar: "bg-blue-500", dot: "bg-blue-500" },
};

// ────────────────────────────────────────────────────────────
// AI Anomaly Attribution Panel
// ────────────────────────────────────────────────────────────
function AnomalyAttributionPanel({
    result,
    loading,
    onRefresh,
}: {
    result: AnomalyResult | null;
    loading: boolean;
    onRefresh: () => void;
}) {
    const totalProb = result?.factors.reduce((s, f) => s + f.probability, 0) ?? 0;

    return (
        <div className="bg-[#0D1117] border border-[#21262D] rounded-2xl overflow-hidden flex flex-col h-full min-h-[420px]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262D]">
                <p className="text-sm font-bold text-[#E6EDF3] tracking-wide">
                    AI Anomaly Attribution
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                        REAL-TIME
                    </span>
                    {result && (
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="p-1.5 rounded-lg hover:bg-[#21262D] text-[#8B949E] hover:text-white transition-colors"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-5 flex flex-col gap-4">
                {loading && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#8B949E]">
                        <Loader2 className="w-8 h-8 animate-spin text-[#58A6FF]" />
                        <p className="text-sm">AI 正在分析异动原因...</p>
                    </div>
                )}

                {!loading && !result && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#8B949E]">
                        <BarChart2 className="w-10 h-10 opacity-30" />
                        <p className="text-sm text-center">
                            输入股票代码后，AI 将分析
                            <br />
                            近期涨跌的归因概率
                        </p>
                    </div>
                )}

                {!loading && result && (
                    <>
                        {/* AI diagnosis */}
                        <div className="rounded-xl bg-[#161B22] border border-[#21262D] px-4 py-3">
                            <p className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider mb-1">
                                AI 诊断结论
                            </p>
                            <p className="text-sm text-[#E6EDF3] leading-relaxed">
                                {result.diagnosis}
                            </p>
                        </div>

                        {/* Stacked probability bar */}
                        <div className="h-5 w-full rounded-full overflow-hidden flex gap-0.5">
                            {result.factors.map((f, i) => (
                                <div
                                    key={i}
                                    className={`${factorColors[f.color]?.bar ?? "bg-slate-400"} transition-all duration-700`}
                                    style={{
                                        width: `${(f.probability / totalProb) * 100}%`,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Factor list */}
                        <div className="flex flex-col gap-2 flex-1">
                            {result.factors.map((f, i) => (
                                <div
                                    key={i}
                                    className={`rounded-xl ${factorColors[f.color]?.bg ?? ""} border border-[#21262D] px-4 py-3 flex items-center gap-3`}
                                >
                                    <div
                                        className={`w-3 h-3 rounded-full flex-shrink-0 ${factorColors[f.color]?.dot ?? ""}`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#E6EDF3]">
                                            {f.name}
                                        </p>
                                        <p className="text-xs text-[#8B949E] truncate">
                                            {f.reason}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold text-[#E6EDF3] font-mono ml-auto flex-shrink-0">
                                        {f.probability}%
                                    </span>
                                </div>
                            ))}
                        </div>

                        <p className="text-[10px] text-[#8B949E] text-right font-mono">
                            基于 AI 统计分析 · 非投资建议
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// Position Simulator Panel (动态持仓沙盘)
// ────────────────────────────────────────────────────────────
function PositionSimulatorPanel({ currentPrice }: { currentPrice: number }) {
    const [shares, setShares] = useState(500);
    const [avgCost, setAvgCost] = useState(185);
    const [mode, setMode] = useState<"buy" | "sell">("buy");

    // Buy mode
    const [buyPrice, setBuyPrice] = useState(
        currentPrice > 0 ? Math.round(currentPrice * 0.97) : 165
    );
    const [buyShares, setBuyShares] = useState(100);

    // Sell mode
    const [sellPrice, setSellPrice] = useState(
        currentPrice > 0 ? currentPrice : 185
    );
    const [sellShares, setSellShares] = useState(100);

    useEffect(() => {
        if (currentPrice > 0) {
            setBuyPrice(Math.round(currentPrice * 0.97));
            setSellPrice(Math.round(currentPrice * 100) / 100);
        }
    }, [currentPrice]);

    const price = currentPrice > 0 ? currentPrice : avgCost * 0.9;
    const unrealizedPnL = (price - avgCost) * shares;
    const unrealizedPct = avgCost > 0 ? ((price - avgCost) / avgCost) * 100 : 0;

    // Buy calculations
    const newTotalShares = shares + buyShares;
    const newTotalCost = shares * avgCost + buyShares * buyPrice;
    const newAvgCost = newTotalShares > 0 ? newTotalCost / newTotalShares : 0;
    const costChange = avgCost > 0 ? ((newAvgCost - avgCost) / avgCost) * 100 : 0;
    const reboundNeeded = price > 0 ? ((newAvgCost - price) / price) * 100 : 0;
    const additionalInvestment = buyShares * buyPrice;

    // Sell calculations
    const safeToSell = Math.min(sellShares, shares);
    const realizedPnL = (sellPrice - avgCost) * safeToSell;
    const realizedPct = avgCost > 0 ? ((sellPrice - avgCost) / avgCost) * 100 : 0;
    const remainingShares = shares - safeToSell;
    const remainingUnrealized = (price - avgCost) * remainingShares;
    const proceeds = safeToSell * sellPrice;

    const fmt = (v: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(v);

    const pmin = Math.max(1, Math.round(price * 0.5));
    const pmax = Math.round(price * 1.5);

    return (
        <div className="bg-[#0D1117] border border-[#21262D] rounded-2xl overflow-hidden flex flex-col h-full min-h-[420px]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262D]">
                <p className="text-sm font-bold text-[#E6EDF3] tracking-wide">
                    持仓模拟沙盘
                </p>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">
                    INTERACTIVE
                </span>
            </div>

            <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">

                {/* Step 1: My Position */}
                <div className="bg-[#161B22] border border-[#21262D] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#8B949E] mb-3 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#58A6FF] text-[#0D1117] text-[9px] flex items-center justify-center font-bold">1</span>
                        填入我的当前持仓
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-[#8B949E] mb-1 block">持股数量（股）</label>
                            <input
                                type="number"
                                value={shares}
                                onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#E6EDF3] font-mono focus:outline-none focus:border-[#58A6FF]"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-[#8B949E] mb-1 block">我的持仓均价（$）</label>
                            <input
                                type="number"
                                step="0.01"
                                value={avgCost}
                                onChange={(e) => setAvgCost(parseFloat(e.target.value) || 0)}
                                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-sm text-[#E6EDF3] font-mono focus:outline-none focus:border-[#58A6FF]"
                            />
                        </div>
                    </div>
                    {/* Current P/L snapshot */}
                    <div className="mt-3 flex items-center justify-between px-3 py-2 bg-[#0D1117] rounded-lg border border-[#21262D]">
                        <span className="text-xs text-[#8B949E]">当前浮动盈亏</span>
                        <div className="text-right">
                            <span className={`text-sm font-bold font-mono ${unrealizedPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {fmt(unrealizedPnL)}
                            </span>
                            <span className={`text-xs font-mono ml-2 ${unrealizedPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                                ({unrealizedPct >= 0 ? "+" : ""}{unrealizedPct.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Step 2: Mode toggle */}
                <div>
                    <p className="text-xs font-semibold text-[#8B949E] mb-2 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#58A6FF] text-[#0D1117] text-[9px] flex items-center justify-center font-bold">2</span>
                        选择操作类型
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setMode("buy")}
                            className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                mode === "buy"
                                    ? "bg-green-500/20 text-green-400 border-green-500/40"
                                    : "bg-[#161B22] text-[#8B949E] border-[#21262D] hover:border-[#30363D]"
                            }`}
                        >
                            📈 加仓（补买）
                        </button>
                        <button
                            onClick={() => setMode("sell")}
                            className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                mode === "sell"
                                    ? "bg-red-500/20 text-red-400 border-red-500/40"
                                    : "bg-[#161B22] text-[#8B949E] border-[#21262D] hover:border-[#30363D]"
                            }`}
                        >
                            📉 减仓（卖出）
                        </button>
                    </div>
                </div>

                {/* Step 3: Params */}
                <div className="bg-[#161B22] border border-[#21262D] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#8B949E] mb-3 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#58A6FF] text-[#0D1117] text-[9px] flex items-center justify-center font-bold">3</span>
                        {mode === "buy" ? "设定加仓参数" : "设定卖出参数"}
                    </p>

                    {mode === "buy" ? (
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs text-[#8B949E]">打算以多少价格买入？</label>
                                    <span className="text-sm font-bold font-mono text-green-400">${buyPrice.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range" min={pmin} max={pmax} step={0.5}
                                    value={buyPrice}
                                    onChange={(e) => setBuyPrice(parseFloat(e.target.value))}
                                    className="w-full accent-green-500 cursor-pointer h-1.5"
                                />
                                <div className="flex justify-between text-[10px] text-[#484F58] mt-0.5">
                                    <span>${pmin}</span><span>${pmax}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs text-[#8B949E]">打算再买多少股？</label>
                                    <input
                                        type="number"
                                        value={buyShares}
                                        onChange={(e) => setBuyShares(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-20 bg-[#0D1117] border border-[#30363D] rounded px-2 py-0.5 text-xs text-[#E6EDF3] font-mono text-right focus:outline-none focus:border-[#58A6FF]"
                                    />
                                </div>
                                <input
                                    type="range" min={1} max={shares * 3} step={10}
                                    value={buyShares}
                                    onChange={(e) => setBuyShares(parseInt(e.target.value))}
                                    className="w-full accent-green-500 cursor-pointer h-1.5"
                                />
                                <div className="flex justify-between text-[10px] text-[#484F58] mt-0.5">
                                    <span>1股</span><span>{shares * 3}股</span>
                                </div>
                            </div>
                            <div className="text-[10px] text-[#8B949E] text-right">
                                本次需要投入：<span className="text-[#E6EDF3] font-mono font-bold">{fmt(additionalInvestment)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs text-[#8B949E]">打算以多少价格卖出？</label>
                                    <span className={`text-sm font-bold font-mono ${sellPrice >= avgCost ? "text-green-400" : "text-red-400"}`}>
                                        ${sellPrice.toFixed(2)}
                                    </span>
                                </div>
                                <input
                                    type="range" min={pmin} max={pmax} step={0.5}
                                    value={sellPrice}
                                    onChange={(e) => setSellPrice(parseFloat(e.target.value))}
                                    className={`w-full cursor-pointer h-1.5 ${sellPrice >= avgCost ? "accent-green-500" : "accent-red-500"}`}
                                />
                                <div className="flex justify-between text-[10px] text-[#484F58] mt-0.5">
                                    <span>${pmin}</span>
                                    <span className="text-[#8B949E]">均价 ${avgCost}</span>
                                    <span>${pmax}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs text-[#8B949E]">打算卖出多少股？</label>
                                    <input
                                        type="number"
                                        value={sellShares}
                                        onChange={(e) => setSellShares(Math.max(1, Math.min(shares, parseInt(e.target.value) || 1)))}
                                        className="w-20 bg-[#0D1117] border border-[#30363D] rounded px-2 py-0.5 text-xs text-[#E6EDF3] font-mono text-right focus:outline-none focus:border-[#58A6FF]"
                                    />
                                </div>
                                <input
                                    type="range" min={1} max={shares} step={10}
                                    value={Math.min(sellShares, shares)}
                                    onChange={(e) => setSellShares(parseInt(e.target.value))}
                                    className="w-full accent-red-500 cursor-pointer h-1.5"
                                />
                                <div className="flex justify-between text-[10px] text-[#484F58] mt-0.5">
                                    <span>1股</span>
                                    <span className="text-[#8B949E]">全仓 {shares}股</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Result */}
                {mode === "buy" ? (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#161B22] border border-green-500/20 rounded-xl p-3">
                            <p className="text-[10px] text-[#8B949E] mb-1">加仓后新均价</p>
                            <p className="text-xl font-mono font-bold text-[#E6EDF3]">{fmt(newAvgCost)}</p>
                            <p className={`text-xs font-mono mt-0.5 ${costChange <= 0 ? "text-green-400" : "text-amber-400"}`}>
                                {costChange <= 0 ? `↓ 摊低了 ${Math.abs(costChange).toFixed(1)}%` : `↑ 抬高了 ${costChange.toFixed(1)}%`}
                            </p>
                        </div>
                        <div className="bg-[#161B22] border border-[#21262D] rounded-xl p-3">
                            <p className="text-[10px] text-[#8B949E] mb-1">回本还需涨</p>
                            <p className={`text-xl font-mono font-bold ${reboundNeeded <= 0 ? "text-green-400" : "text-red-400"}`}>
                                {reboundNeeded <= 0 ? "已回本 ✓" : `+${reboundNeeded.toFixed(2)}%`}
                            </p>
                            <p className="text-[10px] text-[#8B949E] mt-0.5">加仓后共持 {newTotalShares} 股</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`bg-[#161B22] border rounded-xl p-3 ${realizedPnL >= 0 ? "border-green-500/20" : "border-red-500/20"}`}>
                            <p className="text-[10px] text-[#8B949E] mb-1">本次卖出{realizedPnL >= 0 ? "盈利" : "亏损"}</p>
                            <p className={`text-xl font-mono font-bold ${realizedPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {fmt(realizedPnL)}
                            </p>
                            <p className={`text-xs font-mono mt-0.5 ${realizedPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {realizedPct >= 0 ? "+" : ""}{realizedPct.toFixed(2)}% · 回款 {fmt(proceeds)}
                            </p>
                        </div>
                        <div className="bg-[#161B22] border border-[#21262D] rounded-xl p-3">
                            <p className="text-[10px] text-[#8B949E] mb-1">卖出后剩余持仓</p>
                            <p className="text-xl font-mono font-bold text-[#E6EDF3]">{remainingShares} 股</p>
                            <p className={`text-xs font-mono mt-0.5 ${remainingUnrealized >= 0 ? "text-green-400" : "text-red-400"}`}>
                                浮动 {fmt(remainingUnrealized)}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
// Main Sandbox Page
// ────────────────────────────────────────────────────────────
export default function SandboxPage() {
    const { language } = useLanguage();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedTicker, setSelectedTicker] = useState("");
    const [activeTab, setActiveTab] = useState<"sandbox">("sandbox");
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Quick-select tickers
    const quickTickers = [
        { symbol: "AAPL", name: "Apple" },
        { symbol: "TSLA", name: "Tesla" },
        { symbol: "NVDA", name: "NVIDIA" },
        { symbol: "MSFT", name: "Microsoft" },
        { symbol: "BABA", name: "Alibaba" },
        { symbol: "600519.SS", name: "贵州茅台" },
    ];

    // Close suggestions on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Debounced search
    const handleSearchInput = useCallback((value: string) => {
        setQuery(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (value.length < 1) {
            setSuggestions([]);
            return;
        }
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/market/search?q=${encodeURIComponent(value)}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(
                        (data.results || data || []).slice(0, 8).map((r: any) => ({
                            symbol: r.symbol,
                            name: r.shortname || r.longname || r.name || r.symbol,
                            exchange: r.exchDisp || r.exchange,
                        }))
                    );
                    setShowSuggestions(true);
                }
            } catch {
                // ignore
            }
        }, 300);
    }, []);

    // Analyze ticker
    const analyzeTicker = useCallback(
        async (ticker: string) => {
            setSelectedTicker(ticker);
            setQuery(ticker);
            setShowSuggestions(false);
            setLoading(true);
            setAnomalyResult(null);

            try {
                const res = await fetch(
                    `/api/sandbox/anomaly?ticker=${encodeURIComponent(ticker)}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setAnomalyResult(data);
                } else {
                    const err = await res.json();
                    console.error("Anomaly error:", err);
                }
            } catch (e) {
                console.error("Fetch error:", e);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && query.trim()) {
            analyzeTicker(query.trim().toUpperCase());
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0D11]">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
                {/* Stock Header */}
                {anomalyResult && (
                    <div className="mb-6">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-extrabold text-white font-mono tracking-tight">
                                {anomalyResult.ticker}
                            </h1>
                            <span className="text-lg text-[#8B949E] font-medium">
                                {anomalyResult.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#8B949E] bg-[#21262D] px-2 py-0.5 rounded-full border border-[#30363D] uppercase">
                                TECHNOLOGY
                            </span>
                        </div>
                        <div className="flex items-baseline gap-3 mt-1">
                            <span className="text-3xl font-extrabold text-white font-mono">
                                ${anomalyResult.currentPrice.toFixed(2)}
                            </span>
                            <span
                                className={`text-lg font-bold font-mono ${anomalyResult.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}
                            >
                                {anomalyResult.changePercent >= 0 ? "+" : ""}
                                {anomalyResult.changePercent.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                )}

                {/* Search bar + quick tickers */}
                <div className="mb-6">
                    <div className="relative" ref={suggestionsRef}>
                        <div className="flex items-center bg-[#161B22] border border-[#30363D] rounded-xl px-4 gap-3 focus-within:border-[#58A6FF] transition-colors">
                            <Search className="w-5 h-5 text-[#8B949E] flex-shrink-0" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                placeholder={
                                    language === "zh"
                                        ? "输入股票代码或名称 (如: AAPL, TSLA, 贵州茅台)"
                                        : "Enter ticker or company name (e.g. AAPL, TSLA)"
                                }
                                className="flex-1 bg-transparent py-3 text-sm text-[#E6EDF3] placeholder:text-[#484F58] focus:outline-none font-mono"
                            />
                            {query && (
                                <button
                                    onClick={() => analyzeTicker(query.trim().toUpperCase())}
                                    disabled={loading}
                                    className="px-4 py-1.5 rounded-lg bg-[#58A6FF] hover:bg-[#4A90E2] text-[#0D1117] text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        language === "zh" ? "分析" : "Analyze"
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Suggestions dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 top-full mt-1 w-full bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl overflow-hidden">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => analyzeTicker(s.symbol)}
                                        className="w-full text-left px-4 py-2.5 hover:bg-[#21262D] flex items-center gap-3 transition-colors"
                                    >
                                        <span className="text-sm font-mono font-bold text-[#58A6FF]">
                                            {s.symbol}
                                        </span>
                                        <span className="text-sm text-[#8B949E] truncate">
                                            {s.name}
                                        </span>
                                        {s.exchange && (
                                            <span className="text-[10px] text-[#484F58] ml-auto">
                                                {s.exchange}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick select */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {quickTickers.map((t) => (
                            <button
                                key={t.symbol}
                                onClick={() => analyzeTicker(t.symbol)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                                    selectedTicker === t.symbol
                                        ? "bg-[#58A6FF]/20 text-[#58A6FF] border-[#58A6FF]/40"
                                        : "bg-[#161B22] text-[#8B949E] border-[#21262D] hover:border-[#58A6FF]/40 hover:text-[#E6EDF3]"
                                }`}
                            >
                                {t.symbol}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-1 mb-6 bg-[#161B22] rounded-xl p-1 border border-[#21262D] w-fit">
                    <button
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
                        onClick={() => (window.location.href = "/analysis")}
                    >
                        {language === "zh"
                            ? "常规分析 Fundamental Analysis"
                            : "Fundamental Analysis"}
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#21262D] text-[#E6EDF3] border border-[#30363D]"
                    >
                        {language === "zh"
                            ? "AI 测算沙盘 AI Sandbox"
                            : "AI Sandbox"}
                    </button>
                </div>

                {/* Two-panel layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnomalyAttributionPanel
                        result={anomalyResult}
                        loading={loading}
                        onRefresh={() =>
                            selectedTicker && analyzeTicker(selectedTicker)
                        }
                    />
                    <PositionSimulatorPanel
                        currentPrice={anomalyResult?.currentPrice ?? 0}
                    />
                </div>
            </div>
        </div>
    );
}
