import fs from 'fs/promises';
import path from 'path';
import { User, Portfolio, Transaction } from './types';
import { supabase } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PORTFOLIOS_FILE = path.join(DATA_DIR, 'portfolios.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

const USE_SUPABASE = !!supabase;

// Ensure data directory exists (Local only)
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Generic read helper (Local)
async function readJson<T>(file: string, defaultValue: T): Promise<T> {
    await ensureDataDir();
    try {
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data) as T;
    } catch (error) {
        await fs.writeFile(file, JSON.stringify(defaultValue, null, 2));
        return defaultValue;
    }
}

// Generic write helper (Local)
async function writeJson<T>(file: string, data: T): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// --- User Methods ---
export async function getUsers(): Promise<User[]> {
    if (USE_SUPABASE) {
        const { data, error } = await supabase!.from('users').select('*');
        if (error) {
            console.error('Supabase getUsers error:', error);
            throw error;
        }
        return (data as any[])?.map(u => ({
            id: u.id,
            username: u.username,
            passwordHash: u.password_hash,
            createdAt: u.created_at
        })) || [];
    }
    return readJson<User[]>(USERS_FILE, []);
}

export async function saveUser(user: User): Promise<void> {
    if (USE_SUPABASE) {
        const { error } = await supabase!.from('users').insert({
            id: user.id,
            username: user.username,
            password_hash: user.passwordHash,
            created_at: user.createdAt
        });
        if (error) {
            console.error('Supabase saveUser error:', error);
            throw error;
        }
        return;
    }
    const users = await getUsers();
    users.push(user);
    await writeJson(USERS_FILE, users);
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
    if (USE_SUPABASE) {
        const { data, error } = await supabase!.from('users').select('*').eq('username', username).single();

        // PGRST116 is the "row not found" error code in PostgREST/Supabase, which is valid here.
        if (error && error.code !== 'PGRST116') {
            console.error('Supabase findUserByUsername error:', error);
            throw error;
        }

        if (!data) return undefined;

        return {
            id: data.id,
            username: data.username,
            passwordHash: data.password_hash,
            createdAt: data.created_at
        };
    }
    const users = await getUsers();
    return users.find(u => u.username === username);
}

// --- Portfolio Methods ---
export async function getPortfolios(): Promise<Portfolio[]> {
    return [];
}

export async function getPortfolio(userId: string): Promise<Portfolio> {
    if (USE_SUPABASE) {
        const { data, error } = await supabase!.from('portfolios').select('*').eq('user_id', userId).single();

        if (error && error.code !== 'PGRST116') {
            console.error('Supabase getPortfolio error:', error);
        }

        if (!data) {
            // Attempt to initialize portfolio
            const { error: insertError } = await supabase!.from('portfolios').insert({
                user_id: userId,
                holdings: [],
                realized_pl: 0
            });

            if (insertError) {
                console.error('Supabase init portfolio error:', insertError);
                // Fails if user_id invalid or other constraint
            }

            return { userId, holdings: [], realizedPL: 0 };
        }
        return {
            userId: data.user_id,
            holdings: data.holdings || [],
            realizedPL: data.realized_pl || 0
        };
    }

    const portfolios = await readJson<Portfolio[]>(PORTFOLIOS_FILE, []);
    let portfolio = portfolios.find(p => p.userId === userId);
    if (!portfolio) {
        portfolio = { userId, holdings: [], realizedPL: 0 };
        portfolios.push(portfolio);
        await writeJson(PORTFOLIOS_FILE, portfolios);
    }
    return portfolio;
}

