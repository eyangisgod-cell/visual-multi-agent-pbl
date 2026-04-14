import React from 'react';
import { render, screen } from '@testing-library/react';
import { PointsDisplay } from './PointsDisplay';

describe('PointsDisplay', () => {
  const defaultProps = {
    points: 100,
    level: 2,
    levelName: '新手',
    nextLevelMinPoints: 300,
    progressToNextLevel: 33.33,
  };

  it('should render points correctly', () => {
    render(<PointsDisplay {...defaultProps} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should render level correctly', () => {
    render(<PointsDisplay {...defaultProps} />);
    expect(screen.getByText('Lv.2')).toBeInTheDocument();
    expect(screen.getByText('新手')).toBeInTheDocument();
  });

  it('should render progress bar when showProgress is true', () => {
    render(<PointsDisplay {...defaultProps} showProgress />);
    expect(screen.getByText('等级进度')).toBeInTheDocument();
  });

  it('should not render progress bar when showProgress is false', () => {
    render(<PointsDisplay {...defaultProps} showProgress={false} />);
    expect(screen.queryByText('等级进度')).not.toBeInTheDocument();
  });

  it('should show max level message when at max level', () => {
    render(
      <PointsDisplay
        points={5000}
        level={7}
        levelName="宗师"
        nextLevelMinPoints={null}
        progressToNextLevel={100}
      />
    );
    expect(screen.getByText(/已达到最高等级/i)).toBeInTheDocument();
  });

  it('should calculate remaining points to next level', () => {
    render(<PointsDisplay {...defaultProps} />);
    expect(screen.getByText(/还需 200 积分升级到下一级/i)).toBeInTheDocument();
  });

  it('should support small size', () => {
    const { container } = render(<PointsDisplay {...defaultProps} size="sm" />);
    expect(container.firstChild).toHaveClass('p-4');
  });

  it('should support large size', () => {
    const { container } = render(<PointsDisplay {...defaultProps} size="lg" />);
    expect(container.firstChild).toHaveClass('p-4');
  });
});
