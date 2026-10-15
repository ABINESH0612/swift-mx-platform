import React, { useState, useRef } from 'react';
import {
  Upload,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  FileCode2,
  ShieldCheck,
  ArrowRight,
  X
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_PACS008 = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <FIToFICstmrCdtTrf>
        <GrpHdr>
            <MsgId>MSG-2026-1011-0081</MsgId>
            <CreDtTm>2026-10-11T14:30:00</CreDtTm>
            <NbOfTxs>1</NbOfTxs>
            <SttlmInf>
                <SttlmMtd>CLRG</SttlmMtd>
            </SttlmInf>
        </GrpHdr>
        <CdtTrfTxInf>
            <PmtId>
                <EndToEndId>E2E-NXD-20261011-9988</EndToEndId>
                <TxId>TX-9876543210</TxId>
            </PmtId>
            <IntrBkSttlmAmt Ccy="EUR">450000.00</IntrBkSttlmAmt>
            <Dbtr>
                <Nm>Global Trade Solutions Inc.</Nm>
            </Dbtr>
            <DbtrAgt>
                <FinInstnId>
                    <BICFI>BNPAFRPPXXX</BICFI>
                </FinInstnId>
            </DbtrAgt>
            <CdtrAgt>
                <FinInstnId>
                    <BICFI>DEUTDEDDXXX</BICFI>
                </FinInstnId>
            </CdtrAgt>
            <Cdtr>
                <Nm>Continental Industrial Parts AG</Nm>
            </Cdtr>
        </CdtTrfTxInf>
    </FIToFICstmrCdtTrf>
</Document>`;

const SAMPLE_ENVELOPE = `<?xml version="1.0" encoding="UTF-8"?>
<RequestPayload>
    <AppHdr xmlns="urn:iso:std:iso:20022:tech:xsd:head.001.001.01">
        <Fr><FIId><FinInstnId><BICFI>CHASSUS33XXX</BICFI></FinInstnId></FIId></Fr>
        <To><FIId><FinInstnId><BICFI>BARCGB22XXX</BICFI></FinInstnId></FIId></To>
        <BizMsgIdr>BIZ-MSG-20261011-8899</BizMsgIdr>
        <MsgDefIdr>pacs.008.001.08</MsgDefIdr>
        <CreDt>2026-10-11T16:00:00Z</CreDt>
    </AppHdr>
    <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
        <FIToFICstmrCdtTrf>
            <GrpHdr>
                <MsgId>MSG-2026-1011-0082</MsgId>
                <CreDtTm>2026-10-11T16:00:00</CreDtTm>
                <NbOfTxs>1</NbOfTxs>
            </GrpHdr>
            <CdtTrfTxInf>
                <PmtId>
                    <EndToEndId>E2E-CHASE-BARCLAYS-4455</EndToEndId>
                    <TxId>TX-CHASE-0099</TxId>
                </PmtId>
                <IntrBkSttlmAmt Ccy="USD">1250000.75</IntrBkSttlmAmt>
                <Dbtr><Nm>Apollo Investments LLC</Nm></Dbtr>
                <Cdtr><Nm>Sterling Royal Logistics</Nm></Cdtr>
            </CdtTrfTxInf>
        </FIToFICstmrCdtTrf>
    </Document>
</RequestPayload>`;

export default function MessageProcessor({ onMessageProcessed, onViewInquiry }) {
  const [xmlInput, setXmlInput] = useState(SAMPLE_PACS008);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.xml') && file.type !== 'text/xml' && file.type !== 'application/xml') {
      setError('Please select a valid XML file (.xml).');
      return;
    }
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    const reader = new FileReader();
    reader.onload = (event) => {
      setXmlInput(event.target.result);
      setError(null);
    };
    reader.onerror = () => {
      setError('Could not read the selected XML file.');
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setFileName('');
    setFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!xmlInput.trim()) {
      setError('Please provide an XML message payload to process.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.processXml(xmlInput.trim());
      setLastResult(result);
      if (onMessageProcessed) {
        onMessageProcessed(result);
      }
    } catch (err) {
      setError(err.message || 'Error occurred while processing message.');
      setLastResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAmount = (val) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0.00';
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Page Heading */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-navy)' }}>
            Process SWIFT MX Message
          </h1>
          <span className="badge badge-navy" style={{ fontSize: '11px' }}>
            ISO 20022 Engine
          </span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Parse and validate ISO 20022 <strong style={{ color: 'var(--primary-navy)' }}>pacs.008 (Financial Customer Credit Transfer)</strong> messages, extract settlement elements, and commit records to database audit log.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: lastResult ? 'minmax(0, 1.15fr) minmax(0, 1fr)' : 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Form & Upload Controls */}
        <div className="card" style={{ padding: '24px' }}>
          {/* Quick presets bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            marginBottom: '18px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Templates:
              </span>
              <button
                type="button"
                onClick={() => { setXmlInput(SAMPLE_PACS008); clearFile(); setError(null); }}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                Sample pacs.008
              </button>
              <button
                type="button"
                onClick={() => { setXmlInput(SAMPLE_ENVELOPE); clearFile(); setError(null); }}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                Sample Envelope (AppHdr)
              </button>
              <button
                type="button"
                onClick={() => { setXmlInput(''); clearFile(); setError(null); }}
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '5px 10px' }}
                title="Clear input"
              >
                <RotateCcw size={12} /> Clear
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            className={`upload-dropzone ${isDragging ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ marginBottom: '18px' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,text/xml,application/xml"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--accent-blue-subtle)',
              color: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Upload size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--primary-navy)' }}>
                {fileName ? fileName : 'Upload SWIFT MX XML File'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {fileSize ? `File size: ${fileSize} · Click to choose another` : 'Drag and drop .xml file here, or click to browse'}
              </div>
            </div>
            {fileName && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="btn btn-outline"
                style={{ fontSize: '11.5px', padding: '3px 8px', marginTop: '4px' }}
              >
                <X size={12} /> Remove file
              </button>
            )}
          </div>

          {/* Processing Error Alert */}
          {error && (
            <div className="alert-banner alert-banner-error" role="alert" style={{ marginBottom: '18px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '13px' }}>Validation Error</strong>
                <span style={{ fontSize: '12.5px' }}>{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileCode2 size={15} color="var(--accent-blue)" />
                  Raw SWIFT MX XML Payload
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)' }}>
                  {xmlInput.length.toLocaleString()} characters
                </span>
              </div>
              <textarea
                id="xmlInput"
                className="form-textarea"
                rows={15}
                value={xmlInput}
                onChange={(e) => setXmlInput(e.target.value)}
                placeholder="Paste or edit ISO 20022 XML here..."
                required
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !xmlInput.trim()}
                style={{ padding: '10px 24px', fontSize: '14px' }}
              >
                {loading ? (
                  <span>Validating & Storing...</span>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Parse & Store Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Parsed Results OR Empty Guidance State */}
        {lastResult ? (
          <div className="card animate-fade-in" style={{ padding: '24px', border: '1px solid #C4D3DF' }}>
            {/* Success Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-navy)' }}>
                    Message Parsed & Saved
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Stored in MySQL Database Record #{lastResult.id}
                  </p>
                </div>
              </div>
              <span className="badge badge-green">
                Persisted
              </span>
            </div>

            {/* Financial Amount Feature Card (Shopora Account Highlight Style) */}
            <div style={{
              background: 'linear-gradient(135deg, #021250 0%, #172A68 100%)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 4px 14px rgba(2, 18, 80, 0.15)'
            }}>
              <div style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#B5C4DC', fontWeight: '600' }}>
                Interbank Settlement Amount
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '26px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  {formatAmount(lastResult.amount)}
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  background: 'rgba(255, 255, 255, 0.18)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  {lastResult.currency || 'EUR'}
                </span>
              </div>
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#CBD5E1' }}>
                <span>Tx Reference:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#FFFFFF' }}>
                  {lastResult.transactionReference || '—'}
                </span>
              </div>
            </div>

            {/* Extracted Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '22px'
            }}>
              <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Message Type
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--accent-blue)', marginTop: '2px' }}>
                  {lastResult.messageType || 'pacs.008'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Message ID
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-navy)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {lastResult.messageId || '—'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Sender (Debtor / Agent)
                </div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-deep)', marginTop: '2px', wordBreak: 'break-word' }}>
                  {lastResult.sender || '—'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Receiver (Creditor / Agent)
                </div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-deep)', marginTop: '2px', wordBreak: 'break-word' }}>
                  {lastResult.receiver || '—'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Creation Timestamp
                </div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-deep)', marginTop: '2px' }}>
                  {lastResult.creationDate || lastResult.createdAt || '—'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => copyToClipboard(lastResult.originalXml)}
                className="btn btn-secondary"
                style={{ fontSize: '13px' }}
              >
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied XML' : 'Copy XML'}</span>
              </button>
              <button
                type="button"
                onClick={onViewInquiry}
                className="btn btn-primary"
                style={{ fontSize: '13px' }}
              >
                <span>View in Inquiry Log</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* Empty Guidance State */
          <div className="card" style={{ padding: '32px 24px', textAlign: 'left', background: 'var(--bg-surface-subtle)' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <ShieldCheck size={24} />
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--primary-navy)', marginBottom: '8px' }}>
              Financial Message Verification
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.55 }}>
              Ready to parse incoming financial credit transfers. Select a sample message or upload an XML document to view extracted settlement fields.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary-navy)',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  1
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-deep)' }}>
                    Schema Validation
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Validates XML structure for ISO 20022 pacs.008 customer credit transfers.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--accent-blue)',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  2
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-deep)' }}>
                    Attribute Extraction
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Extracts MsgId, EndToEndId, Amount, Currency, Debtor BIC, and Creditor BIC.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--neutral-secondary)',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  3
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-deep)' }}>
                    Persistent Audit Log
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Stores the record in MySQL with original XML payload for compliance audit.
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '28px',
              paddingTop: '18px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Need to view existing messages?
              </span>
              <button
                type="button"
                onClick={onViewInquiry}
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                <span>Go to Inquiry</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
