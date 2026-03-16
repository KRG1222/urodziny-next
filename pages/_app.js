import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Urodziny" />
        <title>Urodziny</title>
      </Head>
      <Component {...pageProps} />
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #ffffff; --bg2: #f5f4f0; --bg3: #eeecea;
          --text: #1a1a1a; --text2: #666; --text3: #999;
          --border: rgba(0,0,0,0.1); --border2: rgba(0,0,0,0.18);
          --radius: 14px; --radius-sm: 9px; --accent: #534AB7;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #1c1c1e; --bg2: #2c2c2e; --bg3: #3a3a3c;
            --text: #f2f2f7; --text2: #ababab; --text3: #6e6e73;
            --border: rgba(255,255,255,0.1); --border2: rgba(255,255,255,0.18);
          }
        }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; background: var(--bg2); color: var(--text); min-height: 100dvh; padding-bottom: env(safe-area-inset-bottom); }

        .header { background: var(--bg); border-bottom: 0.5px solid var(--border); padding: 16px 20px 14px; padding-top: calc(16px + env(safe-area-inset-top)); position: sticky; top: 0; z-index: 10; display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
        .header-left { flex: 1; min-width: 0; }
        .header-left h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .header-left p { font-size: 13px; color: var(--text2); margin-top: 1px; }
        .header-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .my-bday-chip { display: flex; align-items: center; gap: 6px; background: #EEEDFE; color: #3C3489; border-radius: 20px; padding: 6px 11px; font-size: 12px; font-weight: 600; white-space: nowrap; cursor: pointer; border: none; }
        .my-bday-chip:active { opacity: .75; }
        .chip-avatar { width: 20px; height: 20px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; flex-shrink: 0; }

        .add-btn { background: var(--text); color: var(--bg); border: none; border-radius: 20px; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; white-space: nowrap; }
        .add-btn:active { opacity: .7; }
        .icon-btn { background: none; border: none; cursor: pointer; color: var(--text3); line-height: 1; padding: 4px; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; }
        .icon-btn:active { background: var(--bg3); }

        .content { padding: 20px 16px; }
        .section-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: var(--text3); margin: 0 4px 8px; }
        .section { margin-bottom: 24px; }

        .highlight-banner { background: linear-gradient(135deg, #534AB7 0%, #7B6FD4 100%); border-radius: var(--radius); padding: 16px 18px; margin-bottom: 8px; display: flex; align-items: center; gap: 14px; position: relative; overflow: hidden; }
        .highlight-banner::before { content: ''; position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,.08); border-radius: 50%; }
        .hl-avatar { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 17px; flex-shrink: 0; border: 2.5px solid rgba(255,255,255,.35); overflow: hidden; }
        .hl-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .hl-info { flex: 1; min-width: 0; }
        .hl-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.65); margin-bottom: 2px; }
        .hl-name { font-size: 18px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hl-meta { font-size: 13px; color: rgba(255,255,255,.75); margin-top: 2px; }
        .hl-days { font-size: 13px; font-weight: 700; color: #fff; background: rgba(255,255,255,.18); padding: 6px 12px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }

        .soon-strip { background: var(--bg); border-radius: var(--radius); padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
        .ss-dot { width: 8px; height: 8px; border-radius: 50%; background: #F5A623; flex-shrink: 0; }
        .ss-name { flex: 1; font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ss-days { font-size: 13px; color: var(--text2); white-space: nowrap; }

        .card { background: var(--bg); border-radius: var(--radius); padding: 14px 16px; display: flex; align-items: center; gap: 13px; margin-bottom: 2px; }
        .card:first-of-type { border-radius: var(--radius) var(--radius) var(--radius-sm) var(--radius-sm); }
        .card:last-of-type { border-radius: var(--radius-sm) var(--radius-sm) var(--radius) var(--radius); margin-bottom: 0; }
        .card:only-of-type { border-radius: var(--radius); }
        .card-info { flex: 1; min-width: 0; }
        .card-name { font-size: 16px; font-weight: 500; }
        .card-meta { font-size: 13px; color: var(--text2); margin-top: 2px; }
        .badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
        .badge-today { background: #EEEDFE; color: #3C3489; }
        .badge-soon { background: #FAEEDA; color: #633806; }
        .badge-days { color: var(--text3); font-size: 13px; font-weight: 400; }
        .card-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
        .dots-icon { display: flex; align-items: center; gap: 2.5px; height: 20px; }
        .dots-icon span { width: 3.5px; height: 3.5px; border-radius: 50%; background: var(--text3); display: block; }

        .empty { text-align: center; padding: 48px 20px; color: var(--text2); font-size: 15px; line-height: 1.6; }
        .empty-icon { font-size: 48px; margin-bottom: 12px; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 100; display: flex; align-items: flex-end; opacity: 0; pointer-events: none; transition: opacity .2s; }
        .overlay.open { opacity: 1; pointer-events: all; }
        .sheet { background: var(--bg); border-radius: 20px 20px 0 0; padding: 0 20px calc(20px + env(safe-area-inset-bottom)); width: 100%; transform: translateY(100%); transition: transform .3s cubic-bezier(.32,.72,0,1); max-height: 92dvh; overflow-y: auto; }
        .overlay.open .sheet { transform: translateY(0); }
        .sheet-handle { width: 36px; height: 4px; background: var(--bg3); border-radius: 2px; margin: 12px auto 20px; }
        .sheet h2 { font-size: 18px; font-weight: 600; margin-bottom: 20px; }

        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 13px; color: var(--text2); margin-bottom: 6px; }
        .field input[type="text"], .field input[type="date"] { width: 100%; padding: 12px 14px; border-radius: var(--radius-sm); border: .5px solid var(--border2); background: var(--bg2); color: var(--text); font-size: 16px; outline: none; }
        .field input:focus { border-color: var(--accent); }

        .btn-photo { padding: 9px 14px; border-radius: var(--radius-sm); border: .5px solid var(--border2); background: var(--bg2); color: var(--text); font-size: 14px; font-weight: 500; display: block; }
        .btn-photo:active { opacity: .7; }
        .btn-photo-remove { padding: 9px 14px; border-radius: var(--radius-sm); border: .5px solid rgba(226,75,74,.3); background: rgba(226,75,74,.08); color: #E24B4A; font-size: 14px; font-weight: 500; cursor: pointer; width: 100%; }

        .sheet-actions { display: flex; gap: 10px; margin-top: 20px; }
        .btn-cancel { flex: 1; padding: 13px; border-radius: var(--radius-sm); border: .5px solid var(--border2); background: var(--bg2); color: var(--text); font-size: 15px; font-weight: 500; cursor: pointer; }
        .btn-save { flex: 2; padding: 13px; border-radius: var(--radius-sm); border: none; background: var(--text); color: var(--bg); font-size: 15px; font-weight: 600; cursor: pointer; }
        .btn-save:active { opacity: .8; }
        .btn-save:disabled { opacity: .5; }

        .qr-tabs { display: flex; margin-bottom: 20px; border-radius: var(--radius-sm); overflow: hidden; border: .5px solid var(--border2); }
        .qr-tab { flex: 1; padding: 10px; text-align: center; font-size: 14px; font-weight: 500; cursor: pointer; background: var(--bg2); color: var(--text2); border: none; }
        .qr-tab.active { background: var(--text); color: var(--bg); font-weight: 600; }
        .qr-box { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px 0 8px; }
        #qr-canvas { border-radius: 12px; overflow: hidden; }
        .qr-share-btn { width: 100%; padding: 13px; border-radius: var(--radius-sm); border: none; background: var(--accent); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 4px; }
        .scan-box { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px 0; }
        .scan-result { width: 100%; padding: 14px; border-radius: var(--radius-sm); background: #E1F5EE; color: #085041; font-size: 14px; font-weight: 500; text-align: center; }
        .scan-result.error-msg { background: #FAECE7; color: #4A1B0C; }
        .btn-scan-add { width: 100%; padding: 13px; border-radius: var(--radius-sm); border: none; background: var(--text); color: var(--bg); font-size: 15px; font-weight: 600; cursor: pointer; }

        .profile-header { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 8px 0 20px; }
        .profile-avatar-big { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .profile-days-badge { background: #EEEDFE; color: #3C3489; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .profile-actions { display: flex; gap: 10px; margin-bottom: 16px; }
        .btn-profile-action { flex: 1; padding: 11px; border-radius: var(--radius-sm); border: .5px solid var(--border2); background: var(--bg2); color: var(--text); font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }

        .pin-screen { position: fixed; inset: 0; background: var(--bg2); z-index: 200; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 32px calc(40px + env(safe-area-inset-bottom)); padding-top: calc(40px + env(safe-area-inset-top)); }
        .pin-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border2); background: transparent; transition: background .15s, border-color .15s; }
        .pin-dot.filled { background: var(--text); border-color: var(--text); }
        .pin-dot.error { background: #E24B4A; border-color: #E24B4A; }
        @keyframes dotShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} 80%{transform:translateX(-3px)} }
        .pin-dot.shake { animation: dotShake .4s ease; }
        .pin-numpad { display: grid; grid-template-columns: repeat(3, 72px); grid-template-rows: repeat(4, 72px); gap: 10px; }
        .pin-key { width: 72px; height: 72px; border-radius: 50%; border: none; background: var(--bg); color: var(--text); font-size: 22px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,.08); -webkit-tap-highlight-color: transparent; }
        .pin-key:active { background: var(--bg3); }
        .pin-key.empty { background: transparent; box-shadow: none; cursor: default; }
        .pin-link { margin-top: 28px; font-size: 14px; color: var(--text3); background: none; border: none; cursor: pointer; text-decoration: underline; }

        .setup-profile-screen { position: fixed; inset: 0; background: var(--bg2); z-index: 210; display: flex; flex-direction: column; padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom); overflow-y: auto; }
        .setup-profile-inner { flex: 1; display: flex; flex-direction: column; padding: 40px 24px 32px; max-width: 420px; width: 100%; margin: 0 auto; }
        .setup-field { margin-bottom: 16px; }
        .setup-field label { display: block; font-size: 13px; color: var(--text2); margin-bottom: 6px; font-weight: 500; }
        .setup-field input { width: 100%; padding: 13px 14px; border-radius: var(--radius-sm); border: .5px solid var(--border2); background: var(--bg); color: var(--text); font-size: 16px; outline: none; }
        .setup-field input:focus { border-color: var(--accent); }
        .setup-continue-btn { width: 100%; padding: 15px; border-radius: var(--radius-sm); border: none; background: var(--text); color: var(--bg); font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 8px; }
        .setup-continue-btn:disabled { opacity: .5; }
        .setup-skip { text-align: center; margin-top: 14px; font-size: 14px; color: var(--text3); cursor: pointer; background: none; border: none; text-decoration: underline; width: 100%; }
      `}</style>
    </>
  );
}
