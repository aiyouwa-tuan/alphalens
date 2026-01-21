export interface User {
  id: string;
  username: string;
  passwordHash: string; // Simple hash or plain text if strictly requested, but hash is better practice even for MVP
  createdAt: string;
}

export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  id: string;
  userId: string;
  symbol: string;
  type: TransactionType;
  quantity: number;
  price: number;
  date: string; // ISO string
}

export interface Holding {
  symbol: string;
  quantity: number;
  averageCost: number;
}

export interface Portfolio {
  userId: string;
  holdings: Holding[];
  realizedPL: number; // Total realized profit/loss from sells
}
