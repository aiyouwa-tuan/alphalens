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

                // Only auto-fill empty fields or fields not manually edited recently (simplification: just fill if empty)
                if (type === 'name') {
                    if (!newId) setNewId(bestMatch.symbol);
                    if (!newKeywords) setNewKeywords(generateKeywords(bestMatch, cleanedName));
                } else if (type === 'id') {
                    // Update name if empty OR if it matches the ID (user typed ID in name field?) - no, just if empty for now
                    if (!newName) setNewName(cleanedName);
                    if (!newKeywords) setNewKeywords(generateKeywords(bestMatch, cleanedName));
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
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)]">
                    <h2 className="text-xl font-bold text-white">{t('manageFilters')}</h2>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* List */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">{t('currentFilters')}</h3>
                        <div className="space-y-2">
                            {filters.map(filter => (
                                <div key={filter.id} className="flex justify-between items-center bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border-subtle)]">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white truncate max-w-[200px]" title={filter.name}>
                                            {filter.name || t(`filter_${filter.id}` as any) || filter.id}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)] font-mono">{filter.id}</span>
                                    </div>
                                    {filter.id !== 'all' && (
                                        <button
                                            onClick={() => onDelete(filter.id)}
                                            className="text-[var(--color-danger-text)] hover:bg-[var(--bg-panel)] p-1.5 rounded transition-colors text-sm font-medium"
                                        >
                                            {t('delete')}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add New */}
                    <div className="bg-[var(--bg-subtle)]/50 p-4 rounded-xl border border-[var(--border-subtle)] relative">
                        {isSearching && (
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <span className="text-xs text-[var(--text-accent)] animate-pulse">Searching...</span>
                                <span className="animate-spin h-4 w-4 border-2 border-[var(--text-accent)] border-t-transparent rounded-full block"></span>
                            </div>
                        )}
                        <h3 className="text-sm font-semibold text-[var(--text-accent)] mb-4 uppercase tracking-wider">{t('addCompany')}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('companyName')}</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={handleNameChange}
                                        className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--text-accent)] outline-none"
                                        placeholder="Tesla"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('tickerSymbol')}</label>
                                    <input
                                        type="text"
                                        value={newId}
                                        onChange={handleIdChange}
                                        className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--text-accent)] outline-none font-mono"
                                        placeholder="TSLA"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('keywords')}</label>
                                <input
                                    type="text"
                                    value={newKeywords}
                                    onChange={e => setNewKeywords(e.target.value)}
                                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--text-accent)] outline-none"
                                    placeholder="Musk, EV, Electric..."
                                />
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={isAddDisabled}
                                className="w-full py-2 bg-[var(--text-accent)] hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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
