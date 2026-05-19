import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorMessage } from '../components/ErrorMessage'

describe('ErrorMessage', () => {
  it('renders the error message text', () => {
    render(<ErrorMessage message="Connection error" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Connection error')
  })

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorMessage message="Error" onRetry={vi.fn()} />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('does not render retry button when onRetry is omitted', () => {
    render(<ErrorMessage message="Error" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onRetry when the button is clicked', async () => {
    const onRetry = vi.fn()
    render(<ErrorMessage message="Error" onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
