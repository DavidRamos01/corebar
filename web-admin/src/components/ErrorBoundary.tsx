import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-danger"/>
          </div>
          <div className="text-center">
            <p className="font-bold text-[#FDF6E3] text-lg">Error al cargar esta página</p>
            <p className="text-sm text-[#A8956A] mt-1 max-w-sm">{this.state.error.message}</p>
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw size={14}/> Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
