"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, ArrowRight, Loader2, Download, Square, BarChart2, FileText, History, Clock, TrendingUp, Zap, Search, LogIn } from "lucide-react";
import { useRouter } from 'next/navigation';
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
    taskId?: string; // Newly added to connect to background streams
    markdown?: string;
    market_report?: string;
    sentiment_report?: string;
    fundamentals_report?: string;
    technical_report?: string;
    news_report?: string;
}

/**
 * Sanitizes the raw content from the backend.
 * The backend (Python) may return content in one of these formats:
 * 1. A plain string (ideal)
 * 2. A Python list repr: "[{'type': 'text', 'text': 'actual content...'}]"
 * 3. A string with literal "\\n" instead of real newlines
 */
const cleanContent = (raw: any): string => {
    if (!raw) return '';

    let text = typeof raw === 'string' ? raw : JSON.stringify(raw);

    // Convert literal escape sequences to real characters properly right away
    text = text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"');

    // Often the Python list string representation creates strings like:
    // "Neutral Analyst: [{'type': 'text', 'text': 'HERE IS TEXT', 'extras': ...}]"
    // To handle multiple blocks properly without regex mismatches over newlines, we parse it manually.
    let result = "";

    // Look for occurrences of `[{` and `text': '`
    const arrayStartPattern = "[{";
    const textKeyPattern1 = "'text': '";
    const textKeyPattern2 = "'text': \"";

    let currentIndex = 0;
    while (currentIndex < text.length) {
        let blockStartIndex = text.indexOf(arrayStartPattern, currentIndex);
        if (blockStartIndex === -1) {
            // No more arrays, append the rest
            result += text.substring(currentIndex);
            break;
        }

        // Append prefix (like "Neutral Analyst: ")
        result += text.substring(currentIndex, blockStartIndex);

        let singleQuoteIndex = text.indexOf(textKeyPattern1, blockStartIndex);
        let doubleQuoteIndex = text.indexOf(textKeyPattern2, blockStartIndex);

        let textValStart = -1;
        let quoteType = '';

        if (singleQuoteIndex !== -1 && (doubleQuoteIndex === -1 || singleQuoteIndex < doubleQuoteIndex)) {
            textValStart = singleQuoteIndex + textKeyPattern1.length;
            quoteType = "'";
        } else if (doubleQuoteIndex !== -1) {
            textValStart = doubleQuoteIndex + textKeyPattern2.length;
            quoteType = '"';
        }

        if (textValStart === -1) {
            // Broken format or empty array `[]`
            // Just skip past it
            let arrayEndIndex = text.indexOf("]", blockStartIndex);
            if (arrayEndIndex !== -1) {
                currentIndex = arrayEndIndex + 1;
                continue;
            } else {
                result += text.substring(blockStartIndex);
                break;
            }
        }

        // Find the END of the text content safely
        // It ends at `, 'extras':` or `}]`
        let endIdx1 = text.indexOf("', '", textValStart);
        let endIdx1_2 = text.indexOf("\", '", textValStart);
        let endIdx1_3 = text.indexOf("', \"", textValStart);
        let endIdx1_4 = text.indexOf("\", \"", textValStart);
        let endIdx2 = text.indexOf("'}]", textValStart);
        let endIdx2_2 = text.indexOf("\"}]", textValStart);
        let endIdx3 = text.indexOf("'},", textValStart);
        let endIdx3_2 = text.indexOf("\"},", textValStart);

        let possibleEnds = [endIdx1, endIdx1_2, endIdx1_3, endIdx1_4, endIdx2, endIdx2_2, endIdx3, endIdx3_2].filter(idx => idx !== -1);

        if (possibleEnds.length > 0) {
            let actualEndIdx = Math.min(...possibleEnds);
            result += text.substring(textValStart, actualEndIdx);

            // Fast forward past the end of this array
            let arrayEndIndex = text.indexOf("]", actualEndIdx);
            if (arrayEndIndex !== -1) {
                currentIndex = arrayEndIndex + 1;
            } else {
                currentIndex = actualEndIdx;
            }
        } else {
            // Fallback if no matching end found
            result += text.substring(textValStart);
            break;
        }
    }

    return result.trim();
};
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
    const { t, language } = useLanguage();
    const router = useRouter();
    const [ticker, setTicker] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [activeNode, setActiveNode] = useState<string | null>(null);
    const [finalDecision, setFinalDecision] = useState<string | null>(null); // Changed to state variable
    const [showThoughts, setShowThoughts] = useState(true); // New state variable
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Limit State (per-account)
    const [limitData, setLimitData] = useState<{ loggedIn: boolean, used: number, total: number }>({ loggedIn: false, used: 0, total: 3 });

    // History State
    const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);

    // Fetch per-account limits from Next.js API
    const fetchLimit = async () => {
        try {
            const res = await fetch('/api/analysis/limit');
            if (res.ok) {
                const data = await res.json();
                setLimitData({ loggedIn: data.loggedIn, used: data.used, total: data.total });
            }
        } catch (e) {
            console.error("Failed to fetch limit:", e);
        }
    };

    useEffect(() => {
        fetchLimit();
    }, []);

    const processStream = async (taskId: string, historyId: string, signal: AbortSignal) => {
        let currentMarkdown = ""; // Track for history saving
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const response = await fetch(`${backendUrl}/api/debate/stream/${taskId}`, { signal });
            if (!response.body) throw new Error("No stream body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunkStr = decoder.decode(value, { stream: true });
                buffer += chunkStr;

                const parts = buffer.split(/\r?\n\r?\n/);
                buffer = parts.pop() || "";

                for (const block of parts) {
                    const trimmedBlock = block.trim();
                    if (trimmedBlock.startsWith("data: ")) {
                        try {
                            const dataStr = trimmedBlock.replace(/^data:\s*/, "");
                            const data = JSON.parse(dataStr) as AgentMessage;

                            setMessages((prev) => [...prev, data]);

                            if (data.node) setActiveNode(data.node);
                            if (data.final_trade_decision) {
                                const cleaned = cleanContent(data.final_trade_decision);
                                currentMarkdown = cleaned;
                                setFinalDecision(cleaned);
                            }
                            if (data.type === "done" || data.type === "error") {
                                setIsAnalyzing(false);
                                setActiveNode(null);
                                fetchLimit();

                                setHistory(prev => {
                                    const updated = prev.map(item =>
                                        item.id === historyId
                                            ? {
                                                ...item,
                                                status: (data.type === 'error' ? 'error' : 'completed') as 'error' | 'completed',
                                                endTime: new Date().toLocaleString('zh-CN', { hour12: false }),
                                                markdown: data.type === 'error' ? item.markdown : currentMarkdown,
                                                market_report: data.market_report || item.market_report,
                                                sentiment_report: data.sentiment_report || item.sentiment_report,
                                                fundamentals_report: data.fundamentals_report || item.fundamentals_report,
                                                technical_report: data.content || item.technical_report, // Technical might be passed as content
                                                news_report: data.news_report || item.news_report
                                            }
                                            : item
                                    );
                                    saveHistory(updated);
                                    return updated;
                                });
                            }
                        } catch (err) {
                            console.error("Failed to parse SSE chunk:", trimmedBlock, err);
                        }
                    } else if (trimmedBlock.startsWith("{") && trimmedBlock.includes('"error"')) {
                        try {
                            const errData = JSON.parse(trimmedBlock);
                            setMessages(prev => [...prev, { type: "error", message: errData.error }]);
                            setIsAnalyzing(false);
                            setActiveNode(null);
                            fetchLimit();

                            setHistory(prev => {
                                const updated = prev.map(item =>
                                    item.id === historyId
                                        ? { ...item, status: 'error' as const, endTime: new Date().toLocaleString('zh-CN', { hour12: false }) }
                                        : item
                                );
                                saveHistory(updated);
                                return updated;
                            });
                        } catch (e) {
                            console.error("Failed parsing error block", e);
                        }
                    }
                }
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                console.error("Stream reader error:", e);
            }
        }
    };

    // Load history from database on mount and resume any disconnected 'running' tasks
    useEffect(() => {
        const loadDbHistory = async () => {
            try {
                // One-time migration for old users
                const saved = localStorage.getItem('alphalens_analysis_history');
                if (saved) {
                    try {
                        const localHistory = JSON.parse(saved);
                        if (Array.isArray(localHistory) && localHistory.length > 0) {
                            await fetch('/api/analysis/history', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(localHistory)
                            });
                        }
                        localStorage.removeItem('alphalens_analysis_history'); // Delete it so it doesn't trigger again
                    } catch (e) {
                        console.error("Migration error:", e);
                    }
                }

                const res = await fetch('/api/analysis/history');
                if (res.ok) {
                    const savedHistory: AnalysisHistoryItem[] = await res.json();
                    setHistory(savedHistory);

                    // Auto-resume background task if we find one in 'running' state
                    const activeTask = savedHistory.find(h => h.status === 'running' && h.taskId);
                    if (activeTask) {
                        console.log("Resuming background task:", activeTask.taskId);
                        setTicker(activeTask.ticker);
                        setIsAnalyzing(true);
                        setMessages([]);

                        abortControllerRef.current = new AbortController();
                        processStream(activeTask.taskId!, activeTask.id, abortControllerRef.current.signal);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch history from database", e);
            }
        };
        loadDbHistory();
    }, []);

    // Helper to completely sync history to state and database
    const saveHistory = async (newHistory: AnalysisHistoryItem[]) => {
        setHistory(newHistory);
        try {
            await fetch('/api/analysis/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newHistory)
            });
        } catch (error) {
            console.error('Failed to sync history to database', error);
        }
    };

    const clearHistory = async () => {
        setHistory([]);
        try {
            await fetch('/api/analysis/history', { method: 'DELETE' });
        } catch (error) {
            console.error('Failed to clear history in database', error);
        }
    };

    const loadHistoryItem = (item: AnalysisHistoryItem) => {
        if (item.markdown) {
            setFinalDecision(item.markdown);
            setTicker(item.ticker);
            setIsAnalyzing(false);
            setActiveNode(null);
            setShowThoughts(false);

            // Re-populate the original raw agent messages for the appendix if they exist
            const oldMessages: AgentMessage[] = [];
            if (item.market_report) oldMessages.push({ type: 'update', market_report: item.market_report });
            if (item.fundamentals_report) oldMessages.push({ type: 'update', fundamentals_report: item.fundamentals_report });
            if (item.news_report) oldMessages.push({ type: 'update', news_report: item.news_report });
            if (item.sentiment_report) oldMessages.push({ type: 'update', sentiment_report: item.sentiment_report });
            if (item.technical_report) oldMessages.push({ type: 'update', content: item.technical_report });

            setMessages(oldMessages);
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
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Noto Sans SC', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif;
                            line-height: 1.8;
                            color: #1e293b;
                            padding: 48px;
                            max-width: 820px;
                            margin: 0 auto;
                            font-size: 15px;
                            word-break: break-all;
                            white-space: pre-wrap;
                        }
                        h1 { font-size: 28px; color: #0f172a; margin-bottom: 32px; border-bottom: 3px solid #0066FF; padding-bottom: 16px; }
                        h2 { font-size: 20px; color: #1e293b; margin-top: 2em; margin-bottom: 0.75em; border-left: 4px solid #0066FF; padding-left: 12px; }
                        h3, h4 { color: #334155; margin-top: 1.5em; margin-bottom: 0.5em; }
                        p { margin-bottom: 1em; }
                        strong { color: #0f172a; font-weight: 700; }
                        ul, ol { margin-bottom: 1em; padding-left: 2em; }
                        li { margin-bottom: 0.4em; }
                        hr { border: 0; border-top: 1px solid #e2e8f0; margin: 2em 0; }
                        blockquote { border-left: 4px solid #cbd5e1; padding-left: 1em; margin-left: 0; color: #64748b; background: #f8fafc; padding: 12px 16px; border-radius: 4px; }
                        table { width: 100%; border-collapse: collapse; margin: 1em 0; }
                        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
                        th { background: #f1f5f9; font-weight: 600; }
                        code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
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
            console.log("Aborting current fetch request...");
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        // Force the UI elements to stop resolving regardless of backend disconnect success
        setIsAnalyzing(false);
    };
    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker) return;

        // Check login and increment usage
        if (!limitData.loggedIn) {
            alert('请先登录后再使用 AI 分析功能。\n点击右上角登录按钮即可登录。');
            return;
        }

        try {
            const limitRes = await fetch('/api/analysis/limit', { method: 'POST' });
            const limitResult = await limitRes.json();
            if (!limitRes.ok) {
                alert(limitResult.error || '分析次数已用完');
                setLimitData(prev => ({ ...prev, used: limitResult.used ?? prev.used }));
                return;
            }
            setLimitData(prev => ({ ...prev, used: limitResult.used, total: limitResult.total }));
        } catch (e) {
            console.error('Limit check failed:', e);
        }

        setIsAnalyzing(true);
        setMessages([]);
        setActiveNode(null);
        setFinalDecision(null);
        setShowThoughts(true);

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
                        setTicker(resolvedTicker);
                    }
                }
            } catch (searchErr) {
                console.warn("Failed to resolve ticker via search API:", searchErr);
            }

            const payload = {
                ticker: resolvedTicker,
                provider: "google",
                model: "gemini-3-pro-preview",
                api_key: ""
            };

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

            // 1. Kick off background task
            const startRes = await fetch(`${backendUrl}/api/debate/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!startRes.ok) throw new Error("Failed to start task");

            const startData = await startRes.json();
            if (startData.error) {
                setMessages([{ type: "error", message: startData.error }]);
                setIsAnalyzing(false);
                return;
            }

            const remoteTaskId = startData.task_id;

            // 2. Log to history *after* getting real task id
            const nowTime = new Date().toLocaleString('zh-CN', { hour12: false });
            setHistory(prev => {
                const updated = [{
                    id: newHistoryId,
                    taskId: remoteTaskId,
                    ticker: resolvedTicker,
                    startTime: nowTime,
                    timestamp: nowTime,
                    status: 'running' as const
                }, ...prev].slice(0, 50);
                localStorage.setItem('alphalens_analysis_history', JSON.stringify(updated));
                return updated;
            });

            // 3. Connect to the stream
            abortControllerRef.current = new AbortController();
            await processStream(remoteTaskId, newHistoryId, abortControllerRef.current.signal);

        } catch (error: any) {
            if (error.name !== "AbortError") {
                console.error("Starting Analysis error:", error);
                setMessages((prev) => [...prev, { type: "error", message: `分析失败: ${error.message}` }]);
                setIsAnalyzing(false);
                setActiveNode(null);

                setHistory(prev => {
                    const updated = prev.map(item =>
                        item.id === newHistoryId
                            ? { ...item, status: 'error' as const, endTime: new Date().toLocaleString('zh-CN', { hour12: false }) }
                            : item
                    );
                    saveHistory(updated);
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

                    <p className="text-lg text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed font-medium whitespace-pre-line text-balance">
                        {t("analysisHeroSubtitle")}
                    </p>

                    {/* Search Bar matching Figma */}
                    <div className="w-full max-w-xl">
                        <form onSubmit={handleAnalyze} className="relative group flex items-center bg-white border border-slate-200 shadow-lg shadow-slate-200/50 rounded-2xl p-2 transition-all hover:shadow-xl hover:border-slate-300">
                            <div className="pl-4 pr-3 text-slate-400">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                className="flex-1 bg-transparent text-slate-900 text-lg focus:outline-none placeholder-slate-400 font-medium h-12"
                                placeholder={t("enterTicker")}
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value)}
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
                                    disabled={!ticker.trim() || !limitData.loggedIn || limitData.used >= limitData.total}
                                    className="px-6 py-3 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
                                >
                                    {t("analyzeNowBtn")}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </form>
                        <div className="mt-5 flex justify-center w-full">
                            {!limitData.loggedIn ? (
                                <button
                                    onClick={() => router.push('/login')}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-semibold text-sm hover:bg-amber-100 transition-colors cursor-pointer shadow-sm"
                                >
                                    <LogIn className="w-4 h-4" />
                                    {language === 'zh' ? '请先登录后使用 AI 分析功能' : 'Please log in to use AI analysis'}
                                </button>
                            ) : (
                                <div className="inline-flex items-center justify-center gap-3 px-5 py-2 rounded-full border border-blue-200/50 bg-white/60 backdrop-blur-md shadow-sm">
                                    <span className="text-sm font-semibold text-slate-600">
                                        {language === 'zh' ? '今日额度: ' : 'Daily Limit: '}
                                        <span className="text-slate-900 mx-1">{limitData.total}</span>
                                        {language === 'zh' ? '次' : ''}
                                    </span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                    <span className="text-sm font-semibold text-slate-600">
                                        {language === 'zh' ? '已使用: ' : 'Used: '}
                                        <span className="text-slate-900 mx-1">{limitData.used}</span>
                                        {language === 'zh' ? '次' : ''}
                                    </span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                    <span className={`text-sm font-semibold ${limitData.used >= limitData.total ? 'text-red-500' : 'text-blue-600'}`}>
                                        {language === 'zh' ? '还剩: ' : 'Remaining: '}
                                        <span className={`mx-1 ${limitData.used >= limitData.total ? 'text-red-600' : 'text-blue-700'}`}>{Math.max(0, limitData.total - limitData.used)}</span>
                                        {language === 'zh' ? '次' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
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

                {/* Grid Layout strictly for active analysis, results, or idle feature cards */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 max-w-6xl mx-auto">

                    {/* LEFT COLUMN: HISTORY / WATCHLIST (Always visible) */}
                    <div className="lg:col-span-3 flex flex-col gap-6 relative">
                        <div className="bg-white border border-slate-200 rounded-[20px] flex flex-col shadow-sm sticky top-24 w-full h-[600px] overflow-hidden">
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
                                            className={`w-full bg-white border ${h.taskId && h.status === 'running' ? 'border-blue-400 shadow-blue-100/50' : 'border-slate-200'} p-4 rounded-xl text-left hover:border-blue-300 hover:shadow-md transition-all group duration-200`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-slate-800 tracking-tight text-lg">{h.ticker}</span>
                                                <div className="text-xs text-slate-400 font-medium flex flex-col items-end">
                                                    <span>{new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                    <span className="text-[10.5px] mt-0.5 text-slate-500">
                                                        {language === 'zh' ? '开始' : 'Start'} {new Date(h.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                        {h.endTime ? ` | ${language === 'zh' ? '完成' : 'End'} ${new Date(h.endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}` : ` | ${language === 'zh' ? '处理中...' : 'Running...'}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed group-hover:text-slate-600 transition-colors">
                                                {h.status === 'running'
                                                    ? <span className="flex items-center gap-1 text-blue-500"><Loader2 className="w-3 h-3 animate-spin" /> {language === 'zh' ? '正在处理分析数据...' : 'Processing analysis...'}</span>
                                                    : (h.markdown?.substring(0, 80) ?? '...')}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: MAIN RESULTS OR FEATURE CARDS */}
                    <div className="lg:col-span-9 flex flex-col gap-6">

                        {/* 3 Overview Cards - (Shown when idle matching Figma bottom half) */}
                        {!isAnalyzing && !finalDecision && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                        {/* Elegant Progress/Loading State */}
                        {isAnalyzing && !finalDecision && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[24px] border border-blue-100 p-12 shadow-xl shadow-blue-500/5 flex flex-col items-center justify-center min-h-[420px]"
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
                                <div ref={pdfContentRef} className="p-8 prose prose-slate max-w-none text-slate-700 bg-white rounded-b-[20px] break-words whitespace-pre-wrap">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {finalDecision}
                                    </ReactMarkdown>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
