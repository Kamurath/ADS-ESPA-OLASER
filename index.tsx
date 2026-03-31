
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

/**
 * Ponto de entrada do Dashboard
 * O uso de createRoot garante compatibilidade com React 19.
 */
const initDashboard = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("ERRO: Root element não encontrado.");
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Dashboard ADS: Pronto para uso.");
  } catch (err) {
    console.error("Dashboard ADS: Erro na montagem:", err);
    rootElement.innerHTML = `<div style="padding: 20px; color: #f87171; font-family: sans-serif; font-size: 12px;">
      Erro crítico de renderização: ${err.message}
    </div>`;
  }
};

// Garante que o script rode apenas após o DOM estar disponível
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
