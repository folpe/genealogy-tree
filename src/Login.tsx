import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PASSWORD = 'Khau2025'

export const Login = () => {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === PASSWORD) {
      localStorage.setItem('access_granted', 'true')
      navigate('/tree')
    } else {
      setError('Mot de passe incorrect.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h1 className="text-white text-2xl font-bold mb-6 text-center">
          🔒 Accès sécurisé
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <input
            type="password"
            placeholder="Mot de passe"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mb-4 px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            className="bg-white text-black font-semibold py-2 rounded-lg hover:bg-gray-200 transition"
          >
            Entrer
          </button>
        </form>
        <p className="text-gray-400 text-xs text-center mt-6">
          Accès réservé à la famille ✨
        </p>
      </div>
    </div>
  )
}
