import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Accessibility, Activity, ArrowLeft, ArrowRight, Bell, Bot, Bus, Check, ChevronRight,
  CircleHelp, Clock3, Compass, CreditCard, Crosshair, Gauge, Headphones, Heart,
  Home as HomeIcon, LocateFixed, Map, MapPin, Menu, Mic, Navigation, Pause, Pin,
  Plane, Play, Radio, RotateCcw, Route, Send, Settings, ShieldCheck, Sparkles,
  TrainFront, UserRound, Volume2, X, Zap
} from 'lucide-react';
import './styles.css';

const navItems = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'map', label: 'Live map', icon: Map },
  { id: 'journey', label: 'Journey', icon: Route },
  { id: 'oracle', label: 'Oracle', icon: Bot },
  { id: 'comfort', label: 'Comfort', icon: Settings }
];

function useScreen() {
  const [screen, setScreen] = useState(() => window.location.hash.slice(1) || 'home');
  useEffect(() => {
    const onHash = () => setScreen(window.location.hash.slice(1) || 'home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const navigate = (id) => { window.location.hash = id; window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return [screen, navigate];
}

function IconButton({ children, label, onClick, className = '' }) {
  return <button className={`icon-button ${className}`} aria-label={label} onClick={onClick}>{children}</button>;
}

function Header({ onComfort }) {
  return <>
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark"><Navigation size={19} /></div>
        <div><strong>WAYMARK 2100</strong><span>PLANETARY TRANSIT NETWORK</span></div>
      </div>
      <div className="top-actions">
        <span className="system-pill"><i /> SYS.LIVE</span>
        <IconButton label="Open comfort settings" onClick={onComfort}><Settings size={19} /></IconButton>
      </div>
    </header>
    <div className="telemetry-strip"><span><i className="pulse" /> City network: <b>running normally</b></span><span>LATENCY 4ms</span></div>
  </>;
}

function BottomNav({ screen, navigate }) {
  return <nav className="bottom-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={screen === id ? 'active' : ''} onClick={() => navigate(id)}><Icon size={20} /><span>{label}</span></button>)}</nav>;
}

function AppShell({ screen, navigate, children }) {
  return <div className="app-shell"><Header onComfort={() => navigate('comfort')} /><main className="main-content">{children}</main><BottomNav screen={screen} navigate={navigate} /></div>;
}

function SectionHeading({ eyebrow, title, detail }) {
  return <div className="section-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{detail && <p>{detail}</p>}</div>;
}

function Home({ navigate }) {
  const [showSetup, setShowSetup] = useState(true);
  const [destination, setDestination] = useState('Kandy City Centre');
  const quickPlaceIcons = [HomeIcon, CreditCard, Pin, Compass, Plane, Menu];
  return <>
    <SectionHeading eyebrow="Good morning, navigator" title={<>Where would you like to <em>go?</em></>} detail="One trip. Every way to travel. Bus, train, air and smart roads, planned together." />
    {showSetup && <div className="setup-banner"><div className="setup-icon"><Sparkles size={18} /></div><div><strong>Make Waymark fit you.</strong><span>It takes 30 seconds.</span></div><button className="text-button" onClick={() => navigate('comfort')}>Customize</button><IconButton label="Dismiss setup" onClick={() => setShowSetup(false)}><X size={17} /></IconButton></div>}
    <section className="suggestion-card"><div className="card-kicker"><Zap size={15} /> SUGGESTED FOR YOU NOW <span>LEAVE NOW</span></div><h2>KDU Gate <small>to</small> Kandy City Centre</h2><p>Avoids monsoon ground surge · Air Shuttle flight sync ready</p><button className="primary-button" onClick={() => navigate('journey')}>Start this route <ArrowRight size={18} /></button></section>
    <section className="panel planner"><div className="panel-title"><span><Route size={16} /> AUTONOMOUS ROUTE PLANNER</span><small>GEO-SYNC: ACTIVE</small></div><div className="route-field"><LocateFixed size={20} className="teal" /><div><label>ORIGIN NODE</label><strong>My location: KDU Gate, Ratmalana</strong></div><button className="small-button">Change</button></div><div className="route-field focus-field"><MapPin size={20} className="gold" /><div className="destination-input"><label htmlFor="destination">DESTINATION</label><input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} /></div><button className="voice-button" aria-label="Use voice input"><Mic size={17} /><span>Say it</span></button></div><div className="quick-places"><label>QUICK PLACE NODES</label><div className="place-grid">{['Home', 'Work', 'Kandy', 'Colombo', 'Airport', 'More'].map((place, i) => { const QuickIcon = quickPlaceIcons[i]; return <button key={place} onClick={() => setDestination(place === 'Kandy' ? 'Kandy City Centre' : place)}><span><QuickIcon size={17} /></span>{place}</button>; })}</div></div><button className="secondary-button full-button" onClick={() => navigate('map')}>Preview multimodal options <ChevronRight size={17} /></button></section>
    <div className="status-row"><ShieldCheck size={17} /><span>Step-free routes are included by default</span><Check size={15} /></div>
  </>;
}

function LiveMap({ navigate }) {
  const [list, setList] = useState(false);
  return <><div className="map-topline"><div><span className="eyebrow">SYS.LOC // LK-CMB-KDY</span><h1>Live network</h1></div><span className="sync-badge"><i /> SYNCHRONIZED</span></div><section className="alert-card"><div className="transport-icon coral"><Bus size={25} /></div><div><div className="row-title"><strong>Bus B12 · On time</strong><span className="live-tag">LIVE HUD</span></div><p>Arrives at <b>Ratmalana Skyport</b> in 4 min · You arrive <b className="sky">9:16 am</b> in Kandy</p></div><Activity className="gold" size={19} /></section><div className="segmented"><button className={!list ? 'selected' : ''} onClick={() => setList(false)}><Map size={17} /> Map <small>LIVE</small></button><button className={list ? 'selected' : ''} onClick={() => setList(true)}><Menu size={17} /> List view</button></div>{list ? <TransitList navigate={navigate} /> : <TransitMap />}</>;
}

function TransitMap() {
  return <section className="map-canvas"><div className="coordinates">GRID 06°49'02"N / 79°53'18"E<br /><span>ALT: 12m MSL · SPEED 42 KM/H</span></div><span className="air-status"><Plane size={14} /> AIR CORRIDOR: CLEAR</span><svg viewBox="0 0 400 480" role="img" aria-label="Live multimodal route map"><path className="map-road" d="M35 385 C90 340 95 270 157 250 S270 205 354 90" /><path className="map-air" d="M51 410 C145 300 205 270 350 73" /><path className="map-train" d="M48 401 C116 380 171 392 229 343 S294 253 343 217" /><circle className="node bus-node" cx="54" cy="400" r="10" /><circle className="node bus-node" cx="157" cy="250" r="10" /><circle className="node sky-node" cx="350" cy="73" r="10" /><circle className="node teal-node" cx="229" cy="343" r="10" /><g className="map-label"><text x="25" y="435">KDU GATE</text><text x="125" y="232">RATMALANA</text><text x="298" y="57">KANDY CITY</text></g><circle className="you-ping" cx="100" cy="354" r="14" /><circle className="you-dot" cx="100" cy="354" r="5" /></svg><div className="map-legend"><span><i className="coral-dot" /> B12 BUS</span><span><i className="teal-dot" /> MAGLEV</span><span><i className="sky-dot" /> AIR SHUTTLE</span></div></section>;
}

function TransitList({ navigate }) {
  return <div className="transit-list"><div className="list-item"><div className="transport-icon coral"><Bus size={21} /></div><div><strong>Bus B12</strong><span>Ratmalana Skyport · 4 min</span></div><b className="on-time">ON TIME</b></div><div className="list-item"><div className="transport-icon teal"><TrainFront size={21} /></div><div><strong>Maglev M4</strong><span>Fort Interchange · 18 min</span></div><b className="on-time">ON TIME</b></div><div className="list-item"><div className="transport-icon sky"><Plane size={21} /></div><div><strong>Air Shuttle A7</strong><span>Ratmalana → Kandy · 34 min</span></div><b className="advisory">SYNCED</b></div><button className="secondary-button full-button" onClick={() => navigate('journey')}>Open active journey <ArrowRight size={17} /></button></div>;
}

function Journey({ navigate }) {
  return <><div className="subnav"><button className="back-button" onClick={() => navigate('home')}><ArrowLeft size={17} /> Back to ways to go</button><button className="comfort-link" onClick={() => navigate('comfort')}><Accessibility size={17} /> Comfort</button></div><SectionHeading eyebrow="Active mission route · Route-A" title="Trip to Kandy City Centre" /><section className="arrival-card"><div><label>TARGET ARRIVAL TIME</label><div className="arrival-time">9:16 <small>am</small></div></div><span className="on-time-chip"><Check size={13} /> ON TIME</span><div className="journey-meta"><span><Clock3 size={15} /> <b>1 h 6 min</b></span><span>2 changes</span><span className="teal-text"><Accessibility size={15} /> Step-free all the way</span><span className="gold-text">4.8 Cr</span></div></section><section className="next-card"><div className="card-kicker"><Zap size={15} /> DO THIS NEXT <span>IMMEDIATE ACTION</span></div><div className="next-content"><div className="transport-icon gold-bg"><Navigation size={22} /></div><div><h2>Walk to Stop 3 <small>(4 min)</small></h2><p>Bus B12 leaves at 8:14, in <b>3 min</b></p></div></div><button className="primary-button" onClick={() => navigate('map')}>Navigate to stop <ArrowRight size={18} /></button></section><RouteTimeline /></>;
}

function RouteTimeline() { const steps = [['Walk', 'KDU Gate → Stop 3', '4 min', Navigation], ['Bus B12', 'Stop 3 → Ratmalana Skyport', '18 min', Bus], ['Air Shuttle A7', 'Skyport → Kandy City', '42 min', Plane]]; return <section className="panel timeline"><div className="panel-title"><span><Route size={16} /> YOUR ROUTE</span><small>3 LEGS · 1h 06m</small></div>{steps.map(([mode, detail, time, Icon], i) => <div className="timeline-step" key={mode}><div className={`timeline-icon ${i === 1 ? 'coral-bg' : i === 2 ? 'sky-bg' : 'gold-bg'}`}><Icon size={18} /></div><div><label>{mode}</label><strong>{detail}</strong></div><b>{time}</b>{i < 2 && <span className="timeline-line" />}</div>)}</section>; }

function Comfort({ navigate }) {
  const [quiet, setQuiet] = useState(true); const [voice, setVoice] = useState(true); const [density, setDensity] = useState('Standard');
  return <><div className="subnav"><button className="back-button" onClick={() => navigate('home')}><ArrowLeft size={17} /> Back to trip</button><button className="reset-button" onClick={() => { setQuiet(true); setVoice(true); setDensity('Standard'); }}><RotateCcw size={14} /> Reset</button></div><SectionHeading eyebrow="Transit telemetry / comfort" title="Comfort & Preferences" detail="Calibrate autonomous navigation, sensory density, and personal travel timings." /><section className="accessibility-banner"><div className="setup-icon teal-bg"><ShieldCheck size={19} /></div><div><span className="teal-text eyebrow">UNIVERSAL BASELINE · INCLUDED 100%</span><p>Every route includes step-free access, ramps, elevators, and audio-visual announcements.</p></div></section><section className="panel settings-panel"><div className="panel-title"><span><Activity size={16} /> LIVE SIMULATION</span><small>NODE SYNC: ACTIVE</small></div><div className="preview-route"><span>KDU Gate</span><ArrowRight size={15} /><span>Kandy City Centre</span></div><div className="metric-grid"><div><label>ESTIMATED TRANSIT</label><strong>{quiet ? '18 min' : '16 min'}</strong><span className="teal-text">+0m buffer</span></div><div><label>MODE PROFILE</label><strong>{density} HUD</strong><span>Direct corridor</span></div></div><SettingRow icon={<Volume2 size={18} />} title="Audio guidance" detail="Clear voice prompts at every transfer" enabled={voice} setEnabled={setVoice} /><SettingRow icon={<Headphones size={18} />} title="Quiet boarding" detail="Prefer low-sensory vehicles and platforms" enabled={quiet} setEnabled={setQuiet} /><div className="setting-block"><div><strong>Information density</strong><span>How much telemetry appears while moving</span></div><div className="density-tabs">{['Minimal', 'Standard', 'Detailed'].map(item => <button className={density === item ? 'selected' : ''} key={item} onClick={() => setDensity(item)}>{item}</button>)}</div></div></section></>;
}
function SettingRow({ icon, title, detail, enabled, setEnabled }) { return <div className="setting-row"><span className="setting-icon">{icon}</span><div><strong>{title}</strong><span>{detail}</span></div><button className={`toggle ${enabled ? 'on' : ''}`} aria-label={`Toggle ${title}`} onClick={() => setEnabled(!enabled)}><i /></button></div>; }

function Oracle({ navigate }) { const [query, setQuery] = useState(''); const [answer, setAnswer] = useState(''); const ask = () => setAnswer(query ? `I found a clear route for “${query}”. Bus B12 is on time, and the transfer at Ratmalana Skyport is step-free.` : 'Your active route is running normally. Bus B12 arrives at Ratmalana Skyport in 4 minutes.'); return <><SectionHeading eyebrow="Multimodal concierge & avionics" title="Ask Oracle" detail="Your 2100 transit guide and human help desk." /><section className="panel oracle-context"><div className="context-top"><div className="transport-icon gold-bg"><Bot size={21} /></div><div><span className="teal-text eyebrow">LIVE TRIP TELEMETRY</span><strong>Trip to Kandy City Centre · Active now</strong></div><span className="sync-badge">TRANSIT SYNCED</span></div><p><Clock3 size={16} /> Bus B12 on schedule · Next change: <b>Ratmalana Skyport in 4 min</b></p></section><section className="oracle-ask"><div className="oracle-suggestions">{['When do I arrive?', 'Is the route accessible?', 'Find a quieter option'].map(item => <button onClick={() => setQuery(item)} key={item}>{item}</button>)}</div><div className="oracle-input"><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder="Ask about your journey..." /><IconButton label="Use voice input"><Mic size={18} /></IconButton><button className="send-button" onClick={ask}><Send size={17} /></button></div>{answer && <div className="oracle-answer"><Bot size={18} /><p>{answer}</p></div>}</section><button className="secondary-button full-button" onClick={() => navigate('journey')}>Show my full journey <ArrowRight size={17} /></button><div className="help-row"><CircleHelp size={17} /><span>Need a human? Waymark support is available 24/7.</span><ChevronRight size={16} /></div></>;
}

function App() { const [screen, navigate] = useScreen(); const views = { home: <Home navigate={navigate} />, map: <LiveMap navigate={navigate} />, journey: <Journey navigate={navigate} />, comfort: <Comfort navigate={navigate} />, oracle: <Oracle navigate={navigate} /> }; return <AppShell screen={screen} navigate={navigate}>{views[screen] || views.home}</AppShell>; }

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
