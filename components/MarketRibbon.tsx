'use client';

import React from 'react';
import { useLanguage } from '@/components/LanguageProvider';

export default function MarketRibbon() {
    const { t } = useLanguage();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Indices */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-lg p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-wider uppercase">{t('globalIndices')}</h3>
                    <span className="text-[10px] text-[var(--text-secondary)]">{t('realTime')}</span>
                </div>
                {/* ... */}
            </div>

            {/* Crypto */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-lg p-5">
                <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-wider uppercase mb-4">{t('cryptoAssets')}</h3>
                {/* ... */}
            </div>

            {/* Tech */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-lg p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-wider uppercase">{t('blueChipsTech')}</h3>
                    <span className="text-[10px] text-[var(--text-secondary)]">{t('realTime')}</span>
                </div>
                {/* ... */}
            </div>
        </div>
    );
}
