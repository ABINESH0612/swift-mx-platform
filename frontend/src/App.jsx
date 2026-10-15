import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import MessageProcessor from './components/MessageProcessor';
import MessageInquiry from './components/MessageInquiry';
import MessageDetailModal from './components/MessageDetailModal';
import { api } from './services/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('process');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      try {
        const res = await api.checkAuth();
        if (isMounted) {
          if (res.authenticated) {
            setIsAuthenticated(true);
            setUsername(res.username || localStorage.getItem('swift_mx_user') || 'admin');
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setUsername(user);
    setActiveTab('process');
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setUsername('');
    setSelectedMessage(null);
  };

  if (checkingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        gap: '16px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'var(--primary-navy)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(2, 18, 80, 0.2)'
        }}>
          <Layers size={22} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-navy)', fontSize: '13.5px', fontWeight: '600' }}>
          <RefreshCw size={15} className="animate-spin" />
          <span>Initializing SWIFT MX Platform...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        username={username}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {activeTab === 'process' ? (
          <MessageProcessor
            onMessageProcessed={(_savedMsg) => {
              // callback hook for saved messages
            }}
            onViewInquiry={() => setActiveTab('inquiry')}
          />
        ) : (
          <MessageInquiry
            onSelectMessage={(msg) => setSelectedMessage(msg)}
          />
        )}
      </main>

      {selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  );
}
