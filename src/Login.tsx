import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from './assets/logo.svg'

export const Login = () => {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const tryLogin = async (enteredPassword: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password: enteredPassword }),
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await res.json()

    if (data.auth) {
      localStorage.setItem('access_granted', 'true')
      navigate('/tree')
    } else {
      setError('Mot de passe incorrect.')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    tryLogin(input)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="mb-6">
          <div>
            <img
              src={Logo}
              alt="Ances-Tree Logo"
              className="w-20 h-20 mx-auto mb-2"
            />
          </div>
          <h1 className="text-white text-3xl font-bold text-center">
            Ances-Tree
          </h1>
          <p className="text-gray-400 text-sm text-center mt-1">
            Explorez votre histoire familiale
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="relative mb-6">
            <input
              type="password"
              placeholder="Mot de passe"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30 pr-10 border border-white/20"
            />
            <span className="absolute right-3 top-3 text-gray-300">🔑</span>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="bg-white text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-lg"
          >
            Accéder à l'arbre familial
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-white/10">
          <p className="text-gray-400 text-xs text-center">
            Accès réservé à la famille ✨<br />© 2025 Ances-Tree
          </p>
        </div>
      </div>
    </div>
  )
}
