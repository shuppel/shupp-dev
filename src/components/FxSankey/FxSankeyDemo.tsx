import React, { useState } from 'react';
import FxSankey from './FxSankey';
import type { FxSankeyConfig, FxSankeyData } from '../../lib/fxsankey/types';

// Comprehensive color palette for diverse visualization
const SANKEY_COLORS = {
  // Revenue/Income colors (Greens and Blues)
  revenue1: '#2E7D32',  // Forest Green
  revenue2: '#43A047',  // Medium Green
  revenue3: '#66BB6A',  // Light Green
  revenue4: '#1565C0',  // Deep Blue
  revenue5: '#1976D2',  // Medium Blue
  revenue6: '#42A5F5',  // Light Blue
  
  // Expense colors (Reds, Oranges, Purples)
  expense1: '#C62828',  // Dark Red
  expense2: '#EF5350',  // Medium Red
  expense3: '#D84315',  // Dark Orange
  expense4: '#FF6F00',  // Medium Orange
  expense5: '#6A1B9A',  // Deep Purple
  expense6: '#AB47BC',  // Medium Purple
  expense7: '#7B1FA2',  // Purple
  expense8: '#E91E63',  // Pink
  
  // Neutral/Transfer colors (Grays and Browns)
  neutral1: '#424242',  // Dark Gray
  neutral2: '#616161',  // Medium Gray
  neutral3: '#757575',  // Light Gray
  neutral4: '#5D4037',  // Dark Brown
  neutral5: '#6D4C41',  // Medium Brown
  
  // Special categories (Distinct colors)
  special1: '#00838F',  // Cyan
  special2: '#00695C',  // Teal
  special3: '#4527A0',  // Indigo
  special4: '#283593',  // Navy
  special5: '#B71C1C',  // Crimson
  special6: '#FF6F00',  // Amber
  special7: '#1A237E',  // Midnight Blue
  special8: '#004D40',  // Dark Teal
};

