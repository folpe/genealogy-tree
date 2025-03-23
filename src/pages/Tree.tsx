import React, { useEffect, useState } from 'react'
import { SynthesisSection } from '../components/SynthesisSection'
import { SearchField } from '../components/atomic/SearchField'
import { Person } from '../components/FamilyTree/FamilyTree.types'
import { PersonCard } from '../components/PersonCard'

import Logo from '../assets/logo.svg'

import { FamilyTree } from '../components/FamilyTree'
import { Loader } from '../components/atomic/Loader/Loader'
import { getMatchingIds } from '../components/FamilyTree/FamilyTree.utils'

const USE_CACHE = false

export const Tree: React.FC = () => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([])
  const [shouldFocusOnNodes, setShouldFocusOnNodes] = useState(false)
  const [shouldResetZoom, setShouldResetZoom] = useState(false)
  const [familyData, setFamilyData] = useState({
    data: [],
    isLoading: false,
    isError: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      setFamilyData((prev) => ({ ...prev, isLoading: true }))
      try {
        const response = await fetch(
          `/api/getNotionPeople${USE_CACHE ? '?useCache=true' : '?useCache=false'}`
        )
        if (!response.ok) {
          setFamilyData((prev) => ({
            ...prev,
            isLoading: false,
            isError: 'Erreur lors du chargement des données',
          }))
          throw new Error('Erreur lors du chargement des données')
        }
        const jsonData = await response.json()
        console.log('data', jsonData)
        setFamilyData((prev) => ({ ...prev, isLoading: false, data: jsonData }))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setFamilyData((prev) => ({
          ...prev,
          isLoading: false,
          isError: errorMessage,
        }))
        console.error(errorMessage)
      }
    }

    fetchData()
  }, [])

  const handleSearch = (query: string) => {
    // Si la requête est vide, réinitialiser tout
    if (!query.trim()) {
      setHighlightedNodes([])

      // Déclencher la réinitialisation du zoom
      setShouldResetZoom(true)
      setShouldFocusOnNodes(false)
      return
    }

    const matches = getMatchingIds(familyData.data, query)
    setHighlightedNodes(matches)

    // Déclencher la focalisation sur les nœuds correspondants
    if (matches.length > 0) {
      setShouldFocusOnNodes(true)
      setShouldResetZoom(false)
    }
  }

  // Cette fonction sera appelée par FamilyTree pour indiquer
  // que l'action a été exécutée
  const handleZoomActionComplete = () => {
    setShouldFocusOnNodes(false)
    setShouldResetZoom(false)
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <header className="w-full px-4 sm:px-8 py-4 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between">
        {/* Logo et titre - centré sur mobile, aligné à gauche sur desktop */}
        <div className="flex items-center w-full sm:w-1/3 justify-center sm:justify-start mb-3 sm:mb-0 order-1">
          <img src={Logo} alt="Ances-Tree Logo" className="h-10 w-10 mr-3" />
          <h1 className="text-2xl font-bold text-white">Ances-Tree</h1>
        </div>

        {/* Barre de recherche - pleine largeur sur mobile, 1/3 sur desktop */}
        <div className="flex items-center justify-center w-full sm:w-1/3 order-3 sm:order-2">
          <SearchField onSearch={handleSearch} />
        </div>

        {/* Section de synthèse - cachée sur mobile, visible sur desktop */}
        <div className="hidden sm:flex items-center justify-end w-full sm:w-1/3 order-2 sm:order-3">
          {familyData.isLoading ? (
            <Loader dots />
          ) : (
            <SynthesisSection people={familyData.data} />
          )}
        </div>
      </header>

      <main className="flex-1 p-4 w-full">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-2xl w-full h-full">
          <div className="relative w-full h-[750px] overflow-hidden">
            {familyData.isLoading ? (
              <Loader />
            ) : (
              <div className="h-full">
                <p className="absolute bottom-2 right-2 text-sm text-gray-400">
                  Utilisez la souris pour déplacer et zoomer (molette)
                </p>
                {highlightedNodes.length > 0 && (
                  <div className="absolute top-2 left-2 bg-white/10 border border-white/20 p-2 rounded-lg shadow-sm">
                    <p className="text-white text-sm">
                      {highlightedNodes.length} résultat(s) trouvé(s)
                    </p>
                  </div>
                )}
                <FamilyTree
                  data={familyData.data}
                  selectPersonFunc={(person) => setSelectedPerson(person)}
                  highlightedNodes={highlightedNodes}
                  shouldFocusOnNodes={shouldFocusOnNodes}
                  shouldResetZoom={shouldResetZoom}
                  onZoomActionComplete={handleZoomActionComplete}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="flex align-center justify-center p-4 w-full">
        {selectedPerson && (
          <PersonCard
            people={familyData.data}
            closeCardFunc={() => setSelectedPerson(null)}
            selectedPerson={selectedPerson}
            selectPersonFunc={setSelectedPerson}
          />
        )}
      </div>

      <footer className="w-full p-3 bg-white/5 border-t border-white/10 text-center">
        <p className="text-gray-400 text-xs">
          Accès réservé à la famille ✨ © 2025 Ances-Tree
        </p>
      </footer>
    </div>
  )
}
