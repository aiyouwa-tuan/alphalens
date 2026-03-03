'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

interface FilterItem {
    id: string; // Ticker e.g., TSLA
    name?: string; // Optional display name if not translated
    keywords: string[];
}

interface ManageFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterItem[];
    onAdd: (filter: FilterItem) => void;
    onDelete: (id: string) => void;
}

export default function ManageFiltersModal({ isOpen, onClose, filters, onAdd, onDelete }: ManageFiltersModalProps) {
    const { t, language } = useLanguage();
    const [newName, setNewName] = useState('');
    const [newId, setNewId] = useState('');
    const [newKeywords, setNewKeywords] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Debounce timer ref
    const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

    if (!isOpen) return null;

    const cleanCompanyName = (name: string) => {
        if (!name) return '';
        // Remove common suffixes
        return name
            .replace(/,?\s*Inc\.?$/i, '')
            .replace(/,?\s*Corp\.?$/i, '')
            .replace(/,?\s*Corporation$/i, '')
            .replace(/,?\s*Ltd\.?$/i, '')
            .replace(/,?\s*Limited$/i, '')
            .replace(/,?\s*Co\.?$/i, '')
            .replace(/,?\s*Company$/i, '')
            .replace(/,?\s*PLC$/i, '')
            .replace(/,?\s*NV$/i, '')
            .replace(/,?\s*SA$/i, '')
            .replace(/\s+-\s+.*$/, '') // Remove " - Class A" etc
            .trim();
    };

    // Smart Auto-fill Logic
    const performSearch = async (query: string, type: 'name' | 'id') => {
        if (!query || query.length < 2) return;

        setIsSearching(true);
        try {
            // Map simple lang code to Yahoo locale format
            const locale = language === 'zh' ? 'zh-CN' : 'en-US';
            const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}&lang=${locale}`);
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                const bestMatch = data.results[0];
                const cleanedName = cleanCompanyName(bestMatch.name);

                // Aggressively auto-fill fields based on search type
                if (type === 'name') {
                    // Update ID if we found a good match for the name
                    setNewId(bestMatch.symbol);
                    setNewKeywords(generateKeywords(bestMatch, cleanedName));
                } else if (type === 'id') {
                    // Update Name if we found a match for the ID
                    setNewName(cleanedName);
                    setNewKeywords(generateKeywords(bestMatch, cleanedName));
                }
            }
        } catch (error) {
            console.error("Auto-fill search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const generateKeywords = (match: any, cleanedName: string) => {
        const parts = [
            cleanedName,
            match.symbol,
            match.name !== cleanedName ? match.name : null,
            cleanedName.split(' ')[0] // First word of company name
        ];
        // Remove duplicates and joins
        const unique = [...new Set(parts.filter(Boolean))];
        return unique.join(', ');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewName(val);

        // Debounce search
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            if (val && !newId) performSearch(val, 'name');
        }, 800);
    };

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // FORCE UPPERCASE
        const val = e.target.value.toUpperCase();
        setNewId(val);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            // Call search with the uppercase value
            if (val && !newName) performSearch(val, 'id');
        }, 800);
    };

    const handleAdd = () => {
        if (!newId || !newId.trim()) return;

        const finalName = newName.trim() || newId.trim(); // Fallback to ID if name empty

        const keywordsArray = newKeywords
            ? newKeywords.split(',').map(k => k.trim()).filter(Boolean)
            : [newId, finalName].filter(Boolean);

        onAdd({
            id: newId.trim().toUpperCase(),
            name: finalName,
            keywords: keywordsArray
        });

        setNewName('');
        setNewId('');
        setNewKeywords('');
    };

    const isAddDisabled = !newId || isSearching || (newId.length > 0 && isSearching);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">{t('manageFilters')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* List */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">{t('currentFilters')}</h3>
                        <div className="space-y-2">
                            {filters.map(filter => (
                                <div key={filter.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 truncate max-w-[200px]" title={filter.name}>
                                            {filter.name || t(`filter_${filter.id}` as any) || filter.id}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">{filter.id}</span>
                                    </div>
                                    {filter.id !== 'all' && (
                                        <button
                                            onClick={() => onDelete(filter.id)}
                                            className="text-[var(--color-danger-text)] hover:bg-white p-1.5 rounded transition-colors text-sm font-medium"
                                        >
                                            {t('delete')}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add New */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                        {isSearching && (
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <span className="text-xs text-blue-600 animate-pulse">Searching...</span>
                                <span className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full block"></span>
                            </div>
                        )}
                        <h3 className="text-sm font-semibold text-blue-600 mb-4 uppercase tracking-wider">{t('addCompany')}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">{t('companyName')}</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={handleNameChange}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-blue-600 outline-none"
                                        placeholder="Tesla"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">{t('tickerSymbol')}</label>
                                    <input
                                        type="text"
                                        value={newId}
                                        onChange={handleIdChange}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-blue-600 outline-none font-mono"
                                        placeholder="TSLA"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">{t('keywords')}</label>
                                <input
                                    type="text"
                                    value={newKeywords}
                                    onChange={e => setNewKeywords(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-blue-600 outline-none"
                                    placeholder="Musk, EV, Electric..."
                                />
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={isAddDisabled}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {isSearching ? (
                                    <>
                                        <span className="animate-spin h-3 w-3 border-2 border-white/50 border-t-white rounded-full"></span>
                                        Processing...
                                    </>
                                ) : (
                                    t('add')
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
