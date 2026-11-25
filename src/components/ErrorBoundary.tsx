import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'Erro inesperado ao carregar o portal.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; path?: string };
      if (parsed.error) {
        readable = `Permissão ou validação negada em "${parsed.path || 'recurso'}": ${parsed.error}`;
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, message: readable };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] dark:bg-[#0B1410] px-6">
          <div className="max-w-lg w-full bg-white dark:bg-[#11241C] border border-[#C5A467]/40 rounded-2xl p-8 text-center shadow-sm">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#11382B] text-[#C5A467] flex items-center justify-center mb-5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white mb-2">
              Interrupção de Integridade do Portal
            </h2>
            <p className="text-sm text-[#1C2421]/75 dark:text-white/75 leading-relaxed mb-6">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] transition-colors text-sm font-medium cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#C5A467]" />
              Recarregar Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
