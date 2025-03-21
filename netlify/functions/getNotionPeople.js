// netlify/functions/getNotionPeople.js
import { Client } from '@notionhq/client'
import 'dotenv/config'

// Mémoire cache simple
let memoryCache = {
  data: null,
  timestamp: 0,
  ttl: 10 * 60 * 1000, // 10 minutes
}

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const databaseId = process.env.NOTION_DATABASE_ID

async function getAllPagesFromDatabase(useCache = false) {
  // Vérifier le cache si useCache est true
  if (useCache) {
    const now = Date.now()
    if (memoryCache.data && now - memoryCache.timestamp < memoryCache.ttl) {
      console.log('Utilisation des pages en cache (mémoire)')
      return memoryCache.data
    }
  } else {
    console.log('Cache ignoré par choix')
  }

  console.log('Récupération des pages depuis Notion')
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

  // Mettre en cache
  memoryCache.data = pages
  memoryCache.timestamp = Date.now()

  return pages
}

exports.handler = async (event, context) => {
  // Configurer CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }

  // Pour les requêtes OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  try {
    const params = event.queryStringParameters || {}
    const useCache = params.useCache !== 'false'

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
        .sort((a, b) => {
          if (!a.birthDate?.date?.start) return 1
          if (!b.birthDate?.date?.start) return -1
          return (
            new Date(a.birthDate?.date?.start).getTime() -
            new Date(b.birthDate?.date?.start).getTime()
          )
        })

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
      if (!a.birthDate) return 1
      if (!b.birthDate) return -1
      return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime()
    })

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
