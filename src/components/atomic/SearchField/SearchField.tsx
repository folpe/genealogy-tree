import React, { useState } from 'react'

interface ISearchField {
  onSearch: (query: string) => void
}

export const SearchField: React.FC<ISearchField> = ({ onSearch }) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

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
    <div
      className={`relative w-full max-w-sm transition-all duration-200 ${
        isFocused ? 'scale-105' : ''
      }`}
    >
      <div
        className={`flex items-center w-full bg-gray-800/20 backdrop-blur-sm border ${
          isFocused
            ? 'border-blue-400 shadow-md shadow-blue-500/20'
            : 'border-gray-600/30'
        } rounded-lg overflow-hidden transition-all duration-200`}
      >
        {/* Icône de recherche */}
        <div className="flex items-center justify-center pl-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Champ de saisie */}
        <input
          type="text"
          className="w-full py-2 px-3 bg-transparent text-gray-100 placeholder-gray-400 focus:outline-none"
          placeholder="Rechercher une personne..."
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Bouton d'effacement */}
        {query && (
          <button
            className="flex items-center justify-center w-8 h-8 mr-1 text-gray-400 hover:text-gray-200 transition-colors"
            onClick={handleClear}
            aria-label="Effacer la recherche"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
