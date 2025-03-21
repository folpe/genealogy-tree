const { Client } = require('@notionhq/client')
require('dotenv').config()
let NodeCache = null
try {
  NodeCache = require('node-cache')
} catch (error) {
  // Le module n'est pas disponible
}

// Cache temporaire en mémoire pour les environnements sans gestionnaire de cache persistant
let memoryCache = {
  data: null,
  timestamp: 0,
  ttl: 10 * 60 * 1000, // 10 minutes en millisecondes
}

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const databaseId = process.env.NOTION_DATABASE_ID

// Initialiser le cache si disponible
const resultsCache = NodeCache ? new NodeCache({ stdTTL: 10 * 60 }) : null

async function getAllPagesFromDatabase(useCache = true) {
  const cacheKey = 'all_notion_pages'

  // Vérifier le cache si useCache est true
  if (useCache) {
    // Si node-cache est disponible
    if (resultsCache) {
      const cachedPages = resultsCache.get(cacheKey)
      if (cachedPages) {
        console.log('Utilisation des pages en cache (NodeCache)')
        return cachedPages
      }
    }
    // Sinon, utiliser le cache en mémoire simple
    else {
      const now = Date.now()
      if (memoryCache.data && now - memoryCache.timestamp < memoryCache.ttl) {
        console.log('Utilisation des pages en cache (mémoire)')
        return memoryCache.data
      }
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
  if (resultsCache) {
    resultsCache.set(cacheKey, pages)
  } else {
    memoryCache.data = pages
    memoryCache.timestamp = Date.now()
  }

  return pages
}

exports.handler = async (event, context) => {
  // Configurer CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }

  // Pour les requêtes OPTIONS (pré-vol CORS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  try {
    // Extraire les paramètres de la requête
    const params = event.queryStringParameters || {}
    const useCache = params.useCache !== 'false'

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(sortedPeople),
    }
  } catch (err) {
    console.error('Erreur Notion:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Erreur lors de l'accès à Notion",
        message: err.message,
      }),
    }
  }
}
