import React from 'react';
import ReactDOM from 'react-dom/client';
import FxSankeyDemo from './FxSankeyDemo.js';

export function mountFxSankeyDemo() {
  const container = document.getElementById('tool-mount') || document.getElementById('fxsankey-demo');
  
  if (!container) {
    console.error('FxSankey container not found');
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(FxSankeyDemo));
}