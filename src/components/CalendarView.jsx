import { useEffect, useState } from 'react'
import { getAllDays } from '../utils/firestore'
import { fmtDate, fmtHM, TARGET_FULL as TARGET } from '../utils/helpers'

const TR_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
]

const TR_DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

function getGrid(year, month) {
  const first = new Date(year, month, 1).getDay()
  const offset = first === 0 ? 6 : first - 1
  const days = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)

  return cells
}

function key(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CalendarView() {
  const now = new Date()

  const [yr, setYr] = useState(now.getFullYear())
  const [mo, setMo] = useState(now.getMonth())
  const [data, setData] = useState({})
  const [sel, setSel] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllDays().then((days) => {
      const map = {}
      days.forEach((d) => {
        map[d.date] = d
      })
      setData(map)
      setLoading(false)
    })
  }, [])

  function prev() {
    mo === 0 ? (setYr((y) => y - 1), setMo(11)) : setMo((m) => m - 1)
  }

  function next() {
    mo === 11 ? (setYr((y) => y + 1), setMo(0)) : setMo((m) => m + 1)
  }

  const cells = getGrid(yr, mo)

  function cellColor(d) {
    if (!d) return null

    const thisDate = new Date(yr, mo, d)
    if (thisDate > now) return null

    const rec = data[key(yr, mo, d)]
    if (!rec || rec.totalSeconds === 0) return '#e8828255'

    const pct = rec.totalSeconds / TARGET
    if (pct >= 1) return 'var(--ok)'
    if (pct >= 0.5) return 'var(--gold)'
    return 'var(--danger)'
  }

  const totalAll = Object.values(data).reduce((s, d) => s + (d.totalSeconds || 0), 0)
  const doneAll = Object.values(data).filter((d) => d.done).length
  const selData = sel ? data[sel] : null
  const selectedNote = String(selData?.dailyNote || '').trim()

  return (
    <div style={S.wrap}>
      <div style={S.strip}>
        <div style={S.stripItem}>
          <span style={S.stripVal}>{fmtHM(totalAll)}</span>
          <span style={S.stripKey}>Toplam</span>
        </div>

        <div style={S.stripDiv} />

        <div style={S.stripItem}>
          <span style={S.stripVal}>{doneAll}</span>
          <span style={S.stripKey}>Tam gün</span>
        </div>

        <div style={S.stripDiv} />

        <div style={S.stripItem}>
          <span style={S.stripVal}>{Object.keys(data).length}</span>
          <span style={S.stripKey}>Kayıtlı gün</span>
        </div>
      </div>

      <div style={S.header}>
        <button style={S.nav} onClick={prev}>
          ‹
        </button>

        <span style={S.month}>
          {TR_MONTHS[mo]} {yr}
        </span>

        <button style={S.nav} onClick={next}>
          ›
        </button>
      </div>

      <div style={S.dayLabels}>
        {TR_DAYS.map((d) => (
          <span key={d} style={S.dayLabel}>
            {d}
          </span>
        ))}
      </div>

      {loading ? (
        <p style={S.loading}>Yükleniyor…</p>
      ) : (
        <div style={S.grid}>
          {cells.map((d, i) => {
            const dk = d ? key(yr, mo, d) : null
            const color = cellColor(d)
            const isToday = d && new Date(yr, mo, d).toDateString() === now.toDateString()
            const isSel = dk === sel
            const rec = d ? data[dk] : null
            const pct = rec ? Math.min(100, (rec.totalSeconds / TARGET) * 100) : 0

            return (
              <div
                key={i}
                onClick={() => d && new Date(yr, mo, d) <= now && setSel(isSel ? null : dk)}
                style={{
                  ...S.cell,
                  opacity: d ? 1 : 0,
                  cursor: d ? 'pointer' : 'default',
                  background: isSel ? 'var(--rose-dim)' : color ? `${color}1a` : 'transparent',
                  border: `1px solid ${isSel ? 'var(--rose)' : color || 'var(--border)'}`,
                  outline: isToday ? '2px solid var(--rose)' : 'none',
                  outlineOffset: '1px',
                }}
              >
                <span
                  style={{
                    ...S.dayNum,
                    color: color || 'var(--text3)',
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {d}
                </span>

                {rec && pct > 0 && (
                  <div style={S.miniBar}>
                    <div
                      style={{
                        ...S.miniBarFill,
                        width: `${pct}%`,
                        background: color,
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={S.legend}>
        {[
          ['var(--ok)', 'Tam (6s)'],
          ['var(--gold)', 'Yarım'],
          ['var(--danger)', 'Az/yok'],
        ].map(([c, l]) => (
          <span key={l} style={S.legItem}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: c,
                display: 'inline-block',
                marginRight: 4,
              }}
            />
            <span style={S.legText}>{l}</span>
          </span>
        ))}
      </div>

      {sel && (
        <div style={S.detail} className="anim-fadeup">
          <div style={S.detailHead}>
            <span style={S.detailDate}>{fmtDate(sel)}</span>
            <button style={S.detailClose} onClick={() => setSel(null)}>
              ✕
            </button>
          </div>

          {selData ? (
            <>
              <div style={S.detailRow}>
                <span style={S.detailL}>Çalışılan</span>
                <span
                  style={{
                    ...S.detailV,
                    color: selData.done ? 'var(--ok)' : 'var(--rose)',
                  }}
                >
                  {fmtHM(selData.totalSeconds)}
                </span>
              </div>

              <div style={S.detailRow}>
                <span style={S.detailL}>Durum</span>
                <span
                  style={{
                    ...S.detailV,
                    color: selData.done ? 'var(--ok)' : 'var(--danger)',
                  }}
                >
                  {selData.done
                    ? '✅ Tamamlandı'
                    : `❗ ${fmtHM(Math.max(0, TARGET - (selData.totalSeconds || 0)))} eksik`}
                </span>
              </div>

              <div style={S.detailRow}>
                <span style={S.detailL}>Oturum</span>
                <span style={S.detailV}>{selData.sessions?.length || 0} kez</span>
              </div>

              <div style={S.bigBar}>
                <div
                  style={{
                    ...S.bigBarFill,
                    width: `${Math.min(100, ((selData.totalSeconds || 0) / TARGET) * 100)}%`,
                    background: selData.done ? 'var(--ok)' : 'var(--rose)',
                  }}
                />
              </div>

              {selectedNote && (
                <div style={S.noteBox}>
                  <div style={S.noteBoxLabel}>📝 Günün Sözü</div>
                  <div style={S.noteBoxText}>{selectedNote}</div>
                </div>
              )}
            </>
          ) : (
            <p style={S.emptyText}>Bu gün için kayıt yok.</p>
          )}
        </div>
      )}
    </div>
  )
}

const S = {
  wrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '22px',
    padding: '20px',
  },

  strip: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border)',
  },

  stripItem: {
    textAlign: 'center',
  },

  stripVal: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '700',
    fontFamily: 'var(--ff-serif)',
    color: 'var(--text)',
  },

  stripKey: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--text3)',
    marginTop: '2px',
  },

  stripDiv: {
    width: '1px',
    background: 'var(--border)',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },

  nav: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text)',
    fontSize: '18px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  month: {
    fontFamily: 'var(--ff-serif)',
    fontSize: '17px',
    color: 'var(--text)',
  },

  dayLabels: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7,1fr)',
    gap: '3px',
    marginBottom: '6px',
  },

  dayLabel: {
    textAlign: 'center',
    fontSize: '11px',
    color: 'var(--text3)',
    fontWeight: '600',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7,1fr)',
    gap: '3px',
  },

  cell: {
    aspectRatio: '1',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    padding: '2px',
  },

  dayNum: {
    fontSize: '12px',
    lineHeight: 1,
  },

  miniBar: {
    width: '70%',
    height: '3px',
    background: 'var(--surface3)',
    borderRadius: '2px',
    overflow: 'hidden',
  },

  miniBarFill: {
    height: '100%',
    borderRadius: '2px',
  },

  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid var(--border)',
  },

  legItem: {
    display: 'flex',
    alignItems: 'center',
  },

  legText: {
    fontSize: '11px',
    color: 'var(--text3)',
  },

  detail: {
    marginTop: '16px',
    background: 'var(--bg2)',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    padding: '16px',
  },

  detailHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },

  detailDate: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
    lineHeight: 1.4,
  },

  detailClose: {
    background: 'transparent',
    color: 'var(--text3)',
    fontSize: '14px',
    cursor: 'pointer',
    border: 'none',
  },

  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    gap: '12px',
  },

  detailL: {
    fontSize: '13px',
    color: 'var(--text2)',
  },

  detailV: {
    fontSize: '13px',
    fontWeight: '700',
  },

  bigBar: {
    height: '8px',
    background: 'var(--surface3)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '12px',
  },

  bigBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width .4s',
    minWidth: '4px',
  },

  noteBox: {
    marginTop: '14px',
    padding: '14px 16px',
    borderRadius: '16px',
    background: 'rgba(184,166,232,.10)',
    border: '1px solid rgba(184,166,232,.22)',
  },

  noteBoxLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text3)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '.4px',
  },

  noteBoxText: {
    fontSize: '14px',
    color: 'var(--text)',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },

  loading: {
    color: 'var(--text3)',
    textAlign: 'center',
    padding: '24px',
    fontSize: '14px',
  },

  emptyText: {
    fontSize: '14px',
    color: 'var(--text3)',
    textAlign: 'center',
    padding: '12px 0',
  },
}