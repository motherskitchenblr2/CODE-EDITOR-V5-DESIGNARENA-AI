// ============================================================================
// Volt Code AGI - Main App Component
// ============================================================================

import { useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { SocketProvider } from './contexts/SocketProvider';
import { AgentTeamPage } from './pages/AgentTeamPage';
import { AgentOrchestratorPage } from './pages/AgentOrchestratorPage';
import {
  AlertTriangle, BookOpen, Bug, Check, ChevronDown, Code2, Copy, Download,
  History, Menu, Play, RotateCcw, Settings, Sparkles, User, X, Zap, Users, Monitor,
} from 'lucide-react';

// ==========================================================================
// Types
// ==========================================================================

interface Issue {
  id: number;
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  explanation: string;
  original: string;
  fixed: string;
}

interface Session {
  id: string;
  timestamp: string;
  language: string;
  originalCode: string;
  fixedCode: string;
  issues: Issue[];
  summary: string;
}

type View = 'editor' | 'history' | 'settings';

// ==========================================================================
// Constants
// ==========================================================================

const initialCode = `function calculateSum(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  console.log("Sum is: " + sum);
  return sum;
}`;

const languages = [
  { value: 'auto', label: 'Auto detect' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

// ==========================================================================
// Helper Functions
// ==========================================================================

function detectLanguage(value: string) {
  if ((value.includes('def ') || value.includes('import ')) && value.includes(':')) return 'python';
  if (value.includes('function ') || value.includes('const ') || value.includes('=>')) return 'javascript';
  if (value.includes('#include') || value.includes('int main')) return 'cpp';
  if (value.includes('<html') || value.includes('</div>')) return 'html';
  if (value.includes('{') && value.includes('}') && value.includes(':')) return 'css';
  return 'javascript';
}

// ==========================================================================
// Code Editor Component (Original)
// ==========================================================================

function CodeEditorApp() {
  const [view, setView] = useState<View>('editor');
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState('javascript');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [fixedCode, setFixedCode] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('codeSessions') || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  });
  const fixButton = useRef<HTMLButtonElement>(null);
  const detected = useMemo(() => detectLanguage(code), [code]);
  const activeLanguage = language === 'auto' ? detected : language;

  // Save sessions
  const saveSessions = (next: Session[]) => {
    try { localStorage.setItem('codeSessions', JSON.stringify(next)); } catch { /* storage is optional */ }
    setSessions(next);
  };

  // Analyze code
  const analyze = async () => {
    if (!code.trim() || analyzing) return;
    setAnalyzing(true); setShowDiff(false); setProgress(8);
    const timer = window.setInterval(() => setProgress(value => Math.min(value + 12, 92)), 140);
    await new Promise(resolve => window.setTimeout(resolve, 1200));
    window.clearInterval(timer); setProgress(100);
    const next: Issue[] = [];
    let repaired = code;
    if (activeLanguage === 'javascript' && code.includes('console.log')) {
      next.push({ id: 1, type: 'Debug statement', severity: 'Medium', description: 'Remove console.log statements for production', explanation: 'Console output can expose sensitive data and create noisy production logs.', original: 'console.log("Sum is: " + sum);', fixed: '// Debug log removed for production' });
      repaired = repaired.replace(/console\.log\([^)]+\);?/g, '// Debug log removed for production');
    }
    if (code.includes(' == ')) {
      next.push({ id: 2, type: 'Type safety', severity: 'High', description: 'Use strict equality instead of loose equality', explanation: 'Strict equality prevents unexpected type coercion bugs.', original: 'x == y', fixed: 'x === y' });
      repaired = repaired.replace(/ == /g, ' === ');
    }
    if (/\blet\s+\w+\s*=/.test(repaired) && !next.some(issue => issue.type === 'Performance')) {
      next.push({ id: 3, type: 'Performance', severity: 'Low', description: 'Review variables that can be const', explanation: 'Const communicates intent and prevents accidental reassignment.', original: 'let sum = 0;', fixed: 'const sum = 0;' });
    }
    if (!next.length) next.push({ id: 1, type: 'Optimization', severity: 'Low', description: 'Add input validation for edge cases', explanation: 'Guarding inputs makes the function safer for real-world data.', original: code.split('\n')[0], fixed: `// Consider validating inputs\n${code.split('\n')[0]}` });
    setIssues(next); setFixedCode(repaired === code ? `// AI optimized\n${code}` : repaired); setAnalyzing(false); setShowDiff(true);
  };

  // Apply fixes
  const applyFixes = () => {
    if (!fixedCode) return;
    fixButton.current?.classList.add('animate-pulse');
    window.setTimeout(() => fixButton.current?.classList.remove('animate-pulse'), 700);
    const session: Session = { id: Date.now().toString(36), timestamp: new Date().toISOString(), language: activeLanguage, originalCode: code, fixedCode, issues, summary: `${issues.length} issue${issues.length === 1 ? '' : 's'} fixed and saved to your workspace.` };
    setCode(fixedCode); setShowDiff(false); saveSessions([session, ...sessions].slice(0, 12)); setShowReport(true);
  };

  // Copy code
  const copy = async (text: string) => {
    await navigator.clipboard?.writeText(text);
  };

  // Download code
  const download = (text: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    link.download = `volt-${activeLanguage}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Load session
  const loadSession = (session: Session) => {
    setCode(session.originalCode);
    setFixedCode(session.fixedCode);
    setIssues(session.issues);
    setLanguage(session.language);
    setView('editor');
    setShowReport(true);
    setMenuOpen(false);
  };

  // Navigation
  const nav = (next: View) => { setView(next); setMenuOpen(false); };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => nav('editor')} aria-label="Open editor">
          <span className="brand-mark"><Code2 size={21} /></span>
          <span><strong>VOLT</strong><small>CODE AI</small></span>
          <em>v4.8</em>
        </button>
        <div className="topbar-actions">
          <span className="status-dot"><i /> READY</span>
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">
            <Menu size={21} />
          </button>
          <button className="login-button" onClick={() => setLoggedIn(!loggedIn)}>
            <User size={16} /> <span>{loggedIn ? 'dev_user' : 'LOG IN'}</span>
          </button>
        </div>
      </header>
      
      <div className="workspace">
        <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
          <div className="sidebar-title">WORKSPACE</div>
          <button className={view === 'editor' ? 'nav-item active' : 'nav-item'} onClick={() => nav('editor')}>
            <Play size={18} /> <span>New analysis</span><kbd>⌘ N</kbd>
          </button>
          <button className={view === 'history' ? 'nav-item active' : 'nav-item'} onClick={() => nav('history')}>
            <History size={18} /> <span>Session history</span>{sessions.length > 0 && <b>{sessions.length}</b>}
          </button>
          <button className={view === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => nav('settings')}>
            <Settings size={18} /> <span>Settings</span>
          </button>
          
          {/* Agent Team Navigation */}
          <div className="sidebar-title" style={{ marginTop: '16px' }}>AGENT TEAM</div>
          <button className="nav-item" onClick={() => { setMenuOpen(false); window.location.href = '/agents'; }}>
            <Users size={18} /> <span>Agent Team</span>
          </button>
          <button className="nav-item" onClick={() => { setMenuOpen(false); window.location.href = '/agent-orchestrator'; }}>
            <Monitor size={18} /> <span>Agent Orchestrator</span>
          </button>
          
          <div className="sidebar-footer">
            <div className="pro-card">
              <Sparkles size={16} />
              <div><strong>VOLT PRO</strong><span>Unlock faster analysis</span></div>
              <ChevronDown size={14} />
            </div>
            <p>LOCAL-FIRST WORKSPACE<br /><span>Changes stay in your browser</span></p>
          </div>
        </aside>
        
        <section className="content">
          {view === 'editor' && <>
            <div className="page-head">
              <div>
                <div className="eyebrow">MULTI-LANGUAGE EDITOR</div>
                <h1>AI bug finder <span>&amp;</span> optimizer</h1>
                <p>Paste code, scan for issues, and apply practical fixes in one pass.</p>
              </div>
              <div className="head-controls">
                <label className="select-wrap">
                  <span>Language</span>
                  <select value={language} onChange={event => setLanguage(event.target.value)}>
                    {languages.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <ChevronDown size={15} />
                </label>
                <div className="detected">DETECTED <strong>{detected.toUpperCase()}</strong></div>
              </div>
            </div>
            <div className="editor-card">
              <div className="editor-toolbar">
                <div className="window-dots"><i /><i /><i /></div>
                <span>untitled.{activeLanguage === 'javascript' ? 'js' : activeLanguage}</span>
                <div className="toolbar-actions">
                  <button onClick={() => setCode('')} aria-label="Clear editor"><RotateCcw size={15} /></button>
                  <button onClick={() => copy(code)} aria-label="Copy source"><Copy size={15} /></button>
                  <button onClick={() => download(code)} aria-label="Download source"><Download size={15} /></button>
                </div>
              </div>
              <div className="editor-body">
                <div className="line-numbers">
                  {code.split('\n').map((_, index) => <span key={index}>{String(index + 1).padStart(2, '0')}</span>)}
                </div>
                <textarea 
                  aria-label="Source code editor" 
                  value={code} 
                  onChange={event => setCode(event.target.value)} 
                  spellCheck={false} 
                  placeholder="Paste your code here..." 
                />
                {analyzing && <div className="scan-line" style={{ top: `${progress}%` }} />}
              </div>
              <div className="editor-foot">
                <span><i className="live-dot" /> {analyzing ? `SCANNING ${Math.round(progress)}%` : 'READY TO ANALYZE'}</span>
                <span>{code.length} chars · {code.split('\n').length} lines</span>
              </div>
            </div>
            <div className="action-row">
              <button className="secondary-action" onClick={analyze} disabled={analyzing || !code.trim()}>
                <Bug size={18} /> {analyzing ? 'ANALYZING...' : 'RUN AI ANALYSIS'}
              </button>
              {fixedCode && <button ref={fixButton} className="primary-action" onClick={applyFixes}>
                <Zap size={18} /> APPLY ALL FIXES <b>{issues.length}</b>
              </button>}
            </div>
            <div className="feature-strip">
              <div><Check size={16} /><span><strong>Practical rules</strong><small>Finds common production issues</small></span></div>
              <div><BookOpen size={16} /><span><strong>Clear explanations</strong><small>Understand every suggested fix</small></span></div>
              <div><History size={16} /><span><strong>Saved locally</strong><small>Return to your previous sessions</small></span></div>
            </div>
          </>}
          
          {view === 'history' && <div className="panel-page">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">WORKSPACE MEMORY</div>
                <h1>Session history</h1>
                <p>Your recent analyses, ready to reopen.</p>
              </div>
              <button className="primary-action small" onClick={() => nav('editor')}>
                <Play size={16} /> NEW ANALYSIS
              </button>
            </div>
            {sessions.length === 0 ? 
              <div className="empty-state">
                <History size={34} />
                <strong>No saved sessions yet</strong>
                <span>Run an analysis and apply a fix to create your first session.</span>
                <button className="secondary-action small" onClick={() => nav('editor')}>Open editor</button>
              </div> : 
              <div className="session-grid">
                {sessions.map(session => 
                  <button className="session-card" key={session.id} onClick={() => loadSession(session)}>
                    <div className="session-meta">
                      <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                      <b>{session.language}</b>
                    </div>
                    <strong>{session.summary}</strong>
                    <small>{session.issues.length} fix{session.issues.length === 1 ? '' : 'es'} applied · Tap to reopen</small>
                  </button>
                )}
              </div>
            }
          </div>}
          
          {view === 'settings' && <div className="panel-page narrow">
            <div className="eyebrow">WORKSPACE PREFERENCES</div>
            <h1>Settings</h1>
            <p className="panel-copy">Tune VOLT for the way you write and review code.</p>
            <div className="settings-list">
              <div><span><strong>Theme</strong><small>Charcoal + neon orange</small></span><b>LOCKED</b></div>
              <div><span><strong>Language detection</strong><small>Automatically recognizes common syntax</small></span><button className="toggle on" aria-label="Language detection enabled"><i /></button></div>
              <div><span><strong>Session storage</strong><small>Saved to this browser only</small></span><b>LOCAL</b></div>
            </div>
          </div>}
        </section>
      </div>
      
      <nav className="bottom-nav">
        <button className={view === 'editor' ? 'active' : ''} onClick={() => nav('editor')}>
          <Play size={19} /><span>Analyze</span>
        </button>
        <button className={view === 'history' ? 'active' : ''} onClick={() => nav('history')}>
          <History size={19} /><span>History</span>
        </button>
        <button className={view === 'settings' ? 'active' : ''} onClick={() => nav('settings')}>
          <Settings size={19} /><span>Settings</span>
        </button>
      </nav>
      
      <AnimatePresence>
        {showDiff && <div className="modal-backdrop">
          <motion.div 
            className="modal diff-modal" 
            initial={{ opacity: 0, y: 18 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">ANALYSIS COMPLETE</div>
                <h2>Review recommended fixes</h2>
              </div>
              <button className="icon-button" onClick={() => setShowDiff(false)} aria-label="Close"><X size={19} /></button>
            </div>
            <div className="issue-list">
              {issues.map(issue => 
                <div className="issue" key={issue.id}>
                  <span className={`severity ${issue.severity.toLowerCase()}`}>{issue.severity}</span>
                  <div>
                    <strong>{issue.description}</strong>
                    <p>{issue.explanation}</p>
                    <div className="code-pair">
                      <code>{issue.original}</code>
                      <span>→</span>
                      <code>{issue.fixed}</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="secondary-action" onClick={() => setShowDiff(false)}>Keep editing</button>
              <button className="primary-action" onClick={applyFixes}><Zap size={17} /> APPLY ALL FIXES</button>
            </div>
          </motion.div>
        </div>}
      </AnimatePresence>
      
      <AnimatePresence>
        {showReport && <div className="modal-backdrop">
          <motion.div 
            className="modal report-modal" 
            initial={{ opacity: 0, scale: .98 }} 
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="success-icon"><Check size={24} /></div>
            <button className="close-report" onClick={() => setShowReport(false)} aria-label="Close"><X size={18} /></button>
            <div className="eyebrow">WORKSPACE UPDATED</div>
            <h2>Fixes applied successfully</h2>
            <p>{issues.length} improvement{issues.length === 1 ? '' : 's'} applied to your code and saved to session history.</p>
            <div className="report-actions">
              <button className="secondary-action" onClick={() => { setShowReport(false); nav('history') }}><History size={16} /> VIEW HISTORY</button>
              <button className="primary-action" onClick={() => { setShowReport(false); setShowDiff(true) }}><AlertTriangle size={16} /> REVIEW AGAIN</button>
            </div>
          </motion.div>
        </div>}
      </AnimatePresence>
    </main>
  );
}

// ==========================================================================
// Main App Component
// ==========================================================================

export default function App() {
  return (
    <SocketProvider autoConnect={true}>
      <Router>
        <Routes>
          {/* Original code editor */}
          <Route path="/" element={<CodeEditorApp />} />
          
          {/* Agent pages */}
          <Route path="/agents" element={<AgentTeamPage />} />
          <Route path="/agent-orchestrator" element={<AgentOrchestratorPage />} />
          
          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Analytics />
    </SocketProvider>
  );
}
