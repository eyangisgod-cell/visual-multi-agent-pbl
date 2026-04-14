import React from 'react';
import { render, screen } from '@testing-library/react';
import { LevelProgressBar } from './LevelProgressBar';

describe('LevelProgressBar', () => {
  const defaultProps = {
    currentLevel: 2,
    currentPoints: 200,
    nextLevelMinPoints: 300,
    levelName: '新手',
    nextLevelName: '进阶者',
  };

  it('should render current level correctly', () => {
    render(<LevelProgressBar {...defaultProps} />);
    expect(screen.getByText(/Lv\.2/i)).toBeInTheDocument();
  });

  it('should render level name', () => {
    render(<LevelProgressBar {...defaultProps} />);
    expect(screen.getByText(/新手/i)).toBeInTheDocument();
  });

  it('should show progress percentage', () => {
    render(<LevelProgressBar {...defaultProps} />);
    expect(screen.getByText(/%$/)).toBeInTheDocument();
  });

  it('should show max level message when at max level', () => {
    render(
      <LevelProgressBar
        currentLevel={7}
        currentPoints={5000}
        nextLevelMinPoints={null}
        levelName="宗师"
      />
    );
    expect(screen.getByText(/最高等级/i)).toBeInTheDocument();
  });

  it('should show remaining points to next level', () => {
    render(<LevelProgressBar {...defaultProps} />);
    expect(screen.getByText(/还需/i)).toBeInTheDocument();
  });

  it('should not show labels when showLabels is false', () => {
    const { container } = render(
      <LevelProgressBar {...defaultProps} showLabels={false} />
    );
    // Should only have the progress bar, no text labels
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });

  it('should support small size', () => {
    render(<LevelProgressBar {...defaultProps} size="sm" />);
    expect(screen.getByText(/Lv\.2/i)).toBeInTheDocument();
  });

  it('should support large size', () => {
    render(<LevelProgressBar {...defaultProps} size="lg" />);
    expect(screen.getByText(/Lv\.2/i)).toBeInTheDocument();
  });

  it('should calculate progress correctly', () => {
    const { container } = render(
      <LevelProgressBar
        currentLevel={1}
        currentPoints={50}
        nextLevelMinPoints={100}
      />
    );
    const progressBar = container.querySelector('div[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });
});
