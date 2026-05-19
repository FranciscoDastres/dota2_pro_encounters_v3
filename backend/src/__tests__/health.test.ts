import request from 'supertest'
import app, { isAllowedCorsOrigin } from '../app'

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok' })
    expect(typeof res.body.timestamp).toBe('string')
  })
})

describe('CORS origin allowlist', () => {
  it('allows server-to-server requests without an origin', () => {
    expect(isAllowedCorsOrigin(undefined)).toBe(true)
  })

  it('allows the configured frontend origin', () => {
    expect(isAllowedCorsOrigin('http://localhost:5173')).toBe(true)
  })

  it('allows common local development origins on any port', () => {
    expect(isAllowedCorsOrigin('http://localhost:5174', true)).toBe(true)
    expect(isAllowedCorsOrigin('http://127.0.0.1:3001', true)).toBe(true)
    expect(isAllowedCorsOrigin('http://192.168.1.25:5173', true)).toBe(true)
  })

  it('does not allow arbitrary origins', () => {
    expect(isAllowedCorsOrigin('https://example.com', true)).toBe(false)
  })
})
