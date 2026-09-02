import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@icons';

const ConfirmDialogContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);
  const cancelButton = useRef(null);
  const dialogPanel = useRef(null);
  const previousFocus = useRef(null);

  const close = useCallback((answer) => {
    resolver.current?.(answer);
    resolver.current = null;
    setDialog(null);
    window.requestAnimationFrame(() => previousFocus.current?.focus?.());
  }, []);

  const confirm = useCallback((options) => new Promise((resolve) => {
    resolver.current?.(false);
    resolver.current = resolve;
    previousFocus.current = document.activeElement;
    setDialog({
      title: 'Confirm action',
      message: 'Are you sure you want to continue?',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      tone: 'danger',
      ...options,
    });
  }), []);

  useEffect(() => {
    if (!dialog) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelButton.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close(false);
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogPanel.current?.querySelectorAll('button:not([disabled])') || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [dialog, close]);

  return <ConfirmDialogContext.Provider value={confirm}>
    {children}
    {dialog && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) close(false); }}>
      <section ref={dialogPanel} role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
        <button type="button" onClick={() => close(false)} aria-label="Close confirmation" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"><XMarkIcon className="h-5 w-5" /></button>
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${dialog.tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{dialog.tone === 'danger' ? <ExclamationTriangleIcon className="h-6 w-6" /> : <InformationCircleIcon className="h-6 w-6" />}</span>
        <h2 id="confirm-dialog-title" className="mt-5 pr-10 text-xl font-black text-slate-950">{dialog.title}</h2>
        <p id="confirm-dialog-message" className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{dialog.message}</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelButton} type="button" onClick={() => close(false)} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">{dialog.cancelLabel}</button>
          <button type="button" onClick={() => close(true)} className={`min-h-11 rounded-xl px-5 text-sm font-bold text-white transition ${dialog.tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#1a6b3c] hover:bg-[#124d2a]'}`}>{dialog.confirmLabel}</button>
        </div>
      </section>
    </div>}
  </ConfirmDialogContext.Provider>;
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) throw new Error('useConfirmDialog must be used inside ConfirmDialogProvider.');
  return context;
}
