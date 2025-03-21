import 'dotenv/config'

export async function handler(event) {
  const { password } = JSON.parse(event.body || '{}')

  if (password === process.env.FAMILYTREE_SECRET) {
    return {
      statusCode: 200,
      body: JSON.stringify({ auth: true }),
    }
  }

  return {
    statusCode: 401,
    body: JSON.stringify({ auth: false }),
  }
}
