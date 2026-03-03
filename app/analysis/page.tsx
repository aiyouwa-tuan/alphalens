"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, ArrowRight, Loader2, Download, Square, BarChart2, FileText, History, Clock, TrendingUp, Zap, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from '@/components/LanguageProvider';

type AgentMessage = {
    type: "status" | "update" | "error" | "done";
    message?: string;
    node?: string;
    content?: string;
    tool_calls?: any[];
    market_report?: string;
    sentiment_report?: string;
    news_report?: string;
    fundamentals_report?: string;
    investment_plan?: string;
    final_trade_decision?: string;
};

export interface AnalysisHistoryItem {
    id: string;
    ticker: string;
    startTime: string;
    timestamp: string;
    endTime?: string;
    status: 'running' | 'completed' | 'error';
    markdown?: string;
}

const getUserFriendlyStatus = (node: string | null, t: any) => {
    switch (node) {
        case "market_data_analyst": return t("statusMarketData");
        case "fundamentals_analyst": return t("statusFundamentals");
        case "sentiment_analyst": return t("statusSentiment");
        case "technical_analyst": return t("statusTechnical");
        case "risk_manager": return t("statusRisk");
        case "portfolio_manager": return t("statusPortfolio");
        default: return t("statusProcessing");
    }
}

export default function AnalysisPage() {
    const { t } = useLanguage();
    const [ticker, setTicker] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [activeNode, setActiveNode] = useState<string | null>(null);
    const [finalDecision, setFinalDecision] = useState<string | null>(null); // Changed to state variable
    const [showThoughts, setShowThoughts] = useState(true); // New state variable
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // History State
    const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);

    // Load history from localStorage on mount to prevent hydration errors
    useEffect(() => {
        try {
            const saved = localStorage.getItem('alphalens_analysis_history');
            if (saved) {
                setHistory(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to parse history from localstorage", e);
        }
    }, []);

    // Helper to completely sync history to state and localstorage
    const saveHistory = (newHistory: AnalysisHistoryItem[]) => {
        setHistory(newHistory);
        localStorage.setItem('alphalens_analysis_history', JSON.stringify(newHistory.slice(0, 50))); // Keep last 50
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('alphalens_analysis_history');
    };

    const loadHistoryItem = (item: AnalysisHistoryItem) => {
        if (item.markdown) {
            setFinalDecision(item.markdown);
            setTicker(item.ticker);
        }
    };

    // Ref for auto-scrolling the terminal
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const thoughtsEndRef = useRef<HTMLDivElement>(null); // New ref for thoughts section
    const pdfContentRef = useRef<HTMLDivElement>(null); // Ref for PDF export

    const handleDownloadPDF = async () => {
        if (typeof window === "undefined" || !pdfContentRef.current) return;
        setIsExportingPDF(true);

        try {
            // Create a hidden iframe
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.width = '0px';
            iframe.style.height = '0px';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentWindow?.document;
            if (!iframeDoc) throw new Error("Could not access iframe document");

            // Extract just the HTML content of the Markdown block
            const htmlContent = pdfContentRef.current.innerHTML;

            // Construct simple HTML document for printing
            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${ticker} Analysis Report</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            padding: 40px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        h1, h2, h3, h4 { color: #111; margin-top: 1.5em; margin-bottom: 0.5em; }
                        p { margin-bottom: 1em; }
                        strong { color: #000; font-weight: 600; }
                        ul, ol { margin-bottom: 1em; padding-left: 2em; }
                        li { margin-bottom: 0.25em; }
                        hr { border: 0; border-top: 1px solid #eee; margin: 2em 0; }
                        blockquote { border-left: 4px solid #ddd; padding-left: 1em; margin-left: 0; color: #666; }
                        
                        @media print {
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    <h1 style="border-bottom: 2px solid #3B82F6; padding-bottom: 10px; margin-bottom: 30px;">
                        ${ticker} Trading Plan
                    </h1>
                    ${htmlContent}
                </body>
                </html>
            `);
            iframeDoc.close();

            // Wait a moment for iframe to render styles
            await new Promise(resolve => setTimeout(resolve, 500));

            // Execute print
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            // Cleanup after print dialog closes
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);

        } catch (error) {
            console.error("PDF Export failed", error);
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };
    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker) return;

        setIsAnalyzing(true);
        setMessages([]);
        setActiveNode(null);
        setFinalDecision(null); // Reset final decision
        setShowThoughts(true); // Show thoughts by default

        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        const newHistoryId = Date.now().toString();

        try {
            let resolvedTicker = ticker.toUpperCase();

            // Intelligent Ticker Correction
            try {
                const searchRes = await fetch(`/api/market/search?q=${encodeURIComponent(ticker)}&lang=zh-CN`);
                if (searchRes.ok) {
                    const data = await searchRes.json();
                    if (data.results && data.results.length > 0) {
                        resolvedTicker = data.results[0].symbol;
                        setTicker(resolvedTicker); // Auto-correct the input box showing to the user
                    }
                }
            } catch (searchErr) {
                console.warn("Failed to resolve ticker via search API:", searchErr);
                // Non-blocking: If search fails, we continue with the raw input
            }

            // Create new history record
            const nowTime = new Date().toLocaleString('zh-CN', { hour12: false });

            setHistory(prev => {
                const updated = [{
                    id: newHistoryId,
                    ticker: resolvedTicker,
                    startTime: nowTime,
                    timestamp: nowTime,
                    status: 'running' as const
                }, ...prev].slice(0, 50);
                localStorage.setItem('alphalens_analysis_history', JSON.stringify(updated));
                return updated;
            });

            const payload = {
                ticker: resolvedTicker,
                provider: "google",
                model: "gemini-3-pro-preview",
                api_key: ""
            };

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const response = await fetch(`${backendUrl}/api/debate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal // Attach the abort signal
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                console.log("Received chunk! Length:", value?.length);
                const chunkStr = decoder.decode(value, { stream: true });
                console.log("Decoded chunk:", chunkStr.substring(0, 50).replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
                buffer += chunkStr;

                // Split by double newline (handling both \r\n and \n) but keep the last incomplete part in the buffer
                const parts = buffer.split(/\r?\n\r?\n/);
                console.log("Split into parts:", parts.length);
                buffer = parts.pop() || "";

                for (const block of parts) {
                    const trimmedBlock = block.trim();
                    if (trimmedBlock.startsWith("data: ")) {
                        try {
                            const dataStr = trimmedBlock.replace(/^data:\s*/, "");
                            const data = JSON.parse(dataStr) as AgentMessage;

                            setMessages((prev) => [...prev, data]);

                            if (data.node) setActiveNode(data.node);
                            if (data.final_trade_decision) setFinalDecision(data.final_trade_decision); // Set final decision
                            if (data.type === "done" || data.type === "error") {
                                setIsAnalyzing(false);
                                setActiveNode(null);

                                // Mark history as completed
                                setHistory(prev => {
                                    const updated = prev.map(item =>
                                        item.id === newHistoryId
                                            ? { ...item, status: (data.type === 'error' ? 'error' : 'completed') as 'error' | 'completed', endTime: new Date().toLocaleString('zh-CN', { hour12: false }) }
                                            : item
                                    );
                                    localStorage.setItem('alphalens_analysis_history', JSON.stringify(updated));
                                    return updated;
                                });
                            }
                        } catch (err) {
                            console.error("Failed to parse SSE chunk:", trimmedBlock, err);
                        }
                    } else if (trimmedBlock.startsWith("{") && trimmedBlock.includes('"error"')) {
                        // Handle raw JSON error responses from backend (e.g. auth failures)
                        try {
                            const errData = JSON.parse(trimmedBlock);
                            setMessages(prev => [...prev, { type: "error", message: errData.error }]);
                            setIsAnalyzing(false);
                            setActiveNode(null);

                            // Mark history as error
                            setHistory(prev => {
                                const updated = prev.map(item =>
                                    item.id === newHistoryId
                                        ? { ...item, status: 'error' as const, endTime: new Date().toLocaleString('zh-CN', { hour12: false }) }
                                        : item
                                );
                                localStorage.setItem('alphalens_analysis_history', JSON.stringify(updated));
                                return updated;
                            });
                        } catch (e) {
                            // ignore partial JSON
                        }
                    }
                }
            }
        } catch (error: any) {
            if (error.name === "AbortError") {
                console.log("Analysis stream aborted by user.");
                setMessages(prev => [...prev, { type: "error", message: "Analysis canceled by user." }]);
                setIsAnalyzing(false);
                setActiveNode(null);

                // Mark history as error
                setHistory(prev => {
                    const updated = prev.map(item =>
                        item.id === newHistoryId
                            ? { ...item, status: 'error' as const, endTime: new Date().toLocaleString('zh-CN', { hour12: false }) }
                            : item
                    );
                    localStorage.setItem('alphalens_analysis_history', JSON.stringify(updated));
                    return updated;
                });
            } else {
                console.error("Stream error:", error);
                setIsAnalyzing(false);

                // Mark history as error since a network/CORS error occurred
                setHistory(prev => {
                    const updated = prev.map(item =>
                        item.id === newHistoryId
                            ? { ...item, status: 'error' as const, endTime: new Date().toLocaleString('zh-CN', { hour12: false }) }
                            : item
                    );
                    localStorage.setItem('alphalens_analysis_history', JSON.stringify(updated));
                    return updated;
                });
            }
        } finally {
            abortControllerRef.current = null;
        }
    };

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
        if (showThoughts) {
            thoughtsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, showThoughts]);

    // Extract final reports to display in dedicated UI areas
    // const finalDecision = messages.find(m => m.final_trade_decision)?.final_trade_decision; // Removed, now a state variable
    const marketReport = messages.find(m => m.market_report)?.market_report;
    const fundamentalsReport = messages.find(m => m.fundamentals_report)?.fundamentals_report;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 relative overflow-hidden">
            {/* Background Effects (subtle gradients from Figma) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none opacity-60"></div>

            <div className="max-w-7xl mx-auto px-6 pt-16 relative z-10">

                {/* HERO AREA */}
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-semibold text-xs mb-6 shadow-sm">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        {t("analysisHeroLabel")}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                        {t("analysisHeroTitle")}
                    </h1>

                    <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        {t("analysisHeroSubtitle")}
                    </p>

                    {/* Search Bar matching Figma */}
                    <div className="w-full max-w-2xl">
                        <form onSubmit={handleAnalyze} className="relative group flex items-center bg-white border border-slate-200 shadow-lg shadow-slate-200/50 rounded-2xl p-2 transition-all hover:shadow-xl hover:border-slate-300">
                            <div className="pl-4 pr-3 text-slate-400">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                className="flex-1 bg-transparent text-slate-900 text-lg focus:outline-none placeholder-slate-400 font-medium h-12"
                                placeholder={t("enterTicker")}
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                disabled={isAnalyzing}
                                autoFocus
                            />
                            {isAnalyzing ? (
                                <button
                                    type="button"
                                    onClick={handleStop}
                                    className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2"
                                >
                                    <Square className="w-4 h-4 fill-current" />
                                    {t("stopBtn")}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!ticker.trim()}
                                    className="px-6 py-3 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
                                >
                                    {t("analyzeNowBtn")}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Sub Search row */}
                    {!isAnalyzing && !finalDecision && (
                        <div className="flex flex-wrap items-center justify-center gap-8 mt-8 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-medium mr-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Recent:</span>
                                {["AAPL", "TSLA", "NVDA", "MSFT"].map(tk => (
                                    <button onClick={() => { setTicker(tk); }} key={tk} className="px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-600 font-semibold hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm">{tk}</button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-medium mr-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Trending:</span>
                                <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 font-bold border border-emerald-100">NVDA +2.18%</span>
                                <span className="px-2 py-1 rounded-md bg-rose-50 text-rose-600 font-bold border border-rose-100">TSLA -1.63%</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3 Overview Cards - (Shown when idle matching Figma bottom half) */}
                {!isAnalyzing && !finalDecision && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
                        <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                                <BrainCircuit className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{t("featureCard1Title")}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{t("featureCard1Desc")}</p>
                        </div>
                        <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-5">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{t("featureCard2Title")}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{t("featureCard2Desc")}</p>
                        </div>
                        <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-5">
                                <BarChart2 className="w-5 h-5 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{t("featureCard3Title")}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{t("featureCard3Desc")}</p>
                        </div>
                    </div>
                )}

                {/* Grid Layout strictly for active analysis or results */}
                {(isAnalyzing || finalDecision) && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-10">

                        {/* LEFT COLUMN: HISTORY / WATCHLIST */}
                        <div className="lg:col-span-4 flex flex-col gap-6 relative">
                            <div className="bg-white border border-slate-200 rounded-[20px] flex flex-col shadow-sm max-h-[calc(100vh-140px)] sticky top-24 w-full overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                                    <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                                        <History className="w-4 h-4 text-slate-400" />
                                        {t("recentAnalyses")}
                                    </h3>
                                    {history.length > 0 && (
                                        <button onClick={clearHistory} className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors">
                                            {t("clearHistory")}
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                                    {history.length === 0 ? (
                                        <div className="text-center text-slate-400 text-sm mt-10 p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            {t("noPastAnalyses")}
                                        </div>
                                    ) : (
                                        history.map((h, i) => (
                                            <button
                                                key={i}
                                                onClick={() => loadHistoryItem(h)}
                                                className="w-full bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-blue-300 hover:shadow-md transition-all group duration-200"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-slate-800 tracking-tight text-lg">{h.ticker}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{new Date(h.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed group-hover:text-slate-600 transition-colors">
                                                    {h.markdown?.substring(0, 80) ?? ''}...
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: MAIN RESULTS */}
                        <div className="lg:col-span-8 flex flex-col gap-6">

                            {/* Elegant Progress/Loading State */}
                            {isAnalyzing && !finalDecision && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-[24px] border border-blue-100 p-16 shadow-xl shadow-blue-500/5 flex flex-col items-center justify-center min-h-[500px]"
                                >
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-blue-100 rounded-2xl blur-xl animate-pulse" />
                                        <div className="w-20 h-20 rounded-2xl bg-[#0066FF] flex items-center justify-center relative z-10 shadow-lg shadow-blue-500/30">
                                            <Zap className="w-10 h-10 text-white animate-bounce" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                                        {t("analyzingLabel")}{ticker}
                                    </h3>
                                    <p className="text-slate-500 text-center max-w-sm text-lg font-medium">
                                        {getUserFriendlyStatus(activeNode, t)}
                                    </p>
                                    <div className="w-64 h-2 bg-slate-100 rounded-full mt-10 overflow-hidden relative border border-slate-200/50">
                                        <motion.div
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "200%" }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            className="absolute top-0 bottom-0 left-0 w-1/2 bg-[#0066FF] rounded-full shadow-md shadow-blue-500/50"
                                        />
                                    </div>
                                    <p className="mt-6 text-xs text-slate-400 font-semibold tracking-wider uppercase">{t("liveExecutionStatusBadge")}</p>
                                </motion.div>
                            )}

                            {/* Final Decision Formatted Document */}
                            {finalDecision && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="flex-1 rounded-[20px] bg-white border border-slate-200 shadow-md flex flex-col"
                                >
                                    <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-[20px]">
                                        <h3 className="text-xl text-slate-900 font-extrabold flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                            </div>
                                            {t("finalTradingPlan")}
                                        </h3>
                                        <button
                                            onClick={handleDownloadPDF}
                                            disabled={isExportingPDF}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-sm rounded-xl transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isExportingPDF ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                            {isExportingPDF ? t("exporting") : t("downloadPdf")}
                                        </button>
                                    </div>
                                    {/* The markdown body */}
                                    <div ref={pdfContentRef} className="p-8 prose prose-slate max-w-none text-slate-700 bg-white rounded-b-[20px]">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {finalDecision}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
