const express = require('express')
const { Client } = require('@notionhq/client')
require('dotenv').config()
const cors = require('cors')
const NodeCache = require('node-cache')

const app = express()
const port = 3001
const resultsCache = new NodeCache({ stdTTL: 10 * 60 }) // 10 minutes

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const databaseId = process.env.NOTION_DATABASE_ID

app.use(cors())

async function getAllPagesFromDatabase(useCache = false) {
  //Vérifier le cache si useCache est true
  const cacheKey = 'all_notion_pages'

  if (useCache) {
    const cachedPages = resultsCache.get(cacheKey)
    if (cachedPages) {
      console.log('Utilisation des pages en cache')
      return cachedPages
    }
  } else {
    console.log('Cache ignoré par choix')
  }

  console.log('Récupération de toutes les pages depuis Notion')
  const pages = []
  let cursor = undefined

  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    })

    pages.push(...response.results)
    cursor = response.next_cursor
  } while (cursor)

  // Mettre en cache pour les requêtes futures
  resultsCache.set(cacheKey, pages)

  return pages
}

app.get('/api/people', async (req, res) => {
  try {
    // Détermine si on doit utiliser le cache
    const useCache = req.query.useCache !== 'false'

    // Récupérer toutes les pages
    const allPages = await getAllPagesFromDatabase(useCache)

    // Créer un index pour un accès rapide
    const pageIndex = {}
    allPages.forEach((page) => {
      pageIndex[page.id] = page
    })

    // Construire les objets personne
    const people = allPages.map((page) => {
      const props = page.properties

      // Récupérer les IDs des enfants via l'index
      const childrenIds = (props.childrenIds?.relation || [])
        .map((rel) => {
          const childPage = pageIndex[rel.id]
          return childPage?.properties.id?.title[0]?.plain_text || null
        })
        .filter(Boolean)

      // Récupérer les IDs des partenaires via l'index
      const partnerIds = (props.partnerId?.relation || [])
        .map((rel) => {
          const partnerPage = pageIndex[rel.id]
          return partnerPage?.properties.id?.title[0]?.plain_text || null
        })
        .filter(Boolean)

      return {
        id: props.id?.title[0]?.plain_text || null,
        firstName: props.firstName?.rich_text[0]?.plain_text ?? '',
        lastName: props.lastName?.rich_text[0]?.plain_text ?? '',
        maidenName: props.maidenName?.rich_text[0]?.plain_text ?? '',
        birthDate: props.birthDate?.date?.start || null,
        birthLocation: props.birthLocation?.rich_text[0]?.plain_text ?? null,
        deathDate: props.deathDate?.date?.start ?? null,
        gender: props.gender?.select?.name ?? '',
        photo: props.photo?.files[0]?.name ?? '',
        partnerId: partnerIds,
        childrenIds: childrenIds,
      }
    })

    // Tri par date de naissance
    const sortedPeople = people.sort((a, b) => {
      // Si une personne n'a pas de date de naissance, la placer à la fin
      if (!a.birthDate) return 1
      if (!b.birthDate) return -1

      // Comparer les dates de naissance
      return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime()
    })

    console.log(
      `Renvoi de ${
        sortedPeople.length
      } personnes, triées par date de naissance (cache ${
        useCache ? 'utilisé' : 'ignoré'
      })`
    )
    res.json(sortedPeople)
  } catch (err) {
    console.error('Erreur Notion:', err)
    res.status(500).json({
      error: "Erreur lors de l'accès à Notion",
      message: err.message,
    })
  }
})

// Endpoint pour vider le cache
app.get('/api/clear-cache', (req, res) => {
  resultsCache.flushAll()
  console.log('Cache vidé avec succès')
  res.json({ success: true, message: 'Cache vidé avec succès' })
})

app.listen(port, () => {
  console.log(`API Notion démarrée sur ${process.env.BASE_URL}:${port}`)
})
