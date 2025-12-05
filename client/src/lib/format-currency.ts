export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function parseCurrency(value: string): number {
    // Remove currency symbols and spaces, replace comma separators
    const cleaned = value.replace(/[MXN$\s,]/g, '').trim();
    return parseFloat(cleaned) || 0;
}
