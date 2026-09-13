export function requireUuid(value: string): string {
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new Error("Invalid identifier");
 return value;
}
export function safeRedirectPath(value: string): string {
 if (!value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/dashboard';
 try { const parsed = new URL(value, 'https://learningmap.invalid'); return parsed.origin === 'https://learningmap.invalid' ? parsed.pathname + parsed.search + parsed.hash : '/dashboard'; } catch { return '/dashboard'; }
}
