import React, { useState } from 'react';
import FxSankey from './FxSankey';
import type { FxSankeyConfig, FxSankeyData } from '../../lib/fxsankey/types';

const FxSankeyDemo: React.FC = () => {
  const [selectedDataset, setSelectedDataset] = useState<'energy' | 'budget' | 'workflow'>('energy');

  const energyFlowData: FxSankeyData = {
    nodes: [
      { id: 'coal', label: 'Coal' },
      { id: 'natural-gas', label: 'Natural Gas' },
      { id: 'nuclear', label: 'Nuclear' },
      { id: 'renewable', label: 'Renewable' },
      { id: 'electricity', label: 'Electricity' },
      { id: 'heat', label: 'Heat' },
      { id: 'residential', label: 'Residential' },
      { id: 'commercial', label: 'Commercial' },
      { id: 'industrial', label: 'Industrial' },
      { id: 'transport', label: 'Transport' },
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
      { id: 'income', label: 'Income' },
      { id: 'salary', label: 'Salary' },
      { id: 'investments', label: 'Investments' },
      { id: 'housing', label: 'Housing' },
      { id: 'food', label: 'Food' },
      { id: 'transport-exp', label: 'Transport' },
      { id: 'utilities', label: 'Utilities' },
      { id: 'entertainment', label: 'Entertainment' },
      { id: 'savings', label: 'Savings' },
      { id: 'emergency', label: 'Emergency Fund' },
      { id: 'retirement', label: 'Retirement' },
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

  const workflowData: FxSankeyData = {
    nodes: [
      { id: 'ideas', label: 'Ideas', glow: { enabled: true, color: '#E9EB9E' } },
      { id: 'research', label: 'Research' },
      { id: 'design', label: 'Design' },
      { id: 'prototype', label: 'Prototype' },
      { id: 'testing', label: 'Testing' },
      { id: 'development', label: 'Development' },
      { id: 'review', label: 'Review' },
      { id: 'deployment', label: 'Deployment' },
      { id: 'production', label: 'Production', glow: { enabled: true, color: '#ACC196' } },
      { id: 'feedback', label: 'Feedback' },
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
      { source: 'deployment', target: 'production', value: 45, particles: { enabled: true, count: 20, speed: 0.015, color: '#ACC196' } },
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
      nodeStyle: 'liquid',
      linkStyle: 'bezier',
      colorScheme: 'opulent',
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
            className={selectedDataset === 'energy' ? 'active' : ''}
            onClick={() => setSelectedDataset('energy')}
          >
            Energy Flow
          </button>
          <button
            className={selectedDataset === 'budget' ? 'active' : ''}
            onClick={() => setSelectedDataset('budget')}
          >
            Budget Flow
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
        <div className="fxsankey-demo-features">
          <h4>Features:</h4>
          <ul>
            <li>✨ Liquid-inspired node animations</li>
            <li>🌊 Flowing link animations with gradients</li>
            <li>🎯 Smart view presets (Default, Top, Side, Flow)</li>
            <li>🔍 Interactive hover and click events</li>
            <li>🎨 Opulent color schemes and glass morphism</li>
            <li>⚡ Particle systems for enhanced visual effects</li>
            <li>📊 Multiple dataset support</li>
            <li>🎮 Full 3D navigation with OrbitControls</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FxSankeyDemo;