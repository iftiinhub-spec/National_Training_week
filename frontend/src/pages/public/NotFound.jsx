import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';

export const NotFound = () => {
  return (
    <div className="flex min-h-[72vh] items-center justify-center bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl text-center">
        <Link to="/" className="inline-block">
          <img src="/logo.png" alt="National Training Week Logo" className="mx-auto h-20 w-auto object-contain" />
        </Link>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-[#1da156]">404</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-black sm:text-4xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-black/70">
          The page you are looking for may have moved, expired, or never existed.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1da156] px-5 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-black sm:w-auto"
          >
            <HomeIcon className="h-4 w-4" />
            Go Home
          </Link>
          <Link
            to="/signin"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 px-5 py-3 text-sm font-bold text-black transition-colors hover:border-[#1da156] hover:text-[#1da156] sm:w-auto"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
