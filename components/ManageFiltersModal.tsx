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
    const { t } = useLanguage();
    const [newName, setNewName] = useState('');
    const [newId, setNewId] = useState('');
    const [newKeywords, setNewKeywords] = useState('');

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!newId || !newId.trim()) return;

        // Auto-generate keywords if empty? No, require at least one or default to ID.
        const keywordsArray = newKeywords
            ? newKeywords.split(',').map(k => k.trim()).filter(Boolean)
            : [newId, newName].filter(Boolean);

        onAdd({
            id: newId.trim().toUpperCase(),
            name: newName.trim(),
            keywords: keywordsArray
        });

        // Reset form
        setNewName('');
        setNewId('');
        setNewKeywords('');
    };

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
                                        <span className="font-bold text-white">{filter.name || t(`filter_${filter.id}` as any) || filter.id}</span>
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
                    <div className="bg-[var(--bg-subtle)]/50 p-4 rounded-xl border border-[var(--border-subtle)]">
                        <h3 className="text-sm font-semibold text-[var(--text-accent)] mb-4 uppercase tracking-wider">{t('addCompany')}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('companyName')}</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--text-accent)] outline-none"
                                        placeholder="Tesla"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">{t('tickerSymbol')}</label>
                                    <input
                                        type="text"
                                        value={newId}
                                        onChange={e => setNewId(e.target.value)}
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
                                disabled={!newId}
                                className="w-full py-2 bg-[var(--text-accent)] hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('add')}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
