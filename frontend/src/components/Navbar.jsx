import React, { useEffect, useState } from 'react';
import { Layers, User, LogOut } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ activeTab, setActiveTab, username, onLogout }) {
  const [healthStatus, setHealthStatus] = useState('CHECKING');

  useEffect(() => {
    let isMounted = true;
    const checkSystemHealth = async () => {
      try {
        const res = await api.getHealth();
        if (isMounted) {
          setHealthStatus(res.status === 'UP' ? 'ONLINE' : 'OFFLINE');
        }
      } catch {
        if (isMounted) {
          setHealthStatus('OFFLINE');
        }
      }
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isOnline = healthStatus === 'ONLINE';

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: 'var(--shadow-xs)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        height: '66px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 'fit-content' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--primary-navy)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(2, 18, 80, 0.25)'
          }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontWeight: '700',
                fontSize: '16px',
                color: 'var(--primary-navy)',
                letterSpacing: '-0.3px',
                lineHeight: 1.2
              }}>
                SWIFT MX
              </span>
              <span className="badge badge-blue" style={{ fontSize: '10.5px', padding: '1px 7px' }}>
                pacs.008
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.2, marginTop: '2px' }}>
              Financial Message Processing Engine
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Shopora segmented control style) */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-surface-subtle)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('process')}
            className="btn"
            style={{
              fontSize: '13px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'process' ? 'var(--primary-navy)' : 'transparent',
              color: activeTab === 'process' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: activeTab === 'process' ? '0 2px 4px rgba(2, 18, 80, 0.2)' : 'none',
              fontWeight: activeTab === 'process' ? '600' : '500'
            }}
          >
            Process Message
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inquiry')}
            className="btn"
            style={{
              fontSize: '13px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'inquiry' ? 'var(--primary-navy)' : 'transparent',
              color: activeTab === 'inquiry' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: activeTab === 'inquiry' ? '0 2px 4px rgba(2, 18, 80, 0.2)' : 'none',
              fontWeight: activeTab === 'inquiry' ? '600' : '500'
            }}
          >
            Message Inquiry
          </button>
        </nav>

        {/* Right Section: System Health + User + Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 'fit-content' }}>
          {/* Health indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11.5px',
            fontWeight: '600',
            color: isOnline ? 'var(--success-text)' : 'var(--error-text)',
            background: isOnline ? 'var(--success-bg)' : 'var(--error-bg)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${isOnline ? 'var(--success-border)' : 'var(--error-border)'}`
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isOnline ? 'var(--success)' : 'var(--error)',
              display: 'inline-block'
            }} />
            <span>API: {healthStatus}</span>
          </div>

          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-color)' }} />

          {/* User badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--text-deep)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-navy)'
            }}>
              <User size={15} />
            </div>
            <span style={{ fontWeight: '600', color: 'var(--primary-navy)' }}>
              {username || 'admin'}
            </span>
          </div>

          {/* Sign Out */}
          <button
            type="button"
            onClick={onLogout}
            className="btn btn-outline"
            title="Sign out of SWIFT MX"
            style={{ padding: '6px 12px', fontSize: '12.5px' }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
