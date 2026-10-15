import React, { useState, useEffect } from 'react';
import { X, Copy, Check, FileText, Code2 } from 'lucide-react';

export default function MessageDetailModal({ message, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!message) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.originalXml || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAmount = (val) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0.00';
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 18, 80, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '24px 16px'
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '90vh',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--primary-navy)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(2, 18, 80, 0.2)'
            }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-navy)' }}>
                  SWIFT MX Message #{message.id}
                </h2>
                <span className="badge badge-blue" style={{ fontSize: '11px' }}>
                  {message.messageType || 'pacs.008'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Message ID: <strong style={{ color: 'var(--text-deep)' }}>{message.messageId}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            aria-label="Close message details"
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: 'var(--radius-md)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {/* Financial Amount Banner */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div>
              <div style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600' }}>
                Settlement Amount
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-navy)' }}>
                  {formatAmount(message.amount)}
                </span>
                <span className="badge badge-navy" style={{ fontSize: '12px', fontWeight: '700' }}>
                  {message.currency || 'EUR'}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600' }}>
                Transaction Reference
              </div>
              <div style={{ fontSize: '13.5px', fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--text-deep)', marginTop: '4px' }}>
                {message.transactionReference || '—'}
              </div>
            </div>
          </div>

          {/* Extracted Details Grid */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-secondary)',
              fontWeight: '700',
              marginBottom: '12px'
            }}>
              Extracted ISO 20022 Data Elements
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px'
            }}>
              <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Message Type
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--accent-blue)', marginTop: '3px' }}>
                  {message.messageType}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Sender BIC / Name
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-deep)', fontWeight: '500', marginTop: '3px', wordBreak: 'break-word' }}>
                  {message.sender || '—'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Receiver BIC / Name
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-deep)', fontWeight: '500', marginTop: '3px', wordBreak: 'break-word' }}>
                  {message.receiver || '—'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Creation Date & Time
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-deep)', fontWeight: '500', marginTop: '3px' }}>
                  {message.creationDate || message.createdAt || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Original XML Viewer */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code2 size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-deep)' }}>
                  Original SWIFT MX XML Payload (Stored in MySQL)
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                {copied ? (
                  <>
                    <Check size={13} color="var(--success)" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy XML</span>
                  </>
                )}
              </button>
            </div>

            <pre style={{
              background: 'var(--bg-dark-surface)',
              border: '1px solid #1E293B',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              maxHeight: '320px',
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: '#38BDF8',
              lineHeight: '1.6'
            }}>
              <code>{message.originalXml}</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '7px 18px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
