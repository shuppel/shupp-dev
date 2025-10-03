import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import type { CalculationResult } from '../../../lib/calculators/rentVsBuy/types';

interface ComparisonChartProps {
  results: CalculationResult;
  chartType?: 'cumulative' | 'monthly' | 'wealth';
}

export default function ComparisonChart({ results, chartType = 'cumulative' }: ComparisonChartProps): React.JSX.Element {
  const chartData = useMemo(() => {
    return results.monthlyData
      .filter((_, index) => index % 3 === 0 || index === results.monthlyData.length - 1) // Show every 3rd month for performance
      .map(month => ({
        month: month.month,
        year: (month.month / 12).toFixed(1),
        buyingCost: Math.round(month.buyingCumulative),
        rentingCost: Math.round(month.rentingCumulative),
        monthlyCostBuy: Math.round(month.buyingCost),
        monthlyCostRent: Math.round(month.rentingCost),
        homeEquity: Math.round(month.homeEquity),
        investmentValue: Math.round(month.investmentValue),
        netBuyingWealth: Math.round(month.homeEquity - month.buyingCumulative),
        netRentingWealth: Math.round(month.investmentValue - month.rentingCumulative),
      }));
  }, [results]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltip = (value: number, name: string): [string, string] => {
    const labels: Record<string, string> = {
      buyingCost: 'Total Buying Cost',
      rentingCost: 'Total Renting Cost',
      monthlyCostBuy: 'Monthly Buy Cost',
      monthlyCostRent: 'Monthly Rent Cost',
      homeEquity: 'Home Equity',
      investmentValue: 'Investment Value',
      netBuyingWealth: 'Net Wealth (Buy)',
      netRentingWealth: 'Net Wealth (Rent)',
    };
    return [formatCurrency(value), labels[name] || name];
  };

  const getChartConfig = (): { title: string; description?: string; lines: { dataKey: string; stroke: string; name: string }[]; type: 'line' | 'area' } => {
    switch (chartType) {
      case 'monthly':
        return {
          title: 'Monthly Cost Comparison',
          lines: [
            { dataKey: 'monthlyCostBuy', stroke: '#ACC196', name: 'Monthly Buying Cost' },
            { dataKey: 'monthlyCostRent', stroke: '#799496', name: 'Monthly Renting Cost' }
          ],
          type: 'area' as const
        };
      
      case 'wealth':
        return {
          title: 'Wealth Accumulation Over Time',
          lines: [
            { dataKey: 'netBuyingWealth', stroke: '#ACC196', name: 'Net Wealth (Buying)' },
            { dataKey: 'netRentingWealth', stroke: '#799496', name: 'Net Wealth (Renting)' }
          ],
          type: 'line' as const
        };
      
      default: // cumulative
        return {
          title: 'Cumulative Cost Comparison',
          lines: [
            { dataKey: 'buyingCost', stroke: '#ACC196', name: 'Total Buying Cost' },
            { dataKey: 'rentingCost', stroke: '#799496', name: 'Total Renting Cost' }
          ],
          type: 'line' as const
        };
    }
  };

  const config = getChartConfig();
  const breakEvenYears = results.breakEvenMonth !== null ? (results.breakEvenMonth / 12).toFixed(1) : null;

  const ChartComponent = config.type === 'area' ? AreaChart : LineChart;
  const DataComponent = config.type === 'area' ? Area : Line;

  return (
    <div className="chart-container">
      <h3 className="chart-title">{config.title}</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={400}>
          <ChartComponent
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <defs>
              <linearGradient id="buyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ACC196" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ACC196" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="rentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#799496" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#799496" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(172, 193, 150, 0.1)"
              vertical={false}
            />
            
            <XAxis 
              dataKey="year" 
              label={{ 
                value: 'Years', 
                position: 'insideBottom', 
                offset: -10,
                style: { fill: '#ACC196' }
              }}
              tick={{ fill: '#ACC196' }}
              axisLine={{ stroke: '#49475B' }}
            />
            
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              label={{ 
                value: 'Amount', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#ACC196' }
              }}
              tick={{ fill: '#ACC196' }}
              axisLine={{ stroke: '#49475B' }}
            />
            
            <Tooltip 
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'rgba(73, 71, 91, 0.95)',
                border: '1px solid rgba(172, 193, 150, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}
              labelStyle={{ color: '#E9EB9E' }}
              itemStyle={{ color: '#E9EB9E' }}
            />
            
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => <span style={{ color: '#E9EB9E' }}>{value}</span>}
            />
            
            {breakEvenYears !== null && chartType === 'cumulative' && (
              <ReferenceLine 
                x={breakEvenYears} 
                stroke="#E9EB9E"
                strokeDasharray="5 5"
                label={{
                  value: `Break-even: ${breakEvenYears} years`,
                  position: 'top',
                  fill: '#E9EB9E',
                  fontSize: 12
                }}
              />
            )}
            
            {config.lines.map((line, index) => (
              <DataComponent
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                strokeWidth={3}
                name={line.name}
                fill={config.type === 'area' ? (index === 0 ? 'url(#buyGradient)' : 'url(#rentGradient)') : undefined}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            ))}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
      
      {breakEvenYears !== null && (
        <div className="chart-insights">
          <p className="insight-text">
             <span className="insight-icon">Insight</span>
            {chartType === 'cumulative' && `The break-even point occurs at ${breakEvenYears} years, where buying becomes more cost-effective than renting.`}
            {chartType === 'wealth' && `Your net wealth when ${results.netAdvantage > 0 ? 'buying' : 'renting'} exceeds the alternative by ${formatCurrency(Math.abs(results.netAdvantage))}.`}
            {chartType === 'monthly' && `Monthly costs ${results.monthlyData[results.monthlyData.length - 1].buyingCost > results.monthlyData[results.monthlyData.length - 1].rentingCost ? 'for buying remain higher' : 'for renting become higher'} by the end of your analysis period.`}
          </p>
        </div>
      )}
    </div>
  );
}