const FxSankeyDemo: React.FC = () => {
  const [selectedDataset, setSelectedDataset] = useState<'energy' | 'budget' | 'workflow' | 'usBudget'>('usBudget');

  const energyFlowData: FxSankeyData = {
    nodes: [
      { id: 'coal', label: 'Coal', color: SANKEY_COLORS.neutral4 },
      { id: 'natural-gas', label: 'Natural Gas', color: SANKEY_COLORS.revenue5 },
      { id: 'nuclear', label: 'Nuclear', color: SANKEY_COLORS.special7 },
      { id: 'renewable', label: 'Renewable', color: SANKEY_COLORS.revenue1 },
      { id: 'electricity', label: 'Electricity', color: SANKEY_COLORS.special6 },
      { id: 'heat', label: 'Heat', color: SANKEY_COLORS.expense3 },
      { id: 'residential', label: 'Residential', color: SANKEY_COLORS.special2 },
      { id: 'commercial', label: 'Commercial', color: SANKEY_COLORS.special1 },
      { id: 'industrial', label: 'Industrial', color: SANKEY_COLORS.special4 },
      { id: 'transport', label: 'Transport', color: SANKEY_COLORS.expense6 },
    ],
    links: [
      { source: 'coal', target: 'electricity', value: 30 },
      { source: 'coal', target: 'heat', value: 15 },
      { source: 'natural-gas', target: 'electricity', value: 25 },
      { source: 'natural-gas', target: 'heat', value: 20 },
      { source: 'nuclear', target: 'electricity', value: 20 },
      { source: 'renewable', target: 'electricity', value: 15 },
      { source: 'electricity', target: 'residential', value: 25 },
      { source: 'electricity', target: 'commercial', value: 20 },
      { source: 'electricity', target: 'industrial', value: 35 },
      { source: 'electricity', target: 'transport', value: 10 },
      { source: 'heat', target: 'residential', value: 15 },
      { source: 'heat', target: 'commercial', value: 10 },
      { source: 'heat', target: 'industrial', value: 10 },
    ],
    metadata: {
      title: 'Energy Flow',
      description: 'Energy generation and consumption flow',
      units: 'TWh',
    },
  };

  const budgetFlowData: FxSankeyData = {
    nodes: [
      { id: 'income', label: 'Income', color: SANKEY_COLORS.revenue1 },
      { id: 'salary', label: 'Salary', color: SANKEY_COLORS.revenue2 },
      { id: 'investments', label: 'Investments', color: SANKEY_COLORS.revenue4 },
      { id: 'housing', label: 'Housing', color: SANKEY_COLORS.expense1 },
      { id: 'food', label: 'Food', color: SANKEY_COLORS.expense3 },
      { id: 'transport-exp', label: 'Transport', color: SANKEY_COLORS.expense6 },
      { id: 'utilities', label: 'Utilities', color: SANKEY_COLORS.expense4 },
      { id: 'entertainment', label: 'Entertainment', color: SANKEY_COLORS.expense8 },
      { id: 'savings', label: 'Savings', color: SANKEY_COLORS.special1 },
      { id: 'emergency', label: 'Emergency Fund', color: SANKEY_COLORS.special2 },
      { id: 'retirement', label: 'Retirement', color: SANKEY_COLORS.special4 },
    ],
    links: [
      { source: 'income', target: 'salary', value: 5000 },
      { source: 'income', target: 'investments', value: 800 },
      { source: 'salary', target: 'housing', value: 1500 },
      { source: 'salary', target: 'food', value: 600 },
      { source: 'salary', target: 'transport-exp', value: 400 },
      { source: 'salary', target: 'utilities', value: 200 },
      { source: 'salary', target: 'entertainment', value: 300 },
      { source: 'salary', target: 'savings', value: 2000 },
      { source: 'investments', target: 'savings', value: 800 },
      { source: 'savings', target: 'emergency', value: 500 },
      { source: 'savings', target: 'retirement', value: 2300 },
    ],
    metadata: {
      title: 'Personal Budget Flow',
      description: 'Monthly income and expense flow',
      units: '$',
    },
  };

  // US Federal Budget 2024 (in billions, simplified)
  const usBudgetData: FxSankeyData = {
    nodes: [
      // Revenue Sources
      { id: 'individual-income', label: 'Individual Income Tax', color: SANKEY_COLORS.revenue1 },
      { id: 'payroll-tax', label: 'Payroll Tax', color: SANKEY_COLORS.revenue2 },
      { id: 'corporate-tax', label: 'Corporate Tax', color: SANKEY_COLORS.revenue3 },
      { id: 'customs', label: 'Customs & Tariffs', color: SANKEY_COLORS.revenue4 },
      { id: 'estate-tax', label: 'Estate Tax', color: SANKEY_COLORS.revenue5 },
      { id: 'other-revenue', label: 'Other Revenue', color: SANKEY_COLORS.revenue6 },
      
      // Central Hub
      { id: 'treasury', label: 'US Treasury', color: SANKEY_COLORS.neutral1 },
      
      // Major Spending Categories
      { id: 'social-security', label: 'Social Security', color: SANKEY_COLORS.expense1 },
      { id: 'medicare', label: 'Medicare', color: SANKEY_COLORS.expense2 },
      { id: 'medicaid', label: 'Medicaid', color: SANKEY_COLORS.expense3 },
      { id: 'defense', label: 'Defense', color: SANKEY_COLORS.special7 },
      { id: 'veterans', label: 'Veterans Affairs', color: SANKEY_COLORS.special3 },
      { id: 'education', label: 'Education', color: SANKEY_COLORS.special2 },
      { id: 'transportation', label: 'Transportation', color: SANKEY_COLORS.expense6 },
      { id: 'interest', label: 'Interest on Debt', color: SANKEY_COLORS.expense5 },
      { id: 'agriculture', label: 'Agriculture', color: SANKEY_COLORS.special8 },
      { id: 'justice', label: 'Justice', color: SANKEY_COLORS.special4 },
      { id: 'science', label: 'Science & Space', color: SANKEY_COLORS.special1 },
      { id: 'energy', label: 'Energy & Environment', color: SANKEY_COLORS.revenue1 },
      { id: 'housing', label: 'Housing & Urban Dev', color: SANKEY_COLORS.expense4 },
      { id: 'state', label: 'State & International', color: SANKEY_COLORS.special5 },
      { id: 'other-spending', label: 'Other Programs', color: SANKEY_COLORS.neutral3 },
    ],
    links: [
      // Revenue to Treasury (FY 2024 estimates - normalized for visualization)
      { source: 'individual-income', target: 'treasury', value: 210 },
      { source: 'payroll-tax', target: 'treasury', value: 150 },
      { source: 'corporate-tax', target: 'treasury', value: 42.5 },
      { source: 'customs', target: 'treasury', value: 8.5 },
      { source: 'estate-tax', target: 'treasury', value: 3.5 },
      { source: 'other-revenue', target: 'treasury', value: 15.5 },
      
      // Treasury to Spending (normalized for visualization)
      { source: 'treasury', target: 'social-security', value: 135 },
      { source: 'treasury', target: 'medicare', value: 100 },
      { source: 'treasury', target: 'medicaid', value: 60 },
      { source: 'treasury', target: 'defense', value: 81.6 },
      { source: 'treasury', target: 'interest', value: 64 },
      { source: 'treasury', target: 'veterans', value: 30 },
      { source: 'treasury', target: 'education', value: 8 },
      { source: 'treasury', target: 'transportation', value: 11 },
      { source: 'treasury', target: 'agriculture', value: 3 },
      { source: 'treasury', target: 'justice', value: 4 },
      { source: 'treasury', target: 'science', value: 3.5 },
      { source: 'treasury', target: 'energy', value: 5 },
      { source: 'treasury', target: 'housing', value: 7 },
      { source: 'treasury', target: 'state', value: 6.5 },
      { source: 'treasury', target: 'other-spending', value: 11.4 },
    ],
    metadata: {
      title: 'US Federal Budget 2024',
      description: 'Revenue ($4.3T) and spending allocation - values scaled for visualization (actual in billions)',
      units: '×10B $',
    },
  };

  const workflowData: FxSankeyData = {
    nodes: [
      { id: 'ideas', label: 'Ideas', color: SANKEY_COLORS.revenue3, glow: { enabled: true, color: SANKEY_COLORS.revenue3 } },
      { id: 'research', label: 'Research', color: SANKEY_COLORS.special1 },
      { id: 'design', label: 'Design', color: SANKEY_COLORS.special3 },
      { id: 'prototype', label: 'Prototype', color: SANKEY_COLORS.expense6 },
      { id: 'testing', label: 'Testing', color: SANKEY_COLORS.expense4 },
      { id: 'development', label: 'Development', color: SANKEY_COLORS.special4 },
      { id: 'review', label: 'Review', color: SANKEY_COLORS.expense8 },
      { id: 'deployment', label: 'Deployment', color: SANKEY_COLORS.special7 },
      { id: 'production', label: 'Production', color: SANKEY_COLORS.revenue1, glow: { enabled: true, color: SANKEY_COLORS.revenue1 } },
      { id: 'feedback', label: 'Feedback', color: SANKEY_COLORS.revenue5 },
    ],
    links: [
      { source: 'ideas', target: 'research', value: 100, particles: { enabled: true, count: 30, speed: 0.02, glow: true } },
      { source: 'research', target: 'design', value: 80 },
      { source: 'design', target: 'prototype', value: 70 },
      { source: 'prototype', target: 'testing', value: 70 },
      { source: 'testing', target: 'development', value: 50 },
      { source: 'testing', target: 'design', value: 20, opacity: 0.5 },
      { source: 'development', target: 'review', value: 50 },
      { source: 'review', target: 'deployment', value: 45 },
      { source: 'review', target: 'development', value: 5, opacity: 0.5 },
      { source: 'deployment', target: 'production', value: 45, particles: { enabled: true, count: 20, speed: 0.015 } },
      { source: 'production', target: 'feedback', value: 45 },
      { source: 'feedback', target: 'ideas', value: 30, opacity: 0.6, curvature: 0.8 },
      { source: 'feedback', target: 'research', value: 15, opacity: 0.5, curvature: 0.7 },
    ],
    metadata: {
      title: 'Product Development Workflow',
      description: 'Ideas to production flow',
      units: 'tasks',
    },
  };

  const datasets = {
    energy: energyFlowData,
    budget: budgetFlowData,
    workflow: workflowData,
    usBudget: usBudgetData,
  };

  const config: FxSankeyConfig = {
    data: datasets[selectedDataset],
    layout: {
      type: 'hierarchical',
      alignment: 'justify',
      nodeSpacing: 0.3,
      levelSpacing: 2,
    },
    theme: {
      background: '#14080E',
      nodeStyle: 'solid',  // Changed from 'liquid' to show actual colors
      linkStyle: 'bezier',
      colorScheme: 'custom',  // Use custom colors from data
    },
    animation: {
      duration: 1000,
      easing: 'easeInOut',
      autoPlay: true,
    },
    interaction: {
      hover: true,
      click: true,
      drag: true,
      zoom: true,
      rotate: true,
      tooltips: true,
    },
    views: [
      { name: 'default', description: 'Default view', config: {} },
      { name: 'top', description: 'Top view', config: {} },
      { name: 'side', description: 'Side view', config: {} },
      { name: 'flow', description: 'Flow view', config: {} },
    ],
    defaultView: 'default',
    performance: {
      maxParticles: 1000,
      useLOD: true,
      shadowQuality: 'medium',
      antialias: true,
    },
  };

  return (
    <div className="fxsankey-demo-container">
      <div className="fxsankey-demo-header">
        <h2>FxSankey Visualization Demo</h2>
        <div className="fxsankey-demo-selector">
          <button
            className={selectedDataset === 'usBudget' ? 'active' : ''}
            onClick={() => setSelectedDataset('usBudget')}
          >
            US Budget
          </button>
          <button
            className={selectedDataset === 'energy' ? 'active' : ''}
            onClick={() => setSelectedDataset('energy')}
          >
            Energy Flow
          </button>
          <button
            className={selectedDataset === 'budget' ? 'active' : ''}
            onClick={() => setSelectedDataset('budget')}
          >
            Personal Budget
          </button>
          <button
            className={selectedDataset === 'workflow' ? 'active' : ''}
            onClick={() => setSelectedDataset('workflow')}
          >
            Workflow
          </button>
        </div>
      </div>
      
      <FxSankey
        config={config}
        height="600px"
        onNodeClick={(node: any) => console.log('Node clicked:', node)}
        onNodeHover={(node: any) => console.log('Node hovered:', node)}
        onLinkClick={(link: any) => console.log('Link clicked:', link)}
        onLinkHover={(link: any) => console.log('Link hovered:', link)}
      />
      
      <div className="fxsankey-demo-info">
        <h3>{datasets[selectedDataset].metadata?.title}</h3>
        <p>{datasets[selectedDataset].metadata?.description}</p>
      </div>
    </div>
  );
};

export default FxSankeyDemo;