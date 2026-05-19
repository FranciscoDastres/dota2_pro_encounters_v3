import { describe, it, expect } from 'vitest'
import { proEncountersParamsSchema, proMatchesParamsSchema } from '../schemas/params.schema'

describe('proEncountersParamsSchema', () => {
  it('accepts a valid numeric account ID', () => {
    expect(proEncountersParamsSchema.safeParse({ accountId: '12345678' }).success).toBe(true)
  })

  it('accepts the minimum valid account ID (1)', () => {
    expect(proEncountersParamsSchema.safeParse({ accountId: '1' }).success).toBe(true)
  })

  it('accepts the maximum valid account ID (4294967295)', () => {
    expect(proEncountersParamsSchema.safeParse({ accountId: '4294967295' }).success).toBe(true)
  })

  it('rejects 0 (below minimum)', () => {
    const result = proEncountersParamsSchema.safeParse({ accountId: '0' })
    expect(result.success).toBe(false)
  })

  it('rejects a value exceeding 4294967295', () => {
    const result = proEncountersParamsSchema.safeParse({ accountId: '4294967296' })
    expect(result.success).toBe(false)
  })

  it('rejects an account ID with letters only', () => {
    const result = proEncountersParamsSchema.safeParse({ accountId: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/invalid/i)
    }
  })

  it('rejects a mixed alphanumeric account ID', () => {
    const result = proEncountersParamsSchema.safeParse({ accountId: '123abc' })
    expect(result.success).toBe(false)
  })

  it('rejects a negative value expressed as a string', () => {
    const result = proEncountersParamsSchema.safeParse({ accountId: '-1' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = proEncountersParamsSchema.safeParse({ accountId: '' })
    expect(result.success).toBe(false)
  })
})

describe('proMatchesParamsSchema', () => {
  it('accepts valid accountId and proAccountId', () => {
    const result = proMatchesParamsSchema.safeParse({
      accountId: '12345678',
      proAccountId: '87278757',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when accountId is invalid', () => {
    const result = proMatchesParamsSchema.safeParse({
      accountId: 'abc',
      proAccountId: '87278757',
    })
    expect(result.success).toBe(false)
  })

  it('rejects when proAccountId is invalid', () => {
    const result = proMatchesParamsSchema.safeParse({
      accountId: '12345678',
      proAccountId: 'abc',
    })
    expect(result.success).toBe(false)
  })

  it('rejects when both IDs are invalid', () => {
    const result = proMatchesParamsSchema.safeParse({
      accountId: 'abc',
      proAccountId: 'xyz',
    })
    expect(result.success).toBe(false)
  })

  it('rejects when proAccountId is 0', () => {
    const result = proMatchesParamsSchema.safeParse({
      accountId: '12345678',
      proAccountId: '0',
    })
    expect(result.success).toBe(false)
  })

  it('rejects when proAccountId is missing', () => {
    const result = proMatchesParamsSchema.safeParse({ accountId: '12345678' })
    expect(result.success).toBe(false)
  })
})
