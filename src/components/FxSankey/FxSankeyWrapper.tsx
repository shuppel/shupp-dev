import React from 'react';
import FxSankey from './FxSankey';
import type { FxSankeyConfig, FxSankeyData } from '../../lib/fxsankey/types';

const FxSankeyWrapper: React.FC = () => {
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

  const config: FxSankeyConfig = {
    data: energyFlowData,
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
    performance: {
      maxParticles: 1000,
      useLOD: true,
      shadowQuality: 'medium',
      antialias: true,
    },
  };

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <FxSankey
        config={config}
        height="600px"
      />
    </div>
  );
};

export default FxSankeyWrapper;