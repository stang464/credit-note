export type Money = (value: number | string) => string;
export type Card = { cardId: string; name: string; bank?: string | null; last4?: string | null; creditLimit: number | string; color?: string | null };
export type Transaction = { txnId: string; cardId: string; txnDate: string; statementMonth?: string; description?: string | null; amount: number | string; txnType: string; status: string };
export type Plan = { planId: string; cardId: string; itemName: string; monthlyAmount: number | string; termCount: number; paid_terms: number; remaining_terms: number; remaining_balance: number; firstStatementMonth?: string };
export type Category = { categoryId: string; name: string };
