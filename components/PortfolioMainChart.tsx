'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
    date: string;
    value: number;
}

interface PortfolioMainChartProps {
    data: DataPoint[];
    isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] p-3 rounded shadow-lg text-sm">
                <p className="text-[var(--text-secondary)] mb-1">{label}</p>
                <p className="font-bold text-lg text-[var(--text-accent)]">
                    ${payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function PortfolioMainChart({ data, isLoading }: PortfolioMainChartProps) {
    if (isLoading) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center bg-[var(--bg-panel)] rounded-lg animate-pulse">
                <span className="text-[var(--text-secondary)]">Loading Chart...</span>
            </div>
        );
    }

    // If no data, show a placeholder specific to new users
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[300px] flex flex-col items-center justify-center bg-[var(--bg-panel)] rounded-lg border border-dashed border-[var(--border-subtle)]">
                <span className="text-2xl mb-2">📊</span>
                <p className="text-[var(--text-secondary)]">No portfolio history yet</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Add transactions to see your performance over time.</p>
            </div>
        )
    }

    return (
        <div className="w-full h-[350px] bg-[var(--bg-panel)] rounded-lg p-4 border border-[var(--border-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">Portfolio Performance</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--text-accent)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--text-accent)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="var(--text-secondary)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        stroke="var(--text-secondary)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickFormatter={(value) => `$${value / 1000}k`}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--text-accent)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
