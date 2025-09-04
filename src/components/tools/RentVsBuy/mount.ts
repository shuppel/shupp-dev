import React from 'react';
import ReactDOM from 'react-dom/client';
import Calculator from './Calculator';

export function mount(): void {
  const container = document.querySelector('.calculator-wrapper');
  if (container) {
    // Clear the loading state
    container.innerHTML = '';
    
    // Create React root and render
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(Calculator));
  }
}