import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  MatchBenchmarkHeader,
  PurchaseTrailSection,
} from '../components/comparison/CarryMatchSections'
import type { CarryComparisonResponse } from '../types'

describe('MatchBenchmarkHeader', () => {
  it('links the selected match to OpenDota in a new tab', () => {
    const data = {
      match_id: 8827126159,
      fulfilled_role: true,
      scenario: 'stomp',
      role_info: {
        position: 1,
        label: 'Carry',
        title: 'Hard Carry',
      },
      efficiency_gap: {
        score: 0.9,
        gpmRatio: 1,
        lh10Ratio: 1,
        feedback: 'Good performance.',
      },
      metrics: [],
      raw_user: {
        kills: 10,
        deaths: 2,
        assists: 8,
        net_worth: 25000,
        obs_placed: 0,
        sen_placed: 0,
      },
    } as unknown as CarryComparisonResponse

    render(
      <MatchBenchmarkHeader
        data={data}
        hero={undefined}
        heroId={41}
        percentile={99}
        efficiencyScore={90}
        kda="9.0"
      />,
    )

    const link = screen.getByRole('link', { name: /ver partida en opendota/i })
    expect(link).toHaveAttribute('href', 'https://www.opendota.com/matches/8827126159')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders scrollable user and ranked reference trails with an evaluation', () => {
    const purchase = {
      timeMinute: 13,
      itemKey: 'maelstrom',
      itemName: 'Maelstrom',
      iconUrl: 'https://cdn.test/maelstrom.png',
      slotLabel: null,
      description: 'Chain lightning.',
    }

    const { container } = render(
      <PurchaseTrailSection
        purchaseTrail={[purchase]}
        reference={{
          accountId: 100058342,
          playerName: 'skiter',
          rankingScore: 8314.43,
          rankTier: 80,
          matchId: 8742496748,
          startTime: 1774386240,
          patchId: 60,
          patchName: '7.41',
          withinLast14Days: false,
          purchaseTrail: [{ ...purchase, timeMinute: 11 }],
        }}
        comparison={{
          items: [{
            itemKey: 'maelstrom',
            itemName: 'Maelstrom',
            iconUrl: purchase.iconUrl,
            userMinute: 13,
            referenceMinute: 11,
            differenceMinutes: 2,
            status: 'close',
          }],
          evaluation: {
            status: 'close',
            summary: 'Tu progresión estuvo cerca de la referencia.',
            improvements: ['Mantén este ritmo.'],
            aheadCount: 0,
            closeCount: 1,
            behindCount: 0,
            missingCount: 0,
          },
        }}
      />,
    )

    expect(screen.getByText(/referencia top-ranked · skiter/i)).toBeInTheDocument()
    expect(screen.getByText(/evaluación de timings/i)).toBeInTheDocument()
    expect(screen.getByText(/qué mejorar/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver referencia/i })).toHaveAttribute(
      'href',
      'https://www.opendota.com/matches/8742496748',
    )
    expect(container.querySelectorAll('.max-h-\\[300px\\]')).toHaveLength(2)
    expect(container.querySelectorAll('.min-h-\\[34px\\]')).toHaveLength(2)
  })
})
