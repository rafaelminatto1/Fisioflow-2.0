// services/partnership/financialService.ts
import { FinancialSummary, Transaction, CommissionBreakdown, Voucher } from '../types';
import { mockPurchasedVouchers } from '../data/mockData';

const PLATFORM_FEE_RATE = 0.10; // 10%
const TAX_RATE = 0.05; // 5%

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const calculateCommissions = (voucher: Voucher): CommissionBreakdown => {
    const grossAmount = voucher.plan.price;
    const platformFee = grossAmount * PLATFORM_FEE_RATE;
    const taxAmount = grossAmount * TAX_RATE;
    const netAmount = grossAmount - platformFee - taxAmount;
    return { grossAmount, platformFee, taxAmount, netAmount };
};

export const getEducatorFinancials = async (educatorId: string): Promise<{ summary: FinancialSummary; transactions: Transaction[] }> => {
    await delay(800);
    
    const educatorVouchers = mockPurchasedVouchers; // In a real app, filter by educatorId

    const transactions: Transaction[] = educatorVouchers.map(voucher => ({
        id: `txn_${voucher.id}`,
        type: 'voucher_purchase',
        patientName: 'Paciente ' + voucher.patientId, // Placeholder
        planName: voucher.plan.name,
        status: 'completed',
        breakdown: calculateCommissions(voucher),
        createdAt: voucher.purchaseDate,
    }));

    const summary: FinancialSummary = transactions.reduce((acc, txn) => {
        acc.grossRevenue += txn.breakdown.grossAmount;
        acc.platformFee += txn.breakdown.platformFee;
        acc.taxAmount += txn.breakdown.taxAmount;
        acc.netRevenue += txn.breakdown.netAmount;
        return acc;
    }, {
        grossRevenue: 0,
        platformFee: 0,
        taxAmount: 0,
        netRevenue: 0,
        period: 'Mês Atual'
    });

    return { summary, transactions };
};
