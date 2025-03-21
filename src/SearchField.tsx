import React, { useState } from 'react'

interface ISearchField {
  onSearch: (query: string) => void
}

export const SearchField: React.FC<ISearchField> = ({ onSearch }) => {
  const [query, setQuery] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    onSearch(newQuery)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className="relative w-full max-w-sm">
      <input
        type="text"
        className="w-full p-2 pl-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Rechercher une personne..."
        value={query}
        onChange={handleChange}
      />
      {query && (
        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={handleClear}
        >
          ✕
        </button>
      )}
    </div>
  )
}
