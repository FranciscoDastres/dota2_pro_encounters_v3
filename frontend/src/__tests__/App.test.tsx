import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('../hooks/useProEncounters', () => ({
  useProEncounters: () => ({
    data: null,
    status: 'idle',
    error: null,
    search: vi.fn(),
    reset: vi.fn(),
  }),
}))

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    // h1 spans two child elements — query by role
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders the search form in idle state', () => {
    render(<App />)
    expect(screen.getByPlaceholderText(/account id/i)).toBeInTheDocument()
  })

  it('does not render results table in idle state', () => {
    render(<App />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
