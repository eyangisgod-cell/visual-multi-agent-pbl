import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button, ButtonProps } from './Button'

describe('Button', () => {
  const defaultProps: ButtonProps = {
    children: 'Click me'
  }

  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('should apply primary variant by default', () => {
    const { container } = render(<Button>Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-indigo-600')
    expect(button).toHaveClass('text-white')
  })

  it('should apply secondary variant', () => {
    const { container } = render(<Button variant="secondary">Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-gray-100')
    expect(button).toHaveClass('text-gray-900')
  })

  it('should apply outline variant', () => {
    const { container } = render(<Button variant="outline">Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('border-2')
    expect(button).toHaveClass('border-gray-300')
  })

  it('should apply ghost variant', () => {
    const { container } = render(<Button variant="ghost">Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-transparent')
  })

  it('should apply danger variant', () => {
    const { container } = render(<Button variant="danger">Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-red-600')
  })

  it('should apply small size', () => {
    const { container } = render(<Button size="sm">Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('px-3')
    expect(button).toHaveClass('py-1.5')
    expect(button).toHaveClass('text-sm')
  })

  it('should apply medium size by default', () => {
    const { container } = render(<Button>Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('px-4')
    expect(button).toHaveClass('py-2')
    expect(button).toHaveClass('text-base')
  })

  it('should apply large size', () => {
    const { container } = render(<Button size="lg">Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('px-6')
    expect(button).toHaveClass('py-3')
    expect(button).toHaveClass('text-lg')
  })

  it('should be disabled when isLoading is true', () => {
    render(<Button isLoading>Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should show loading spinner when isLoading is true', () => {
    render(<Button isLoading>Click me</Button>)
    const spinner = document.querySelector('svg.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should not show loading spinner when isLoading is false', () => {
    render(<Button>Click me</Button>)
    const spinner = document.querySelector('svg.animate-spin')
    expect(spinner).not.toBeInTheDocument()
  })

  it('should forward ref to button element', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Click me</Button>)
    expect(ref.current).toBeInTheDocument()
    expect(ref.current?.tagName).toBe('BUTTON')
  })

  it('should apply custom className', () => {
    const { container } = render(<Button className="custom-class">Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should pass through HTML props', () => {
    render(<Button type="submit" id="submit-btn">Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('id', 'submit-btn')
  })
})
