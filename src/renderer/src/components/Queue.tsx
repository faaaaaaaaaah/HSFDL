import React from 'react';
import { useAppTheme } from '../context/ThemeContext';
import { 
  Play, 
  Pause, 
  X, 
  RotateCcw, 
  FolderOpen,
  Trash2,
  ListVideo,
  AlertCircle,
  TrendingUp,
  FileVideo
} from 'lucide-react';

const Queue: React.FC = () => {
  const { 
    queue, 
    pauseDownload, 
    resumeDownload, 
    cancelDownload, 
    retryDownload, 
    clearQueue,
    openFolder
  } = useAppTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading': return 'var(--accent-color)';
      case 'paused': return 'var(--warning-color)';
      case 'completed': return 'var(--success-color)';
      case 'failed': return 'var(--error-color)';
      case 'cancelled': return 'var(--text-muted)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'downloading': return 'Downloading';
      case 'paused': return 'Paused';
      case 'completed': return 'Finished';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      case 'queued': return 'Queued';
      default: return status;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 className="view-title">Active Queue</h1>
        {queue.length > 0 && (
          <button 
            className="btn secondary" 
            style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={clearQueue}
          >
            <Trash2 size={14} />
            Clear Finished/Cancelled
          </button>
        )}
      </div>
      <p className="view-subtitle">Manage concurrent downloads, view speed meters, and handle paused/failed states.</p>

      {/* Queue items list */}
      {queue.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {queue.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '18px 24px', animation: 'fadeIn 0.25s ease', flexShrink: 0, minHeight: '70px' }}>
              
              {/* Left thumbnail/Icon */}
              <div style={{ width: '80px', height: '45px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--card-border)', backgroundColor: 'rgba(255, 255, 255, 0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FileVideo size={20} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              {/* Title & Badge details */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden' 
                }}>
                  {item.title}
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-secondary)'
                  }}>
                    {item.format} {item.quality ? `(${item.quality})` : ''}
                  </span>
                  
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: `rgba(255, 255, 255, 0.04)`,
                    color: getStatusColor(item.status),
                    border: `1px solid rgba(255, 255, 255, 0.05)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {item.status === 'downloading' && (
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-color)',
                        display: 'inline-block',
                        animation: 'pulse 1.2s infinite'
                      }} />
                    )}
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>

              {/* Progress column */}
              <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {item.status === 'downloading' || item.status === 'paused' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={12} />
                        {item.speed} ({item.downloadedBytes} / {item.totalBytes})
                      </span>
                      <span>ETA: {item.eta}</span>
                    </div>

                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${item.progress}%`,
                        height: '100%',
                        backgroundColor: getStatusColor(item.status),
                        borderRadius: '3px',
                        transition: 'width 0.3s cubic-bezier(0.1, 0.8, 0.25, 1)'
                      }} />
                    </div>
                  </>
                ) : item.status === 'failed' ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    color: 'var(--error-color)', 
                    fontSize: '12px',
                    padding: '6px 12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.12)',
                    borderRadius: '8px'
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {item.error || 'Unknown error occurred'}
                    </span>
                  </div>
                ) : item.status === 'completed' ? (
                  <span style={{ color: 'var(--success-color)', fontSize: '12px', fontWeight: 500 }}>
                    Saved to output library directory.
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    Waiting for concurrent download slots...
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {item.status === 'downloading' && (
                  <button 
                    className="btn secondary" 
                    style={{ padding: '6px', borderRadius: '6px' }}
                    onClick={() => pauseDownload(item.id)}
                    title="Pause Download"
                  >
                    <Pause size={14} />
                  </button>
                )}

                {item.status === 'paused' && (
                  <button 
                    className="btn secondary" 
                    style={{ padding: '6px', borderRadius: '6px' }}
                    onClick={() => resumeDownload(item.id)}
                    title="Resume Download"
                  >
                    <Play size={14} style={{ color: 'var(--success-color)' }} />
                  </button>
                )}

                {item.status === 'failed' && (
                  <button 
                    className="btn secondary" 
                    style={{ padding: '6px', borderRadius: '6px' }}
                    onClick={() => retryDownload(item.id)}
                    title="Retry Download"
                  >
                    <RotateCcw size={14} style={{ color: 'var(--accent-color)' }} />
                  </button>
                )}

                {item.status === 'completed' && (
                  <button 
                    className="btn secondary" 
                    style={{ padding: '6px', borderRadius: '6px' }}
                    onClick={() => openFolder()}
                    title="Open Folder"
                  >
                    <FolderOpen size={14} />
                  </button>
                )}

                {item.status !== 'completed' && item.status !== 'cancelled' && (
                  <button 
                    className="btn secondary" 
                    style={{ padding: '6px', borderRadius: '6px' }}
                    onClick={() => cancelDownload(item.id)}
                    title="Cancel Download"
                  >
                    <X size={14} style={{ color: 'var(--error-color)' }} />
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed var(--card-border)',
          borderRadius: '16px',
          padding: '48px',
          opacity: 0.85,
          backgroundColor: 'rgba(255, 255, 255, 0.01)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--text-muted)'
          }}>
            <ListVideo size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Active Downloads</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', maxWidth: '320px', lineHeight: 1.4 }}>
            Your download queue is empty. Return to the Downloader view to grab online media formats.
          </p>
        </div>
      )}
      
      {/* CSS animation for pulse indicator */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default Queue;
