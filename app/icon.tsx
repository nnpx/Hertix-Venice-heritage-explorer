// app/icon.tsx
import { ImageResponse } from 'next/og';

// Next.js config for the icon
export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 22,
                    background: '#0f172a', // Tailwind slate-900
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontFamily: 'sans-serif',
                }}
            >
                H<span style={{ color: '#2563eb' }}>.</span> {/* Tailwind blue-600 */}
            </div>
        ),
        { ...size }
    );
}