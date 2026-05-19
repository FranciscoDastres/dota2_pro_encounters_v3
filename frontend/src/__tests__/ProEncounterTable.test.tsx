import { render, screen } from '@testing-library/react'
import { ProEncounterTable } from '../components/ProEncounterTable'
import type { ProEncountersResponse } from '../types'

const mockData: ProEncountersResponse = {
  account_id: 12345678,
  pros: [
    {
      account_id: 87278757,
      name: 'Miracle-',
      avatarfull: 'https://example.com/avatar.jpg',
      profileurl: 'https://steamcommunity.com/id/Miracle-/',
      personaname: 'Miracle-',
      team_name: 'Team Liquid',
      last_match_time: '2024-01-15T20:00:00.000Z',
      games: 3,
      win: 2,
      country_code: 'JO',
    },
    {
      account_id: 111620041,
      name: 'Puppey',
      avatarfull: 'https://example.com/avatar2.jpg',
      profileurl: 'https://steamcommunity.com/id/Puppey/',
      personaname: 'Puppey',
      team_name: 'Team Secret',
      last_match_time: '2023-11-20T18:30:00.000Z',
      games: 1,
      win: 0,
      country_code: 'EE',
    },
  ],
}

describe('ProEncounterTable', () => {
  it('shows the account id', () => {
    render(<ProEncounterTable data={mockData} />)
    expect(screen.getByText(/#12345678/)).toBeInTheDocument()
  })

  it('renders the correct pro count in the summary', () => {
    render(<ProEncounterTable data={mockData} />)
    const bar = screen.getByTestId('summary-bar')
    expect(bar).toHaveTextContent('2')
    expect(bar).toHaveTextContent('pros found')
  })

  it('renders all pro player names', () => {
    render(<ProEncounterTable data={mockData} />)
    expect(screen.getByRole('link', { name: /Miracle-/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Puppey/ })).toBeInTheDocument()
  })

  it('renders profile links with correct href and target', () => {
    render(<ProEncounterTable data={mockData} />)
    const link = screen.getByRole('link', { name: /Miracle-/ })
    expect(link).toHaveAttribute('href', 'https://steamcommunity.com/id/Miracle-/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders team names', () => {
    render(<ProEncounterTable data={mockData} />)
    expect(screen.getByText('Team Liquid')).toBeInTheDocument()
    expect(screen.getByText('Team Secret')).toBeInTheDocument()
  })

  it('renders all column headers', () => {
    render(<ProEncounterTable data={mockData} />)
    expect(screen.getByText('Player')).toBeInTheDocument()
    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('Games')).toBeInTheDocument()
    expect(screen.getByText('W')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('Win Rate')).toBeInTheDocument()
  })

  it('renders avatar images with alt text', () => {
    render(<ProEncounterTable data={mockData} />)
    expect(screen.getByAltText("Miracle-'s avatar")).toBeInTheDocument()
  })
})
