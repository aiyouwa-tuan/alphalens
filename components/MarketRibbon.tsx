'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface MarketItem {
    symbol: string;
    price: number;
    changePercent: number;
}

interface MarketRibbonProps {
    items: MarketItem[];
    className?: string; // Allow custom classes
}

export default function MarketRibbon({ items, className }: MarketRibbonProps) {
    // If no items, provide fallback or hide
    if (!items || items.length === 0) return null;

    return (
        <div className={twMerge("w-full overflow-hidden bg-[var(--bg-panel)] border-b border-[var(--border-subtle)] py-2", className)}>
            <div className="flex animate-marquee whitespace-nowrap">
                {/* Double the list to create seamless loop effect */}
                {[...items, ...items].map((item, index) => (
                    <div key={`${item.symbol}-${index}`} className="flex items-center gap-2 mx-6 text-sm font-mono">
                        <span className="font-bold text-[var(--text-primary)]">{item.symbol}</span>
                        <span className="text-[var(--text-secondary)]">{item.price.toFixed(2)}</span>
                        <span
                            className={clsx(
                                "font-semibold",
                                item.changePercent >= 0 ? "text-[var(--color-success-text)]" : "text-[var(--color-danger-text)]"
                            )}
                        >
                            {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
            <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
        </div>
    );
}
