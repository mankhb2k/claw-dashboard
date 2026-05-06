"use client";

import React, { useState } from 'react';
import * as MockData from '@/lib/mock-data';
import { 
  User, 
  Settings, 
  Database, 
  Cpu, 
  HardDrive, 
  Activity, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle,
  ExternalLink
} from 'lucide-react';

export default function MockTestPage() {
  const [view, setView] = useState<'free' | 'pro'>('pro');

  const user = view === 'pro' ? MockData.MOCK_USER_PRO : MockData.MOCK_USER;
  const projects = view === 'pro' ? MockData.MOCK_PROJECTS_PRO : MockData.MOCK_PROJECTS;
  const plan = view === 'pro' ? MockData.MOCK_PLANS[1] : MockData.MOCK_PLANS[0];

  return (
    <div style={{ 
      padding: 'var(--space-8)', 
      maxWidth: '1200px', 
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-8)'
    }}>
      {/* Header & Toggle */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 'var(--space-6)'
      }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>
            Mock Data Debugger
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Testing all data states for frontend development</p>
        </div>
        
        <div style={{ 
          background: 'var(--color-surface)', 
          padding: 'var(--space-1)', 
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: 'var(--space-1)',
          border: '1px solid var(--color-border)'
        }}>
          <button 
            onClick={() => setView('free')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: view === 'free' ? 'var(--color-primary)' : 'transparent',
              color: view === 'free' ? 'white' : 'var(--color-text-muted)',
              transition: 'var(--transition-base)'
            }}
          >
            Free Tier
          </button>
          <button 
            onClick={() => setView('pro')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: view === 'pro' ? 'var(--color-primary)' : 'transparent',
              color: view === 'pro' ? 'white' : 'var(--color-text-muted)',
              transition: 'var(--transition-base)'
            }}
          >
            Pro Tier
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-8)' }}>
        <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          
          {/* Projects Section */}
          <section>
            <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Database size={20} /> Your Projects
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
              {projects.map((p) => (
                <div key={p.id} style={{ 
                  background: 'var(--color-surface)', 
                  padding: 'var(--space-5)', 
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold' }}>{p.displayName}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                    {p.subdomain}.openclaw.ai
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><HardDrive size={12} /> {p.storageUsedMb}MB</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}><Clock size={12} /> {new Date(p.lastActiveAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Heavy Jobs Section */}
          <section>
            <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Activity size={20} /> Heavy Jobs Activity
            </h2>
            <div style={{ 
              background: 'var(--color-surface)', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--color-border)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
                <thead style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                  <tr>
                    <th style={{ padding: 'var(--space-4)' }}>Tool</th>
                    <th style={{ padding: 'var(--space-4)' }}>Cost</th>
                    <th style={{ padding: 'var(--space-4)' }}>Status</th>
                    <th style={{ padding: 'var(--space-4)' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {MockData.MOCK_HEAVY_JOBS.map(job => (
                    <tr key={job.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-4)', fontWeight: '500' }}>{job.tool}</td>
                      <td style={{ padding: 'var(--space-4)' }}>{job.creditCost} credits</td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <JobStatus status={job.status} />
                      </td>
                      <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
                        {new Date(job.submittedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* Sidebar Info */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Profile Card */}
          <div style={{ background: 'var(--color-surface)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <img src={user.image!} alt={user.name} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--color-primary)' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{user.email}</div>
              </div>
            </div>
            <div style={{ 
              background: 'var(--color-primary-dim)', 
              color: 'var(--color-primary)', 
              fontSize: 'var(--font-size-xs)', 
              padding: 'var(--space-2)', 
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {plan.name} Tier
            </div>
          </div>

          {/* Wallet Card */}
          <div style={{ background: 'var(--color-surface)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CreditCard size={16} /> Credit Wallet
            </h3>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
              {MockData.MOCK_CREDITS.monthlyBalance + MockData.MOCK_CREDITS.purchasedBalance}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Next reset: {new Date(MockData.MOCK_CREDITS.monthlyResetAt!).toLocaleDateString()}
            </div>
          </div>

          {/* Plan Limits Card */}
          <div style={{ background: 'var(--color-surface)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>Plan Limits</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <LimitItem icon={<Database size={14}/>} label="Storage" value={`${plan.storageGb}GB`} />
              <LimitItem icon={<Cpu size={14}/>} label="CPU" value={`${plan.cpuVcpu} vCPU`} />
              <LimitItem icon={<Settings size={14}/>} label="RAM" value={`${plan.ramMb}MB`} />
              <LimitItem icon={<PlayCircle size={14}/>} label="Max Running" value={plan.maxConcurrentRunning} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    RUNNING: { bg: 'var(--color-success-dim)', text: 'var(--color-success)' },
    STOPPED: { bg: 'var(--color-surface-2)', text: 'var(--color-text-muted)' },
    ERROR: { bg: 'var(--color-danger-dim)', text: 'var(--color-danger)' },
    CREATING: { bg: 'var(--color-primary-dim)', text: 'var(--color-primary)' },
  };
  const config = colors[status] || colors.STOPPED;
  return (
    <span style={{ 
      padding: '2px 8px', 
      borderRadius: 'var(--radius-sm)', 
      fontSize: 'var(--font-size-xs)',
      background: config.bg,
      color: config.text,
      fontWeight: 'bold'
    }}>
      {status}
    </span>
  );
}

function JobStatus({ status }: { status: string }) {
  if (status === 'DONE') return <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14}/> Done</span>;
  if (status === 'FAILED') return <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14}/> Failed</span>;
  return <span style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={14}/> {status}</span>;
}

function LimitItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
        {icon} {label}
      </span>
      <span style={{ fontWeight: '500' }}>{value}</span>
    </div>
  );
}
