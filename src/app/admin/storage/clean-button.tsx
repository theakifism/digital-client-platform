'use client'

export default function CleanButton({ count }: { count: number }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(`Delete ${count > 200 ? 'the first 200 of ' : ''}${count} unused photo file${count === 1 ? '' : 's'}? This cannot be undone.`)) e.preventDefault()
      }}
    >
      Delete unused photos
    </button>
  )
}
