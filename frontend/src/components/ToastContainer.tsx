import { useToastStore } from '../stores/toastStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast__icon">
            {t.type === 'success' && '✓'}
            {t.type === 'error' && '✕'}
            {t.type === 'warning' && '⚠'}
            {t.type === 'info' && 'ℹ'}
          </span>
          <span className="toast__message">{t.message}</span>
          <button className="toast__close" onClick={() => removeToast(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
