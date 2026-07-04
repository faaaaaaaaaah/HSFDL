import React, { useEffect, useRef } from 'react';
import { useAppTheme } from '../context/ThemeContext';
import { 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Copy,
  Cpu
} from 'lucide-react';

const Diagnostics: React.FC = () => {
  const { diagnostics, logs, runDiagnostics, addToast } = useAppTheme();
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopyLogs = () => {
    if (logs.length === 0) return;
    navigator.clipboard.writeText(logs.join('\n'));
    addToast('Logs copied to clipboard!', 'success');
  };

  const getStatusIcon = (status: string) => {
    if (status.startsWith('Ready') || status === 'Ready') {
      return <CheckCircle2 size={16} style={{ color: 'var(--success-color)' }} />;
    } else if (status.startsWith('Not Found') || status.startsWith('Not Installed')) {
      return <XCircle size={16} style={{ color: 'var(--error-color)' }} />;
    } else {
      return <HelpCircle size={16} style={{ color: 'var(--warning-color)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 className="view-title">Diagnostics & Logs</h1>
        <button 
          className="btn" 
          style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={runDiagnostics}
        >
          <RefreshCw size={14} />
          Reload Checks
        </button>
      </div>
      <p className="view-subtitle">Validate dependency installations, verify system variables, and review active console outputs.</p>

      {/* Diagnostics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Core dependencies check */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Cpu size={16} style={{ color: 'var(--accent-color)' }} />
            Dependency Checklist
          </h3>

          {diagnostics ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Python Runtime:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                  {diagnostics.python} {getStatusIcon(diagnostics.python)}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>yt-dlp Core Engine:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                  {diagnostics.ytdlp} {getStatusIcon(diagnostics.ytdlp)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>FFmpeg Transcoder:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                  {diagnostics.ffmpeg} {getStatusIcon(diagnostics.ffmpeg)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading checklist status...</div>
          )}
        </div>

        {/* Client details check */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Terminal size={16} style={{ color: 'var(--accent-color)' }} />
            Application Specs
          </h3>

          {diagnostics ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Operating System:</span>
                <span style={{ fontWeight: 500 }}>{diagnostics.os}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Node Engine:</span>
                <span style={{ fontWeight: 500 }}>{diagnostics.node}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>App Version:</span>
                <span style={{ fontWeight: 500 }}>{diagnostics.appVersion}</span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading client details...</div>
          )}
        </div>
      </div>

      {/* Terminal logs viewer */}
      <div className="card" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '16px 20px', 
        backgroundColor: '#050408',
        borderColor: 'rgba(255, 255, 255, 0.05)',
        minHeight: '200px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
            <Terminal size={15} style={{ color: 'var(--accent-color)' }} />
            Streaming Console Outputs
          </div>
          {logs.length > 0 && (
            <button 
              onClick={handleCopyLogs}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              title="Copy all logs"
            >
              <Copy size={11} /> Copy Logs
            </button>
          )}
        </div>

        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          fontFamily: '"JetBrains Mono", "Courier New", monospace', 
          fontSize: '12px', 
          lineHeight: '1.6', 
          color: '#8be9fd', // Soft cyan debugger text style
          paddingRight: '6px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }}>
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                {log}
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '24px' }}>
              No active downloader executions or logger details streamed yet.
            </div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};

export default Diagnostics;