export async function savePortfolio(portfolio: Portfolio): Promise<void> {
    if (USE_SUPABASE) {
        const { error } = await supabase!.from('portfolios').upsert({
            user_id: portfolio.userId,
            holdings: portfolio.holdings,
            realized_pl: portfolio.realizedPL
        });
        if (error) {
            console.error('Supabase savePortfolio error:', error);
            throw error;
        }
        return;
    }

    const portfolios = await readJson<Portfolio[]>(PORTFOLIOS_FILE, []);
    const index = portfolios.findIndex(p => p.userId === portfolio.userId);
    if (index !== -1) {
        portfolios[index] = portfolio;
    } else {
        portfolios.push(portfolio);
    }
    await writeJson(PORTFOLIOS_FILE, portfolios);
}

// --- Transaction Methods ---
export async function getTransactions(userId: string): Promise<Transaction[]> {
    if (USE_SUPABASE) {
        const { data, error } = await supabase!.from('transactions').select('*').eq('user_id', userId);
        if (error) {
            console.error('Supabase getTransactions error:', error);
            throw error;
        }
        return (data || []).map((t: any) => ({
            id: t.id,
            userId: t.user_id,
            symbol: t.symbol,
            type: t.type,
            quantity: t.quantity,
            price: t.price,
            date: t.date
        }));
    }
    const allTransactions = await readJson<Transaction[]>(TRANSACTIONS_FILE, []);
    return allTransactions.filter(t => t.userId === userId);
}

export async function saveTransaction(transaction: Transaction): Promise<void> {
    if (USE_SUPABASE) {
        const { error } = await supabase!.from('transactions').insert({
            id: transaction.id,
            user_id: transaction.userId,
            symbol: transaction.symbol,
            type: transaction.type,
            quantity: transaction.quantity,
            price: transaction.price,
            date: transaction.date
        });
        if (error) {
            console.error('Supabase saveTransaction error:', error);
            throw error;
        }
        return;
    }
    const transactions = await readJson<Transaction[]>(TRANSACTIONS_FILE, []);
    transactions.push(transaction);
    await writeJson(TRANSACTIONS_FILE, transactions);
}

// --- Watchlist Methods ---
const WATCHLIST_FILE = path.join(DATA_DIR, 'watchlist.json');

export async function getWatchlist(userId: string): Promise<string[]> {
    if (USE_SUPABASE) {
        const { data, error } = await supabase!.from('watchlists').select('symbol').eq('user_id', userId);
        if (error) {
            console.error('Supabase getWatchlist error:', error);
            return [];
        }
        return (data || []).map((w: any) => w.symbol);
    }
    const allWatchlists = await readJson<{ userId: string, symbol: string }[]>(WATCHLIST_FILE, []);
    return allWatchlists.filter(w => w.userId === userId).map(w => w.symbol);
}

export async function addToWatchlist(userId: string, symbol: string): Promise<void> {
    const upperSymbol = symbol.toUpperCase();
    if (USE_SUPABASE) {
        const { error } = await supabase!.from('watchlists').upsert({
            user_id: userId,
            symbol: upperSymbol
        });
        if (error) {
            console.error('Supabase addToWatchlist error:', error);
            throw error;
        }
        return;
    }
    const allWatchlists = await readJson<{ userId: string, symbol: string }[]>(WATCHLIST_FILE, []);
    if (!allWatchlists.some(w => w.userId === userId && w.symbol === upperSymbol)) {
        allWatchlists.push({ userId, symbol: upperSymbol });
        await writeJson(WATCHLIST_FILE, allWatchlists);
    }
}

export async function removeFromWatchlist(userId: string, symbol: string): Promise<void> {
    const upperSymbol = symbol.toUpperCase();
    if (USE_SUPABASE) {
        const { error } = await supabase!.from('watchlists').delete().match({ user_id: userId, symbol: upperSymbol });
        if (error) {
            console.error('Supabase removeFromWatchlist error:', error);
            throw error;
        }
        return;
    }
    const allWatchlists = await readJson<{ userId: string, symbol: string }[]>(WATCHLIST_FILE, []);
    const filtered = allWatchlists.filter(w => !(w.userId === userId && w.symbol === upperSymbol));
    await writeJson(WATCHLIST_FILE, filtered);
}
