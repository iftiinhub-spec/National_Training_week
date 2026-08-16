import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Application render failed:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 text-slate-950 dark:bg-[#121212] dark:text-white">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-[#181818]">
          <h1 className="text-2xl font-black">Something went wrong</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/70">
            The page could not finish loading. Refresh the page, or sign in again if your session expired.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-xl bg-[#1a6b3c] px-5 text-sm font-bold text-white"
            >
              Refresh page
            </button>
            <a
              href="/signin"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 dark:border-white/15 dark:text-white"
            >
              Sign in again
            </a>
          </div>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;
