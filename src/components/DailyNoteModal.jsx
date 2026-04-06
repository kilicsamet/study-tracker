import { useEffect, useState } from 'react'

export default function DailyNoteModal({ open, onClose, onSave, saving = false }) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (open) setText('')
  }, [open])

  if (!open) return null

  const trimmed = text.trim()
  const disabled = saving || trimmed.length === 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (disabled) return
    await onSave(trimmed)
  }

  return (
    <div style={S.backdrop}>
      <div style={S.modal}>
        <div style={S.icon}>✨</div>
        <h3 style={S.title}>Bugünün sözünü bırak</h3>
        <p style={S.desc}>
          Hedefini tamamladın. Bugün için kendine ait bir cümle yaz.
        </p>

        <form onSubmit={handleSubmit} style={S.form}>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Bugün kendimle gurur duydum..."
            maxLength={700}
            style={S.textarea}
          />

          <div style={S.footer}>
            <span style={S.counter}>{trimmed.length}/700</span>

            <div style={S.actions}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{ ...S.btn, ...S.btnGhost, opacity: saving ? 0.7 : 1 }}
              >
                Kapat
              </button>

              <button
                type="submit"
                disabled={disabled}
                style={{ ...S.btn, ...S.btnPrimary, opacity: disabled ? 0.6 : 1 }}
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const S = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(7, 8, 16, 0.62)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '720px',
    background: 'var(--surface)',
    border: '1px solid var(--border2)',
    borderRadius: '24px',
    boxShadow: 'var(--shadow)',
    padding: '24px',
  },
  icon: {
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    background: 'rgba(232,130,154,.10)',
    border: '1px solid rgba(232,130,154,.22)',
    marginBottom: '14px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    lineHeight: 1.2,
    color: 'var(--text)',
  },
  desc: {
    margin: '8px 0 18px',
    color: 'var(--text2)',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  textarea: {
    width: '100%',
    minHeight: '360px',
    resize: 'vertical',
    borderRadius: '16px',
    border: '1px solid var(--border2)',
    background: 'var(--surface2)',
    color: 'var(--text)',
    padding: '16px',
    outline: 'none',
    fontSize: '15px',
    lineHeight: 1.6,
    fontFamily: 'inherit',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  counter: {
    fontSize: '12px',
    color: 'var(--text3)',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  btn: {
    borderRadius: '14px',
    padding: '12px 18px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  btnGhost: {
    background: 'var(--surface2)',
    color: 'var(--text2)',
    border: '1px solid var(--border)',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg,var(--rose),#d4547a)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 6px 22px var(--rose-glow)',
  },
}