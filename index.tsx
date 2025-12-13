import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Error Boundary simple para evitar pantalla blanca
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '2rem', fontFamily: 'sans-serif', color: '#7f1d1d', background: '#fef2f2', height: '100vh'}}>
          <h1>⚠️ Algo salió mal</h1>
          <p>La aplicación ha encontrado un error crítico.</p>
          <pre style={{background: '#fff', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto'}}>
            {this.state.error?.toString()}
          </pre>
          <p>Sugerencia: Verifica que hayas añadido <code>"homepage": "."</code> en tu <code>package.json</code>.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{marginTop: '1rem', padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.25rem'}}
          >
            Recargar Aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);