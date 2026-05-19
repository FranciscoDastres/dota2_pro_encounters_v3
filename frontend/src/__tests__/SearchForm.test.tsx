import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from '../components/SearchForm'

describe('SearchForm', () => {
  const mockOnSearch = vi.fn()

  beforeEach(() => {
    mockOnSearch.mockReset()
  })

  it('renders input and submit button', () => {
    render(<SearchForm onSearch={mockOnSearch} loading={false} />)
    expect(screen.getByPlaceholderText(/account id/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('shows validation error when submitted empty', async () => {
    render(<SearchForm onSearch={mockOnSearch} loading={false} />)
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/enter your account id/i)
    expect(mockOnSearch).not.toHaveBeenCalled()
  })

  it('shows validation error for non-numeric input', async () => {
    render(<SearchForm onSearch={mockOnSearch} loading={false} />)
    await userEvent.type(screen.getByPlaceholderText(/account id/i), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/numbers only/i)
    expect(mockOnSearch).not.toHaveBeenCalled()
  })

  it('calls onSearch with valid numeric id', async () => {
    render(<SearchForm onSearch={mockOnSearch} loading={false} />)
    await userEvent.type(screen.getByPlaceholderText(/account id/i), '12345678')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(mockOnSearch).toHaveBeenCalledWith('12345678')
    expect(mockOnSearch).toHaveBeenCalledOnce()
  })

  it('submits on Enter key', async () => {
    render(<SearchForm onSearch={mockOnSearch} loading={false} />)
    await userEvent.type(screen.getByPlaceholderText(/account id/i), '12345678{enter}')
    expect(mockOnSearch).toHaveBeenCalledWith('12345678')
  })

  it('disables input and button while loading', () => {
    render(<SearchForm onSearch={mockOnSearch} loading={true} />)
    expect(screen.getByPlaceholderText(/account id/i)).toBeDisabled()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows "Searching…" while loading', () => {
    render(<SearchForm onSearch={mockOnSearch} loading={true} />)
    expect(screen.getByRole('button')).toHaveTextContent('Searching…')
  })

  it('clears validation error when user starts typing', async () => {
    render(<SearchForm onSearch={mockOnSearch} loading={false} />)
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await userEvent.type(screen.getByPlaceholderText(/account id/i), '1')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
