import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  AlertCircle,
  Inbox,
  FilterX
} from 'lucide-react';
import { api } from '../services/api';

export default function MessageInquiry({ onSelectMessage }) {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (searchQuery.trim()) {
        data = await api.searchMessages(searchQuery.trim());
      } else {
        data = await api.getMessages();
      }
      setMessages(Array.isArray(data) ? data : []);
      setActiveFilter(searchQuery.trim());
    } catch (err) {
      setError(err.message || 'Failed to retrieve messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getMessages();
        if (!ignore) {
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to retrieve messages');
          setMessages([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMessages(query);
  };

  const handleClearSearch = () => {
    setQuery('');
    fetchMessages('');
  };

  const formatAmount = (val) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0.00';
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (val) => {
    if (!val) return '—';
    return val.replace('T', ' ').substring(0, 19);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Header & Search Area */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '26px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-navy)' }}>
              SWIFT MX Message Inquiry & Audit Log
            </h1>
            <span className="badge badge-navy" style={{ fontSize: '11px' }}>
              Audit View
            </span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Search, filter, inspect, and review previously processed SWIFT ISO 20022 messages.
          </p>
        </div>

        {/* Search Input & Refresh Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}>
                <Search size={15} />
              </div>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px', paddingRight: '12px', height: '40px', fontSize: '13px' }}
                placeholder="Search by ID, Ref, Sender, Receiver..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={loading}
              style={{ height: '40px', padding: '0 16px', fontSize: '13px' }}
            >
              Search
            </button>
          </form>

          {activeFilter && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="btn btn-outline"
              title="Clear search filter"
              style={{ height: '40px', padding: '0 12px', fontSize: '12.5px' }}
            >
              <FilterX size={14} /> Clear Filter
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchMessages(query)}
            className="btn btn-outline"
            title="Refresh message list"
            disabled={loading}
            style={{ height: '40px', width: '40px', padding: 0 }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-banner alert-banner-error" role="alert" style={{ marginBottom: '20px' }}>
          <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '13px' }}>Inquiry Error</strong>
            <span style={{ fontSize: '12.5px' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Table Card Container */}
      <div className="table-container">
        {/* Table Subheader / Record Count */}
        <div style={{
          padding: '14px 20px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--primary-navy)' }}>
              Persisted Records
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '11.5px' }}>
              {messages.length} {messages.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {activeFilter && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Filtered by: <strong style={{ color: 'var(--accent-blue)' }}>"{activeFilter}"</strong>
            </span>
          )}
        </div>

        {/* Scrollable Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#ID</th>
                <th style={{ width: '110px' }}>Type</th>
                <th>Message ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Tx Reference</th>
                <th>Date</th>
                <th style={{ textAlign: 'right', width: '90px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && messages.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <RefreshCw size={28} className="animate-spin" color="var(--accent-blue)" />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--primary-navy)' }}>
                        Fetching messages from database...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '380px', margin: '0 auto' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)'
                      }}>
                        <Inbox size={24} />
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--primary-navy)' }}>
                        {activeFilter ? 'No matching SWIFT messages' : 'No processed messages found'}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {activeFilter
                          ? `No records found matching "${activeFilter}". Try clearing your search query.`
                          : 'Submit or upload an ISO 20022 XML message using the "Process Message" tab to begin audit tracking.'}
                      </span>
                      {activeFilter && (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="btn btn-secondary"
                          style={{ marginTop: '8px', fontSize: '12.5px' }}
                        >
                          Clear Search Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr
                    key={msg.id}
                    onClick={() => onSelectMessage(msg)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Database ID */}
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                      #{msg.id}
                    </td>

                    {/* Message Type Badge */}
                    <td>
                      <span className="badge badge-blue">
                        {msg.messageType || 'pacs.008'}
                      </span>
                    </td>

                    {/* Message ID */}
                    <td style={{ fontWeight: '600', color: 'var(--primary-navy)' }} title={msg.messageId}>
                      <span style={{
                        display: 'inline-block',
                        maxWidth: '160px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {msg.messageId || '—'}
                      </span>
                    </td>

                    {/* Sender */}
                    <td style={{ color: 'var(--text-deep)' }} title={msg.sender}>
                      <span style={{
                        display: 'inline-block',
                        maxWidth: '150px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {msg.sender || '—'}
                      </span>
                    </td>

                    {/* Receiver */}
                    <td style={{ color: 'var(--text-deep)' }} title={msg.receiver}>
                      <span style={{
                        display: 'inline-block',
                        maxWidth: '150px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {msg.receiver || '—'}
                      </span>
                    </td>

                    {/* Amount & Currency */}
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--primary-navy)' }}>
                        {formatAmount(msg.amount)}{' '}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'var(--accent-blue)',
                        background: 'var(--accent-blue-subtle)',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        {msg.currency || ''}
                      </span>
                    </td>

                    {/* Transaction Reference */}
                    <td title={msg.transactionReference}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        display: 'inline-block',
                        maxWidth: '140px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {msg.transactionReference || '—'}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {formatDate(msg.creationDate || msg.createdAt)}
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMessage(msg);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '5px 12px', fontSize: '12px' }}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
