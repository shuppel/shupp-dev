import React from 'react';
import FxSankey from './FxSankey';
import type { FxSankeyConfig, FxSankeyData } from '../../lib/fxsankey/types';

// Comprehensive color palette
const COLORS = {
  coal: '#5D4037',        // Dark Brown
  naturalGas: '#42A5F5',  // Light Blue
  nuclear: '#7B1FA2',     // Purple
  renewable: '#43A047',   // Green
  electricity: '#FFB300',  // Amber
  heat: '#EF5350',        // Red
  residential: '#26A69A', // Teal
  commercial: '#5C6BC0',  // Indigo
  industrial: '#8D6E63',  // Brown
};

const FxSankeyWrapper: React.FC = () => {
  const energyFlowData: FxSankeyData = {
    nodes: [
      { id: 'coal', label: 'Coal', color: COLORS.coal },
      { id: 'natural-gas', label: 'Natural Gas', color: COLORS.naturalGas },
      { id: 'nuclear', label: 'Nuclear', color: COLORS.nuclear },
      { id: 'renewable', label: 'Renewable', color: COLORS.renewable },
      { id: 'electricity', label: 'Electricity', color: COLORS.electricity },
      { id: 'heat', label: 'Heat', color: COLORS.heat },
      { id: 'residential', label: 'Residential', color: COLORS.residential },
      { id: 'commercial', label: 'Commercial', color: COLORS.commercial },
      { id: 'industrial', label: 'Industrial', color: COLORS.industrial },
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
      nodeStyle: 'solid',  // Changed to show actual colors
      linkStyle: 'bezier',
      colorScheme: 'custom',
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