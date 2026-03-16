import { useEffect, useRef, useState, useCallback } from 'react';
import Head from 'next/head';

// ── HELPERS ──────────────────────────────────────────────
const COLORS = [
  { bg: '#EEEDFE', text: '#3C3489' }, { bg: '#E1F5EE', text: '#085041' },
  { bg: '#FAECE7', text: '#4A1B0C' }, { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#FAEEDA', text: '#633806' }, { bg: '#FBEAF0', text: '#4B1528' },
  { bg: '#EAF3DE', text: '#27500A' },
];
const GROUPS = ['rodzina', 'przyjaciele', 'praca', 'inne'];
const MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];

function getColor(name) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}
function initials(name) { return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join(''); }
function daysUntil(s) {
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  let nx = new Date(t.getFullYear(), m - 1, d);
  if (nx < t) nx = new Date(t.getFullYear() + 1, m - 1, d);
  return Math.round((nx - t) / 86400000);
}
function formatDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  const mo = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
  return `${d} ${mo[m - 1]} ${y}`;
}
function calcAge(s) {
  const [y, m, d] = s.split('-').map(Number); const t = new Date();
  let a = t.getFullYear() - y;
  if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) a--;
  return a;
}
function ageSuffix(n) { if (n === 1) return 'rok'; if (n >= 2 && n <= 4) return 'lata'; return 'lat'; }
function zodiac(s) {
  const [y, m, d] = s.split('-').map(Number);
  const sg = [
    { name: 'Koziorożec', symbol: '♑', end: [1, 19] }, { name: 'Wodnik', symbol: '♒', end: [2, 18] },
    { name: 'Ryby', symbol: '♓', end: [3, 20] }, { name: 'Baran', symbol: '♈', end: [4, 19] },
    { name: 'Byk', symbol: '♉', end: [5, 20] }, { name: 'Bliźnięta', symbol: '♊', end: [6, 20] },
    { name: 'Rak', symbol: '♋', end: [7, 22] }, { name: 'Lew', symbol: '♌', end: [8, 22] },
    { name: 'Panna', symbol: '♍', end: [9, 22] }, { name: 'Waga', symbol: '♎', end: [10, 22] },
    { name: 'Skorpion', symbol: '♏', end: [11, 21] }, { name: 'Strzelec', symbol: '♐', end: [12, 21] },
    { name: 'Koziorożec', symbol: '♑', end: [12, 31] },
  ];
  for (const z of sg) if (m < z.end[0] || (m === z.end[0] && d <= z.end[1])) return z;
  return sg[0];
}
function ls(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ── PHOTO UPLOAD ──────────────────────────────────────────
async function uploadPhoto(base64) {
  const formData = new FormData();
  formData.append('image', base64.replace(/^data:image\/\w+;base64,/, ''));
  const res = await fetch('https://api.imgbb.com/1/upload?key=3aad24d59db7bae281e99d817ae81732', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.data.url;
}

// ── PUSH NOTIFICATIONS ────────────────────────────────────
async function requestNotifications() {
  try {
    if (typeof Notification === 'undefined') return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch(e) { return false; }
}

function scheduleNotificationsCheck(entries) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    entries.forEach(e => {
      const days = daysUntil(e.date);
      if (days === 1) new Notification('🎂 Jutro urodziny!', { body: `${e.name} obchodzi jutro urodziny!` });
      else if (days === 0) new Notification('🎉 Dzisiaj urodziny!', { body: `${e.name} obchodzi dzisiaj urodziny!` });
    });
  } catch(e) { console.warn('Notifications not supported', e); }
}

// ── AVATAR ────────────────────────────────────────────────
function Avatar({ entry, size = 46 }) {
  const col = getColor(entry.name);
  if (entry.photo) return <img src={entry.photo} alt={entry.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: '50%', background: col.bg, color: col.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: Math.round(size * 0.33), flexShrink: 0 }}>{initials(entry.name)}</div>;
}

// ── PHOTO PICKER ──────────────────────────────────────────
function PhotoPicker({ photo, name, onPhoto, onRemove, inputId }) {
  const col = name ? getColor(name) : { bg: 'var(--bg3)', text: 'var(--text3)' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, background: photo ? undefined : col.bg, color: photo ? undefined : col.text }}>
        {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (name ? initials(name) : '?')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <label htmlFor={inputId} className="btn-photo" style={{ cursor: 'pointer', textAlign: 'center' }}>📷 {photo ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}</label>
        <input type="file" id={inputId} accept="image/*" style={{ display: 'none' }} onChange={onPhoto} />
        {photo && <button className="btn-photo-remove" onClick={onRemove}>Usuń zdjęcie</button>}
      </div>
    </div>
  );
}

