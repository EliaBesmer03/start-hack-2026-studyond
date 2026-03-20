import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract the path after /api/slsp/
  const { path } = req.query
  const pathStr = Array.isArray(path) ? path.join('/') : (path ?? '')

  // Build target URL
  const target = `https://swisscovery.slsp.ch/${pathStr}`
  const url = new URL(target)

  // Forward query parameters (except the catch-all path)
  const params = new URLSearchParams(req.query as Record<string, string>)
  params.delete('path')
  url.search = params.toString()

  try {
    const response = await fetch(url.toString(), {
      method: req.method ?? 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, */*',
      },
    })

    const body = await response.text()

    res.setHeader('Content-Type', response.headers.get('content-type') ?? 'text/xml')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(response.status).send(body)
  } catch (err) {
    res.status(502).json({ error: 'Failed to proxy request to SLSP' })
  }
}
