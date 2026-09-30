import Icon from '../ui/Icon'
export default function RefreshButton({ label, loading, lastUpdated, onRefresh, children }) {
  return (
    <span className="placeholder-note sync-refresh">
      <span className="sync-source">{children}</span>
      <button
        type="button"
        className="sync-refresh-button"
        onClick={onRefresh}
        disabled={loading}
        aria-label={label}
        title={label}
      >
        <Icon name="refresh" size={18} />
      </button>
      <span className="sync-status" role="status">
        {loading
          ? 'Refreshing…'
          : lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : ''}
      </span>
    </span>
  )
}
