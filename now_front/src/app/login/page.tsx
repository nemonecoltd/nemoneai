"use client";

import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002';
    window.location.replace(`${authUrl}/login?next=${encodeURIComponent(document.referrer || window.location.origin)}`);
  }, []);

  return null;
}
