import React, { useState } from 'react';
import { useAppTheme } from '../context/ThemeContext';
import { 
  Play, 
  FolderOpen, 
  Search, 
  Trash2, 
  History as HistoryIcon,
  FileVideo,
  FileAudio,
  Calendar,
  Layers
} from 'lucide-react';

const History: React.FC = () => {
  const { 
    history,
    clearHistory, 
    openFolder, 
    playFile
  } = useAppTheme();

  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear your download library history? (This will not delete the actual files from your disk)')) {
      await clearHistory();
      // History in context is updated automatically via clearHistory()
    }
  };

  // Filter based on search query
  const filteredItems = history.filter((item) => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 className="view-title">Downloads Library</h1>
        {history.length > 0 && (
          <button 
            className="btn secondary" 
            style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleClear}
          >
            <Trash2 size={14} style={{ color: 'var(--error-color)' }} />
            Clear Library
          </button>
        )}
      </div>
      <p className="view-subtitle">Access previously downloaded video/audio assets and open them locally.</p>

      {/* Search Input Bar */}
      {history.length > 0 && (
        <div className="input-group" style={{ marginBottom: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '14px', color: 'var(--text-secondary)' }}>
            <Search size={16} />
          </span>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search downloads by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* List items */}
      {filteredItems.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {filteredItems.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 20px', animation: 'fadeIn 0.25s ease', flexShrink: 0, minHeight: '70px' }}>
              
              {/* Media Icon Type */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.format === 'MP3' ? 'var(--warning-color)' : 'var(--accent-color)',
                flexShrink: 0,
                border: '1px solid var(--card-border)'
              }}>
                {item.format === 'MP3' ? <FileAudio size={20} /> : <FileVideo size={20} />}
              </div>

              {/* Title & metadata */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden' 
                }}>
                  {item.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {formatDate(item.addedAt)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={12} />
                    {item.totalBytes || 'Unknown size'} • {item.format}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn secondary" 
                  style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => playFile(item.title)}
                  title="Play/Launch Video"
                >
                  <Play size={13} style={{ color: 'var(--success-color)' }} />
                  Play
                </button>
                <button 
                  className="btn secondary" 
                  style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => openFolder()}
                  title="Show in File Explorer"
                >
                  <FolderOpen size={13} />
                  Open Folder
                </button>
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
            <HistoryIcon size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            {searchQuery ? 'No Results Found' : 'Library is Empty'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', maxWidth: '320px', lineHeight: 1.4 }}>
            {searchQuery ? 'Double check your spelling or search terms.' : 'Assets that have successfully finished downloading will appear in this database.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default History;
