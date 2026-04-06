'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
          <h2>Something went fundamentally wrong!</h2>
          <p>{error.message || 'An unexpected global error occurred.'}</p>
          <button
            onClick={() => reset()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#3a7f44', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
