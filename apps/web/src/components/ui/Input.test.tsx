import React from 'react'
import { render, screen } from '@testing-library/react'
import { Input, InputProps } from './Input'

describe('Input', () => {
  const defaultProps: InputProps = {
    label: 'Test Input'
  }

  it('should render input with label', () => {
    render(<Input label="Username" />)
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
  })

  it('should render with helper text', () => {
    render(<Input label="Username" helperText="Enter your username" />)
    expect(screen.getByText(/enter your username/i)).toBeInTheDocument()
  })

  it('should render error message', () => {
    render(<Input label="Username" error="Username is required" />)
    expect(screen.getByText(/username is required/i)).toBeInTheDocument()
  })

  it('should apply error styles when error prop is provided', () => {
    const { container } = render(<Input label="Username" error="Invalid" />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('border-red-500')
    expect(input).toHaveClass('focus:ring-red-500')
  })

  it('should apply default border styles when no error', () => {
    const { container } = render(<Input label="Username" />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('border-gray-300')
  })

  it('should generate id from label if not provided', () => {
    const { container } = render(<Input label="Test Label" />)
    const input = container.querySelector('input')
    expect(input?.id).toBe('test-label')
  })

  it('should use provided id', () => {
    const { container } = render(<Input label="Username" id="custom-id" />)
    const input = container.querySelector('input')
    expect(input?.id).toBe('custom-id')
  })

  it('should forward ref to input element', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} label="Username" />)
    expect(ref.current).toBeInTheDocument()
    expect(ref.current?.tagName).toBe('INPUT')
  })

  it('should pass through HTML input props', () => {
    render(
      <Input
        label="Email"
        type="email"
        placeholder="test@example.com"
        required
        disabled
      />
    )
    const input = screen.getByLabelText(/email/i)
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('placeholder', 'test@example.com')
    expect(input).toBeRequired()
    expect(input).toBeDisabled()
  })

  it('should apply custom className', () => {
    const { container } = render(<Input label="Username" className="custom-class" />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('custom-class')
  })

  it('should not show helper text when error is present', () => {
    render(
      <Input
        label="Username"
        helperText="This should not show"
        error="This should show"
      />
    )
    expect(screen.getByText(/this should show/i)).toBeInTheDocument()
    expect(screen.queryByText(/this should not show/i)).not.toBeInTheDocument()
  })

  it('should show helper text when no error', () => {
    render(
      <Input
        label="Username"
        helperText="This should show"
      />
    )
    expect(screen.getByText(/this should show/i)).toBeInTheDocument()
  })

  it('should have focus styles', () => {
    const { container } = render(<Input label="Username" />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('focus:ring-2')
    expect(input).toHaveClass('focus:ring-indigo-500')
  })
})