// ── PIN SCREEN ────────────────────────────────────────────
function PinScreen({ initialStage, onSaved, onUnlocked, onReset }) {
  const [stage, setStage] = useState(initialStage);
  const [buffer, setBuffer] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const stageRef = useRef(stage);
  const firstRef = useRef('');
  useEffect(() => { stageRef.current = stage; }, [stage]);

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 400); };

  const press = (digit) => {
    setBuffer(prev => {
      if (prev.length >= 4) return prev;
      const next = prev + digit;
      if (next.length === 4) setTimeout(() => commit(next), 120);
      return next;
    });
  };

  const commit = (val) => {
    const s = stageRef.current;
    if (s === 'setup') {
      firstRef.current = val; setBuffer(''); setError(''); setStage('confirm');
    } else if (s === 'confirm') {
      if (val === firstRef.current) { localStorage.setItem('app_pin', val); onSaved(); }
      else { setError('PINy się nie zgadzają.'); doShake(); setTimeout(() => { firstRef.current = ''; setBuffer(''); setError(''); setStage('setup'); }, 900); }
    } else {
      const stored = localStorage.getItem('app_pin');
      if (val === stored) { onUnlocked(); }
      else { setError('Nieprawidłowy PIN.'); doShake(); setTimeout(() => { setBuffer(''); setError(''); }, 800); }
    }
  };

  const del = () => setBuffer(b => b.slice(0, -1));

  useEffect(() => {
    const handler = (e) => { if (e.key >= '0' && e.key <= '9') press(e.key); else if (e.key === 'Backspace') del(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const icons  = { setup: '🔐', confirm: '🔄', unlock: '🔐' };
  const titles = { setup: 'Ustaw PIN', confirm: 'Potwierdź PIN', unlock: 'Urodziny' };
  const subs   = { setup: 'Wpisz 4-cyfrowy PIN,\nktóry będzie chronić Twój kalendarz.', confirm: 'Wpisz PIN jeszcze raz,\naby potwierdzić.', unlock: 'Wpisz PIN, aby otworzyć kalendarz.' };

  return (
    <div className="pin-screen">
      <div style={{ fontSize: 52, marginBottom: 16 }}>{icons[stage]}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>{titles[stage]}</div>
      <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 40, textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{subs[stage]}</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
        {[0,1,2,3].map(i => <div key={i} className={`pin-dot${buffer.length > i ? ' filled' : ''}${shake ? ' error' : ''}`} />)}
      </div>
      <div className="pin-numpad">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
          <button key={i} className={`pin-key${k === '' ? ' empty' : ''}`} onClick={() => k === '⌫' ? del() : k !== '' ? press(k) : null}>{k}</button>
        ))}
      </div>
      <div style={{ fontSize: 14, color: '#E24B4A', marginTop: 20, height: 20, textAlign: 'center' }}>{error}</div>
      {stage === 'unlock' && <button className="pin-link" onClick={onReset}>Zapomniałem PINu (reset danych)</button>}
    </div>
  );
}

// ── SETUP PROFILE ─────────────────────────────────────────
function SetupProfileScreen({ onSave, onSkip }) {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handlePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file); e.target.value = '';
  };

  const handleSave = async () => {
    if (!name.trim()) { alert('Podaj swoje imię.'); return; }
    if (!dob) { alert('Podaj datę urodzin.'); return; }
    let photoUrl = null;
    if (photo) {
      try { setUploading(true); photoUrl = await uploadPhoto(photo); }
      catch { alert('Nie udało się przesłać zdjęcia. Spróbuj ponownie.'); setUploading(false); return; }
      finally { setUploading(false); }
    }
    onSave({ name: name.trim(), dob, photo: photoUrl });
  };

  const col = name ? getColor(name) : { bg: 'var(--bg3)', text: 'var(--text3)' };
  return (
    <div className="setup-profile-screen">
      <div className="setup-profile-inner">
        <div style={{ fontSize: 44, marginBottom: 12 }}>🎂</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4, marginBottom: 6 }}>Twój profil</h2>
        <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 28, lineHeight: 1.5 }}>Podaj swoje dane — będziemy liczyć dni do Twoich urodzin i pozwolimy Ci udostępniać profil przez QR kod.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, background: photo ? undefined : col.bg, color: photo ? undefined : col.text }}>
            {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (name ? initials(name) : '?')}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="setup-photo-input" className="btn-photo" style={{ cursor: 'pointer', textAlign: 'center' }}>📷 Dodaj zdjęcie</label>
            <input type="file" id="setup-photo-input" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            {photo && <button className="btn-photo-remove" onClick={() => setPhoto(null)}>Usuń zdjęcie</button>}
          </div>
        </div>
        <div className="setup-field"><label>Imię i nazwisko</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. Jan Kowalski" autoComplete="off" /></div>
        <div className="setup-field"><label>Data urodzin</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} /></div>
        <button className="setup-continue-btn" onClick={handleSave} disabled={uploading}>{uploading ? 'Przesyłanie...' : 'Gotowe →'}</button>
        <button className="setup-skip" onClick={onSkip}>Pomiń na teraz</button>
      </div>
    </div>
  );
}

