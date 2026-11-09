import { useEffect } from 'react';

export default function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const fn = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    document.body.classList.add('no-scroll');
    return () => { window.removeEventListener('keydown', fn); document.body.classList.remove('no-scroll'); };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Avatar({ member, size = 32 }) {
  const label = (member.name || member.email || '?').slice(0, 1).toUpperCase();
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (member.photo) return <img className="avatar" src={member.photo} alt={member.name} style={style} referrerPolicy="no-referrer" />;
  return <span className={`avatar ${member.name ? '' : 'pending'}`} style={style} title={member.name || member.email}>{label}</span>;
}
