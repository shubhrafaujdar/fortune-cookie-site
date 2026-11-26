/** Shown while the fortunes file loads (or if it cannot be found). */
export default function Brewing({ error }) {
  return (
    <div className="brewing" role="status">
      <p>{error ? 'The fortunes could not be found. Please refresh the page.' : 'Brewing a fresh pot of fortunes…'}</p>
      {error && <small>{String(error.message || error)}</small>}
    </div>
  )
}
