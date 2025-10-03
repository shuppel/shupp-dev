import React from 'react';
import ReactDOM from 'react-dom/client';
import Calculator from './Calculator';

export function mount(): void {
  const container = document.getElementById('tool-mount');
  if (container) {
    container.innerHTML = '';
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(Calculator));
  }
}