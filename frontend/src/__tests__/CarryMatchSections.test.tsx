import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MatchBenchmarkHeader } from '../components/comparison/CarryMatchSections'
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
})
