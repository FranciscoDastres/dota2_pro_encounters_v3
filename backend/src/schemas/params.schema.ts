import { z } from 'zod'

// Dota 2 account IDs are 32-bit unsigned integers (Steam ID3 format): 1–4 294 967 295
const accountIdField = z
  .string()
  .regex(/^\d{1,10}$/, 'Invalid account ID: numbers only')
  .refine(
    (val) => {
      const n = Number(val)
      return n >= 1 && n <= 4_294_967_295
    },
    { message: 'Account ID must be between 1 and 4 294 967 295' },
  )

const matchIdField = z
  .string()
  .regex(/^\d{1,12}$/, 'Invalid match ID: numbers only')
  .refine(
    (val) => {
      const n = Number(val)
      return n >= 1 && n <= 999_999_999_999
    },
    { message: 'Match ID must be between 1 and 999 999 999 999' },
  )

export const proEncountersParamsSchema = z.object({
  accountId: accountIdField,
})

export const proMatchesParamsSchema = z.object({
  accountId: accountIdField,
  proAccountId: accountIdField,
})

export const carryComparisonParamsSchema = z.object({
  accountId: accountIdField,
  matchId: matchIdField,
  heroId: accountIdField,
})
