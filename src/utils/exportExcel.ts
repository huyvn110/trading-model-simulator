'use client';

import ExcelJS from 'exceljs';
import { TestSession, TestTrade } from '@/store/testSessionStore';
import { LiveSession, LiveTrade } from '@/types';

// Helper function to download blob with proper filename
function downloadBlob(blob: Blob, fileName: string) {
    // Create a fresh blob with explicit type to ensure proper MIME type
    const url = URL.createObjectURL(blob);

    // Create invisible anchor
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName; // This sets the filename

    // Append, click, and cleanup
    document.body.appendChild(a);
    a.click();

    // Use requestAnimationFrame for cleanup to ensure download starts
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
    });
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
    overviewSheet.mergeCells('A1:C1');
    overviewSheet.addRow(['Tên phiên:', session.name]);
    overviewSheet.addRow(['Mode đo lường:', session.measurementMode === 'RR' ? 'Risk:Reward (R)' : session.measurementMode === '$' ? 'Dollar ($)' : 'Phần trăm (%)']);
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
    const winValue = trades.filter(t => t.result === 'win').reduce((sum, t) => sum + t.measurementValue, 0);
    const lossValue = trades.filter(t => t.result === 'lose').reduce((sum, t) => sum + t.measurementValue, 0);
    const avgTradeValue = trades.length > 0 ? trades.reduce((sum, t) => sum + t.measurementValue, 0) / trades.length : 0;
    const avgWinValue = wins > 0 ? winValue / wins : 0;
    const avgLossValue = losses > 0 ? lossValue / losses : 0;

    // Calculate streaks
    let maxWinStreak = 0, maxLossStreak = 0, currentWinStreak = 0, currentLossStreak = 0;
    trades.forEach(t => {
        if (t.result === 'win') {
            currentWinStreak++;
            currentLossStreak = 0;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else {
            currentLossStreak++;
            currentWinStreak = 0;
            maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        }
    });

    // Find best model
    const modelStatsForOverview: Record<string, { name: string; wins: number; total: number; value: number }> = {};
    trades.forEach(trade => {
        const factorNames = trade.factorIds.map(id => getFactorName(id)).join(' + ');
        if (!modelStatsForOverview[trade.modelKey]) {
            modelStatsForOverview[trade.modelKey] = { name: factorNames, wins: 0, total: 0, value: 0 };
        }
        modelStatsForOverview[trade.modelKey].total++;
        if (trade.result === 'win') {
            modelStatsForOverview[trade.modelKey].wins++;
            modelStatsForOverview[trade.modelKey].value += trade.measurementValue;
        } else {
            modelStatsForOverview[trade.modelKey].value -= trade.measurementValue;
        }
    });
    const bestModel = Object.values(modelStatsForOverview).sort((a, b) => {
        const aRate = a.total > 0 ? a.wins / a.total : 0;
        const bRate = b.total > 0 ? b.wins / b.total : 0;
        return bRate - aRate;
    })[0];

    overviewSheet.addRow(['THỐNG KÊ TỔNG HỢP']);
    overviewSheet.getRow(7).font = { bold: true, size: 14 };
    overviewSheet.mergeCells('A7:C7');
    overviewSheet.addRow([]);

    // Trade counts
    overviewSheet.addRow(['Tổng số lệnh:', trades.length]);
    overviewSheet.addRow(['Lệnh thắng:', wins, `(${winRate.toFixed(1)}%)`]);
    overviewSheet.addRow(['Lệnh thua:', losses, `(${trades.length > 0 ? ((losses / trades.length) * 100).toFixed(1) : 0}%)`]);
    overviewSheet.addRow([]);

    // Values
    overviewSheet.addRow(['GIÁ TRỊ']);
    overviewSheet.getRow(overviewSheet.rowCount).font = { bold: true, size: 12 };
    overviewSheet.addRow(['Tổng P/L:', formatValue(totalValue, session.measurementMode), totalValue >= 0 ? '✓ Lời' : '✗ Lỗ']);
    overviewSheet.getCell(`B${overviewSheet.rowCount}`).font = { bold: true, color: { argb: totalValue >= 0 ? 'FF2E7D32' : 'FFC62828' } };
    overviewSheet.addRow(['Tổng thắng:', formatValue(winValue, session.measurementMode)]);
    overviewSheet.addRow(['Tổng thua:', formatValue(lossValue, session.measurementMode)]);
    overviewSheet.addRow(['Trung bình/lệnh:', formatValue(avgTradeValue, session.measurementMode)]);
    overviewSheet.addRow(['TB lệnh thắng:', formatValue(avgWinValue, session.measurementMode)]);
    overviewSheet.addRow(['TB lệnh thua:', formatValue(avgLossValue, session.measurementMode)]);
    overviewSheet.addRow([]);

    // Streaks
    overviewSheet.addRow(['STREAKS']);
    overviewSheet.getRow(overviewSheet.rowCount).font = { bold: true, size: 12 };
    overviewSheet.addRow(['Chuỗi thắng dài nhất:', maxWinStreak, 'lệnh']);
    overviewSheet.addRow(['Chuỗi thua dài nhất:', maxLossStreak, 'lệnh']);
    overviewSheet.addRow([]);

    // Best Model
    if (bestModel) {
        overviewSheet.addRow(['🏆 MODEL HIỆU QUẢ NHẤT']);
        overviewSheet.getRow(overviewSheet.rowCount).font = { bold: true, size: 12 };
        overviewSheet.addRow(['Tên Model:', bestModel.name]);
        overviewSheet.addRow(['Win Rate:', `${bestModel.total > 0 ? ((bestModel.wins / bestModel.total) * 100).toFixed(1) : 0}%`]);
        overviewSheet.addRow(['P/L:', formatValue(bestModel.value, session.measurementMode)]);
        overviewSheet.addRow(['Số lệnh:', bestModel.total]);
    }

    overviewSheet.getColumn(1).width = 22;
    overviewSheet.getColumn(2).width = 35;
    overviewSheet.getColumn(3).width = 15;

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

    // === SHEET 3: Phân Tích Model (Model Analysis) ===
    const analysisSheet = workbook.addWorksheet('Phân Tích Model');

    // Calculate comprehensive model stats
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
        avgWin: number;
        avgLoss: number;
        realRR: number;
        expectancy: number;
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
                avgWin: 0,
                avgLoss: 0,
                realRR: 0,
                expectancy: 0,
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
        stats.avgWin = stats.wins > 0 ? stats.winValue / stats.wins : 0;
        stats.avgLoss = stats.losses > 0 ? stats.lossValue / stats.losses : 1;
        stats.realRR = stats.avgLoss > 0 ? stats.avgWin / stats.avgLoss : stats.avgWin;
        const wr = stats.winRate / 100;
        stats.expectancy = (wr * Math.abs(stats.avgWin)) - (1 - wr);
    });

    // Sort by win rate
    const modelStats = Object.values(modelStatsMap).sort((a, b) => b.winRate - a.winRate);
    const bestModelStats = modelStats[0];

    // === Section 1: Model Tốt Nhất (Best Model) ===
    analysisSheet.addRow(['🏆 MODEL TỐT NHẤT']);
    analysisSheet.getRow(1).font = { bold: true, size: 14 };
    analysisSheet.mergeCells('A1:E1');
    analysisSheet.addRow([]);

    if (bestModelStats) {
        analysisSheet.addRow(['Tên Model:', bestModelStats.factorNames]);
        analysisSheet.getCell('B3').font = { bold: true, size: 12, color: { argb: 'FF6D28D9' } };

        const bestPL = bestModelStats.totalValue;
        analysisSheet.addRow(['Win Rate:', `${bestModelStats.winRate.toFixed(1)}%`]);
        analysisSheet.getCell('B4').font = { bold: true, color: { argb: 'FF2E7D32' } };

        analysisSheet.addRow(['P/L:', formatValue(bestPL, session.measurementMode), bestPL >= 0 ? '✓ Lời' : '✗ Lỗ']);
        analysisSheet.getCell('B5').font = { bold: true, color: { argb: bestPL >= 0 ? 'FF2E7D32' : 'FFC62828' } };

        analysisSheet.addRow(['Số lệnh:', bestModelStats.totalTrades]);
        analysisSheet.addRow(['Thắng / Thua:', `${bestModelStats.wins} / ${bestModelStats.losses}`]);
        analysisSheet.addRow(['Real RR:', `${bestModelStats.realRR.toFixed(2)}R`]);
        analysisSheet.getCell('B8').font = { bold: true, color: { argb: bestModelStats.realRR >= 1 ? 'FF2E7D32' : 'FFC62828' } };

        analysisSheet.addRow(['Kỳ Vọng:', `${bestModelStats.expectancy >= 0 ? '+' : ''}${bestModelStats.expectancy.toFixed(2)}`]);
        analysisSheet.getCell('B9').font = { bold: true, color: { argb: bestModelStats.expectancy >= 0 ? 'FF1976D2' : 'FFC62828' } };
    }

    analysisSheet.addRow([]);
    analysisSheet.addRow([]);

    // === Section 2: Hiệu Quả Giao Dịch (Trading Efficiency - Real RR) ===
    const efficiencyStartRow = analysisSheet.rowCount + 1;
    analysisSheet.addRow(['💰 HIỆU QUẢ GIAO DỊCH (Real RR)']);
    analysisSheet.getRow(efficiencyStartRow).font = { bold: true, size: 14 };
    analysisSheet.mergeCells(`A${efficiencyStartRow}:E${efficiencyStartRow}`);
    analysisSheet.addRow([]);

    // Sort by RR for this section
    const statsByRR = [...modelStats].sort((a, b) => b.realRR - a.realRR);

    const rrHeaders = ['#', 'Model', 'TB Thắng', 'TB Thua', 'Real RR'];
    analysisSheet.addRow(rrHeaders);
    analysisSheet.getRow(analysisSheet.rowCount).eachCell((cell) => {
        cell.style = headerStyle;
    });

    statsByRR.forEach((stat, index) => {
        const row = analysisSheet.addRow([
            index + 1,
            stat.factorNames,
            formatValue(stat.avgWin, session.measurementMode),
            formatValue(stat.avgLoss, session.measurementMode),
            `${stat.realRR.toFixed(2)}R`,
        ]);

        const rrCell = row.getCell(5);
        if (stat.realRR >= 1) {
            rrCell.font = { bold: true, color: { argb: 'FF2E7D32' } };
        } else {
            rrCell.font = { bold: true, color: { argb: 'FFC62828' } };
        }

        // Highlight best
        if (index === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
            });
        }
    });

    analysisSheet.addRow([]);
    analysisSheet.addRow([]);

    // === Section 3: Kỳ Vọng (Expectancy) ===
    const expStartRow = analysisSheet.rowCount + 1;
    analysisSheet.addRow(['🎯 KỲ VỌNG (Expectancy)']);
    analysisSheet.getRow(expStartRow).font = { bold: true, size: 14 };
    analysisSheet.mergeCells(`A${expStartRow}:E${expStartRow}`);
    analysisSheet.addRow([]);

    // Sort by expectancy for this section
    const statsByExp = [...modelStats].sort((a, b) => b.expectancy - a.expectancy);

    const expHeaders = ['#', 'Model', 'Win Rate', 'TB Thắng', 'Kỳ Vọng'];
    analysisSheet.addRow(expHeaders);
    analysisSheet.getRow(analysisSheet.rowCount).eachCell((cell) => {
        cell.style = headerStyle;
    });

    statsByExp.forEach((stat, index) => {
        const row = analysisSheet.addRow([
            index + 1,
            stat.factorNames,
            `${stat.winRate.toFixed(1)}%`,
            formatValue(stat.avgWin, session.measurementMode),
            `${stat.expectancy >= 0 ? '+' : ''}${stat.expectancy.toFixed(2)}`,
        ]);

        const expCell = row.getCell(5);
        if (stat.expectancy >= 0) {
            expCell.font = { bold: true, color: { argb: 'FF1976D2' } };
        } else {
            expCell.font = { bold: true, color: { argb: 'FFC62828' } };
        }

        // Highlight best
        if (index === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
            });
        }
    });

    analysisSheet.addRow([]);
    analysisSheet.addRow([]);

    // === Section 4: Bảng Xếp Hạng Model (Full Rankings) ===
    const rankStartRow = analysisSheet.rowCount + 1;
    analysisSheet.addRow(['📋 BẢNG XẾP HẠNG MODEL']);
    analysisSheet.getRow(rankStartRow).font = { bold: true, size: 14 };
    analysisSheet.mergeCells(`A${rankStartRow}:I${rankStartRow}`);
    analysisSheet.addRow([]);

    const rankHeaders = ['#', 'Model', 'Trades', 'Thắng', 'Thua', 'Win Rate', `Thắng ${session.measurementMode}`, `Thua ${session.measurementMode}`, 'Tổng P/L', 'Real RR', 'Kỳ Vọng'];
    analysisSheet.addRow(rankHeaders);
    analysisSheet.getRow(analysisSheet.rowCount).eachCell((cell) => {
        cell.style = headerStyle;
    });

    modelStats.forEach((stat, index) => {
        const row = analysisSheet.addRow([
            index + 1,
            stat.factorNames,
            stat.totalTrades,
            stat.wins,
            stat.losses,
            `${stat.winRate.toFixed(1)}%`,
            formatValue(stat.winValue, session.measurementMode),
            formatValue(stat.lossValue, session.measurementMode),
            formatValue(stat.totalValue, session.measurementMode),
            `${stat.realRR.toFixed(2)}R`,
            `${stat.expectancy >= 0 ? '+' : ''}${stat.expectancy.toFixed(2)}`,
        ]);

        // Color coding
        const winRateCell = row.getCell(6);
        const plCell = row.getCell(9);
        const rrCell = row.getCell(10);
        const expCell = row.getCell(11);

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

        if (stat.realRR >= 1) {
            rrCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
        } else {
            rrCell.font = { color: { argb: 'FFC62828' }, bold: true };
        }

        if (stat.expectancy >= 0) {
            expCell.font = { color: { argb: 'FF1976D2' }, bold: true };
        } else {
            expCell.font = { color: { argb: 'FFC62828' }, bold: true };
        }

        // Highlight best model
        if (index === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
            });
        }
    });

    // Column widths for analysis sheet
    analysisSheet.getColumn(1).width = 5;
    analysisSheet.getColumn(2).width = 40;
    analysisSheet.getColumn(3).width = 12;
    analysisSheet.getColumn(4).width = 10;
    analysisSheet.getColumn(5).width = 10;
    analysisSheet.getColumn(6).width = 10;
    analysisSheet.getColumn(7).width = 12;
    analysisSheet.getColumn(8).width = 12;
    analysisSheet.getColumn(9).width = 12;
    analysisSheet.getColumn(10).width = 10;
    analysisSheet.getColumn(11).width = 10;

    analysisSheet.views = [{ state: 'frozen', ySplit: 0 }];

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
    overviewSheet.mergeCells('A1:C1');
    overviewSheet.addRow(['Mode đo lường:', session.measurementMode === 'RR' ? 'Risk:Reward (R)' : session.measurementMode === '$' ? 'Dollar ($)' : 'Phần trăm (%)']);
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
    const winValue = trades.filter(t => t.result === 'win').reduce((sum, t) => sum + t.measurementValue, 0);
    const lossValue = trades.filter(t => t.result === 'lose').reduce((sum, t) => sum + t.measurementValue, 0);
    const avgTradeValue = trades.length > 0 ? trades.reduce((sum, t) => sum + t.measurementValue, 0) / trades.length : 0;
    const avgWinValue = wins > 0 ? winValue / wins : 0;
    const avgLossValue = losses > 0 ? lossValue / losses : 0;

    // Calculate streaks
    let maxWinStreak = 0, maxLossStreak = 0, currentWinStreak = 0, currentLossStreak = 0;
    trades.forEach(t => {
        if (t.result === 'win') {
            currentWinStreak++;
            currentLossStreak = 0;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else {
            currentLossStreak++;
            currentWinStreak = 0;
            maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        }
    });

    // Find best model
    const modelStatsForOverview: Record<string, { name: string; wins: number; total: number; value: number }> = {};
    trades.forEach(trade => {
        if (!modelStatsForOverview[trade.modelName]) {
            modelStatsForOverview[trade.modelName] = { name: trade.modelName, wins: 0, total: 0, value: 0 };
        }
        modelStatsForOverview[trade.modelName].total++;
        if (trade.result === 'win') {
            modelStatsForOverview[trade.modelName].wins++;
            modelStatsForOverview[trade.modelName].value += trade.measurementValue;
        } else {
            modelStatsForOverview[trade.modelName].value -= trade.measurementValue;
        }
    });
    const bestModel = Object.values(modelStatsForOverview).sort((a, b) => {
        const aRate = a.total > 0 ? a.wins / a.total : 0;
        const bRate = b.total > 0 ? b.wins / b.total : 0;
        return bRate - aRate;
    })[0];

    overviewSheet.addRow(['THỐNG KÊ TỔNG HỢP']);
    overviewSheet.getRow(6).font = { bold: true, size: 14 };
    overviewSheet.mergeCells('A6:C6');
    overviewSheet.addRow([]);

    // Trade counts
    overviewSheet.addRow(['Tổng số lệnh:', trades.length]);
    overviewSheet.addRow(['Lệnh thắng:', wins, `(${winRate.toFixed(1)}%)`]);
    overviewSheet.addRow(['Lệnh thua:', losses, `(${trades.length > 0 ? ((losses / trades.length) * 100).toFixed(1) : 0}%)`]);
    overviewSheet.addRow([]);

    // Values
    overviewSheet.addRow(['GIÁ TRỊ']);
    overviewSheet.getRow(overviewSheet.rowCount).font = { bold: true, size: 12 };
    overviewSheet.addRow(['Tổng P/L:', formatValue(totalValue, session.measurementMode), totalValue >= 0 ? '✓ Lời' : '✗ Lỗ']);
    overviewSheet.getCell(`B${overviewSheet.rowCount}`).font = { bold: true, color: { argb: totalValue >= 0 ? 'FF2E7D32' : 'FFC62828' } };
    overviewSheet.addRow(['Tổng thắng:', formatValue(winValue, session.measurementMode)]);
    overviewSheet.addRow(['Tổng thua:', formatValue(lossValue, session.measurementMode)]);
    overviewSheet.addRow(['Trung bình/lệnh:', formatValue(avgTradeValue, session.measurementMode)]);
    overviewSheet.addRow(['TB lệnh thắng:', formatValue(avgWinValue, session.measurementMode)]);
    overviewSheet.addRow(['TB lệnh thua:', formatValue(avgLossValue, session.measurementMode)]);
    overviewSheet.addRow([]);

    // Streaks
    overviewSheet.addRow(['STREAKS']);
    overviewSheet.getRow(overviewSheet.rowCount).font = { bold: true, size: 12 };
    overviewSheet.addRow(['Chuỗi thắng dài nhất:', maxWinStreak, 'lệnh']);
    overviewSheet.addRow(['Chuỗi thua dài nhất:', maxLossStreak, 'lệnh']);
    overviewSheet.addRow([]);

    // Best Model
    if (bestModel) {
        overviewSheet.addRow(['🏆 MODEL HIỆU QUẢ NHẤT']);
        overviewSheet.getRow(overviewSheet.rowCount).font = { bold: true, size: 12 };
        overviewSheet.addRow(['Tên Model:', bestModel.name]);
        overviewSheet.addRow(['Win Rate:', `${bestModel.total > 0 ? ((bestModel.wins / bestModel.total) * 100).toFixed(1) : 0}%`]);
        overviewSheet.addRow(['P/L:', formatValue(bestModel.value, session.measurementMode)]);
        overviewSheet.addRow(['Số lệnh:', bestModel.total]);
    }

    overviewSheet.getColumn(1).width = 22;
    overviewSheet.getColumn(2).width = 35;
    overviewSheet.getColumn(3).width = 15;

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

    // === SHEET 3: Phân Tích Model (Model Analysis) ===
    const analysisSheet = workbook.addWorksheet('Phân Tích Model');

    // Calculate comprehensive model stats
    const modelStatsMap: Record<string, {
        modelName: string;
        totalTrades: number;
        wins: number;
        losses: number;
        winRate: number;
        totalValue: number;
        winValue: number;
        lossValue: number;
        avgWin: number;
        avgLoss: number;
        realRR: number;
        expectancy: number;
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
                avgWin: 0,
                avgLoss: 0,
                realRR: 0,
                expectancy: 0,
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
        stats.avgWin = stats.wins > 0 ? stats.winValue / stats.wins : 0;
        stats.avgLoss = stats.losses > 0 ? stats.lossValue / stats.losses : 1;
        stats.realRR = stats.avgLoss > 0 ? stats.avgWin / stats.avgLoss : stats.avgWin;
        const wr = stats.winRate / 100;
        stats.expectancy = (wr * Math.abs(stats.avgWin)) - (1 - wr);
    });

    // Sort by win rate
    const modelStats = Object.values(modelStatsMap).sort((a, b) => b.winRate - a.winRate);
    const bestModelStats = modelStats[0];

    // Gold header style
    const goldStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: 'FF856404' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } },
    };

    // Section header style
    const sectionStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, size: 12, color: { argb: 'FF1976D2' } },
    };

    // === Section 1: Model Tốt Nhất (Best Model) ===
    analysisSheet.addRow(['🏆 MODEL TỐT NHẤT']);
    analysisSheet.getRow(1).font = { bold: true, size: 14 };
    analysisSheet.mergeCells('A1:E1');
    analysisSheet.addRow([]);

    if (bestModelStats) {
        analysisSheet.addRow(['Tên Model:', bestModelStats.modelName]);
        analysisSheet.getCell('B3').font = { bold: true, size: 12, color: { argb: 'FF6D28D9' } };

        const bestPL = bestModelStats.totalValue;
        analysisSheet.addRow(['Win Rate:', `${bestModelStats.winRate.toFixed(1)}%`]);
        analysisSheet.getCell('B4').font = { bold: true, color: { argb: 'FF2E7D32' } };

        analysisSheet.addRow(['P/L:', formatValue(bestPL, session.measurementMode), bestPL >= 0 ? '✓ Lời' : '✗ Lỗ']);
        analysisSheet.getCell('B5').font = { bold: true, color: { argb: bestPL >= 0 ? 'FF2E7D32' : 'FFC62828' } };

        analysisSheet.addRow(['Số lệnh:', bestModelStats.totalTrades]);
        analysisSheet.addRow(['Thắng / Thua:', `${bestModelStats.wins} / ${bestModelStats.losses}`]);
        analysisSheet.addRow(['Real RR:', `${bestModelStats.realRR.toFixed(2)}R`]);
        analysisSheet.getCell('B8').font = { bold: true, color: { argb: bestModelStats.realRR >= 1 ? 'FF2E7D32' : 'FFC62828' } };

        analysisSheet.addRow(['Kỳ Vọng:', `${bestModelStats.expectancy >= 0 ? '+' : ''}${bestModelStats.expectancy.toFixed(2)}`]);
        analysisSheet.getCell('B9').font = { bold: true, color: { argb: bestModelStats.expectancy >= 0 ? 'FF1976D2' : 'FFC62828' } };
    }

    analysisSheet.addRow([]);
    analysisSheet.addRow([]);

    // === Section 2: Hiệu Quả Giao Dịch (Trading Efficiency - Real RR) ===
    const efficiencyStartRow = analysisSheet.rowCount + 1;
    analysisSheet.addRow(['💰 HIỆU QUẢ GIAO DỊCH (Real RR)']);
    analysisSheet.getRow(efficiencyStartRow).font = { bold: true, size: 14 };
    analysisSheet.mergeCells(`A${efficiencyStartRow}:E${efficiencyStartRow}`);
    analysisSheet.addRow([]);

    // Sort by RR for this section
    const statsByRR = [...modelStats].sort((a, b) => b.realRR - a.realRR);

    const rrHeaders = ['#', 'Model', 'TB Thắng', 'TB Thua', 'Real RR'];
    analysisSheet.addRow(rrHeaders);
    analysisSheet.getRow(analysisSheet.rowCount).eachCell((cell) => {
        cell.style = headerStyle;
    });

    statsByRR.forEach((stat, index) => {
        const row = analysisSheet.addRow([
            index + 1,
            stat.modelName,
            formatValue(stat.avgWin, session.measurementMode),
            formatValue(stat.avgLoss, session.measurementMode),
            `${stat.realRR.toFixed(2)}R`,
        ]);

        const rrCell = row.getCell(5);
        if (stat.realRR >= 1) {
            rrCell.font = { bold: true, color: { argb: 'FF2E7D32' } };
        } else {
            rrCell.font = { bold: true, color: { argb: 'FFC62828' } };
        }

        // Highlight best
        if (index === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
            });
        }
    });

    analysisSheet.addRow([]);
    analysisSheet.addRow([]);

    // === Section 3: Kỳ Vọng (Expectancy) ===
    const expStartRow = analysisSheet.rowCount + 1;
    analysisSheet.addRow(['🎯 KỲ VỌNG (Expectancy)']);
    analysisSheet.getRow(expStartRow).font = { bold: true, size: 14 };
    analysisSheet.mergeCells(`A${expStartRow}:E${expStartRow}`);
    analysisSheet.addRow([]);

    // Sort by expectancy for this section
    const statsByExp = [...modelStats].sort((a, b) => b.expectancy - a.expectancy);

    const expHeaders = ['#', 'Model', 'Win Rate', 'TB Thắng', 'Kỳ Vọng'];
    analysisSheet.addRow(expHeaders);
    analysisSheet.getRow(analysisSheet.rowCount).eachCell((cell) => {
        cell.style = headerStyle;
    });

    statsByExp.forEach((stat, index) => {
        const row = analysisSheet.addRow([
            index + 1,
            stat.modelName,
            `${stat.winRate.toFixed(1)}%`,
            formatValue(stat.avgWin, session.measurementMode),
            `${stat.expectancy >= 0 ? '+' : ''}${stat.expectancy.toFixed(2)}`,
        ]);

        const expCell = row.getCell(5);
        if (stat.expectancy >= 0) {
            expCell.font = { bold: true, color: { argb: 'FF1976D2' } };
        } else {
            expCell.font = { bold: true, color: { argb: 'FFC62828' } };
        }

        // Highlight best
        if (index === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
            });
        }
    });

    analysisSheet.addRow([]);
    analysisSheet.addRow([]);

    // === Section 4: Bảng Xếp Hạng Model (Full Rankings) ===
    const rankStartRow = analysisSheet.rowCount + 1;
    analysisSheet.addRow(['📋 BẢNG XẾP HẠNG MODEL']);
    analysisSheet.getRow(rankStartRow).font = { bold: true, size: 14 };
    analysisSheet.mergeCells(`A${rankStartRow}:I${rankStartRow}`);
    analysisSheet.addRow([]);

    const rankHeaders = ['#', 'Model', 'Trades', 'Thắng', 'Thua', 'Win Rate', `Thắng ${session.measurementMode}`, `Thua ${session.measurementMode}`, 'Tổng P/L', 'Real RR', 'Kỳ Vọng'];
    analysisSheet.addRow(rankHeaders);
    analysisSheet.getRow(analysisSheet.rowCount).eachCell((cell) => {
        cell.style = headerStyle;
    });

    modelStats.forEach((stat, index) => {
        const row = analysisSheet.addRow([
            index + 1,
            stat.modelName,
            stat.totalTrades,
            stat.wins,
            stat.losses,
            `${stat.winRate.toFixed(1)}%`,
            formatValue(stat.winValue, session.measurementMode),
            formatValue(stat.lossValue, session.measurementMode),
            formatValue(stat.totalValue, session.measurementMode),
            `${stat.realRR.toFixed(2)}R`,
            `${stat.expectancy >= 0 ? '+' : ''}${stat.expectancy.toFixed(2)}`,
        ]);

        // Color coding
        const winRateCell = row.getCell(6);
        const plCell = row.getCell(9);
        const rrCell = row.getCell(10);
        const expCell = row.getCell(11);

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

        if (stat.realRR >= 1) {
            rrCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
        } else {
            rrCell.font = { color: { argb: 'FFC62828' }, bold: true };
        }

        if (stat.expectancy >= 0) {
            expCell.font = { color: { argb: 'FF1976D2' }, bold: true };
        } else {
            expCell.font = { color: { argb: 'FFC62828' }, bold: true };
        }

        // Highlight best model
        if (index === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
            });
        }
    });

    // Column widths for analysis sheet
    analysisSheet.getColumn(1).width = 5;
    analysisSheet.getColumn(2).width = 30;
    analysisSheet.getColumn(3).width = 12;
    analysisSheet.getColumn(4).width = 10;
    analysisSheet.getColumn(5).width = 10;
    analysisSheet.getColumn(6).width = 10;
    analysisSheet.getColumn(7).width = 12;
    analysisSheet.getColumn(8).width = 12;
    analysisSheet.getColumn(9).width = 12;
    analysisSheet.getColumn(10).width = 10;
    analysisSheet.getColumn(11).width = 10;

    analysisSheet.views = [{ state: 'frozen', ySplit: 0 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `live_session_${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadBlob(blob, fileName);
}

