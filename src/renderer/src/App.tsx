import React from 'react';
import { useAppTheme } from './context/ThemeContext';
import Downloader from './components/Downloader';
import Queue from './components/Queue';
import History from './components/History';
import Settings from './components/Settings';
import Diagnostics from './components/Diagnostics';
import {
  Download,
  ListOrdered,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Activity,
  Minus,
  Square,
  X,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

const App: React.FC = () => {
  const {
    currentView,
    setView,
    queue,
    toasts,
    removeToast
  } = useAppTheme();

  // Count items that are active or queued
  const activeQueueCount = queue.filter(item =>
    item.status === 'downloading' || item.status === 'queued'
  ).length;

  const renderView = () => {
    switch (currentView) {
      case 'downloader':
        return <Downloader />;
      case 'queue':
        return <Queue />;
      case 'history':
        return <History />;
      case 'settings':
        return <Settings />;
      case 'diagnostics':
        return <Diagnostics />;
      default:
        return <Downloader />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Frameless Titlebar */}
      <header className="titlebar">
        <div className="titlebar-logo">
          <Download size={16} style={{ color: 'var(--accent-color)' }} />
          <span>HSFDL</span> Downloader
        </div>
        <div className="titlebar-controls">
          <button className="titlebar-btn" onClick={() => window.api.minimize()}>
            <Minus size={14} />
          </button>
          <button className="titlebar-btn" onClick={() => window.api.maximize()}>
            <Square size={12} />
          </button>
          <button className="titlebar-btn close" onClick={() => window.api.close()}>
            <X size={14} />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-nav">
            <div
              className={`sidebar-item ${currentView === 'downloader' ? 'active' : ''}`}
              onClick={() => setView('downloader')}
            >
              <Download size={18} />
              <span>Downloader</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'queue' ? 'active' : ''}`}
              onClick={() => setView('queue')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ListOrdered size={18} />
                <span>Active Queue</span>
              </div>
              {activeQueueCount > 0 && (
                <span style={{
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(var(--accent-rgb), 0.4)'
                }}>
                  {activeQueueCount}
                </span>
              )}
            </div>

            <div
              className={`sidebar-item ${currentView === 'history' ? 'active' : ''}`}
              onClick={() => setView('history')}
            >
              <HistoryIcon size={18} />
              <span>Downloads Library</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'settings' ? 'active' : ''}`}
              onClick={() => setView('settings')}
            >
              <SettingsIcon size={18} />
              <span>Settings</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'diagnostics' ? 'active' : ''}`}
              onClick={() => setView('diagnostics')}
            >
              <Activity size={18} />
              <span>Diagnostics & Logs</span>
            </div>
          </div>

          <div className="sidebar-footer">
            <div>v1.0.0 (Premium)</div>
            <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.7 }}>Powered by Electron & yt-dlp</div>
          </div>
        </aside>

        {/* Dynamic Viewport */}
        <main className="main-panel">
          {renderView()}
        </main>
      </div>

      {/* Real-time Toasts Layer */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast" onClick={() => removeToast(toast.id)}>
            {toast.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--success-color)' }} />}
            {toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--error-color)' }} />}
            {toast.type === 'warning' && <AlertCircle size={18} style={{ color: 'var(--warning-color)' }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--accent-color)' }} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
