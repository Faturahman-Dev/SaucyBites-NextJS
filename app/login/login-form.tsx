'use client';

import { useState } from 'react';
import { Crown, Users, LockKeyhole, Zap } from 'lucide-react';
import type { UserRole } from '@/lib/session';

export default function LoginForm({
  initialRole = 'owner',
  loginAction,
  loginConfigured,
  isDev,
}: {
  initialRole?: UserRole;
  loginAction: (formData: FormData) => void;
  loginConfigured: boolean;
  isDev: boolean;
}) {
  const [role, setRole] = useState<UserRole>(initialRole);

  return (
    <form action={loginAction}>
      <input type="hidden" name="role" value={role} />

      <div className="login-role-tabs">
        <button
          type="button"
          className={`login-role-tab ${role === 'owner' ? 'active owner-tab' : ''}`}
          onClick={() => setRole('owner')}
        >
          <Crown size={20} />
          <strong>Pemilik (Owner)</strong>
          <small>Akses Penuh</small>
        </button>

        <button
          type="button"
          className={`login-role-tab ${role === 'member' ? 'active' : ''}`}
          onClick={() => setRole('member')}
        >
          <Users size={20} />
          <strong>Anggota Tim</strong>
          <small>Kasir & Catatan</small>
        </button>
      </div>

      <label className="field">
        <span>{role === 'owner' ? 'Nama Pemilik' : 'Nama Anggota Tim'}</span>
        <input
          name="name"
          key={role}
          defaultValue={role === 'owner' ? 'Owner' : ''}
          placeholder={
            role === 'owner' ? 'Nama Anda sebagai pemilik' : 'Nama Anda di tim'
          }
          autoComplete="name"
          required
          maxLength={80}
        />
      </label>

      <label className="field">
        <span>{role === 'owner' ? 'Password Owner' : 'Password Tim'}</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={
            role === 'owner' ? 'Masukkan password owner' : 'Masukkan password tim'
          }
          required
          maxLength={1000}
        />
      </label>

      <button className="btn primary wide" disabled={!loginConfigured} type="submit">
        <LockKeyhole size={17} />
        {role === 'owner' ? 'Masuk sebagai Owner' : 'Masuk sebagai Anggota'}
      </button>

      {isDev && (
        <div className="quick-login-box">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            <Zap size={15} color="#b45309" />
            <span>Mode Dev: Akses Cepat 1-Klik</span>
          </div>
          <div className="quick-login-actions">
            <button
              type="submit"
              name="quick_role"
              value="owner"
              className="btn subtle"
              style={{ fontSize: '12px' }}
            >
              <Crown size={14} /> Masuk Owner
            </button>
            <button
              type="submit"
              name="quick_role"
              value="member"
              className="btn subtle"
              style={{ fontSize: '12px' }}
            >
              <Users size={14} /> Masuk Anggota
            </button>
          </div>
          <small style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
            Password: Owner = <code>owner123</code> | Tim = <code>tim123</code>
          </small>
        </div>
      )}
    </form>
  );
}
