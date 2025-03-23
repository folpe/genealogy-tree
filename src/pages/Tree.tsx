import React, { useEffect, useRef, useState } from 'react'
import { SynthesisSection } from '../components/SynthesisSection'
import { SearchField } from '../components/atomic/SearchField'
import { Person } from '../components/FamilyTree/FamilyTree.types'
import { PersonCard } from '../components/PersonCard'

import Logo from '../assets/logo.svg'
import { getMatchingIds } from '../FamilyTree.helpers'

import { select } from 'd3'
import { FamilyTree } from '../components/FamilyTree'
import { Loader } from '../components/atomic/Loader/Loader'

const USE_CACHE = true

export const Tree: React.FC = () => {
  const svgRef = useRef(null)

  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([])
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

      // Réinitialiser tous les nœuds à leur apparence normale
      if (svgRef.current) {
        // Réinitialiser les cercles des nœuds principaux
        select(svgRef.current)
          .selectAll('.node circle')
          .attr('stroke-width', 2)
          .attr('stroke', (d: any) => (d.data.isAlive ? 'green' : 'black'))
          .attr('opacity', 1)

        // Réinitialiser les cercles des partenaires
        select(svgRef.current)
          .selectAll('.partner-group circle')
          .attr('stroke-width', 2)
          .attr('stroke', 'black')
          .attr('opacity', 1)
      }
      return
    }

    const matches = getMatchingIds(familyData.data, query)
    setHighlightedNodes(matches)
    // Appliquer immédiatement la surbrillance
    applyHighlights(matches)
  }

  const applyHighlights = (matches: string[]) => {
    if (!svgRef.current || !matches.length) return

    // D'abord, réinitialiser tous les cercles
    // Cercles des nœuds principaux
    select(svgRef.current).selectAll('.node circle').attr('opacity', 0.2)

    // Cercles des partenaires
    select(svgRef.current)
      .selectAll('.partner-group circle')
      .attr('opacity', 0.2)

    // Mettre en surbrillance les nœuds principaux
    select(svgRef.current)
      .selectAll('.node')
      .each(function (d: any) {
        if (matches.includes(d.data.id)) {
          select(this).select('circle').attr('opacity', 1)
        }
      })

    // Mettre en surbrillance les partenaires
    // Pour chaque nœud principal
    select(svgRef.current)
      .selectAll('.partner-group')
      .each(function (data) {
        if (matches.includes((data as Person).id)) {
          select(this).select('circle').attr('opacity', 1)
        }
      })
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
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-6 w-full h-full">
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
                <FamilyTree data={familyData.data} />
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
