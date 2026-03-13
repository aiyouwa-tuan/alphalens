export type Language = 'en' | 'zh';

export const translations = {
    en: {
        // Layout
        dashboard: "Dashboard",
        analytics: "Analytics",
        portfolio: "Portfolio",
        news: "News",
        sandbox: "Sandbox",
        settings: "Settings",
        logout: "Logout",

        // TopBar
        globalOverview: "Global Overview",
        newOrder: "+ New Order",
        loadingMarket: "Loading market data...",

        // Widgets
        portfolioPerformance: "PORTFOLIO PERFORMANCE",
        totalEquity: "TOTAL EQUITY",
        allTime: "All Time",
        liveMarketNews: "LIVE MARKET NEWS",
        viewAll: "View All",
        macroIndicators: "MACRO INDICATORS",
        globalIndices: "GLOBAL INDICES",
        cryptoAssets: "CRYPTO ASSETS",
        blueChipsTech: "BLUE CHIPS & TECH",

        // Watchlist
        saveChanges: "Save Changes",
        activePositions: "Active Positions",
        manage: "Manage",
        watchlist: "Watchlist",
        asset: "Asset",
        price: "Price",
        qty: "Qty",
        value: "Value",
        pl: "P/L",

        // Auth
        login: "Login",
        welcomeBack: "Welcome back",

        // Market Status
        realTime: "Real-time",
        closed: "Closed",

        // News
        loadingNews: "Loading news...",
        noNews: "No news available.",
        noPositions: "No positions open.",
        noData: "No data available",
        loadingCrypto: "Loading Crypto...",

        // Market Symbols
        "^TNX": "10Y Treasury",
        "CL=F": "Crude Oil",
        "GC=F": "Gold",
        "^VIX": "VIX",
        "DX-Y.NYB": "Dollar Index",
        "^DJI": "Dow Jones",
        "^IXIC": "Nasdaq",
        "^GSPC": "S&P 500",
        "^HSI": "Hang Seng",

        // News Page
        marketHeadlines: "Market Headlines",
        newsSubtitle: "Real-time intelligence from global sources (Situation Monitor)",
        backToDashboard: "← Back to Dashboard",
        marketFocus: "Market Focus",
        loadingLatestNews: "Loading latest news...",
        noRecentNews: "No recent news mentions found for",
        readSource: "Read source",

        // Filters
        filter_all: "General",
        filter_TSM: "TSM",
        filter_AAPL: "Apple",
        filter_TSLA: "Tesla",
        filter_NVDA: "NVIDIA",
        filter_MSFT: "Microsoft",
        filter_AMZN: "Amazon",
        filter_GOOG: "Google",
        filter_META: "Meta",

        // Manage Filters Modal
        manageFilters: "Manage Feed Filters",
        addCompany: "Add New Company",
        companyName: "Company Name (e.g. Tesla)",
        tickerSymbol: "Ticker/ID (e.g. TSLA)",
        keywords: "Keywords (comma separated)",
        add: "Add",
        delete: "Delete",
        close: "Close",
        currentFilters: "Current Filters",

        // Analysis Page
        analysisTitle: "Multi-Agent Deep Research",
        analysisSubtitle: "Input a stock ticker to unleash our autonomous team of AI analysts. They will debate market sentiment, technicals, and fundamentals to provide an objective trading signal.",
        enterTicker: "Enter Ticker (e.g. AAPL, NVDA, TENCENT)",
        analyzeBtn: "Analyze",
        stopBtn: "Stop",
        recentAnalyses: "Recent Analyses",
        clearHistory: "Clear History",
        noPastAnalyses: "No past analyses yet.",
        agentTerminal: "agent-terminal ~ zsh",
        waitingForInput: "Waiting for input...",
        processing: "(Processing...)",
        liveExecutionStatus: "Live Execution Status",
        watchAgentsDebate: "Watch the agents debate and form an investment plan.",
        analysisInProgress: "Analysis in Progress...",
        ready: "Ready",
        activeAgent: "Active Agent",
        liveAgentThoughts: "Live Agent Thoughts",
        waitingForThoughts: "Waiting for agent to produce analytical thoughts...",
        finalTradingPlan: "Final Trading Plan",
        exporting: "Exporting...",
        downloadPdf: "Download PDF",
        analysisResultWillAppearHere: "Analysis result will appear here.",
        statusMarketData: "Gathering market data and latest prices...",
        statusFundamentals: "Analyzing financial statements and company fundamentals...",
        statusSentiment: "Evaluating market sentiment and recent news...",
        statusTechnical: "Computing technical indicators and chart patterns...",
        statusRisk: "Assessing potential risks and sizing constraints...",
        statusPortfolio: "Synthesizing all analysis into a final trading plan...",
        statusProcessing: "Processing and analyzing data for optimal insights...",
        analyzingLabel: "Analyzing ",
        generatingReport: "Generating Report...",

        // Analysis Page Hero (Figma redesign)
        analysisHeroLabel: "Multi-Agent AI Analysis",
        analysisHeroTitle: "Institutional-Grade Stock Intelligence",
        analysisHeroSubtitle: "Four specialized AI agents — Technical, Fundamental, Macro, and Sentiment — debate every trade so you don't have to.",
        analyzeNowBtn: "Analyze Now",
        liveExecutionStatusBadge: "Live Execution Status",
        recentLabel: "Recent:",
        trendingLabel: "Trending:",
        featureCard1Title: "Multi-Agent Debate",
        featureCard1Desc: "4 specialized AI analysts debate every stock from all angles before reaching consensus.",
        featureCard2Title: "Technical Analysis",
        featureCard2Desc: "Price action, momentum indicators, chart patterns and volume analysis.",
        featureCard3Title: "Fundamental Research",
        featureCard3Desc: "Earnings quality, balance sheet health, valuation multiples and competitive moat."
    },
    zh: {
        // Layout
        dashboard: "仪表盘",
        analytics: "分析",
        portfolio: "投资组合",
        news: "新闻",
        sandbox: "沙盘",
        settings: "设置",
        logout: "退出登录",

        // TopBar
        globalOverview: "全球概览",
        newOrder: "+ 新建订单",
        loadingMarket: "正在加载市场数据...",

        // Widgets
        portfolioPerformance: "投资组合表现",
        totalEquity: "总权益",
        allTime: "历史累计",
        liveMarketNews: "实时市场新闻",
        viewAll: "查看全部",
        macroIndicators: "宏观指标",
        globalIndices: "全球指数",
        cryptoAssets: "加密资产",
        blueChipsTech: "蓝筹科技股",

        // Watchlist
        saveChanges: "保存更改",
        activePositions: "当前持仓",
        manage: "管理",
        watchlist: "自选股",
        asset: "资产",
        price: "价格",
        qty: "数量",
        value: "市值",
        pl: "盈亏",

        // Auth
        login: "登录",
        welcomeBack: "欢迎回来",

        // Market Status
        realTime: "实时",
        closed: "已收盘",

        // News
        loadingNews: "正在加载新闻...",
        noNews: "暂无新闻",
        noPositions: "暂无持仓",
        noData: "暂无数据",
        loadingCrypto: "正在加载加密货币...",

        // Market Symbols
        "^TNX": "10年期美债",
        "CL=F": "原油",
        "GC=F": "黄金",
        "^VIX": "恐慌指数",
        "DX-Y.NYB": "美元指数",
        "^DJI": "道琼斯",
        "^IXIC": "纳斯达克",
        "^GSPC": "标普500",
        "^HSI": "恒生指数",

        // News Page
        marketHeadlines: "市场头条",
        newsSubtitle: "来自全球资源的实时情报（态势监控）",
        backToDashboard: "← 返回仪表盘",
        marketFocus: "市场焦点",
        loadingLatestNews: "正在加载最新新闻...",
        noRecentNews: "未找到近期新闻：",
        readSource: "阅读原文",

        // Filters
        filter_all: "综合",
        filter_TSM: "台积电 (TSM)",
        filter_AAPL: "苹果 (Apple)",
        filter_TSLA: "特斯拉 (Tesla)",
        filter_NVDA: "英伟达 (NVIDIA)",
        filter_MSFT: "微软 (Microsoft)",
        filter_AMZN: "亚马逊 (Amazon)",
        filter_GOOG: "谷歌 (Google)",
        filter_META: "Meta",

        // Manage Filters Modal
        manageFilters: "管理新闻过滤器",
        addCompany: "添加新公司",
        companyName: "公司名称 (如: 特斯拉)",
        tickerSymbol: "代码/ID (如: TSLA)",
        keywords: "关键词 (逗号分隔)",
        add: "添加",
        delete: "删除",
        close: "关闭",
        currentFilters: "当前过滤器",

        // Analysis Page
        analysisTitle: "多智能体深度研究",
        analysisSubtitle: "输入股票代码，启动我们的自主AI分析师团队。他们将就市场情绪、技术面和基本面展开辩论，为您提供客观的交易信号。",
        enterTicker: "输入代码 (如: AAPL, NVDA, 腾讯)",
        analyzeBtn: "开始分析",
        stopBtn: "停止",
        recentAnalyses: "最近分析",
        clearHistory: "清除历史",
        noPastAnalyses: "暂无分析历史",
        agentTerminal: "agent-terminal ~ zsh",
        waitingForInput: "等待输入...",
        processing: "(处理中...)",
        liveExecutionStatus: "实时执行状态",
        watchAgentsDebate: "观看智能体进行辩论并制定投资计划",
        analysisInProgress: "分析进行中...",
        ready: "就绪",
        activeAgent: "当前工作节点",
        liveAgentThoughts: "实时智能体想法",
        waitingForThoughts: "等待智能体生成分析想法...",
        finalTradingPlan: "最终交易计划",
        exporting: "正在导出...",
        downloadPdf: "下载 PDF",
        analysisResultWillAppearHere: "分析结果将显示在这里。",
        statusMarketData: "正在收集市场数据和最新价格...",
        statusFundamentals: "正在分析财务报表和公司基本面...",
        statusSentiment: "正在评估市场情绪和近期新闻...",
        statusTechnical: "正在计算技术指标和图表形态...",
        statusRisk: "正在评估潜在风险和头寸限制...",
        statusPortfolio: "正在将所有分析综合成最终交易计划...",
        statusProcessing: "正在处理分析数据以获取最佳见解...",
        analyzingLabel: "正在分析 ",
        generatingReport: "正在生成报告...",

        // Analysis Page Hero (Figma redesign)
        analysisHeroLabel: "多智能体 AI 分析",
        analysisHeroTitle: "机构级股票研究平台",
        analysisHeroSubtitle: "四位专业 AI 分析师——技术面、基本面、宏观面和情绪面——替您辩论每一笔交易。",
        analyzeNowBtn: "立即分析",
        liveExecutionStatusBadge: "实时执行状态",
        recentLabel: "最近：",
        trendingLabel: "热门：",
        featureCard1Title: "多智能体辩论",
        featureCard1Desc: "4 位专业 AI 分析师从各个角度对每只股票展开辩论，最终达成共识。",
        featureCard2Title: "技术分析",
        featureCard2Desc: "价格走势、动量指标、图表形态和成交量分析。",
        featureCard3Title: "基本面研究",
        featureCard3Desc: "盈利质量、资产负债表健康状况、估值倍数和竞争护城河。"
    }
};
