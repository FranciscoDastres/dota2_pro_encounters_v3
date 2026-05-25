import request from 'supertest'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { mockAxiosGet, mockQuery } = vi.hoisted(() => ({
  mockAxiosGet: vi.fn(),
  mockQuery: vi.fn(),
}))

vi.mock('axios', () => ({
  AxiosError: class AxiosError extends Error {},
  default: {
    create: vi.fn(() => ({ get: vi.fn() })),
    get: mockAxiosGet,
    isAxiosError: vi.fn(),
  },
}))

vi.mock('../services/database.service', () => ({
  query: mockQuery,
}))

const { default: app } = await import('../app')

describe('GET /api/health/deep', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockQuery.mockResolvedValue({ rows: [{ '?column?': 1 }] })
    mockAxiosGet.mockResolvedValue({ status: 200 })
  })

  it('returns 200 when database and OpenDota checks pass', async () => {
    const res = await request(app).get('/api/health/deep')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      status: 'ok',
      checks: { database: 'ok', openDota: 'ok' },
    })
  })

  it('returns 503 when the database check fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('database down'))

    const res = await request(app).get('/api/health/deep')

    expect(res.status).toBe(503)
    expect(res.body).toMatchObject({
      status: 'degraded',
      checks: { database: 'error', openDota: 'ok' },
    })
  })
})
