import { AlertTriangle, RefreshCw } from 'lucide-react'

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger">
      <div className="flex items-center gap-3">
        <AlertTriangle size={18}/>
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1.5 text-xs font-medium hover:text-red-300 transition-colors">
          <RefreshCw size={13}/> Reintentar
        </button>
      )}
    </div>
  )
}
