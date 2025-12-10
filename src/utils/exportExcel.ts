'use client';

import ExcelJS from 'exceljs';
import { TestSession, TestTrade } from '@/store/testSessionStore';
import { LiveSession, LiveTrade } from '@/types';

// Helper function to download blob with proper filename
function downloadBlob(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Format value based on measurement mode
const formatValue = (value: number, mode: string): string => {
    switch (mode) {
        case 'RR': return `${value}R`;
        case '$': return `$${value}`;
        case '%': return `${value}%`;
        default: return String(value);
    }
};

// Format date for display
const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Export Test Session to Excel
export async function exportTestSessionToExcel(
    session: TestSession,
    getFactorName: (id: string) => string
): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Trading Model Simulator';
    workbook.created = new Date();

    // === SHEET 1: Tổng quan ===
    const overviewSheet = workbook.addWorksheet('Tổng quan');

    // Header styling
    const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } },
        alignment: { horizontal: 'center' },
    };

    // Session info
    overviewSheet.addRow(['THÔNG TIN PHIÊN TEST']);
    overviewSheet.getRow(1).font = { bold: true, size: 14 };
    overviewSheet.addRow(['Tên phiên:', session.name]);
    overviewSheet.addRow(['Mode:', session.measurementMode]);
    overviewSheet.addRow(['Bắt đầu:', formatDate(session.startTime)]);
    overviewSheet.addRow(['Kết thúc:', session.endTime ? formatDate(session.endTime) : 'Đang tiến hành']);
    overviewSheet.addRow([]);

    // Statistics
    const trades = session.trades;
    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'lose').length;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    const totalValue = trades.reduce((sum, t) => {
        return sum + (t.result === 'win' ? t.measurementValue : -t.measurementValue);
    }, 0);

    overviewSheet.addRow(['THỐNG KÊ']);
    overviewSheet.getRow(7).font = { bold: true, size: 14 };
    overviewSheet.addRow(['Tổng trades:', trades.length]);
    overviewSheet.addRow(['Thắng:', wins]);
    overviewSheet.addRow(['Thua:', losses]);
    overviewSheet.addRow(['Win Rate:', `${winRate.toFixed(1)}%`]);
    overviewSheet.addRow(['P/L:', formatValue(totalValue, session.measurementMode)]);

    overviewSheet.getColumn(1).width = 15;
    overviewSheet.getColumn(2).width = 30;

    // === SHEET 2: Danh sách trades ===
    const tradesSheet = workbook.addWorksheet('Trades');

    // Headers - thêm nhiều cột chi tiết hơn
    const headers = ['#', 'Thời gian', 'Model (Factors)', 'Giá trị', 'Kết quả', 'P/L', 'Tích lũy', 'Có ảnh', 'Ghi chú'];
    tradesSheet.addRow(headers);

    const headerRow = tradesSheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.style = headerStyle;
    });

    // Data rows
    let runningTotal = 0;
    trades.forEach((trade, index) => {
        const factorNames = trade.factorIds.map(id => getFactorName(id)).join(' + ');
        const pl = trade.result === 'win' ? trade.measurementValue : -trade.measurementValue;
        runningTotal += pl;
        const hasImages = trade.images && trade.images.length > 0 ? `${trade.images.length} ảnh` : '-';

        const row = tradesSheet.addRow([
            index + 1,
            formatDate(trade.timestamp),
            factorNames,
            formatValue(trade.measurementValue, session.measurementMode),
            trade.result === 'win' ? 'WIN' : 'LOSS',
            formatValue(pl, session.measurementMode),
            formatValue(runningTotal, session.measurementMode),
            hasImages,
            trade.notes || '',
        ]);

        // Color coding for result
        const resultCell = row.getCell(5);
        const plCell = row.getCell(6);
        const totalCell = row.getCell(7);

        if (trade.result === 'win') {
            resultCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
            resultCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
            plCell.font = { color: { argb: 'FF2E7D32' } };
        } else {
            resultCell.font = { color: { argb: 'FFC62828' }, bold: true };
            resultCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
            plCell.font = { color: { argb: 'FFC62828' } };
        }

        // Running total color
        if (runningTotal >= 0) {
            totalCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
        } else {
            totalCell.font = { color: { argb: 'FFC62828' }, bold: true };
        }
    });

    // Auto-fit columns
    tradesSheet.getColumn(1).width = 5;   // #
    tradesSheet.getColumn(2).width = 18;  // Thời gian
    tradesSheet.getColumn(3).width = 35;  // Model (Factors)
    tradesSheet.getColumn(4).width = 10;  // Giá trị
    tradesSheet.getColumn(5).width = 8;   // Kết quả
    tradesSheet.getColumn(6).width = 10;  // P/L
    tradesSheet.getColumn(7).width = 10;  // Tích lũy
    tradesSheet.getColumn(8).width = 8;   // Có ảnh
    tradesSheet.getColumn(9).width = 40;  // Ghi chú

    // Freeze header row
    tradesSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // === SHEET 3: Thống kê Model ===
    const modelStatsSheet = workbook.addWorksheet('Thống kê Model');

    // Calculate model stats
    const modelStatsMap: Record<string, {
        modelKey: string;
        factorNames: string;
        totalTrades: number;
        wins: number;
        losses: number;
        winRate: number;
        totalValue: number;
        winValue: number;
        lossValue: number;
    }> = {};

    trades.forEach(trade => {
        if (!modelStatsMap[trade.modelKey]) {
            const factorNames = trade.factorIds.map(id => getFactorName(id)).join(' + ');
            modelStatsMap[trade.modelKey] = {
                modelKey: trade.modelKey,
                factorNames,
                totalTrades: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                totalValue: 0,
                winValue: 0,
                lossValue: 0,
            };
        }

        const stats = modelStatsMap[trade.modelKey];
        stats.totalTrades++;
        if (trade.result === 'win') {
            stats.wins++;
            stats.winValue += trade.measurementValue;
            stats.totalValue += trade.measurementValue;
        } else {
            stats.losses++;
            stats.lossValue += trade.measurementValue;
            stats.totalValue -= trade.measurementValue;
        }
        stats.winRate = (stats.wins / stats.totalTrades) * 100;
    });

    // Sort by win rate
    const modelStats = Object.values(modelStatsMap).sort((a, b) => b.winRate - a.winRate);

    // Header
    const modelHeaders = ['#', 'Model', 'Trades', 'Thắng', 'Thua', 'Win Rate', 'Thắng ' + session.measurementMode, 'Thua ' + session.measurementMode, 'Tổng P/L'];
    modelStatsSheet.addRow(modelHeaders);
    modelStatsSheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
    });

    // Data rows
    modelStats.forEach((stat, index) => {
        const row = modelStatsSheet.addRow([
            index + 1,
            stat.factorNames,
            stat.totalTrades,
            stat.wins,
            stat.losses,
            `${stat.winRate.toFixed(1)}%`,
            formatValue(stat.winValue, session.measurementMode),
            formatValue(stat.lossValue, session.measurementMode),
            formatValue(stat.totalValue, session.measurementMode),
        ]);

        // Color coding
        const winRateCell = row.getCell(6);
        const plCell = row.getCell(9);

        if (stat.winRate >= 50) {
            winRateCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
        } else {
            winRateCell.font = { color: { argb: 'FFC62828' }, bold: true };
        }

        if (stat.totalValue >= 0) {
            plCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
        } else {
            plCell.font = { color: { argb: 'FFC62828' }, bold: true };
        }

        // Highlight best model
        if (index === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
            });
        }
    });

    // Column widths
    modelStatsSheet.getColumn(1).width = 5;
    modelStatsSheet.getColumn(2).width = 40;
    modelStatsSheet.getColumn(3).width = 8;
    modelStatsSheet.getColumn(4).width = 8;
    modelStatsSheet.getColumn(5).width = 8;
    modelStatsSheet.getColumn(6).width = 10;
    modelStatsSheet.getColumn(7).width = 12;
    modelStatsSheet.getColumn(8).width = 12;
    modelStatsSheet.getColumn(9).width = 12;

    modelStatsSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `${session.name.replace(/[^a-zA-Z0-9\u0080-\uFFFF]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadBlob(blob, fileName);
}

// Export Live Session to Excel
export async function exportLiveSessionToExcel(session: LiveSession): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Trading Model Simulator';
    workbook.created = new Date();

    const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } },
        alignment: { horizontal: 'center' },
    };

    // === SHEET 1: Tổng quan ===
    const overviewSheet = workbook.addWorksheet('Tổng quan');

    overviewSheet.addRow(['THÔNG TIN PHIÊN THỰC CHIẾN']);
    overviewSheet.getRow(1).font = { bold: true, size: 14 };
    overviewSheet.addRow(['Mode:', session.measurementMode]);
    overviewSheet.addRow(['Bắt đầu:', formatDate(session.startTime)]);
    overviewSheet.addRow(['Kết thúc:', session.endTime ? formatDate(session.endTime) : 'Đang tiến hành']);
    overviewSheet.addRow([]);

    const trades = session.trades;
    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'lose').length;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    const totalValue = trades.reduce((sum, t) => {
        return sum + (t.result === 'win' ? t.measurementValue : -t.measurementValue);
    }, 0);

    overviewSheet.addRow(['THỐNG KÊ']);
    overviewSheet.getRow(6).font = { bold: true, size: 14 };
    overviewSheet.addRow(['Tổng trades:', trades.length]);
    overviewSheet.addRow(['Thắng:', wins]);
    overviewSheet.addRow(['Thua:', losses]);
    overviewSheet.addRow(['Win Rate:', `${winRate.toFixed(1)}%`]);
    overviewSheet.addRow(['P/L:', formatValue(totalValue, session.measurementMode)]);

    overviewSheet.getColumn(1).width = 15;
    overviewSheet.getColumn(2).width = 30;

    // === SHEET 2: Trades ===
    const tradesSheet = workbook.addWorksheet('Trades');

    const headers = ['#', 'Thời gian', 'Model', 'Giá trị', 'Profit Ratio', 'Kết quả', 'P/L', 'Tích lũy', 'Có ảnh', 'Ghi chú'];
    tradesSheet.addRow(headers);

    const headerRow = tradesSheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.style = headerStyle;
    });

    let runningTotal = 0;
    trades.forEach((trade, index) => {
        const pl = trade.result === 'win' ? trade.measurementValue : -trade.measurementValue;
        runningTotal += pl;
        const hasImages = trade.images && trade.images.length > 0 ? `${trade.images.length} ảnh` : '-';

        const row = tradesSheet.addRow([
            index + 1,
            formatDate(trade.timestamp),
            trade.modelName,
            formatValue(trade.measurementValue, session.measurementMode),
            trade.profitRatio ? `${trade.profitRatio}x` : '-',
            trade.result === 'win' ? 'WIN' : 'LOSS',
            formatValue(pl, session.measurementMode),
            formatValue(runningTotal, session.measurementMode),
            hasImages,
            trade.notes || '',
        ]);

        const resultCell = row.getCell(6);
        const plCell = row.getCell(7);
        const totalCell = row.getCell(8);

        if (trade.result === 'win') {
            resultCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
            resultCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
            plCell.font = { color: { argb: 'FF2E7D32' } };
        } else {
            resultCell.font = { color: { argb: 'FFC62828' }, bold: true };
            resultCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
            plCell.font = { color: { argb: 'FFC62828' } };
        }

        if (runningTotal >= 0) {
            totalCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
        } else {
            totalCell.font = { color: { argb: 'FFC62828' }, bold: true };
        }
    });

    tradesSheet.getColumn(1).width = 5;   // #
    tradesSheet.getColumn(2).width = 18;  // Thời gian
    tradesSheet.getColumn(3).width = 25;  // Model
    tradesSheet.getColumn(4).width = 10;  // Giá trị
    tradesSheet.getColumn(5).width = 12;  // Profit Ratio
    tradesSheet.getColumn(6).width = 8;   // Kết quả
    tradesSheet.getColumn(7).width = 10;  // P/L
    tradesSheet.getColumn(8).width = 10;  // Tích lũy
    tradesSheet.getColumn(9).width = 8;   // Có ảnh
    tradesSheet.getColumn(10).width = 40; // Ghi chú

    tradesSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // === SHEET 3: Thống kê Model ===
    const modelStatsSheet = workbook.addWorksheet('Thống kê Model');

    // Calculate model stats
    const modelStatsMap: Record<string, {
        modelName: string;
        totalTrades: number;
        wins: number;
        losses: number;
        winRate: number;
        totalValue: number;
        winValue: number;
        lossValue: number;
    }> = {};

    trades.forEach(trade => {
        if (!modelStatsMap[trade.modelName]) {
            modelStatsMap[trade.modelName] = {
                modelName: trade.modelName,
                totalTrades: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                totalValue: 0,
                winValue: 0,
                lossValue: 0,
            };
        }

        const stats = modelStatsMap[trade.modelName];
        stats.totalTrades++;
        if (trade.result === 'win') {
            stats.wins++;
            stats.winValue += trade.measurementValue;
            stats.totalValue += trade.measurementValue;
        } else {
            stats.losses++;
            stats.lossValue += trade.measurementValue;
            stats.totalValue -= trade.measurementValue;
        }
        stats.winRate = (stats.wins / stats.totalTrades) * 100;
    });

    // Sort by win rate
    const modelStats = Object.values(modelStatsMap).sort((a, b) => b.winRate - a.winRate);

    // Header
    const modelHeaders = ['#', 'Model', 'Trades', 'Thắng', 'Thua', 'Win Rate', 'Thắng ' + session.measurementMode, 'Thua ' + session.measurementMode, 'Tổng P/L'];
    modelStatsSheet.addRow(modelHeaders);
    modelStatsSheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
    });

    // Data rows
    modelStats.forEach((stat, index) => {
        const row = modelStatsSheet.addRow([
            index + 1,
            stat.modelName,
            stat.totalTrades,
            stat.wins,
            stat.losses,
            `${stat.winRate.toFixed(1)}%`,
            formatValue(stat.winValue, session.measurementMode),
            formatValue(stat.lossValue, session.measurementMode),
            formatValue(stat.totalValue, session.measurementMode),
        ]);

        // Color coding
        const winRateCell = row.getCell(6);
        const plCell = row.getCell(9);

        if (stat.winRate >= 50) {
            winRateCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
        } else {
            winRateCell.font = { color: { argb: 'FFC62828' }, bold: true };
        }

        if (stat.totalValue >= 0) {
            plCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
        } else {
            plCell.font = { color: { argb: 'FFC62828' }, bold: true };
        }

        // Highlight best model
        if (index === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
            });
        }
    });

    // Column widths
    modelStatsSheet.getColumn(1).width = 5;
    modelStatsSheet.getColumn(2).width = 30;
    modelStatsSheet.getColumn(3).width = 8;
    modelStatsSheet.getColumn(4).width = 8;
    modelStatsSheet.getColumn(5).width = 8;
    modelStatsSheet.getColumn(6).width = 10;
    modelStatsSheet.getColumn(7).width = 12;
    modelStatsSheet.getColumn(8).width = 12;
    modelStatsSheet.getColumn(9).width = 12;

    modelStatsSheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `live_session_${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadBlob(blob, fileName);
}

