export default function OfflinePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>离线模式</h1>
      <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem' }}>
        当前网络连接不可用，请检查网络设置
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '12px 24px',
          fontSize: '1rem',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        重新连接
      </button>
    </div>
  )
}
