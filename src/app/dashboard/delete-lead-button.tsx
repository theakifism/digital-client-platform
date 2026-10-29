'use client'

export default function DeleteLeadButton() {
  return (
    <button
      type="submit"
      className="secondary"
      onClick={(e) => {
        if (!window.confirm('Delete this message? This cannot be undone.')) e.preventDefault()
      }}
    >
      Delete
    </button>
  )
}
