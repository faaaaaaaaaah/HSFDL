import React from 'react';
import { useAppTheme } from '../context/ThemeContext';
import { 
  FolderOpen, 
  Palette, 
  Monitor, 
  Moon, 
  Sun, 
  Globe,
  HardDrive
} from 'lucide-react';

const ACCENT_COLORS = [
  { name: 'Royal Purple', value: '#8a2be2' },
  { name: 'Neon Blue', value: '#00b4d8' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Coral Crimson', value: '#e63946' },
  { name: 'Amber Gold', value: '#f59e0b' },
  { name: 'Hot Pink', value: '#ff007f' },
];

const Settings: React.FC = () => {
  const { settings, updateSettings, selectFolder } = useAppTheme();

  if (!settings) return <div style={{ color: 'var(--text-secondary)' }}>Loading settings...</div>;

  const handleFolderBrowse = async () => {
    const path = await selectFolder();
    if (path) {
      updateSettings({ downloadFolder: path });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <h1 className="view-title">App Settings</h1>
      <p className="view-subtitle">Customize client options, default directories, accent variables, and networking.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
        
        {/* Visual Styling Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={16} style={{ color: 'var(--accent-color)' }} />
            Visual Customization
          </h3>

          {/* Theme selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Application Theme</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={`btn secondary ${settings.theme === 'system' ? 'active' : ''}`}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  borderColor: settings.theme === 'system' ? 'var(--accent-color)' : 'var(--card-border)',
                  backgroundColor: settings.theme === 'system' ? 'rgba(var(--accent-rgb), 0.08)' : 'transparent'
                }}
                onClick={() => updateSettings({ theme: 'system' })}
              >
                <Monitor size={14} /> System
              </button>
              <button 
                className={`btn secondary ${settings.theme === 'dark' ? 'active' : ''}`}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  borderColor: settings.theme === 'dark' ? 'var(--accent-color)' : 'var(--card-border)',
                  backgroundColor: settings.theme === 'dark' ? 'rgba(var(--accent-rgb), 0.08)' : 'transparent'
                }}
                onClick={() => updateSettings({ theme: 'dark' })}
              >
                <Moon size={14} /> Dark
              </button>
              <button 
                className={`btn secondary ${settings.theme === 'light' ? 'active' : ''}`}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  borderColor: settings.theme === 'light' ? 'var(--accent-color)' : 'var(--card-border)',
                  backgroundColor: settings.theme === 'light' ? 'rgba(var(--accent-rgb), 0.08)' : 'transparent'
                }}
                onClick={() => updateSettings({ theme: 'light' })}
              >
                <Sun size={14} /> Light
              </button>
            </div>
          </div>

          {/* Accent Color Palette picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Accent Tone</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => updateSettings({ accentColor: color.value })}
                  title={color.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: color.value,
                    border: settings.accentColor === color.value ? '3px solid var(--text-primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: 'var(--shadow-sm)',
                    transform: settings.accentColor === color.value ? 'scale(1.12)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Toggle animations checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <input 
              type="checkbox" 
              id="enableAnimations"
              checked={settings.enableAnimations} 
              onChange={(e) => updateSettings({ enableAnimations: e.target.checked })}
              style={{ accentColor: 'var(--accent-color)', cursor: 'pointer' }}
            />
            <label htmlFor="enableAnimations" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Enable fluid UI animations & GPU transition styles
            </label>
          </div>
        </div>

        {/* Directory and Engine Limits Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={16} style={{ color: 'var(--accent-color)' }} />
            Directories & Download Rules
          </h3>

          {/* Download Path */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Output Directory</label>
            <div className="input-group">
              <input 
                type="text" 
                className="input-field" 
                value={settings.downloadFolder} 
                readOnly 
              />
              <button className="btn" onClick={handleFolderBrowse}>
                <FolderOpen size={16} /> Browse
              </button>
            </div>
          </div>

          {/* Max concurrent queue limit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Max Concurrent Jobs</label>
              <select 
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  padding: '10px 14px',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                }}
                value={settings.maxConcurrentDownloads}
                onChange={(e) => updateSettings({ maxConcurrentDownloads: parseInt(e.target.value) })}
              >
                <option value={1}>1 Download</option>
                <option value={2}>2 Downloads (Recommended)</option>
                <option value={3}>3 Downloads</option>
                <option value={4}>4 Downloads</option>
                <option value={5}>5 Downloads</option>
              </select>
            </div>

            {/* Bandwidth Limiter — preset buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Speed Limit:{' '}
                <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
                  {settings.bandwidthLimit === 0 ? 'Unlimited' : settings.bandwidthLimit < 1000 ? `${settings.bandwidthLimit} KB/s` : `${(settings.bandwidthLimit / 1000).toFixed(1).replace(/\.0$/, '')} Mbps`}
                </span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {[
                  { label: 'Unlimited', value: 0 },
                  { label: '500 Kbps', value: 500 },
                  { label: '750 Kbps', value: 750 },
                  { label: '1 Mbps',   value: 1000 },
                  { label: '1.5 Mbps', value: 1500 },
                  { label: '2 Mbps',   value: 2000 },
                  { label: '4 Mbps',   value: 4000 },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    className="btn secondary"
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderColor: settings.bandwidthLimit === value ? 'var(--accent-color)' : 'var(--card-border)',
                      backgroundColor: settings.bandwidthLimit === value ? 'rgba(var(--accent-rgb), 0.12)' : 'transparent',
                      color: settings.bandwidthLimit === value ? 'var(--accent-color)' : 'var(--text-secondary)',
                    }}
                    onClick={() => updateSettings({ bandwidthLimit: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced & Network Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} style={{ color: 'var(--accent-color)' }} />
            Advanced & Proxy Integration
          </h3>

          {/* FFmpeg Custom binary location */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>FFmpeg Executable Path (Optional)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. C:\ffmpeg\bin\ffmpeg.exe (Leave empty to use system PATH)" 
              value={settings.ffmpegPath} 
              onChange={(e) => updateSettings({ ffmpegPath: e.target.value })}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Cookies binary location */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Cookies File Path (cookies.txt)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. C:\Users\User\cookies.txt (Netscape cookies file)" 
              value={settings.cookiesPath} 
              onChange={(e) => updateSettings({ cookiesPath: e.target.value })}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Network Proxy path */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Proxy Host Address</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. http://127.0.0.1:1080 (Leave empty for default direct network)" 
              value={settings.proxy} 
              onChange={(e) => updateSettings({ proxy: e.target.value })}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
