import { useEffect, useState } from 'react'
import CalendarView from '../components/CalendarView'
import { useAuth } from '../context/AuthContext'
import { ensureDaily, getAllDays, setDayTarget, todayKey } from '../utils/firestore'
import { fmtDate, fmtHM, TARGET_FULL, TARGETS } from '../utils/helpers'

export default function AdminDashboard() {
  const { logout } = useAuth()
  const [days, setDays] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [todayData, setTodayData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const dateKey = todayKey()

  async function loadDashboard() {
    setLoading(true)
    try {
      const [d, today] = await Promise.all([getAllDays(), ensureDaily(dateKey)])
      setDays(d)
      setTodayData(today)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function handleSetTarget(type) {
    if (saving) return

    setSaving(true)
    try {
      await setDayTarget(dateKey, type)

      const [freshToday, freshDays] = await Promise.all([
        ensureDaily(dateKey),
        getAllDays(),
      ])

      setTodayData(freshToday)
      setDays(freshDays)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const total = days.reduce((s, d) => s + (d.totalSeconds || 0), 0)
  const done = days.filter((d) => d.done).length
  const avg = days.length ? total / days.length : 0
  const last7 = days.slice(0, 7)
  const l7total = last7.reduce((s, d) => s + (d.totalSeconds || 0), 0)

  function statusOf(d) {
    if (d.targetType === 'holiday') return { label: '🏖 Tatil', color: 'var(--mint)' }

    const p = d.target > 0 ? (d.totalSeconds || 0) / d.target : 0

    if (d.done) return { label: '✅ Tam', color: 'var(--ok)' }
    if (p >= 0.5) return { label: '⚡ Yarım', color: 'var(--warn)' }
    if (p > 0) return { label: '❗ Az', color: 'var(--danger)' }
    return { label: '○ Yok', color: 'var(--text3)' }
  }

  const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  const currentTarget = todayData?.targetType || 'full'

  return (
    <div style={S.page}>
      <div style={S.blob} />

      <header style={S.header}>
        <div style={S.hl}>
          <span style={{ fontSize: '22px' }}>👑</span>
          <div>
            <div style={S.hTitle}>Admin Paneli</div>
            <div style={S.hSub}>Çalışma istatistikleri</div>
          </div>
        </div>
        <button style={S.logoutBtn} onClick={logout}>
          Çıkış
        </button>
      </header>

      <div style={S.tabBar}>
        {[
          ['overview', '📊 Özet'],
          ['calendar', '📅 Takvim'],
          ['history', '📋 Geçmiş'],
        ].map(([v, l]) => (
          <button
            key={v}
            style={{ ...S.tab, ...(tab === v ? S.tabA : {}) }}
            onClick={() => setTab(v)}
          >
            {l}
          </button>
        ))}
      </div>

      <main style={S.main}>
        {loading && (
          <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px' }}>
            Yükleniyor…
          </p>
        )}

        {!loading && (
          <div style={S.targetCard}>
            <div style={S.targetCardHead}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
                📅 Bugünün Hedefi
              </span>
              {saved && <span style={{ fontSize: '12px', color: 'var(--ok)' }}>✅ Kaydedildi!</span>}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '14px' }}>
              Seçim yapmazsan varsayılan 6 saat devam eder.
            </p>

            <div style={S.targetBtns}>
              {Object.entries(TARGETS).map(([key, val]) => (
                <button
                  key={key}
                  disabled={saving}
                  onClick={() => handleSetTarget(key)}
                  style={{
                    ...S.targetBtn,
                    ...(currentTarget === key ? S.targetBtnActive : {}),
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {val.label}
                  {currentTarget === key && <span style={S.activeDot} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && tab === 'overview' && (
          <div className="anim-fadeup">
            <div style={S.kpiGrid}>
              {[
                { icon: '⏱', val: fmtHM(total), label: 'Toplam süre', c: 'var(--rose)' },
                { icon: '✅', val: `${done} gün`, label: 'Tamamlanan gün', c: 'var(--ok)' },
                { icon: '📈', val: fmtHM(avg), label: 'Günlük ortalama', c: 'var(--gold)' },
                { icon: '📅', val: fmtHM(l7total), label: 'Son 7 gün', c: 'var(--lavender)' },
              ].map((k, i) => (
                <div key={i} style={{ ...S.kpi, borderColor: `${k.c}40` }}>
                  <span style={{ fontSize: '28px' }}>{k.icon}</span>
                  <span style={{ ...S.kpiV, color: k.c }}>{k.val}</span>
                  <span style={S.kpiL}>{k.label}</span>
                </div>
              ))}
            </div>

            <div style={S.section}>
              <h3 style={S.sTitle}>Son 7 Gün</h3>

              {last7.length === 0 && (
                <p style={{ color: 'var(--text3)', fontSize: '14px' }}>Kayıt bulunamadı.</p>
              )}

              <div style={S.bars}>
                {[...last7].reverse().map((d) => {
                  const target = d.target || TARGET_FULL
                  const pct = target > 0 ? Math.min(100, ((d.totalSeconds || 0) / target) * 100) : 100
                  const st = statusOf(d)
                  const [, m, day] = d.date.split('-')

                  return (
                    <div key={d.date} style={S.barRow}>
                      <span style={S.barD}>
                        {day} {MONTHS[Number(m) - 1]}
                      </span>

                      <div style={S.barBg}>
                        <div
                          style={{
                            ...S.barFill,
                            width: `${pct}%`,
                            background:
                              d.targetType === 'holiday'
                                ? 'var(--mint)'
                                : d.done
                                ? 'var(--ok)'
                                : pct >= 50
                                ? 'var(--gold)'
                                : 'var(--danger)',
                          }}
                        />
                      </div>

                      <span style={{ ...S.barV, color: st.color }}>
                        {d.targetType === 'holiday' ? '🏖' : fmtHM(d.totalSeconds || 0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {!loading && tab === 'calendar' && (
          <div className="anim-fadeup">
            <CalendarView />
          </div>
        )}

        {!loading && tab === 'history' && (
          <div className="anim-fadeup">
            <div style={S.section}>
              <h3 style={S.sTitle}>Tüm Günler</h3>

              {days.length === 0 && (
                <p style={{ color: 'var(--text3)', fontSize: '14px' }}>Kayıt bulunamadı.</p>
              )}

              {days.map((d) => {
                const target = d.target || TARGET_FULL
                const pct = target > 0 ? Math.min(100, ((d.totalSeconds || 0) / target) * 100) : 100
                const st = statusOf(d)

                return (
                  <div key={d.date} style={S.hRow}>
                    <div style={S.hLeft}>
                      <span style={S.hDate}>{fmtDate(d.date)}</span>
                      <span style={{ fontSize: '12px', color: st.color }}>{st.label}</span>
                    </div>

                    <div style={S.hRight}>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text)' }}>
                        {d.targetType === 'holiday' ? '🏖 Tatil' : fmtHM(d.totalSeconds || 0)}
                      </span>

                      {!d.done && d.targetType !== 'holiday' && target > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                          –{fmtHM(target - (d.totalSeconds || 0))}
                        </span>
                      )}
                    </div>

                    <div style={S.hBar}>
                      <div
                        style={{
                          ...S.hBarF,
                          width: `${pct}%`,
                          background:
                            d.targetType === 'holiday'
                              ? 'var(--mint)'
                              : d.done
                              ? 'var(--ok)'
                              : 'var(--rose)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

const S = {
  page: { minHeight: '100vh', position: 'relative' },
  blob: {
    position: 'fixed',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle,rgba(122,232,196,.07) 0%,transparent 70%)',
    top: '-80px',
    right: '-80px',
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(15,12,26,.85)',
    backdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 200,
  },
  hl: { display: 'flex', alignItems: 'center', gap: '10px' },
  hTitle: { fontSize: '16px', fontWeight: '700', color: 'var(--text)' },
  hSub: { fontSize: '12px', color: 'var(--text3)' },
  logoutBtn: {
    background: 'var(--surface2)',
    color: 'var(--text2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    padding: '12px 16px',
    background: 'var(--bg2)',
    borderBottom: '1px solid var(--border)',
  },
  tab: {
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '10px',
    padding: '8px 16px',
    fontSize: '13px',
    color: 'var(--text2)',
    cursor: 'pointer',
    fontWeight: '600',
  },
  tabA: {
    background: 'var(--rose-dim)',
    border: '1px solid rgba(232,130,154,.3)',
    color: 'var(--rose)',
  },
  main: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '24px 16px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  targetCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border2)',
    borderRadius: '22px',
    padding: '20px',
  },
  targetCardHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  targetBtns: { display: 'flex', flexDirection: 'column', gap: '8px' },
  targetBtn: {
    padding: '13px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    position: 'relative',
    background: 'var(--surface2)',
    color: 'var(--text2)',
    border: '1px solid var(--border)',
    transition: 'all .15s',
  },
  targetBtnActive: {
    background: 'var(--rose-dim)',
    color: 'var(--rose)',
    border: '1px solid rgba(232,130,154,.4)',
  },
  activeDot: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--rose)',
    display: 'inline-block',
  },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '16px' },
  kpi: {
    background: 'var(--surface)',
    border: '1px solid',
    borderRadius: '18px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  kpiV: { fontSize: '22px', fontWeight: '700', fontFamily: 'var(--ff-serif)' },
  kpiL: { fontSize: '12px', color: 'var(--text3)' },
  section: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '22px',
    padding: '20px',
  },
  sTitle: { fontSize: '17px', marginBottom: '16px', color: 'var(--text)' },
  bars: { display: 'flex', flexDirection: 'column', gap: '10px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  barD: { fontSize: '12px', color: 'var(--text2)', width: '50px', flexShrink: 0 },
  barBg: { flex: 1, height: '10px', background: 'var(--surface3)', borderRadius: '5px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '5px', transition: 'width .5s', minWidth: '3px' },
  barV: { fontSize: '12px', fontWeight: '600', width: '58px', textAlign: 'right', flexShrink: 0 },
  hRow: {
    padding: '14px 16px',
    background: 'var(--bg2)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    marginBottom: '8px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
  },
  hLeft: { flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '3px' },
  hDate: { fontSize: '13px', fontWeight: '600', color: 'var(--text)', textTransform: 'capitalize' },
  hRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  hBar: { width: '100%', height: '4px', background: 'var(--surface3)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' },
  hBarF: { height: '100%', borderRadius: '2px', minWidth: '3px' },
}