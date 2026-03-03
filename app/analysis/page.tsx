"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Activity, ShieldAlert, Cpu, BrainCircuit, ArrowRight, Loader2, PlayCircle, ChevronDown, ChevronUp, Download, XCircle } from "lucide-react";
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
    endTime?: string;
    status: 'running' | 'completed' | 'error';
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
        <div className="min-h-screen bg-[#0A0A0B] text-slate-200">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Header Area */}
                <div className="text-center mb-10 mt-2">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6"
                    >
                        <BrainCircuit className="w-5 h-5" />
                        <span className="text-sm font-medium">AlphaLens Trading Agents powered by Gemini</span>
                    </motion.div>
                    <h1 className="text-5xl font-extrabold tracking-tight text-white mb-6">
                        {t('analysisTitle')}
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        {t('analysisSubtitle')}
                    </p>


                    {/* Hero Search Bar - Centered */}
                    <div className="max-w-3xl mx-auto mb-10 mt-8">
                        <form onSubmit={handleAnalyze} className="relative group">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg transition-opacity opacity-0 group-hover:opacity-100" />
                            <div className="relative flex items-center bg-[#111113] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                                <input
                                    type="text"
                                    placeholder={t('enterTicker')}
                                    className="w-full bg-transparent border-none text-white px-6 py-5 text-lg outline-none placeholder:text-slate-500 uppercase font-mono"
                                    value={ticker}
                                    onChange={(e) => setTicker(e.target.value)}
                                    disabled={isAnalyzing}
                                />
                                <div className="flex mr-3 gap-2">
                                    {isAnalyzing ? (
                                        <button
                                            type="button"
                                            onClick={handleStop}
                                            className="bg-red-600/80 hover:bg-red-500 text-white px-8 py-3.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            {t('stopBtn')}
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={!ticker}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <PlayCircle className="w-5 h-5" />
                                            {t('analyzeBtn')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* 2-Column Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto text-left">

                    {/* Left Column (Terminal & History) - 4 Cols */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Left Column: History Panel */}
                        <div className="bg-[#111113] border border-white/10 rounded-2xl flex flex-col h-[600px] shadow-xl">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                                <h3 className="text-sm font-semibold text-slate-300 px-1">{t('recentAnalyses')}</h3>
                                {history.length > 0 && (
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('alphalens_analysis_history');
                                            setHistory([]);
                                        }}
                                        className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        {t('clearHistory')}
                                    </button>
                                )}
                            </div>
                            <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                                {history.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm pb-8">
                                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-4 flex items-center justify-center shadow-lg">
                                            <Activity className="w-6 h-6 text-slate-400 opacity-60" />
                                        </div>
                                        <span className="font-medium">{t('noPastAnalyses')}</span>
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="bg-white/5 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors cursor-pointer" onClick={() => {
                                            if (!isAnalyzing) setTicker(item.ticker);
                                        }}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono font-bold text-blue-400 text-base">{item.ticker}</span>
                                                {item.status === 'running' && <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full"><Loader2 className="w-3 h-3 animate-spin" /> Running</span>}
                                                {item.status === 'completed' && <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Completed</span>}
                                                {item.status === 'error' && <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Error</span>}
                                            </div>
                                            <div className="text-[11px] text-slate-500 flex flex-col gap-1 font-mono">
                                                <div className="flex justify-between">
                                                    <span>Start:</span>
                                                    <span className="text-slate-400">{item.startTime}</span>
                                                </div>
                                                {item.endTime && (
                                                    <div className="flex justify-between">
                                                        <span>End:</span>
                                                        <span className="text-slate-400">{item.endTime}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Agent Terminal & Execution) - 8 Cols */}
                    <div className="lg:col-span-8 flex flex-col gap-6">


                        {/* Agent Stream Terminal */}
                        <div className="rounded-2xl bg-[#111113] border border-white/10 flex flex-col h-[600px] overflow-hidden shadow-xl">
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-[#1A1A1D]">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="ml-2 text-sm text-slate-400 font-mono">{t('agentTerminal')}</span>
                            </div>

                            <div className="flex-1 p-5 overflow-y-auto font-mono text-sm space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                                <AnimatePresence>
                                    {messages.length === 0 && !isAnalyzing && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-slate-500 italic pb-12">
                                            <div className="text-blue-500/30 mb-4 animate-pulse">
                                                <BrainCircuit className="w-12 h-12" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-600 font-bold">~ </span>
                                                {t('waitingForInput')}
                                                <span className="inline-block w-2 h-4 bg-blue-500/50 animate-pulse ml-1" />
                                            </div>
                                        </motion.div>
                                    )}
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex flex-col gap-1"
                                        >
                                            {msg.type === "status" && <span className="text-blue-400">➜ {msg.message}</span>}
                                            {msg.type === "done" && <span className="text-green-400">➜ {msg.message}</span>}
                                            {msg.type === "error" && <span className="text-red-400">➜ Error: {msg.message}</span>}

                                            {msg.type === "update" && (
                                                <div className="pl-4 border-l-2 border-white/5 py-1">
                                                    <span className="text-indigo-400 font-bold">[{msg.node}]</span>
                                                    {msg.tool_calls && msg.tool_calls.length > 0 ? (
                                                        <div className="text-slate-400 mt-1">
                                                            Calling tool: <span className="text-yellow-400/80">{msg.tool_calls[0].name}</span>()
                                                        </div>
                                                    ) : msg.content ? (
                                                        <div className="text-slate-300 mt-1 whitespace-pre-wrap">
                                                            {msg.content.substring(0, 150)}{msg.content.length > 150 ? "..." : ""}
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-500 mt-1 italic">
                                                            {t('processing')}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {isAnalyzing && (
                                    <div className="flex items-center gap-2 text-blue-400 opacity-70">
                                        <span className="animate-pulse">_</span>
                                    </div>
                                )}
                                <div ref={terminalEndRef} />
                            </div>
                        </div>

                        {/* Results Grid */}
                        <div className="flex flex-col gap-6">

                            {/* Status Overview Card */}
                            <div className="rounded-2xl bg-gradient-to-br from-[#111113] to-[#151518] border border-white/10 p-8 shadow-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-blue-500/5" />
                                <div className="relative flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                            <Activity className="w-6 h-6 text-blue-400" />
                                            {t('liveExecutionStatus')}
                                        </h3>
                                        <p className="text-slate-400 mt-2 text-sm">
                                            {t('watchAgentsDebate')}
                                        </p>
                                    </div>

                                    <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${isAnalyzing ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'} `}>
                                        {isAnalyzing ? t('analysisInProgress') : t('ready')}
                                    </div>
                                </div>

                                {/* Active Agent Pulse */}
                                {activeNode && isAnalyzing && (
                                    <div className="mt-8 flex items-center gap-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-ping" />
                                            <Cpu className="w-8 h-8 text-indigo-400 relative z-10" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-indigo-400 uppercase tracking-wider">{t('activeAgent')}</div>
                                            <div className="text-lg text-white font-semibold">{activeNode}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Live Agent Thoughts (Collapsible) */}
                                {messages.length > 0 && (
                                    <div className="mt-8 border border-white/10 rounded-xl overflow-hidden bg-[#1A1A1D]">
                                        <button
                                            onClick={() => setShowThoughts(!showThoughts)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors focus:outline-none"
                                        >
                                            <div className="flex items-center gap-2">
                                                <BrainCircuit className="w-5 h-5 text-purple-400" />
                                                <span className="font-semibold text-slate-200">{t('liveAgentThoughts')}</span>
                                                {isAnalyzing && (
                                                    <span className="flex h-2 w-2 relative ml-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            {showThoughts ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                        </button>

                                        <AnimatePresence>
                                            {showThoughts && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-white/5"
                                                >
                                                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-4 font-mono text-sm scrollbar-thin scrollbar-thumb-white/10">
                                                        {messages.filter(m => m.type === "update").map((msg, idx) => (
                                                            <div key={idx} className="bg-[#111113] p-3 rounded-lg border border-white/5">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded">
                                                                        {msg.node}
                                                                    </span>
                                                                </div>
                                                                {msg.tool_calls && msg.tool_calls.length > 0 ? (
                                                                    <div className="text-yellow-400/90 text-xs">
                                                                        &gt; Executing tool: <span className="font-semibold">{msg.tool_calls[0].name}</span>(...)
                                                                    </div>
                                                                ) : msg.content ? (
                                                                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed opacity-90">
                                                                        {msg.content}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-slate-500 italic">
                                                                        {t('processing')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {messages.filter(m => m.type === "update").length === 0 && (
                                                            <div className="text-slate-500 italic text-center py-4">{t('waitingForThoughts')}</div>
                                                        )}
                                                        <div ref={thoughtsEndRef} />
                                                    </div >
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Final Decision Area */}
                            {finalDecision && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    className="lg:col-span-2 flex-1 rounded-2xl bg-[#111113] border border-blue-500/20 p-8 shadow-xl shadow-blue-900/10 flex flex-col"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-2xl text-white font-bold flex items-center gap-3">
                                            <ShieldAlert className="w-7 h-7 text-blue-500" />
                                            {t('finalTradingPlan')}
                                        </h3>
                                        <button
                                            onClick={handleDownloadPDF}
                                            disabled={isExportingPDF}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors text-sm font-medium border border-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isExportingPDF ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                            {isExportingPDF ? t('exporting') : t('downloadPdf')}
                                        </button>
                                    </div>
                                    <div ref={pdfContentRef} className="prose prose-invert prose-blue max-w-none text-slate-300">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {finalDecision}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            )}

                            {!finalDecision && !isAnalyzing && messages.length > 0 && (
                                <div className="flex-1 rounded-2xl border border-dashed border-white/20 flex items-center justify-center text-slate-500 min-h-[300px]">
                                    {t('analysisResultWillAppearHere')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
