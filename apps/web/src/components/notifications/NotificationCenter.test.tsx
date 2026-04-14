import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter, NotificationCard } from '@/components/notifications/NotificationCenter';

// Mock fetch
global.fetch = jest.fn();

const mockNotifications = [
  {
    id: '1',
    userId: 'user-123',
    type: 'info' as const,
    title: 'Test Notification 1',
    content: 'This is a test notification',
    isRead: false,
    actionUrl: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    readAt: null,
  },
  {
    id: '2',
    userId: 'user-123',
    type: 'success' as const,
    title: 'Success Notification',
    content: 'Operation completed successfully',
    isRead: true,
    actionUrl: '/dashboard',
    metadata: null,
    createdAt: new Date().toISOString(),
    readAt: new Date().toISOString(),
  },
];

describe('NotificationCard', () => {
  it('should render notification with correct content', () => {
    const mockOnMarkRead = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <NotificationCard
        notification={mockNotifications[0]}
        onMarkRead={mockOnMarkRead}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Notification 1')).toBeInTheDocument();
    expect(screen.getByText('This is a test notification')).toBeInTheDocument();
    expect(screen.getByText('标记已读')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
  });

  it('should show mark unread button for read notifications', () => {
    const mockOnMarkRead = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <NotificationCard
        notification={mockNotifications[1]}
        onMarkRead={mockOnMarkRead}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('标记未读')).toBeInTheDocument();
  });

  it('should call onMarkRead when mark as read button is clicked', () => {
    const mockOnMarkRead = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <NotificationCard
        notification={mockNotifications[0]}
        onMarkRead={mockOnMarkRead}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('标记已读'));
    expect(mockOnMarkRead).toHaveBeenCalledWith('1', true);
  });

  it('should call onDelete when delete button is clicked', () => {
    const mockOnMarkRead = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <NotificationCard
        notification={mockNotifications[0]}
        onMarkRead={mockOnMarkRead}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('删除'));
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('should render action link if actionUrl is provided', () => {
    const mockOnMarkRead = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <NotificationCard
        notification={mockNotifications[1]}
        onMarkRead={mockOnMarkRead}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('查看详情 →')).toBeInTheDocument();
    expect(screen.getByText('查看详情 →')).toHaveAttribute('href', '/dashboard');
  });
});

describe('NotificationCenter', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <NotificationCenter
        userId="user-123"
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('通知中心')).not.toBeInTheDocument();
  });

  it('should show loading state initially', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: [] }),
    });

    render(
      <NotificationCenter
        userId="user-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Should show loading spinner initially
    await waitFor(() => {
      expect(screen.queryByText('暂无通知')).toBeInTheDocument();
    });
  });

  it('should display notifications when loaded', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: mockNotifications }),
    });

    render(
      <NotificationCenter
        userId="user-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Notification 1')).toBeInTheDocument();
      expect(screen.getByText('Success Notification')).toBeInTheDocument();
    });
  });

  it('should show unread count', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: mockNotifications }),
    });

    render(
      <NotificationCenter
        userId="user-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/未读：1/)).toBeInTheDocument();
    });
  });

  it('should close when close button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: [] }),
    });

    render(
      <NotificationCenter
        userId="user-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('暂无通知')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('✕'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should filter by unread when clicking 未读 button', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: mockNotifications }),
    });

    render(
      <NotificationCenter
        userId="user-123"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Wait for notifications to load
    await waitFor(() => {
      expect(screen.getByText('未读：1')).toBeInTheDocument();
    });

    // Click the 未读 button
    fireEvent.click(screen.getByText('未读'));

    // Verify fetch was called with isRead=false
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