// ── SHEET ─────────────────────────────────────────────────
function Sheet({ open, onClose, children }) {
  return (
    <div className={`overlay${open ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">{children}</div>
    </div>
  );
}

// ── ENTRY SHEET ───────────────────────────────────────────
function EntrySheet({ open, onClose, entry, onSave }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [photo, setPhoto] = useState(null);
  const [group, setGroup] = useState('inne');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(entry?.name || '');
      setDate(entry?.date || '');
      setPhoto(entry?.photo || null);
      setGroup(entry?.group || 'inne');
      setNote(entry?.note || '');
    }
  }, [open, entry]);

  const handlePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file); e.target.value = '';
  };

  const handleSave = async () => {
    if (!name.trim() || !date) return;
    let photoUrl = photo;
    if (photo && photo.startsWith('data:')) {
      try { setUploading(true); photoUrl = await uploadPhoto(photo); }
      catch { alert('Nie udało się przesłać zdjęcia.'); setUploading(false); return; }
      finally { setUploading(false); }
    }
    onSave({ name: name.trim(), date, photo: photoUrl || null, group, note: note.trim() });
  };

  const previewPhoto = photo && (photo.startsWith('data:') || photo.startsWith('http')) ? photo : null;

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-handle" />
      <h2>{entry ? 'Edytuj osobę' : 'Nowa osoba'}</h2>
      <PhotoPicker photo={previewPhoto} name={name} onPhoto={handlePhoto} onRemove={() => setPhoto(null)} inputId="entry-photo-input" />
      <div className="field"><label>Imię i nazwisko</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. Jan Kowalski" autoComplete="off" /></div>
      <div className="field"><label>Data urodzin</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
      <div className="field">
        <label>Grupa</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GROUPS.map(g => (
            <button key={g} onClick={() => setGroup(g)} style={{ padding: '6px 12px', borderRadius: 20, border: '0.5px solid', borderColor: group === g ? 'var(--accent)' : 'var(--border2)', background: group === g ? 'var(--accent)' : 'var(--bg2)', color: group === g ? '#fff' : 'var(--text)', fontSize: 13, fontWeight: group === g ? 600 : 400, cursor: 'pointer' }}>
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Notatka (np. co lubią, pomysły na prezent)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="np. lubi książki, kocha kawę..." style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border2)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 72, outline: 'none' }} />
      </div>
      <div className="sheet-actions">
        <button className="btn-cancel" onClick={onClose}>Anuluj</button>
        <button className="btn-save" onClick={handleSave} disabled={uploading}>{uploading ? 'Przesyłanie...' : 'Zapisz'}</button>
      </div>
    </Sheet>
  );
}

// ── PROFILE SHEET ─────────────────────────────────────────
function ProfileSheet({ open, onClose, profile, onOpenQr, onEdit }) {
  if (!profile) return null;
  const col = getColor(profile.name);
  const days = daysUntil(profile.dob);
  const z = zodiac(profile.dob);
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-handle" />
      <div className="profile-header">
        <div className="profile-avatar-big">
          {profile.photo ? <img src={profile.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: 80, height: 80, borderRadius: '50%', background: col.bg, color: col.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 26 }}>{initials(profile.name)}</div>}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.name}</div>
        <div style={{ fontSize: 14, color: 'var(--text2)' }}>{formatDate(profile.dob)} · {z.symbol} {z.name}</div>
        <div className="profile-days-badge">{days === 0 ? '🎉 Dzisiaj Twoje urodziny!' : `Do Twoich urodzin: ${days} dni`}</div>
      </div>
      <div className="profile-actions">
        <button className="btn-profile-action" onClick={() => { onClose(); onOpenQr(); }}>📱 QR kod</button>
        <button className="btn-profile-action" onClick={() => { onClose(); onEdit(); }}>✏️ Edytuj profil</button>
      </div>
      <div style={{ height: .5, background: 'var(--border)', margin: '4px 0 16px' }} />
      <div className="sheet-actions"><button className="btn-cancel" onClick={onClose}>Zamknij</button></div>
    </Sheet>
  );
}

// ── EDIT PROFILE SHEET ────────────────────────────────────
function EditProfileSheet({ open, onClose, profile, onSave }) {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) { setName(profile?.name || ''); setDob(profile?.dob || ''); setPhoto(profile?.photo || null); }
  }, [open, profile]);

  const handlePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file); e.target.value = '';
  };

  const handleSave = async () => {
    if (!name.trim() || !dob) { alert('Podaj imię i datę urodzin.'); return; }
    let photoUrl = photo;
    if (photo && photo.startsWith('data:')) {
      try { setUploading(true); photoUrl = await uploadPhoto(photo); }
      catch { alert('Nie udało się przesłać zdjęcia.'); setUploading(false); return; }
      finally { setUploading(false); }
    }
    onSave({ name: name.trim(), dob, photo: photoUrl || null });
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-handle" />
      <h2>Edytuj profil</h2>
      <PhotoPicker photo={photo && (photo.startsWith('data:') || photo.startsWith('http')) ? photo : null} name={name} onPhoto={handlePhoto} onRemove={() => setPhoto(null)} inputId="profile-edit-photo" />
      <div className="field"><label>Imię i nazwisko</label><input type="text" value={name} onChange={e => setName(e.target.value)} /></div>
      <div className="field"><label>Data urodzin</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} /></div>
      <div className="sheet-actions">
        <button className="btn-cancel" onClick={onClose}>Anuluj</button>
        <button className="btn-save" onClick={handleSave} disabled={uploading}>{uploading ? 'Przesyłanie...' : 'Zapisz'}</button>
      </div>
    </Sheet>
  );
}

// ── QR SHEET ─────────────────────────────────────────────
function QrSheet({ open, onClose, profile, onOpenProfile }) {
  const [tab, setTab] = useState('show');
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const qrRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!open) { stopScan(); return; }
    if (tab === 'show') { stopScan(); setTimeout(generateQr, 100); }
    if (tab === 'scan') startScan();
  }, [open, tab]);

  useEffect(() => { if (!open) { stopScan(); setScanResult(null); setScanError(''); } }, [open]);

  const generateQr = () => {
    if (!qrRef.current) return;
    qrRef.current.innerHTML = '';
    if (!profile?.dob) return;
    const photoParam = profile.photo ? `&photo=${encodeURIComponent(profile.photo)}` : '';
    const url = `${window.location.origin}${window.location.pathname}?add=${encodeURIComponent(`${profile.name}|${profile.dob}`)}${photoParam}`;
    if (window.QRCode) new window.QRCode(qrRef.current, { text: url, width: 220, height: 220, colorDark: '#1a1a1a', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M });
  };

  const startScan = async () => {
    setScanResult(null); setScanError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      if ('BarcodeDetector' in window) {
        const det = new window.BarcodeDetector({ formats: ['qr_code'] });
        intervalRef.current = setInterval(async () => {
          try { const codes = await det.detect(videoRef.current); if (codes.length > 0) processResult(codes[0].rawValue); } catch {}
        }, 400);
      } else setScanError('Automatyczne skanowanie niedostępne. Użyj aparatu systemowego.');
    } catch { setScanError('Brak dostępu do kamery.'); }
  };

  const stopScan = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const processResult = (raw) => {
    stopScan();
    try {
      const url = new URL(raw);
      const add = url.searchParams.get('add');
      const photo = url.searchParams.get('photo');
      if (add) {
        const [name, date] = decodeURIComponent(add).split('|');
        if (name && date) { setScanResult({ name, date, photo: photo ? decodeURIComponent(photo) : null }); return; }
      }
    } catch {}
    setScanError('Nie rozpoznano kodu — spróbuj ponownie.');
  };

  const addScanned = () => {
    if (!scanResult) return;
    const entries = ls('birthdays') || [];
    if (!entries.find(e => e.name === scanResult.name && e.date === scanResult.date)) {
      entries.push({ id: Date.now().toString(), name: scanResult.name, date: scanResult.date, group: 'inne', note: '', ...(scanResult.photo ? { photo: scanResult.photo } : {}) });
      lsSet('birthdays', entries);
    }
    onClose(); setScanResult(null);
  };

  const shareQr = () => {
    if (!profile) return;
    const photoParam = profile.photo ? `&photo=${encodeURIComponent(profile.photo)}` : '';
    const url = `${window.location.origin}${window.location.pathname}?add=${encodeURIComponent(`${profile.name}|${profile.dob}`)}${photoParam}`;
    if (navigator.share) navigator.share({ title: `Urodziny – ${profile.name}`, text: 'Dodaj moje urodziny!', url });
    else navigator.clipboard.writeText(url).then(() => alert('Link skopiowany!'));
  };

  const z = profile?.dob ? zodiac(profile.dob) : null;

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-handle" />
      <h2>Udostępnij datę urodzin</h2>
      <div className="qr-tabs">
        <button className={`qr-tab${tab === 'show' ? ' active' : ''}`} onClick={() => setTab('show')}>📲 Mój QR</button>
        <button className={`qr-tab${tab === 'scan' ? ' active' : ''}`} onClick={() => setTab('scan')}>🔍 Skanuj</button>
      </div>
      {tab === 'show' && (
        <div>
          <div className="qr-box">
            {!profile?.dob ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Uzupełnij swój profil</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Podaj imię i datę urodzin, aby wygenerować QR kod.</div>
                <button onClick={() => { onClose(); onOpenProfile(); }} style={{ padding: '11px 22px', borderRadius: 9, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Ustaw profil →</button>
              </div>
            ) : (
              <>
                <div ref={qrRef} id="qr-canvas" />
                <div style={{ fontSize: 16, fontWeight: 600, textAlign: 'center' }}>{profile.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', marginTop: -8 }}>{formatDate(profile.dob)} · {z?.symbol} {z?.name}</div>
              </>
            )}
          </div>
          {profile?.dob && <button className="qr-share-btn" onClick={shareQr}>🔗 Udostępnij link</button>}
        </div>
      )}
      {tab === 'scan' && (
        <div className="scan-box">
          <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', maxWidth: 320, borderRadius: 12, aspectRatio: '1', objectFit: 'cover', background: '#000' }} />
          <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>Skieruj kamerę na kod QR osoby,<br />której chcesz dodać urodziny.</div>
          {scanError && <div className="scan-result error-msg">{scanError}</div>}
          {scanResult && (
            <>
              <div className="scan-result">✓ Znaleziono: {scanResult.name}, {formatDate(scanResult.date)}{scanResult.photo ? ' · ze zdjęciem 📷' : ''}</div>
              <button className="btn-scan-add" onClick={addScanned}>+ Dodaj do kalendarza</button>
            </>
          )}
        </div>
      )}
      <div className="sheet-actions" style={{ marginTop: 16 }}>
        <button className="btn-cancel" onClick={onClose}>Zamknij</button>
      </div>
    </Sheet>
  );
}

// ── STATS SHEET ───────────────────────────────────────────
function StatsSheet({ open, onClose, entries }) {
  if (!entries.length) return null;

  // Urodziny per miesiąc
  const perMonth = Array(12).fill(0);
  entries.forEach(e => { const m = parseInt(e.date.split('-')[1]) - 1; perMonth[m]++; });
  const maxPerMonth = Math.max(...perMonth, 1);

  // Per grupa
  const perGroup = {};
  GROUPS.forEach(g => perGroup[g] = 0);
  entries.forEach(e => { perGroup[e.group || 'inne']++; });

  // Najbliższe w tym miesiącu
  const now = new Date();
  const thisMonth = entries.filter(e => parseInt(e.date.split('-')[1]) === now.getMonth() + 1);

  // Najstarszy i najmłodszy
  const withAge = entries.map(e => ({ ...e, age: calcAge(e.date) })).filter(e => e.age >= 0);
  const oldest = withAge.sort((a, b) => b.age - a.age)[0];
  const youngest = withAge.sort((a, b) => a.age - b.age)[0];

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-handle" />
      <h2>📊 Statystyki</h2>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Wszystkich osób', value: entries.length },
          { label: 'W tym miesiącu', value: thisMonth.length },
          oldest && { label: 'Najstarsza osoba', value: `${oldest.name.split(' ')[0]}, ${oldest.age} l.` },
          youngest && { label: 'Najmłodsza osoba', value: `${youngest.name.split(' ')[0]}, ${youngest.age} l.` },
        ].filter(Boolean).map((c, i) => (
          <div key={i} style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Per miesiąc bar chart */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)', marginBottom: 10 }}>Urodziny w miesiącach</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
          {perMonth.map((count, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: '100%', background: count > 0 ? 'var(--accent)' : 'var(--bg3)', borderRadius: '3px 3px 0 0', height: `${(count / maxPerMonth) * 48 + (count > 0 ? 4 : 0)}px`, minHeight: count > 0 ? 8 : 2, transition: 'height 0.3s' }} />
              <div style={{ fontSize: 8, color: 'var(--text3)' }}>{MONTH_NAMES[i].slice(0, 3)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per grupa */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)', marginBottom: 10 }}>Według grup</div>
        {GROUPS.filter(g => perGroup[g] > 0).map(g => (
          <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 70, fontSize: 13, color: 'var(--text2)', textTransform: 'capitalize' }}>{g}</div>
            <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${(perGroup[g] / entries.length) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, minWidth: 16 }}>{perGroup[g]}</div>
          </div>
        ))}
      </div>

      <div className="sheet-actions" style={{ marginTop: 16 }}>
        <button className="btn-cancel" onClick={onClose}>Zamknij</button>
      </div>
    </Sheet>
  );
}

// ── TIMELINE SHEET ────────────────────────────────────────
function TimelineSheet({ open, onClose, entries }) {
  const now = new Date();
  // Group entries by month of birthday (next 12 months)
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = (now.getMonth() + i) % 12;
    const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
    const monthEntries = entries
      .map(e => ({ ...e, days: daysUntil(e.date) }))
      .filter(e => {
        const bd = parseInt(e.date.split('-')[1]) - 1;
        return bd === m;
      })
      .sort((a, b) => a.days - b.days);
    return { month: m, year, entries: monthEntries };
  }).filter(m => m.entries.length > 0);

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-handle" />
      <h2>📅 Oś czasu</h2>
      {months.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text2)' }}>Brak danych</div>}
      {months.map(({ month, year, entries: mes }) => (
        <div key={`${month}-${year}`} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)', marginBottom: 8 }}>
            {MONTH_NAMES[month]} {year}
          </div>
          {mes.map(e => {
            const a = calcAge(e.date);
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 2 }}>
                <Avatar entry={e} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{e.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{formatDate(e.date)} · {a + 1} {ageSuffix(a + 1)}</div>
                </div>
                <div style={{ fontSize: 12, color: e.days <= 7 ? '#633806' : 'var(--text3)', background: e.days <= 7 ? '#FAEEDA' : 'var(--bg2)', padding: '3px 8px', borderRadius: 12, whiteSpace: 'nowrap', fontWeight: e.days <= 7 ? 600 : 400 }}>
                  {e.days === 0 ? 'Dzisiaj!' : e.days === 1 ? 'Jutro' : `za ${e.days} dni`}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div className="sheet-actions" style={{ marginTop: 8 }}>
        <button className="btn-cancel" onClick={onClose}>Zamknij</button>
      </div>
    </Sheet>
  );
}

// ── SETTINGS SHEET ────────────────────────────────────────
function SettingsSheet({ open, onClose, notifEnabled, onToggleNotif, onResetPin }) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-handle" />
      <h2>⚙️ Ustawienia</h2>

      {/* Powiadomienia */}
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Powiadomienia</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Przypomnij dzień przed urodzinami</div>
          </div>
          <button onClick={onToggleNotif} style={{ width: 44, height: 26, borderRadius: 13, border: 'none', background: notifEnabled ? 'var(--accent)' : 'var(--bg3)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: notifEnabled ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>
        {notifEnabled && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>✓ Powiadomienia są włączone</div>}
      </div>

      {/* PWA install hint */}
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Dodaj do ekranu głównego</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
          iPhone: kliknij <strong>Udostępnij</strong> → <strong>Dodaj do ekranu głównego</strong><br />
          Android: kliknij menu przeglądarki → <strong>Zainstaluj aplikację</strong>
        </div>
      </div>

      <div style={{ height: .5, background: 'var(--border)', margin: '8px 0 12px' }} />

      {/* Reset PIN */}
      <button onClick={onResetPin} style={{ width: '100%', padding: '13px', borderRadius: 'var(--radius-sm)', border: '0.5px solid rgba(226,75,74,0.3)', background: 'rgba(226,75,74,0.08)', color: '#E24B4A', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
        Resetuj PIN i dane
      </button>

      <div className="sheet-actions" style={{ marginTop: 12 }}>
        <button className="btn-cancel" onClick={onClose}>Zamknij</button>
      </div>
    </Sheet>
  );
}

// ── MAIN APP ──────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState('loading');
  const [pinStage, setPinStage] = useState('setup');
  const [entries, setEntries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [pendingAdd, setPendingAdd] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [todayLabel, setTodayLabel] = useState('');
  const [filterGroup, setFilterGroup] = useState('wszystkie');
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('add')) {
      try {
        const [name, date] = decodeURIComponent(params.get('add')).split('|');
        const photo = params.has('photo') ? decodeURIComponent(params.get('photo')) : null;
        if (name && date) setPendingAdd({ name, date, photo });
      } catch {}
      history.replaceState({}, '', window.location.pathname);
    }
    const stored = localStorage.getItem('app_pin');
    setPinStage(stored ? 'unlock' : 'setup');
    setScreen('pin');
    setNotifEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted');

    const t = new Date();
    const days = ['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota'];
    const months = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
    setTodayLabel(`${days[t.getDay()]}, ${t.getDate()} ${months[t.getMonth()]}`);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.QRCode) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      document.head.appendChild(s);
    }
  }, []);

  const enterApp = useCallback(() => {
    const e = ls('birthdays') || [];
    const p = ls('user_profile');
    setEntries(e); setProfile(p);
    setPendingAdd(prev => {
      if (prev) {
        const exists = e.find(x => x.name === prev.name && x.date === prev.date);
        if (!exists) {
          const updated = [...e, { id: Date.now().toString(), name: prev.name, date: prev.date, group: 'inne', note: '', ...(prev.photo ? { photo: prev.photo } : {}) }];
          lsSet('birthdays', updated); setEntries(updated);
          setTimeout(() => alert(`✓ Dodano: ${prev.name} (${formatDate(prev.date)})`), 300);
        }
      }
      return null;
    });
    if (!p) setScreen('profile-setup');
    else {
      setScreen('app');
      // Check notifications on enter
      setTimeout(() => scheduleNotificationsCheck(ls('birthdays') || []), 1000);
    }
  }, []);

  const handleToggleNotif = async () => {
    if (notifEnabled) { setNotifEnabled(false); return; }
    const granted = await requestNotifications();
    setNotifEnabled(granted);
    if (granted) scheduleNotificationsCheck(entries);
  };

  const handleResetPin = () => {
    if (!confirm('Resetowanie PINu usunie wszystkie dane. Kontynuować?')) return;
    localStorage.removeItem('app_pin'); localStorage.removeItem('birthdays'); localStorage.removeItem('user_profile');
    setEntries([]); setProfile(null); setSheet(null); setPinStage('setup'); setScreen('pin');
  };

  const saveEntry = (data) => {
    let updated;
    if (editEntry) {
      updated = entries.map(e => e.id === editEntry.id ? { ...e, ...data, photo: data.photo || undefined } : e);
    } else {
      const entry = { id: Date.now().toString(), ...data };
      if (!entry.photo) delete entry.photo;
      updated = [...entries, entry];
    }
    lsSet('birthdays', updated); setEntries(updated); setSheet(null); setEditEntry(null);
  };

  const deleteEntry = (id) => {
    if (!confirm('Usunąć tę osobę?')) return;
    const updated = entries.filter(e => e.id !== id);
    lsSet('birthdays', updated); setEntries(updated);
  };

  // Filter by group
  const filtered = filterGroup === 'wszystkie' ? entries : entries.filter(e => (e.group || 'inne') === filterGroup);
  const sortedEntries = filtered.map(e => ({ ...e, days: daysUntil(e.date) })).sort((a, b) => a.days - b.days);
  const nearest = sortedEntries[0];
  const soonOthers = sortedEntries.slice(1).filter(e => e.days <= 30);
  const rest = sortedEntries.filter(e => !soonOthers.includes(e));

  const myDays = profile?.dob ? daysUntil(profile.dob) : null;
  const col = profile ? getColor(profile.name) : null;

  if (screen === 'loading') return null;
  if (screen === 'pin') return <PinScreen initialStage={pinStage} onSaved={enterApp} onUnlocked={enterApp} onReset={handleResetPin} />;
  if (screen === 'profile-setup') return <SetupProfileScreen onSave={(p) => { lsSet('user_profile', p); setProfile(p); setScreen('app'); }} onSkip={() => setScreen('app')} />;

  return (
    <>
      <Head>
        <meta name="theme-color" content="#534AB7" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div className="header">
        <div className="header-left">
          <h1>Urodziny 🎂</h1>
          <p>{todayLabel}</p>
        </div>
        <div className="header-right">
          {profile?.dob && (
            <button className="my-bday-chip" onClick={() => setSheet('profile')}>
              <div className="chip-avatar">
                {profile.photo ? <img src={profile.photo} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ background: col.bg, color: col.text, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{initials(profile.name)}</span>}
              </div>
              <span>{myDays === 0 ? '🎉 Dzisiaj!' : `${myDays} dni`}</span>
            </button>
          )}
          <button className="add-btn" onClick={() => { setEditEntry(null); setSheet('add'); }}>+ Dodaj</button>
          <button className="icon-btn" onClick={() => setSheet('qr')} title="QR" style={{ fontSize: 18 }}>📱</button>
          <button className="icon-btn" onClick={() => setSheet('timeline')} title="Oś czasu" style={{ fontSize: 18 }}>📅</button>
          <button className="icon-btn" onClick={() => setSheet('stats')} title="Statystyki" style={{ fontSize: 18 }}>📊</button>
          <button className="icon-btn" onClick={() => setSheet('settings')} title="Ustawienia" style={{ fontSize: 18 }}>⚙️</button>
        </div>
      </div>

      {/* Group filter */}
      {entries.length > 0 && (
        <div style={{ padding: '10px 16px 0', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {['wszystkie', ...GROUPS].map(g => (
            <button key={g} onClick={() => setFilterGroup(g)} style={{ padding: '5px 12px', borderRadius: 20, border: '0.5px solid', borderColor: filterGroup === g ? 'var(--accent)' : 'var(--border2)', background: filterGroup === g ? 'var(--accent)' : 'var(--bg)', color: filterGroup === g ? '#fff' : 'var(--text2)', fontSize: 12, fontWeight: filterGroup === g ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {g}
            </button>
          ))}
        </div>
      )}

      <div className="content">
        {sortedEntries.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🎈</div>
            {entries.length === 0 ? 'Brak zapisanych urodzin.\nDodaj pierwszą osobę!' : `Brak osób w grupie "${filterGroup}".`}
          </div>
        ) : (
          <>
            <div className="section">
              <div className="section-label">Następne urodziny</div>
              <div className="highlight-banner">
                <div className="hl-avatar">
                  {nearest.photo ? <img src={nearest.photo} alt="" /> : <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>{initials(nearest.name)}</span>}
                </div>
                <div className="hl-info">
                  <div className="hl-label">Najbliższe urodziny</div>
                  <div className="hl-name">{nearest.name}</div>
                  <div className="hl-meta">{formatDate(nearest.date)} · {calcAge(nearest.date)} {ageSuffix(calcAge(nearest.date))} · {zodiac(nearest.date).symbol} {zodiac(nearest.date).name}</div>
                  {nearest.note && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>📝 {nearest.note}</div>}
                </div>
                <div className="hl-days">{nearest.days === 0 ? '🎉 Dzisiaj!' : nearest.days === 1 ? 'Jutro!' : `za ${nearest.days} dni`}</div>
              </div>
            </div>

            {soonOthers.length > 0 && (
              <div className="section">
                <div className="section-label">W ciągu 30 dni</div>
                {soonOthers.map(e => (
                  <div key={e.id} className="soon-strip">
                    <div className="ss-dot" />
                    <Avatar entry={e} size={36} />
                    <div className="ss-name">{e.name}</div>
                    <div className="ss-days">{e.days === 0 ? 'Dzisiaj!' : e.days === 1 ? 'Jutro' : `za ${e.days} dni`}</div>
                    <div className="card-actions">
                      <button className="icon-btn" onClick={() => { setEditEntry(e); setSheet('edit'); }}><div className="dots-icon"><span /><span /><span /></div></button>
                      <button className="icon-btn" onClick={() => deleteEntry(e.id)} style={{ fontSize: 18 }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="section">
              <div className="section-label">Wszystkie</div>
              {rest.map(e => {
                const a = calcAge(e.date);
                return (
                  <div key={e.id} className="card">
                    <Avatar entry={e} size={46} />
                    <div className="card-info">
                      <div className="card-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {e.name}
                        {e.group && e.group !== 'inne' && <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg2)', padding: '2px 6px', borderRadius: 10 }}>{e.group}</span>}
                      </div>
                      <div className="card-meta">{formatDate(e.date)} · {a} {ageSuffix(a)} · {zodiac(e.date).symbol} {zodiac(e.date).name}</div>
                      {e.note && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>📝 {e.note}</div>}
                    </div>
                    {e.days === 0 ? <span className="badge badge-today">Dzisiaj!</span> : e.days <= 7 ? <span className="badge badge-soon">za {e.days} dni</span> : <span className="badge-days">{e.days} dni</span>}
                    <div className="card-actions">
                      <button className="icon-btn" onClick={() => { setEditEntry(e); setSheet('edit'); }}><div className="dots-icon"><span /><span /><span /></div></button>
                      <button className="icon-btn" onClick={() => deleteEntry(e.id)} style={{ fontSize: 18 }}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <EntrySheet open={sheet === 'add' || sheet === 'edit'} onClose={() => { setSheet(null); setEditEntry(null); }} entry={editEntry} onSave={saveEntry} />
      <ProfileSheet open={sheet === 'profile'} onClose={() => setSheet(null)} profile={profile} onOpenQr={() => setSheet('qr')} onEdit={() => setSheet('edit-profile')} />
      <EditProfileSheet open={sheet === 'edit-profile'} onClose={() => setSheet(null)} profile={profile} onSave={(p) => { lsSet('user_profile', p); setProfile(p); setSheet(null); }} />
      <QrSheet open={sheet === 'qr'} onClose={() => setSheet(null)} profile={profile} onOpenProfile={() => setSheet('profile')} />
      <StatsSheet open={sheet === 'stats'} onClose={() => setSheet(null)} entries={entries} />
      <TimelineSheet open={sheet === 'timeline'} onClose={() => setSheet(null)} entries={entries} />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} notifEnabled={notifEnabled} onToggleNotif={handleToggleNotif} onResetPin={() => { setSheet(null); handleResetPin(); }} />
    </>
  );
}
