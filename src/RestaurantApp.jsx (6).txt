import { useState, useEffect, useRef } from "react";
import { ShoppingCart, LogOut, Search, Tag, Upload, X, Plus } from "lucide-react";

// ─── BACKEND URL ──────────────────────────────────────────────────────────────
const API = "https://veeranj-backend.onrender.com/";

// ─── LOGO (paste your original base64 logo here) ─────────────────────────────
const LOGO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const FREE_ABOVE   = 499;
const DELIVERY_FEE = 49;
const HANDLING_FEE = 10;

const STEPS = ["confirmed","preparing","ready","out_for_delivery","delivered"];
const STEP_LABELS = { confirmed:"Order Confirmed", preparing:"Being Prepared", ready:"Ready for Pickup", out_for_delivery:"Out for Delivery", delivered:"Delivered" };
const STEP_EMOJI  = { confirmed:"✅", preparing:"👨‍🍳", ready:"📦", out_for_delivery:"🛵", delivered:"🎉" };

const C = {
  bg:"#070400", surface:"#0E0900", card:"#130C01", border:"#2A1A04",
  gold:"#C9922A", goldL:"#E8B84B", goldD:"#8A5F0A",
  cream:"#FDF6E8", muted:"#8A7055", faint:"#5A4535",
  green:"#2E7D32", red:"#B71C1C", blue:"#1565C0", lime:"#4A7A28",
};
const SF = "Cormorant Garamond, Playfair Display, serif";
const SN = "Nunito, sans-serif";
const SI = {
  background:C.card, border:"1px solid " + C.border, color:C.cream,
  padding:"11px 16px", borderRadius:10, fontFamily:SN, fontSize:14,
  width:"100%", boxSizing:"border-box", outline:"none",
};

// ─── API HELPERS ──────────────────────────────────────────────────────────────
const fmt = n => "₹" + Number(n).toLocaleString("en-IN");
const getToken = () => localStorage.getItem("veeranj_token");
const setToken = t => localStorage.setItem("veeranj_token", t);
const clearToken = () => localStorage.removeItem("veeranj_token");

async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const res = await fetch(API + path, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "Something went wrong");
  return data;
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function VegDot({ size = 14 }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:size, height:size, border:"1.5px solid " + C.lime, borderRadius:2, flexShrink:0 }}>
      <span style={{ width:size*0.52, height:size*0.52, borderRadius:"50%", background:C.lime, display:"block" }} />
    </span>
  );
}
function Stars({ n, size = 13 }) {
  return <span style={{ color:C.gold, fontSize:size, letterSpacing:1 }}>{"★".repeat(Math.floor(n))}{"☆".repeat(5 - Math.floor(n))}</span>;
}
function GoldBar() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"0 0 24px" }}>
      <div style={{ flex:1, height:1, background:"linear-gradient(to right, transparent, " + C.goldD + ")" }} />
      <span style={{ color:C.gold, fontSize:14 }}>✦</span>
      <div style={{ flex:1, height:1, background:"linear-gradient(to left, transparent, " + C.goldD + ")" }} />
    </div>
  );
}
function Btn({ children, onClick, variant = "gold", size = "md", disabled = false, style = {} }) {
  const pad = size === "sm" ? "7px 16px" : size === "lg" ? "14px 32px" : "10px 22px";
  const fs  = size === "sm" ? 12 : size === "lg" ? 15 : 13;
  const base = { display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, border:"none", borderRadius:10, fontFamily:SN, fontWeight:700, cursor:disabled ? "not-allowed" : "pointer", fontSize:fs, padding:pad, transition:"all .2s", userSelect:"none", opacity:disabled ? 0.4 : 1, letterSpacing:0.3 };
  const V = {
    gold:    { background:"linear-gradient(135deg," + C.goldL + "," + C.gold + ")", color:"#050300", boxShadow:"0 4px 20px rgba(201,146,42,0.2)" },
    outline: { background:"transparent", color:C.goldL, border:"1.5px solid " + C.gold },
    ghost:   { background:C.surface, color:C.muted, border:"1px solid " + C.border },
    danger:  { background:"#200808", color:"#E57373", border:"1px solid #5A1010" },
    success: { background:"#082008", color:"#81C784", border:"1px solid #105010" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...(V[variant] || V.gold), ...style }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {children}
    </button>
  );
}
function DishImage({ img, name, cat, fallback = "🍛" }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{ position:"relative", height:160, overflow:"hidden", borderRadius:"14px 14px 0 0", background:C.surface }}>
      {!err
        ? <img src={img} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={() => setErr(true)} />
        : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:52 }}>{fallback}</div>
      }
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(7,4,0,0.85) 0%, transparent 60%)" }} />
      <div style={{ position:"absolute", top:8, left:8, background:"rgba(7,4,0,0.75)", backdropFilter:"blur(4px)", borderRadius:6, padding:"2px 8px", border:"1px solid " + C.goldD }}>
        <span style={{ color:C.goldL, fontSize:9, fontWeight:700, letterSpacing:2 }}>{(cat||"").toUpperCase()}</span>
      </div>
      <div style={{ position:"absolute", top:8, right:8 }}><VegDot size={15} /></div>
    </div>
  );
}
function GlobalStyles() {
  useEffect(() => {
    if (document.getElementById("vj-font")) return;
    const l = document.createElement("link");
    l.id = "vj-font";
    l.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Nunito:wght@400;500;600;700&display=swap";
    l.rel = "stylesheet";
    document.head.appendChild(l);
  }, []);
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: ${C.bg}; font-family: ${SN}; overflow-x: hidden; color: ${C.cream}; }
      ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: ${C.goldD}; border-radius: 4px; }
      input:focus, textarea:focus, select:focus { outline: 2px solid ${C.gold}; outline-offset: -1px; }
      input::placeholder, textarea::placeholder { color: ${C.faint}; }
      select option { background: ${C.card}; color: ${C.cream}; }
      .dc { transition: transform .25s, box-shadow .25s; }
      .dc:hover { transform: translateY(-5px); box-shadow: 0 14px 40px rgba(201,146,42,0.2); }
      .gt { background: linear-gradient(135deg,${C.goldL},${C.gold}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      @keyframes fadeUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      @keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
      @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
      @keyframes popIn   { from { opacity:0; transform:scale(.9); } to { opacity:1; transform:scale(1); } }
    `}</style>
  );
}
function Toast({ msg }) {
  return (
    <div style={{ position:"fixed", top:70, right:16, zIndex:9999, background:C.card, border:"1px solid " + C.gold, color:C.cream, padding:"12px 18px", borderRadius:12, fontSize:13, fontWeight:600, boxShadow:"0 8px 32px rgba(0,0,0,0.8)", animation:"fadeUp .3s ease", maxWidth:290, pointerEvents:"none" }}>
      <span style={{ color:C.gold, marginRight:6 }}>✦</span>{msg}
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ user, cartCount, onCart, onLogin, onLogout }) {
  return (
    <nav style={{ position:"sticky", top:0, zIndex:200, background:"rgba(7,4,0,0.97)", backdropFilter:"blur(20px)", borderBottom:"1px solid " + C.border, padding:"0 16px", display:"flex", alignItems:"center", justifyContent:"space-between", height:62 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <img src={LOGO_B64} alt="Veeranj" style={{ width:44, height:44, objectFit:"contain", borderRadius:"50%", border:"1.5px solid " + C.goldD }} />
        <div>
          <div className="gt" style={{ fontFamily:SF, fontSize:19, fontWeight:700, letterSpacing:3, lineHeight:1 }}>VEERANJ</div>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
            <VegDot size={10} />
            <span style={{ fontSize:8, color:C.lime, letterSpacing:3, fontWeight:700 }}>PURE VEG</span>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={onCart} style={{ position:"relative", background:"linear-gradient(135deg," + C.goldL + "," + C.gold + ")", border:"none", color:"#050300", borderRadius:10, padding:"9px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontWeight:700, fontSize:13, fontFamily:SN }}>
          <ShoppingCart size={15} /> Cart
          {cartCount > 0 && <span style={{ position:"absolute", top:-6, right:-6, background:C.red, color:"#fff", borderRadius:"50%", width:18, height:18, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{cartCount}</span>}
        </button>
        {user ? (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div>
              <div style={{ color:C.cream, fontSize:12, fontWeight:600 }}>{user.name}</div>
              {user.role === "admin" && <div style={{ color:C.gold, fontSize:9, letterSpacing:2 }}>ADMIN</div>}
            </div>
            <button onClick={onLogout} style={{ background:C.surface, border:"1px solid " + C.border, color:C.muted, borderRadius:8, padding:"7px 9px", cursor:"pointer" }}><LogOut size={13} /></button>
          </div>
        ) : (
          <button onClick={onLogin} style={{ background:"transparent", border:"1.5px solid " + C.gold, color:C.goldL, borderRadius:10, padding:"8px 16px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:SN }}>Login</button>
        )}
      </div>
    </nav>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ view, setView, isAdmin }) {
  const tabs = [
    { id:"home", icon:"🏛️", label:"Home" },
    { id:"menu", icon:"🍽️", label:"Menu" },
    { id:"services", icon:"✨", label:"Services" },
    { id:"tracking", icon:"📦", label:"Track" },
    { id:"contact", icon:"📞", label:"Contact" },
    ...(isAdmin ? [{ id:"admin", icon:"⚙️", label:"Admin" }] : []),
  ];
  return (
    <nav style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, background:"rgba(7,4,0,0.98)", backdropFilter:"blur(16px)", borderTop:"1px solid " + C.border, display:"flex", height:58 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setView(t.id)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, padding:"4px 2px", position:"relative" }}>
          {view === t.id && <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:2, background:"linear-gradient(to right," + C.goldL + "," + C.gold + ")", borderRadius:2 }} />}
          <span style={{ fontSize:15, lineHeight:1 }}>{t.icon}</span>
          <span style={{ fontSize:9, fontWeight:700, color:view === t.id ? C.goldL : C.faint, letterSpacing:0.4 }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── COUPON INPUT ─────────────────────────────────────────────────────────────
function CouponInput({ subtotal, applied, setApplied }) {
  const [code, setCode]     = useState("");
  const [err, setErr]       = useState("");
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    apiFetch("/coupons").then(setCoupons).catch(() => {});
  }, []);

  const apply = async () => {
    try {
      const data = await apiFetch("/coupons/validate", {
        method:"POST",
        body: JSON.stringify({ code: code.trim(), subtotal }),
      });
      setApplied({ code: data.code, ...data });
      setErr("");
    } catch(e) { setErr(e.message); }
  };
  const remove = () => { setApplied(null); setCode(""); setErr(""); };

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        <div style={{ flex:1, position:"relative" }}>
          <Tag size={13} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:C.gold, pointerEvents:"none" }} />
          <input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setErr(""); }} placeholder="Enter coupon code" style={{ ...SI, paddingLeft:32, fontSize:13 }} />
        </div>
        {applied
          ? <Btn onClick={remove} variant="danger" size="sm">Remove</Btn>
          : <Btn onClick={apply} size="sm">Apply</Btn>
        }
      </div>
      {err && <p style={{ color:"#E57373", fontSize:11, marginBottom:8 }}>{err}</p>}
      {applied && (
        <div style={{ background:"#082008", border:"1px solid " + C.green, borderRadius:8, padding:"8px 12px", marginBottom:8 }}>
          <span style={{ color:"#81C784", fontSize:12, fontWeight:700 }}>✅ {applied.code} — saved {fmt(applied.discount)}!</span>
        </div>
      )}
      {coupons.length > 0 && (
        <>
          <p style={{ color:C.faint, fontSize:10, letterSpacing:2, marginBottom:6 }}>AVAILABLE OFFERS</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {coupons.map(c => (
              <button key={c.code} onClick={() => { setCode(c.code); setErr(""); }} style={{ background:C.surface, border:"1px solid " + C.border, borderRadius:8, padding:"4px 10px", cursor:"pointer", fontFamily:SN }}>
                <div style={{ color:C.goldL, fontSize:10, fontWeight:700 }}>{c.code}</div>
                <div style={{ color:C.faint, fontSize:9 }}>{c.label}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── BOOKING MODAL ────────────────────────────────────────────────────────────
function BookingModal({ onClose, onConfirm }) {
  const today = new Date().toISOString().split("T")[0];
  const [f, setF] = useState({ name:"", phone:"", date:today, time:"19:00", guests:"2", note:"" });
  const [done, setDone]     = useState(false);
  const [loading, setLoading] = useState(false);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name || !f.phone) return;
    setLoading(true);
    try {
      await apiFetch("/bookings", { method:"POST", body: JSON.stringify(f) });
      setDone(true);
      setTimeout(() => { onConfirm(f); onClose(); }, 2200);
    } catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:16, animation:"fadeIn .2s" }}>
      <div style={{ background:C.card, border:"1px solid " + C.border, borderRadius:16, width:"min(420px,100%)", padding:28, position:"relative", animation:"popIn .25s", maxHeight:"90vh", overflowY:"auto" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:16, background:"none", border:"none", color:C.faint, cursor:"pointer", fontSize:20 }}>✕</button>
        {done ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <div style={{ fontSize:56 }}>🎊</div>
            <h3 style={{ fontFamily:SF, fontSize:26, color:C.cream, margin:"14px 0 8px" }}>Table Reserved!</h3>
            <GoldBar />
            <p style={{ color:C.muted, fontSize:13, lineHeight:1.8 }}>Table for <b style={{ color:C.goldL }}>{f.guests} guests</b> on <b style={{ color:C.goldL }}>{f.date}</b> at <b style={{ color:C.goldL }}>{f.time}</b></p>
          </div>
        ) : (
          <>
            <div style={{ textAlign:"center", marginBottom:18 }}>
              <img src={LOGO_B64} alt="Veeranj" style={{ width:48, height:48, objectFit:"contain", borderRadius:"50%", border:"1px solid " + C.goldD }} />
              <h2 style={{ fontFamily:SF, fontSize:24, color:C.cream, marginTop:8, fontWeight:600 }}>Reserve Your Table</h2>
            </div>
            <GoldBar />
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[["YOUR NAME *","name","Full name","text"],["PHONE *","phone","+91 98765 43210","tel"]].map(([lbl,key,ph,type]) => (
                <div key={key}>
                  <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:5 }}>{lbl}</label>
                  <input value={f[key]} onChange={e => s(key, e.target.value)} placeholder={ph} type={type} style={SI} />
                </div>
              ))}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:5 }}>DATE</label>
                  <input value={f.date} onChange={e => s("date", e.target.value)} type="date" min={today} style={SI} />
                </div>
                <div>
                  <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:5 }}>TIME</label>
                  <select value={f.time} onChange={e => s("time", e.target.value)} style={SI}>
                    {["11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:5 }}>GUESTS</label>
                <select value={f.guests} onChange={e => s("guests", e.target.value)} style={SI}>
                  {["1","2","3","4","5","6","7","8","9","10+"].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:5 }}>SPECIAL REQUEST</label>
                <textarea value={f.note} onChange={e => s("note", e.target.value)} placeholder="Birthday, anniversary, dietary needs..." style={{ ...SI, minHeight:60, resize:"vertical" }} />
              </div>
            </div>
            <Btn onClick={submit} disabled={!f.name || !f.phone || loading} size="lg" style={{ width:"100%", marginTop:18 }}>
              {loading ? "Booking..." : "🪑 Confirm Reservation"}
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ─── REVIEW MODAL ─────────────────────────────────────────────────────────────
function ReviewModal({ onClose, onSubmit }) {
  const [f, setF]           = useState({ name:"", rating:5, text:"", dish:"" });
  const [done, setDone]     = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!f.name || !f.text) return;
    setLoading(true);
    try {
      await apiFetch("/reviews", { method:"POST", body: JSON.stringify(f) });
      setDone(true);
      setTimeout(() => { onSubmit(f); onClose(); }, 1600);
    } catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:16, animation:"fadeIn .2s" }}>
      <div style={{ background:C.card, border:"1px solid " + C.border, borderRadius:16, width:"min(390px,100%)", padding:28, position:"relative", animation:"popIn .25s" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:16, background:"none", border:"none", color:C.faint, cursor:"pointer", fontSize:20 }}>✕</button>
        {done ? (
          <div style={{ textAlign:"center", padding:"28px 0" }}>
            <div style={{ fontSize:48 }}>🙏</div>
            <h3 style={{ fontFamily:SF, fontSize:22, color:C.cream, marginTop:12 }}>Shukriya!</h3>
          </div>
        ) : (
          <>
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <h2 style={{ fontFamily:SF, fontSize:22, color:C.cream, fontWeight:600 }}>Share Your Experience</h2>
            </div>
            <GoldBar />
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <input value={f.name} onChange={e => setF(p => ({ ...p, name:e.target.value }))} placeholder="Your name *" style={SI} />
              <input value={f.dish} onChange={e => setF(p => ({ ...p, dish:e.target.value }))} placeholder="Dish you loved" style={SI} />
              <div>
                <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:8 }}>YOUR RATING</label>
                <div style={{ display:"flex", gap:6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setF(p => ({ ...p, rating:n }))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:28, color:n <= f.rating ? C.gold : C.faint, transform:n <= f.rating ? "scale(1.2)" : "scale(1)", transition:"all .15s" }}>★</button>
                  ))}
                </div>
              </div>
              <textarea value={f.text} onChange={e => setF(p => ({ ...p, text:e.target.value }))} placeholder="Tell us about your experience... *" style={{ ...SI, minHeight:80, resize:"vertical" }} />
            </div>
            <Btn onClick={submit} disabled={!f.name || !f.text || loading} style={{ width:"100%", padding:"12px 0", marginTop:16 }}>
              {loading ? "Posting..." : "Post Review ✦"}
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ setView, menuItems, onAddToCart, onBook }) {
  const featured = menuItems.filter(m => m.stars >= 4.8).slice(0, 3);
  const chaap    = menuItems.filter(m => m.cat === "Chaap").slice(0, 4);
  return (
    <div>
      {/* HERO */}
      <div style={{ position:"relative", textAlign:"center", padding:"60px 20px 52px", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 40%, #1A0A00, #070400)" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 40% 40% at 50% 30%, rgba(201,146,42,0.1), transparent 70%)" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <img src={LOGO_B64} alt="Veeranj" style={{ width:90, height:90, objectFit:"contain", marginBottom:16, filter:"drop-shadow(0 0 20px rgba(201,146,42,0.4))" }} />
          <h1 style={{ fontFamily:SF, fontSize:"clamp(36px,7vw,72px)", fontWeight:300, color:C.cream, lineHeight:0.95, marginBottom:6, animation:"fadeUp .5s ease" }}>Flavours of</h1>
          <h1 className="gt" style={{ fontFamily:SF, fontSize:"clamp(36px,7vw,72px)", fontWeight:700, lineHeight:1, marginBottom:18, animation:"fadeUp .6s ease" }}>Incredible India</h1>
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(46,125,50,0.12)", border:"1px solid rgba(46,125,50,0.4)", borderRadius:20, padding:"5px 14px", marginBottom:22 }}>
            <span>🛵</span>
            <span style={{ color:"#81C784", fontSize:11, fontWeight:700 }}>FREE delivery on orders above {fmt(FREE_ABOVE)}</span>
          </div>
          <p style={{ color:C.muted, fontSize:14, maxWidth:420, margin:"0 auto 28px", lineHeight:1.85, fontStyle:"italic" }}>
            "From the smoky tandoors of Punjab to the royal kitchens of Hyderabad — a vegetarian feast like no other."
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Btn onClick={() => setView("menu")} size="lg">🍽️ Explore Menu</Btn>
            <Btn onClick={onBook} variant="ghost" size="lg">🪑 Reserve a Table</Btn>
            <Btn onClick={() => setView("tracking")} variant="outline" size="lg">📦 Track Order</Btn>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ background:C.surface, borderTop:"1px solid " + C.border, borderBottom:"1px solid " + C.border }}>
        <div style={{ display:"flex", maxWidth:800, margin:"0 auto" }}>
          {[["🥗","Pure Veg","100%"],["🌶️","Spices","50+"],["🍽️","Dishes","44+"],["⭐","Rating","4.9"]].map(([ic,l,v], i) => (
            <div key={l} style={{ flex:1, textAlign:"center", padding:"16px 6px", borderRight:i < 3 ? "1px solid " + C.border : "none" }}>
              <div style={{ fontSize:18 }}>{ic}</div>
              <div className="gt" style={{ fontFamily:SF, fontSize:22, fontWeight:700, marginBottom:2 }}>{v}</div>
              <div style={{ color:C.faint, fontSize:9, letterSpacing:2 }}>{l.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAAP SECTION */}
      {chaap.length > 0 && (
        <div style={{ padding:"44px 20px 0", maxWidth:960, margin:"0 auto" }}>
          <p style={{ fontFamily:SF, fontSize:11, color:C.gold, letterSpacing:6, marginBottom:6 }}>SIGNATURE SPECIALTY</p>
          <h2 style={{ fontFamily:SF, fontSize:"clamp(24px,4vw,40px)", fontWeight:600, color:C.cream, marginBottom:16 }}>The Art of Chaap</h2>
          <GoldBar />
          <div style={{ background:"linear-gradient(135deg,#130C01,#0E0900)", border:"1px solid " + C.border, borderRadius:20, padding:"22px 18px", marginBottom:44 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10 }}>
              {chaap.map(item => (
                <div key={item._id || item.id} onClick={() => onAddToCart(item)} className="dc" style={{ background:C.card, border:"1px solid " + C.border, borderRadius:12, overflow:"hidden", cursor:"pointer" }}>
                  <div style={{ height:90, overflow:"hidden" }}>
                    <DishImage img={item.img} name={item.name} cat={item.cat} />
                  </div>
                  <div style={{ padding:"10px 10px 12px" }}>
                    <div style={{ fontFamily:SF, fontSize:12, color:C.cream, fontWeight:600, marginBottom:3 }}>{item.name}</div>
                    <div className="gt" style={{ fontWeight:700, fontSize:13 }}>{fmt(item.price)}</div>
                    <div style={{ color:C.lime, fontSize:9, marginTop:4, fontWeight:700 }}>+ ADD TO CART</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign:"center", marginTop:16 }}>
              <Btn onClick={() => setView("menu")} variant="outline" size="sm">View All Chaap →</Btn>
            </div>
          </div>
        </div>
      )}

      {/* SIGNATURE DISHES */}
      {featured.length > 0 && (
        <div style={{ padding:"0 20px 0", maxWidth:960, margin:"0 auto" }}>
          <p style={{ fontFamily:SF, fontSize:11, color:C.gold, letterSpacing:6, marginBottom:6 }}>CHEF SELECTION</p>
          <h2 style={{ fontFamily:SF, fontSize:"clamp(24px,4vw,40px)", fontWeight:600, color:C.cream, marginBottom:16 }}>Signature Creations</h2>
          <GoldBar />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:18 }}>
            {featured.map(item => (
              <div key={item._id || item.id} className="dc" style={{ background:C.card, border:"1px solid " + C.border, borderRadius:16, overflow:"hidden" }}>
                <DishImage img={item.img} name={item.name} cat={item.cat} />
                <div style={{ padding:20 }}>
                  <h3 style={{ fontFamily:SF, fontSize:18, color:C.cream, fontWeight:600, marginBottom:6 }}>{item.name}</h3>
                  <p style={{ color:C.muted, fontSize:12, lineHeight:1.65, marginBottom:14 }}>{item.desc}</p>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div className="gt" style={{ fontWeight:700, fontSize:19, fontFamily:SF }}>{fmt(item.price)}</div>
                      <Stars n={item.stars || 4.5} size={12} />
                    </div>
                    <Btn onClick={() => onAddToCart(item)} size="sm">Add to Cart</Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", margin:"28px 0 0" }}>
            <Btn onClick={() => setView("menu")} variant="outline" size="lg">Explore Full Menu ✦</Btn>
          </div>
        </div>
      )}

      {/* BOOK TABLE */}
      <div style={{ background:"linear-gradient(135deg," + C.surface + "," + C.card + ")", borderTop:"1px solid " + C.border, borderBottom:"1px solid " + C.border, padding:"48px 20px", marginTop:44, textAlign:"center" }}>
        <img src={LOGO_B64} alt="Veeranj" style={{ width:56, height:56, objectFit:"contain", marginBottom:14, filter:"drop-shadow(0 0 12px rgba(201,146,42,0.3))" }} />
        <p style={{ fontFamily:SF, fontSize:11, color:C.gold, letterSpacing:6, marginBottom:8 }}>FINE DINING</p>
        <h2 style={{ fontFamily:SF, fontSize:"clamp(24px,5vw,42px)", fontWeight:600, color:C.cream, marginBottom:14 }}>Reserve Your Table</h2>
        <GoldBar />
        <p style={{ color:C.muted, fontSize:14, lineHeight:1.85, marginBottom:26, maxWidth:420, margin:"0 auto 26px" }}>Experience the royal ambience of Veeranj. Let us craft an unforgettable evening for you.</p>
        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
          <Btn onClick={onBook} size="lg">🪑 Book a Table Now</Btn>
          <Btn onClick={() => {}} variant="outline" size="lg">📞 Call Us</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── MENU PAGE ────────────────────────────────────────────────────────────────
function MenuPage({ menuItems, onAddToCart, cart, onBook }) {
  const [search, setSearch] = useState("");
  const [cat, setCat]       = useState("All");
  const cats = ["All","Chaap","Starters","Mains","Breads","Desserts","Ice Cream","Drinks"];
  const getId = item => item._id || item.id;
  const getQty = id => (cart.find(c => (c._id || c.id) === id) || {}).qty || 0;
  const filtered = menuItems.filter(m =>
    m.avail !== false &&
    (cat === "All" || m.cat === cat) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) || (m.desc||"").toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 16px 80px" }}>
      <p style={{ fontFamily:SF, fontSize:11, color:C.gold, letterSpacing:6, marginBottom:6 }}>THE MENU</p>
      <h2 style={{ fontFamily:SF, fontSize:"clamp(28px,5vw,44px)", fontWeight:600, color:C.cream, marginBottom:6 }}>Taste the Tradition</h2>
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(46,125,50,0.12)", border:"1px solid rgba(46,125,50,0.35)", borderRadius:20, padding:"4px 12px", marginBottom:18 }}>
        <span>🛵</span><span style={{ color:"#81C784", fontSize:11, fontWeight:700 }}>FREE delivery above {fmt(FREE_ABOVE)}</span>
      </div>
      <GoldBar />
      <div style={{ background:"linear-gradient(135deg,#130C01,#1A0E00)", border:"1px solid " + C.border, borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>🪑</span>
          <div><div style={{ color:C.cream, fontWeight:700, fontSize:13 }}>Want to dine in?</div><div style={{ color:C.faint, fontSize:11 }}>Reserve a table for fine dining</div></div>
        </div>
        <Btn onClick={onBook} size="sm">Book a Table ✦</Btn>
      </div>
      <div style={{ position:"relative", marginBottom:12 }}>
        <Search size={14} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:C.faint, pointerEvents:"none" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes..." style={{ ...SI, paddingLeft:38 }} />
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ background:cat === c ? "linear-gradient(135deg," + C.goldL + "," + C.gold + ")" : "transparent", color:cat === c ? "#050300" : C.muted, border:"1px solid " + (cat === c ? C.gold : C.border), borderRadius:20, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer", transition:"all .2s", fontFamily:SN }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:18 }}>
        {filtered.map(item => (
          <div key={getId(item)} className="dc" style={{ background:C.card, border:"1px solid " + C.border, borderRadius:16, overflow:"hidden" }}>
            <DishImage img={item.img} name={item.name} cat={item.cat} />
            <div style={{ padding:"16px 18px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <h3 style={{ fontFamily:SF, fontSize:17, color:C.cream, fontWeight:600, flex:1, paddingRight:8 }}>{item.name}</h3>
                <div className="gt" style={{ fontWeight:700, fontSize:16, fontFamily:SF, flexShrink:0 }}>{fmt(item.price)}</div>
              </div>
              <Stars n={item.stars || 4.5} size={11} />
              <p style={{ color:C.muted, fontSize:12, lineHeight:1.6, margin:"8px 0 16px" }}>{item.desc}</p>
              {getQty(getId(item)) > 0 ? (
                <div style={{ background:C.surface, borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ color:C.muted, fontSize:12 }}>{getQty(getId(item))} in cart</span>
                  <Btn onClick={() => onAddToCart(item)} size="sm">+ More</Btn>
                </div>
              ) : (
                <Btn onClick={() => onAddToCart(item)} style={{ width:"100%", padding:"9px 0" }}>Add to Cart</Btn>
              )}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:"60px 0", color:C.faint }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <p>No dishes found for "{search}"</p>
        </div>
      )}
    </div>
  );
}

// ─── SERVICES PAGE ────────────────────────────────────────────────────────────
function ServicesPage({ onBook, reviews, onAddReview }) {
  const avg = reviews.length ? (reviews.reduce((s,r) => s + r.rating, 0) / reviews.length).toFixed(1) : "5.0";
  const services = [
    { icon:"🍽️", title:"Royal Dine-In", desc:"Luxurious seating, soft music & a Mughal-inspired ambience. Dine like royalty." },
    { icon:"🛍️", title:"Quick Takeaway", desc:"Eco-friendly packaging with freshness sealed in. Ready in minutes." },
    { icon:"🛵", title:"Free Delivery", desc:"FREE above " + fmt(FREE_ABOVE) + ". Hot & fresh at your door in 45 mins." },
    { icon:"🎂", title:"Private Events", desc:"Birthdays, anniversaries & corporate events. We handle every detail." },
    { icon:"🙏", title:"Jain Friendly", desc:"No onion, no garlic options available. We respect every dietary preference." },
    { icon:"👨‍🍳", title:"Live Kitchen", desc:"Watch our chefs craft your meal. Fresh, transparent & spectacular." },
  ];
  return (
    <div style={{ maxWidth:960, margin:"0 auto", padding:"32px 16px 80px" }}>
      <p style={{ fontFamily:SF, fontSize:11, color:C.gold, letterSpacing:6, marginBottom:6 }}>WHAT WE OFFER</p>
      <h2 style={{ fontFamily:SF, fontSize:"clamp(26px,5vw,42px)", fontWeight:600, color:C.cream, marginBottom:16 }}>Our Services</h2>
      <GoldBar />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(255px, 1fr))", gap:16, marginBottom:44 }}>
        {services.map((sv, i) => (
          <div key={i} className="dc" style={{ background:C.card, border:"1px solid " + C.border, borderRadius:16, padding:24, textAlign:"center" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(201,146,42,0.1)", border:"1px solid " + C.goldD, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:24 }}>{sv.icon}</div>
            <h3 style={{ fontFamily:SF, fontSize:17, color:C.cream, fontWeight:600, marginBottom:8 }}>{sv.title}</h3>
            <p style={{ color:C.muted, fontSize:12, lineHeight:1.75 }}>{sv.desc}</p>
          </div>
        ))}
      </div>
      <div style={{ background:"linear-gradient(135deg,#130C01,#0E0900)", border:"1px solid " + C.border, borderRadius:20, padding:"36px 24px", textAlign:"center", marginBottom:44 }}>
        <img src={LOGO_B64} alt="Veeranj" style={{ width:52, height:52, objectFit:"contain", marginBottom:12 }} />
        <h3 style={{ fontFamily:SF, fontSize:26, color:C.cream, marginBottom:10, fontWeight:600 }}>Ready for a Royal Feast?</h3>
        <Btn onClick={onBook} size="lg">🪑 Reserve a Table ✦</Btn>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <p style={{ fontFamily:SF, fontSize:11, color:C.gold, letterSpacing:6, marginBottom:4 }}>GUEST LOVE</p>
          <h2 style={{ fontFamily:SF, fontSize:"clamp(22px,4vw,32px)", fontWeight:600, color:C.cream }}>What Our Guests Say</h2>
        </div>
        <Btn onClick={onAddReview} variant="outline" size="sm">✍️ Write a Review</Btn>
      </div>
      <GoldBar />
      <div style={{ background:C.card, border:"1px solid " + C.border, borderRadius:14, padding:20, marginBottom:22, display:"flex", gap:22, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div className="gt" style={{ fontFamily:SF, fontSize:52, fontWeight:700 }}>{avg}</div>
          <Stars n={parseFloat(avg)} size={18} />
          <p style={{ color:C.faint, fontSize:11, marginTop:4 }}>{reviews.length} reviews</p>
        </div>
        <div style={{ flex:1, minWidth:160 }}>
          {[5,4,3,2,1].map(n => {
            const cnt = reviews.filter(r => r.rating === n).length;
            return (
              <div key={n} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ color:C.faint, fontSize:11, width:8 }}>{n}</span>
                <span style={{ color:C.gold, fontSize:11 }}>★</span>
                <div style={{ flex:1, height:5, background:C.surface, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:(reviews.length ? (cnt / reviews.length) * 100 : 0) + "%", height:"100%", background:"linear-gradient(to right," + C.goldL + "," + C.gold + ")", borderRadius:3 }} />
                </div>
                <span style={{ color:C.faint, fontSize:11, width:12, textAlign:"right" }}>{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(265px, 1fr))", gap:14 }}>
        {reviews.length === 0 && <p style={{ color:C.faint, padding:"32px 0" }}>No reviews yet. Be the first!</p>}
        {reviews.map((r, i) => (
          <div key={r._id || i} className="dc" style={{ background:C.card, border:"1px solid " + C.border, borderRadius:14, padding:20 }}>
            <div style={{ color:C.goldD, fontSize:32, lineHeight:1, marginBottom:10, fontFamily:SF }}>"</div>
            <p style={{ color:C.cream, fontSize:13, lineHeight:1.7, marginBottom:12, fontStyle:"italic" }}>{r.text}</p>
            {r.dish && <div style={{ display:"inline-block", background:"rgba(201,146,42,0.12)", color:C.goldL, fontSize:10, padding:"3px 10px", borderRadius:12, marginBottom:12, fontWeight:700, border:"1px solid " + C.goldD }}>✦ {r.dish}</div>}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid " + C.border, paddingTop:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:20 }}>{r.avatar || "👤"}</span>
                <div>
                  <div style={{ color:C.cream, fontSize:12, fontWeight:700 }}>{r.name}</div>
                  <div style={{ color:C.faint, fontSize:10 }}>{r.date || "Recently"}</div>
                </div>
              </div>
              <Stars n={r.rating} size={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TRACKING PAGE ────────────────────────────────────────────────────────────
function TrackingPage({ trackingId, setTrackingId }) {
  const [input, setInput]     = useState(trackingId || "");
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  const track = async (id) => {
    if (!id) return;
    setLoading(true); setErr("");
    try {
      const data = await apiFetch("/orders/track/" + id);
      setOrder(data); setTrackingId(id);
    } catch(e) {
      setErr("Order not found"); setOrder(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (trackingId) track(trackingId); }, []);
  const stepIdx = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div style={{ maxWidth:620, margin:"0 auto", padding:"32px 16px 80px" }}>
      <p style={{ fontFamily:SF, fontSize:11, color:C.gold, letterSpacing:6, marginBottom:6 }}>TRACK ORDER</p>
      <h2 style={{ fontFamily:SF, fontSize:"clamp(26px,5vw,42px)", fontWeight:600, color:C.cream, marginBottom:16 }}>Order Status</h2>
      <GoldBar />
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <input value={input} onChange={e => setInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && track(input)} placeholder="Enter Order ID e.g. VRJ123456" style={{ ...SI, flex:1 }} />
        <Btn onClick={() => track(input)} style={{ padding:"10px 18px" }}>{loading ? "..." : "Track"}</Btn>
      </div>
      {err && <p style={{ color:"#E57373", fontSize:13, marginBottom:14 }}>{err}</p>}
      {!order && !loading && (
        <div style={{ textAlign:"center", padding:"48px 0", color:C.faint }}>
          <div style={{ fontSize:48, marginBottom:14 }}>📦</div>
          <p>Enter your Order ID above to track</p>
        </div>
      )}
      {order && (
        <div style={{ background:C.card, border:"1px solid " + C.border, borderRadius:14, padding:24, animation:"popIn .3s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", paddingBottom:18, marginBottom:20, borderBottom:"1px solid " + C.border }}>
            <div>
              <h3 style={{ fontFamily:SF, fontSize:22, color:C.cream }}>{order.orderId}</h3>
              <p style={{ color:C.muted, fontSize:12, marginTop:3 }}>{order.customer}</p>
              <p style={{ color:C.faint, fontSize:11, marginTop:2 }}>{order.addr}</p>
            </div>
            <div className="gt" style={{ fontFamily:SF, fontSize:20, fontWeight:700 }}>{fmt(order.grand)}</div>
          </div>
          {STEPS.map((step, i) => {
            const done   = i <= stepIdx;
            const active = i === stepIdx;
            return (
              <div key={step} style={{ display:"flex", gap:14 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:active ? "linear-gradient(135deg," + C.goldL + "," + C.gold + ")" : done ? "#0A200A" : C.surface, border:"2px solid " + (done ? C.gold : C.border), fontSize:15, color:active ? "#050300" : C.cream }}>
                    {active ? STEP_EMOJI[step] : done ? "✓" : "○"}
                  </div>
                  {i < STEPS.length - 1 && <div style={{ width:2, height:24, background:done ? "linear-gradient(" + C.goldL + "," + C.goldD + ")" : C.border, margin:"4px 0" }} />}
                </div>
                <div style={{ paddingTop:6, paddingBottom:20 }}>
                  <div style={{ color:active ? C.goldL : done ? C.cream : C.faint, fontWeight:active ? 700 : 500, fontSize:13 }}>{STEP_LABELS[step]}</div>
                  {active && <div style={{ color:C.faint, fontSize:11, marginTop:2 }}>In progress…</div>}
                </div>
              </div>
            );
          })}
          <div style={{ borderTop:"1px solid " + C.border, paddingTop:14 }}>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid " + C.border }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}><VegDot size={11} /><span style={{ color:C.cream, fontSize:13 }}>{item.name} × {item.qty}</span></div>
                <span className="gt" style={{ fontWeight:700, fontSize:13 }}>{fmt(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
function ContactPage() {
  const [f, setF]   = useState({ name:"", email:"", msg:"" });
  const [sent, setSent] = useState(false);
  const send = () => {
    if (!f.name || !f.email || !f.msg) return;
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setF({ name:"", email:"", msg:"" });
  };
  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 16px 80px" }}>
      <p style={{ fontFamily:SF, fontSize:11, color:C.gold, letterSpacing:6, marginBottom:6 }}>GET IN TOUCH</p>
      <h2 style={{ fontFamily:SF, fontSize:"clamp(26px,5vw,42px)", fontWeight:600, color:C.cream, marginBottom:16 }}>Connect With Us</h2>
      <GoldBar />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:14, marginBottom:26 }}>
        {[{ icon:"📍", title:"Visit Us", lines:["Connaught Place, New Delhi","Open daily: 11 AM – 11 PM"] },{ icon:"📞", title:"Call Us", lines:["+91 98765 43210","+91 98765 43211"] },{ icon:"✉️", title:"Email Us", lines:["hello@veeranj.com","reservations@veeranj.com"] }].map((card, i) => (
          <div key={i} className="dc" style={{ background:C.card, border:"1px solid " + C.border, borderRadius:14, padding:22, textAlign:"center" }}>
            <div style={{ width:48, height:48, borderRadius:"50%", background:"rgba(201,146,42,0.1)", border:"1px solid " + C.goldD, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:20 }}>{card.icon}</div>
            <h4 style={{ fontFamily:SF, fontSize:15, color:C.cream, fontWeight:600, marginBottom:8 }}>{card.title}</h4>
            {card.lines.map((l, j) => <p key={j} style={{ color:C.muted, fontSize:12, lineHeight:1.9 }}>{l}</p>)}
          </div>
        ))}
      </div>
      <div style={{ background:C.card, border:"1px solid " + C.border, borderRadius:14, padding:24, marginBottom:24, textAlign:"center" }}>
        <p style={{ color:C.faint, fontSize:9, letterSpacing:4, marginBottom:14 }}>FOLLOW VEERANJ</p>
        <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
          {[["📸","Instagram","@veeranj.in"],["👍","Facebook","Veeranj Delhi"],["💬","WhatsApp","+91 98765 43210"],["▶️","YouTube","Veeranj Kitchen"]].map(([ic,nm,h]) => (
            <div key={nm} style={{ background:C.surface, border:"1px solid " + C.border, borderRadius:10, padding:"10px 14px", textAlign:"center", minWidth:80, cursor:"pointer" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize:18, marginBottom:4 }}>{ic}</div>
              <div style={{ color:C.cream, fontSize:10, fontWeight:700 }}>{nm}</div>
              <div style={{ color:C.faint, fontSize:9 }}>{h}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:C.card, border:"1px solid " + C.border, borderRadius:14, padding:24 }}>
        <h3 style={{ fontFamily:SF, fontSize:20, color:C.cream, marginBottom:14, fontWeight:600 }}>Send Us a Message</h3>
        {sent && <div style={{ background:"#082008", border:"1px solid " + C.green, borderRadius:8, padding:12, marginBottom:14, color:"#81C784", fontSize:12, fontWeight:600, textAlign:"center" }}>✅ Message sent! We will get back soon.</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <input value={f.name} onChange={e => setF(p => ({ ...p, name:e.target.value }))} placeholder="Your name *" style={SI} />
            <input value={f.email} onChange={e => setF(p => ({ ...p, email:e.target.value }))} placeholder="Email *" type="email" style={SI} />
          </div>
          <textarea value={f.msg} onChange={e => setF(p => ({ ...p, msg:e.target.value }))} placeholder="Your message... *" style={{ ...SI, minHeight:100, resize:"vertical" }} />
        </div>
        <Btn onClick={send} disabled={!f.name || !f.email || !f.msg} style={{ padding:"11px 24px", marginTop:14 }}>Send Message ✦</Btn>
      </div>
      <div style={{ marginTop:22, textAlign:"center", padding:"18px 0", borderTop:"1px solid " + C.border }}>
        <p style={{ color:C.faint, fontSize:11 }}>© 2026 Veeranj Restaurant · Pure Vegetarian · New Delhi</p>
      </div>
    </div>
  );
}

// ─── EDIT DISH MODAL ──────────────────────────────────────────────────────────
function EditDishModal({ item, onClose, onSave }) {
  const [f, setF]         = useState({ name:item.name, price:String(item.price), desc:item.desc||"", img:item.img||"", cat:item.cat });
  const [preview, setPreview] = useState(item.img||"");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setF(p => ({ ...p, img:ev.target.result })); setPreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!f.name || !f.price) return;
    setLoading(true);
    try {
      const updated = await apiFetch("/menu/" + item._id, {
        method:"PUT",
        body: JSON.stringify({ ...f, price: parseInt(f.price) }),
      });
      onSave(updated); onClose();
    } catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:700, display:"flex", alignItems:"center", justifyContent:"center", padding:16, animation:"fadeIn .2s" }}>
      <div style={{ background:C.card, border:"1px solid " + C.gold, borderRadius:18, width:"min(500px,100%)", padding:28, position:"relative", animation:"popIn .25s", maxHeight:"92vh", overflowY:"auto" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:16, background:"none", border:"none", color:C.faint, cursor:"pointer", fontSize:22 }}>✕</button>
        <h3 style={{ fontFamily:SF, fontSize:20, color:C.cream, fontWeight:600, marginBottom:16 }}>✏️ Edit Dish</h3>
        <GoldBar />
        <div style={{ marginBottom:14 }}>
          <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:8 }}>📸 DISH IMAGE</label>
          {preview && (
            <div style={{ position:"relative", width:"100%", height:150, borderRadius:10, overflow:"hidden", marginBottom:8 }}>
              <img src={preview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={() => setPreview("")} />
              <button onClick={() => { setF(p => ({ ...p, img:"" })); setPreview(""); }} style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.75)", border:"none", color:"#fff", borderRadius:"50%", width:28, height:28, cursor:"pointer", fontSize:13 }}>✕</button>
            </div>
          )}
          <div onClick={() => fileRef.current.click()} style={{ border:"2px dashed " + C.border, borderRadius:10, padding:"14px 16px", textAlign:"center", cursor:"pointer", marginBottom:8 }}>
            <Upload size={20} style={{ color:C.gold, marginBottom:4 }} />
            <p style={{ color:C.muted, fontSize:12 }}>Upload new photo</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
          <input value={f.img.startsWith("data:") ? "" : f.img} onChange={e => { setF(p => ({ ...p, img:e.target.value })); setPreview(e.target.value); }} placeholder="Or paste image URL…" style={{ ...SI, fontSize:12 }} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <input value={f.name} onChange={e => setF(p => ({ ...p, name:e.target.value }))} placeholder="Dish name" style={SI} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <input value={f.price} onChange={e => setF(p => ({ ...p, price:e.target.value }))} placeholder="Price" type="number" style={SI} />
            <select value={f.cat} onChange={e => setF(p => ({ ...p, cat:e.target.value }))} style={SI}>
              {["Starters","Chaap","Mains","Breads","Desserts","Ice Cream","Drinks"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <textarea value={f.desc} onChange={e => setF(p => ({ ...p, desc:e.target.value }))} placeholder="Dish description…" style={{ ...SI, minHeight:72, resize:"vertical" }} />
        </div>
        <div style={{ display:"flex", gap:10, marginTop:18 }}>
          <Btn onClick={save} disabled={!f.name || !f.price || loading} style={{ flex:1, padding:"12px 0" }}>{loading ? "Saving..." : "💾 Save Changes"}</Btn>
          <Btn onClick={onClose} variant="ghost" style={{ padding:"12px 16px" }}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── COUPONS MANAGER ──────────────────────────────────────────────────────────
function CouponsManager() {
  const EMPTY = { code:"", type:"percent", value:"", min:"0", desc:"", label:"", active:true };
  const [coupons, setCoupons] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [err, setErr]         = useState("");
  const sf = (k,v) => setForm(p => ({ ...p, [k]:v }));

  useEffect(() => {
    apiFetch("/coupons").then(setCoupons).catch(() => {});
  }, []);

  const save = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code || !form.value || !form.desc || !form.label) { setErr("All fields required"); return; }
    try {
      if (editId) {
        const updated = await apiFetch("/coupons/" + editId, { method:"PUT", body: JSON.stringify({ ...form, code, value:parseInt(form.value), min:parseInt(form.min)||0 }) });
        setCoupons(prev => prev.map(c => c._id === editId ? updated : c));
      } else {
        const created = await apiFetch("/coupons", { method:"POST", body: JSON.stringify({ ...form, code, value:parseInt(form.value), min:parseInt(form.min)||0 }) });
        setCoupons(prev => [...prev, created]);
      }
      setShowAdd(false); setErr(""); setEditId(null); setForm(EMPTY);
    } catch(e) { setErr(e.message); }
  };

  const deleteCoupon = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await apiFetch("/coupons/" + id, { method:"DELETE" });
      setCoupons(prev => prev.filter(c => c._id !== id));
    } catch(e) { alert(e.message); }
  };

  const toggleActive = async (id, active) => {
    try {
      const updated = await apiFetch("/coupons/" + id, { method:"PUT", body: JSON.stringify({ active: !active }) });
      setCoupons(prev => prev.map(c => c._id === id ? updated : c));
    } catch(e) { alert(e.message); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <p style={{ color:C.muted, fontSize:13 }}>Manage all coupon codes.</p>
        <Btn onClick={() => { setForm(EMPTY); setEditId(null); setErr(""); setShowAdd(p => !p); }}>+ New Coupon</Btn>
      </div>
      {showAdd && (
        <div style={{ background:C.card, border:"1px solid " + C.gold, borderRadius:14, padding:22, marginBottom:20, animation:"fadeUp .2s" }}>
          <h3 style={{ fontFamily:SF, fontSize:18, color:C.cream, fontWeight:600, marginBottom:14 }}>{editId ? "✏️ Edit Coupon" : "➕ New Coupon"}</h3>
          {err && <p style={{ color:"#E57373", fontSize:12, marginBottom:10, fontWeight:600 }}>{err}</p>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:5 }}>COUPON CODE *</label>
              <input value={form.code} onChange={e => sf("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))} placeholder="e.g. SAVE20" style={SI} disabled={!!editId} />
            </div>
            <div>
              <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:5 }}>LABEL *</label>
              <input value={form.label} onChange={e => sf("label", e.target.value)} placeholder="e.g. Weekend Deal" style={SI} />
            </div>
            <div>
              <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:5 }}>TYPE</label>
              <select value={form.type} onChange={e => sf("type", e.target.value)} style={SI}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:5 }}>VALUE *</label>
              <input value={form.value} onChange={e => sf("value", e.target.value.replace(/\D/g,""))} placeholder={form.type === "percent" ? "e.g. 20" : "e.g. 99"} type="number" style={SI} />
            </div>
            <div>
              <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:5 }}>MIN ORDER (₹)</label>
              <input value={form.min} onChange={e => sf("min", e.target.value.replace(/\D/g,""))} placeholder="0 = no min" type="number" style={SI} />
            </div>
          </div>
          <input value={form.desc} onChange={e => sf("desc", e.target.value)} placeholder="Description *" style={{ ...SI, marginBottom:12 }} />
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={save}>{editId ? "💾 Save" : "✅ Add Coupon"}</Btn>
            <Btn onClick={() => { setShowAdd(false); setErr(""); }} variant="ghost">Cancel</Btn>
          </div>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:14 }}>
        {coupons.map(c => (
          <div key={c._id} style={{ background:C.card, border:"1px solid " + (c.active ? C.border : C.faint), borderRadius:12, padding:18, position:"relative", overflow:"hidden", opacity:c.active ? 1 : 0.6 }}>
            <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:c.active ? "linear-gradient(" + C.goldL + "," + C.gold + ")" : C.faint }} />
            <div style={{ paddingLeft:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div className="gt" style={{ fontFamily:SF, fontSize:18, fontWeight:700, letterSpacing:2 }}>{c.code}</div>
                <span style={{ background:(c.active ? C.green : "#555") + "20", color:c.active ? "#81C784" : C.faint, fontSize:10, padding:"2px 8px", borderRadius:10, fontWeight:700 }}>{c.active ? "ACTIVE" : "OFF"}</span>
              </div>
              <p style={{ color:C.muted, fontSize:12, marginBottom:6 }}>{c.desc}</p>
              <div style={{ display:"flex", gap:12, marginBottom:12 }}>
                <span style={{ color:C.faint, fontSize:11 }}>Min: {fmt(c.min)}</span>
                <span className="gt" style={{ fontSize:11, fontWeight:700 }}>{c.type === "percent" ? c.value + "% OFF" : fmt(c.value) + " OFF"}</span>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <Btn onClick={() => toggleActive(c._id, c.active)} variant={c.active ? "success" : "danger"} style={{ padding:"4px 10px", fontSize:10, flex:1 }}>{c.active ? "✓ Active" : "✗ Off"}</Btn>
                <Btn onClick={() => { setForm({ ...c, value:String(c.value), min:String(c.min) }); setEditId(c._id); setErr(""); setShowAdd(true); }} variant="outline" style={{ padding:"4px 10px", fontSize:11 }}>✏️</Btn>
                <Btn onClick={() => deleteCoupon(c._id)} variant="danger" style={{ padding:"4px 10px", fontSize:12 }}>🗑️</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ orders, setOrders, menuItems, setMenuItems }) {
  const [tab, setTab]         = useState("orders");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [newItem, setNewItem] = useState({ name:"", cat:"Starters", price:"", desc:"", img:"", imgPreview:"" });
  const [bookings, setBookings] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    if (tab === "bookings") apiFetch("/bookings").then(setBookings).catch(() => {});
    if (tab === "reviews")  apiFetch("/reviews/all").then(setAllReviews).catch(() => {});
  }, [tab]);

  const handleImageFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setNewItem(p => ({ ...p, img:ev.target.result, imgPreview:ev.target.result }));
    reader.readAsDataURL(file);
  };

  const updateStatus = async (id, dir) => {
    try {
      const updated = await apiFetch("/orders/" + id + "/status", { method:"PUT", body: JSON.stringify({ direction: dir }) });
      setOrders(prev => prev.map(o => o._id === id ? updated : o));
    } catch(e) { alert(e.message); }
  };

  const addItem = async () => {
    if (!newItem.name || !newItem.price) return;
    try {
      const item = await apiFetch("/menu", { method:"POST", body: JSON.stringify({ name:newItem.name, price:parseInt(newItem.price), cat:newItem.cat, desc:newItem.desc, img:newItem.img }) });
      setMenuItems(prev => [item, ...prev]);
      setNewItem({ name:"", cat:"Starters", price:"", desc:"", img:"", imgPreview:"" });
      setShowAdd(false);
    } catch(e) { alert(e.message); }
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this dish?")) return;
    try {
      await apiFetch("/menu/" + id, { method:"DELETE" });
      setMenuItems(prev => prev.filter(m => m._id !== id));
    } catch(e) { alert(e.message); }
  };

  const toggleAvail = async (id) => {
    try {
      const updated = await apiFetch("/menu/" + id + "/toggle", { method:"PUT" });
      setMenuItems(prev => prev.map(m => m._id === id ? updated : m));
    } catch(e) { alert(e.message); }
  };

  const approveReview = async (id, approved) => {
    try {
      await apiFetch("/reviews/" + id, { method:"PUT", body: JSON.stringify({ approved }) });
      setAllReviews(prev => prev.map(r => r._id === id ? { ...r, approved } : r));
    } catch(e) { alert(e.message); }
  };

  const revenue = orders.reduce((s, o) => s + (o.grand || 0), 0);
  const sc = s => ({ confirmed:C.gold, preparing:"#FF9800", ready:"#2196F3", out_for_delivery:"#9C27B0", delivered:C.green }[s] || C.faint);

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 16px 80px" }}>
      {editItem && <EditDishModal item={editItem} onClose={() => setEditItem(null)} onSave={updated => setMenuItems(prev => prev.map(m => m._id === updated._id ? updated : m))} />}

      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
        <img src={LOGO_B64} alt="Veeranj" style={{ width:38, height:38, objectFit:"contain", borderRadius:"50%", border:"1px solid " + C.goldD }} />
        <p style={{ fontFamily:SF, fontSize:11, color:C.gold, letterSpacing:6 }}>ADMIN PANEL</p>
      </div>
      <h2 style={{ fontFamily:SF, fontSize:"clamp(26px,5vw,42px)", fontWeight:600, color:C.cream, marginBottom:16 }}>Dashboard</h2>
      <GoldBar />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginBottom:24 }}>
        {[["📦",orders.length,"Orders"],["⏳",orders.filter(o => o.status === "confirmed").length,"Pending"],["✅",orders.filter(o => o.status === "delivered").length,"Delivered"],["💰",fmt(revenue),"Revenue"]].map(([ic,v,l]) => (
          <div key={l} style={{ background:C.card, border:"1px solid " + C.border, borderRadius:14, padding:16, textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{ic}</div>
            <div className="gt" style={{ fontFamily:SF, fontSize:22, fontWeight:700 }}>{v}</div>
            <div style={{ color:C.faint, fontSize:10, letterSpacing:1 }}>{l.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
        {[["orders","📦 Orders"],["menu","🍛 Menu"],["bookings","🪑 Bookings"],["reviews","⭐ Reviews"],["coupons","🏷️ Coupons"]].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} style={{ background:tab === t ? "linear-gradient(135deg," + C.goldL + "," + C.gold + ")" : "transparent", color:tab === t ? "#050300" : C.muted, border:"1px solid " + (tab === t ? C.gold : C.border), borderRadius:10, padding:"9px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:SN }}>
            {l}
          </button>
        ))}
      </div>

      {/* ORDERS */}
      {tab === "orders" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {orders.length === 0 && <p style={{ color:C.faint, textAlign:"center", padding:"32px 0" }}>No orders yet</p>}
          {orders.map(o => {
            const si = STEPS.indexOf(o.status);
            return (
              <div key={o._id} style={{ background:C.card, border:"1px solid " + C.border, borderRadius:14, padding:16, display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontFamily:SF, fontSize:16, color:C.cream }}>{o.orderId}</span>
                    <span style={{ background:sc(o.status) + "20", color:sc(o.status), fontSize:10, padding:"2px 9px", borderRadius:20, fontWeight:700 }}>{(o.status||"").replace("_"," ")}</span>
                  </div>
                  <p style={{ color:C.muted, fontSize:11 }}>{o.customer} · {o.addr}</p>
                </div>
                <div className="gt" style={{ fontFamily:SF, fontSize:16, fontWeight:700 }}>{fmt(o.grand)}</div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn onClick={() => updateStatus(o._id, -1)} variant="ghost" style={{ padding:"7px 12px", opacity:si <= 0 ? 0.3 : 1 }}>←</Btn>
                  <Btn onClick={() => updateStatus(o._id, +1)} style={{ padding:"7px 12px", opacity:si >= STEPS.length - 1 ? 0.3 : 1 }}>→</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MENU */}
      {tab === "menu" && (
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
            <Btn onClick={() => setShowAdd(p => !p)}>+ Add New Dish</Btn>
          </div>
          {showAdd && (
            <div style={{ background:C.card, border:"1px solid " + C.border, borderRadius:14, padding:22, marginBottom:18 }}>
              <h3 style={{ fontFamily:SF, fontSize:20, color:C.cream, marginBottom:16, fontWeight:600 }}>Add New Dish</h3>
              <div style={{ marginBottom:16 }}>
                <label style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, display:"block", marginBottom:8 }}>DISH IMAGE</label>
                {newItem.imgPreview ? (
                  <div style={{ position:"relative", width:"100%", height:160, borderRadius:10, overflow:"hidden", marginBottom:8 }}>
                    <img src={newItem.imgPreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    <button onClick={() => setNewItem(p => ({ ...p, img:"", imgPreview:"" }))} style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.7)", border:"none", color:"#fff", borderRadius:"50%", width:28, height:28, cursor:"pointer" }}>✕</button>
                  </div>
                ) : (
                  <div onClick={() => fileRef.current.click()} style={{ border:"2px dashed " + C.border, borderRadius:10, padding:"28px 20px", textAlign:"center", cursor:"pointer" }}>
                    <Upload size={28} style={{ color:C.gold, marginBottom:8 }} />
                    <p style={{ color:C.muted, fontSize:13, fontWeight:600 }}>Click to upload dish photo</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} style={{ display:"none" }} />
                <input value={newItem.img.startsWith("data:") ? "" : newItem.img} onChange={e => setNewItem(p => ({ ...p, img:e.target.value, imgPreview:e.target.value }))} placeholder="Or paste image URL..." style={{ ...SI, marginTop:8, fontSize:12 }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name:e.target.value }))} placeholder="Dish name *" style={SI} />
                <input value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price:e.target.value }))} placeholder="Price in ₹ *" type="number" style={SI} />
                <select value={newItem.cat} onChange={e => setNewItem(p => ({ ...p, cat:e.target.value }))} style={SI}>
                  {["Starters","Chaap","Mains","Breads","Desserts","Ice Cream","Drinks"].map(c => <option key={c}>{c}</option>)}
                </select>
                <input value={newItem.desc} onChange={e => setNewItem(p => ({ ...p, desc:e.target.value }))} placeholder="Short description" style={SI} />
              </div>
              <div style={{ display:"flex", gap:10, marginTop:14 }}>
                <Btn onClick={addItem} disabled={!newItem.name || !newItem.price}>✅ Add Dish</Btn>
                <Btn onClick={() => setShowAdd(false)} variant="ghost">Cancel</Btn>
              </div>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:14 }}>
            {menuItems.map(item => (
              <div key={item._id} style={{ background:C.card, border:"1px solid " + C.border, borderRadius:14, overflow:"hidden", opacity:item.avail ? 1 : 0.55 }}>
                <div style={{ height:120, overflow:"hidden" }}>
                  <DishImage img={item.img} name={item.name} cat={item.cat} />
                </div>
                <div style={{ padding:"12px 14px" }}>
                  <h4 style={{ fontFamily:SF, fontSize:14, color:C.cream, fontWeight:600, marginBottom:2 }}>{item.name}</h4>
                  <div className="gt" style={{ fontFamily:SF, fontSize:16, fontWeight:700, marginBottom:10 }}>{fmt(item.price)}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <Btn onClick={() => toggleAvail(item._id)} variant={item.avail ? "success" : "danger"} style={{ padding:"4px 10px", fontSize:10, flex:1 }}>{item.avail ? "✓ Live" : "✗ Off"}</Btn>
                    <Btn onClick={() => setEditItem(item)} variant="outline" style={{ padding:"4px 10px", fontSize:11 }}>✏️</Btn>
                    <Btn onClick={() => deleteItem(item._id)} variant="danger" style={{ padding:"4px 10px", fontSize:12 }}>🗑️</Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOOKINGS */}
      {tab === "bookings" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {bookings.length === 0 && <p style={{ color:C.faint, textAlign:"center", padding:"32px 0" }}>No bookings yet</p>}
          {bookings.map(b => (
            <div key={b._id} style={{ background:C.card, border:"1px solid " + C.border, borderRadius:12, padding:"14px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:C.cream, fontWeight:700 }}>{b.name}</span>
                <span style={{ color:C.gold, fontSize:12 }}>{b.date} at {b.time}</span>
              </div>
              <p style={{ color:C.muted, fontSize:12 }}>{b.phone} · {b.guests} guests</p>
              {b.note && <p style={{ color:C.faint, fontSize:11, marginTop:4 }}>{b.note}</p>}
            </div>
          ))}
        </div>
      )}

      {/* REVIEWS */}
      {tab === "reviews" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {allReviews.length === 0 && <p style={{ color:C.faint, textAlign:"center", padding:"32px 0" }}>No reviews yet</p>}
          {allReviews.map(r => (
            <div key={r._id} style={{ background:C.card, border:"1px solid " + C.border, borderRadius:12, padding:"14px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:C.cream, fontWeight:700 }}>{r.name}</span>
                <Stars n={r.rating} size={12} />
              </div>
              <p style={{ color:C.muted, fontSize:12, marginBottom:10 }}>{r.text}</p>
              <div style={{ display:"flex", gap:8 }}>
                <Btn onClick={() => approveReview(r._id, true)} variant="success" style={{ padding:"4px 12px", fontSize:11 }}>✅ Approve</Btn>
                <Btn onClick={() => approveReview(r._id, false)} variant="danger" style={{ padding:"4px 12px", fontSize:11 }}>❌ Reject</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COUPONS */}
      {tab === "coupons" && <CouponsManager />}
    </div>
  );
}

// ─── CART DRAWER ──────────────────────────────────────────────────────────────
function CartDrawer({ cart, total, onClose, onUpdateQty, onCheckout, user, onLoginNeeded }) {
  const [step, setStep]       = useState("cart");
  const [addr, setAddr]       = useState("");
  const [cd, setCd]           = useState({ num:"", exp:"", cvv:"", name:"" });
  const [busy, setBusy]       = useState(false);
  const [applied, setApplied] = useState(null);

  const discount = applied ? applied.discount : 0;
  const delivery = total >= FREE_ABOVE ? 0 : DELIVERY_FEE;
  const gst      = Math.round((total - discount) * 0.05);
  const grand    = Math.max(0, total - discount) + delivery + gst + HANDLING_FEE;

  const pay = () => {
    if (!cd.num || !cd.exp || !cd.cvv || !cd.name) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); onCheckout(addr, { discount, delivery, gst, grand, coupon: applied?.code || "" }); }, 2000);
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:500, display:"flex", justifyContent:"flex-end", animation:"fadeIn .2s" }}>
      <div style={{ width:"min(410px,100vw)", background:C.surface, borderLeft:"1px solid " + C.border, display:"flex", flexDirection:"column", height:"100vh", animation:"slideIn .3s ease" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid " + C.border, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, background:C.card }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {step !== "cart" && <button onClick={() => setStep(step === "payment" ? "checkout" : "cart")} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:20 }}>←</button>}
            <span style={{ fontFamily:SF, fontSize:17, color:C.cream }}>{step === "cart" ? "Your Cart" : step === "checkout" ? "Delivery Details" : "Payment"}</span>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.faint, cursor:"pointer", fontSize:22 }}>✕</button>
        </div>
        <div style={{ flex:1, padding:18, overflowY:"auto", paddingBottom:80 }}>
          {step === "cart" && (
            cart.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:C.faint }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🛒</div>
                <p style={{ fontFamily:SF, fontSize:16 }}>Your cart is empty</p>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item._id || item.id} style={{ display:"flex", gap:10, padding:"12px 0", borderBottom:"1px solid " + C.border }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <VegDot size={11} />
                        <span style={{ color:C.cream, fontSize:13, fontWeight:600 }}>{item.name}</span>
                      </div>
                      <div className="gt" style={{ fontWeight:700, fontSize:14, marginTop:2 }}>{fmt(item.price * item.qty)}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <button onClick={() => onUpdateQty(item._id || item.id, -1)} style={{ background:C.card, border:"1px solid " + C.border, color:C.muted, borderRadius:6, width:27, height:27, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                      <span style={{ color:C.cream, minWidth:16, textAlign:"center", fontWeight:700 }}>{item.qty}</span>
                      <button onClick={() => onUpdateQty(item._id || item.id, +1)} style={{ background:"linear-gradient(135deg," + C.goldL + "," + C.gold + ")", border:"none", color:"#050300", borderRadius:6, width:27, height:27, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>+</button>
                    </div>
                  </div>
                ))}
                <div style={{ margin:"16px 0" }}>
                  <p style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:700, marginBottom:10 }}>🏷️ APPLY COUPON</p>
                  <CouponInput subtotal={total} applied={applied} setApplied={setApplied} />
                </div>
                <div style={{ background:C.card, borderRadius:12, padding:14, border:"1px solid " + C.border }}>
                  <p style={{ color:C.faint, fontSize:9, letterSpacing:3, marginBottom:12 }}>BILL SUMMARY</p>
                  <div style={{ display:"flex", justifyContent:"space-between", color:C.muted, fontSize:12, marginBottom:7 }}><span>Subtotal</span><span>{fmt(total)}</span></div>
                  {discount > 0 && <div style={{ display:"flex", justifyContent:"space-between", color:"#81C784", fontSize:12, marginBottom:7, fontWeight:700 }}><span>Discount</span><span>-{fmt(discount)}</span></div>}
                  <div style={{ display:"flex", justifyContent:"space-between", color:C.muted, fontSize:12, marginBottom:7 }}><span>Delivery</span>{delivery === 0 ? <span style={{ color:"#81C784", fontWeight:700 }}>FREE 🎉</span> : <span>{fmt(DELIVERY_FEE)}</span>}</div>
                  <div style={{ display:"flex", justifyContent:"space-between", color:C.muted, fontSize:12, marginBottom:7 }}><span>Handling</span><span>{fmt(HANDLING_FEE)}</span></div>
                  <div style={{ display:"flex", justifyContent:"space-between", color:C.muted, fontSize:12, marginBottom:7 }}><span>GST (5%)</span><span>{fmt(gst)}</span></div>
                  <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid " + C.border, paddingTop:10, marginTop:4 }}>
                    <span style={{ color:C.cream, fontWeight:700, fontSize:17 }}>Total</span>
                    <span className="gt" style={{ fontWeight:700, fontSize:17 }}>{fmt(grand)}</span>
                  </div>
                  {discount > 0 && <p style={{ color:"#81C784", fontSize:11, marginTop:6, fontWeight:600, textAlign:"center" }}>You saved {fmt(discount)} on this order! 🎉</p>}
                </div>
              </>
            )
          )}
          {step === "checkout" && (
            <div>
              <p style={{ color:C.muted, fontSize:13, marginBottom:14 }}>Where should we deliver?</p>
              <textarea value={addr} onChange={e => setAddr(e.target.value)} placeholder="House no., Street, Area, City, PIN code..." style={{ ...SI, minHeight:100, resize:"vertical" }} />
            </div>
          )}
          {step === "payment" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ background:"linear-gradient(135deg,#1A0E00,#2A1800)", border:"1px solid " + C.goldD, borderRadius:14, padding:18 }}>
                <div style={{ fontSize:9, color:C.gold, letterSpacing:5, marginBottom:10 }}>PAYMENT CARD</div>
                <div style={{ color:C.cream, fontSize:16, letterSpacing:4, marginBottom:14, fontFamily:"monospace" }}>{cd.num ? cd.num.replace(/(.{4})/g,"$1 ").trim() : "•••• •••• •••• ••••"}</div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div><div style={{ color:C.faint, fontSize:8, letterSpacing:2 }}>CARDHOLDER</div><div style={{ color:C.cream, fontSize:11 }}>{cd.name || "Your Name"}</div></div>
                  <div><div style={{ color:C.faint, fontSize:8, letterSpacing:2 }}>EXPIRES</div><div style={{ color:C.cream, fontSize:11 }}>{cd.exp || "MM/YY"}</div></div>
                </div>
              </div>
              <input value={cd.name} onChange={e => setCd(p => ({ ...p, name:e.target.value }))} placeholder="Cardholder name" style={SI} />
              <input value={cd.num} onChange={e => setCd(p => ({ ...p, num:e.target.value.replace(/\D/g,"").slice(0,16) }))} placeholder="Card number" style={SI} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <input value={cd.exp} onChange={e => setCd(p => ({ ...p, exp:e.target.value }))} placeholder="MM/YY" style={SI} />
                <input value={cd.cvv} onChange={e => setCd(p => ({ ...p, cvv:e.target.value.replace(/\D/g,"").slice(0,3) }))} placeholder="CVV" style={SI} />
              </div>
              <p style={{ color:C.faint, fontSize:11, textAlign:"center" }}>🔒 Secured · 256-bit Encryption</p>
            </div>
          )}
        </div>
        <div style={{ padding:18, borderTop:"1px solid " + C.border, flexShrink:0, background:C.card }}>
          {step === "cart" && cart.length > 0 && (user
            ? <Btn onClick={() => setStep("checkout")} style={{ width:"100%", padding:"13px 0" }}>Proceed to Checkout →</Btn>
            : <Btn onClick={onLoginNeeded} style={{ width:"100%", padding:"13px 0" }}>Login to Checkout 🔐</Btn>
          )}
          {step === "checkout" && <Btn onClick={() => addr.trim() && setStep("payment")} disabled={!addr.trim()} style={{ width:"100%", padding:"13px 0" }}>Continue to Payment →</Btn>}
          {step === "payment" && <Btn onClick={pay} style={{ width:"100%", padding:"13px 0" }}>{busy ? "Processing..." : "Pay " + fmt(grand) + " ✦"}</Btn>}
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN MODAL ──────────────────────────────────────────────────────────────
function LoginModal({ onLogin, onClose }) {
  const [mode, setMode]     = useState("login");
  const [f, setF]           = useState({ name:"", phone:"", pass:"" });
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode === "login") {
        const data = await apiFetch("/auth/login", { method:"POST", body: JSON.stringify({ phone: f.phone, password: f.pass }) });
        setToken(data.token); onLogin({ ...data.user, phone: f.phone });
      } else {
        if (!f.name || !f.phone || !f.pass) { setErr("All fields required"); setLoading(false); return; }
        const data = await apiFetch("/auth/register", { method:"POST", body: JSON.stringify({ name: f.name, phone: f.phone, password: f.pass }) });
        setToken(data.token); onLogin({ ...data.user, phone: f.phone });
      }
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:16, animation:"fadeIn .2s" }}>
      <div style={{ background:C.card, border:"1px solid " + C.border, borderRadius:16, width:"min(380px,100%)", padding:32, position:"relative", animation:"popIn .25s", boxShadow:"0 32px 80px rgba(0,0,0,0.8)" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:16, background:"none", border:"none", color:C.faint, cursor:"pointer", fontSize:20 }}>✕</button>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <img src={LOGO_B64} alt="Veeranj" style={{ width:60, height:60, objectFit:"contain", marginBottom:10, filter:"drop-shadow(0 0 16px rgba(201,146,42,0.4))" }} />
          <div className="gt" style={{ fontFamily:SF, fontSize:20, letterSpacing:3, marginBottom:4 }}>VEERANJ</div>
          <p style={{ color:C.faint, fontSize:12 }}>{mode === "login" ? "Welcome back. Please sign in." : "Create your Veeranj account."}</p>
        </div>
        <GoldBar />
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {mode === "signup" && <input value={f.name} onChange={e => setF(p => ({ ...p, name:e.target.value }))} placeholder="Full name" style={SI} />}
          <input value={f.phone} onChange={e => setF(p => ({ ...p, phone:e.target.value }))} placeholder="Phone number" style={SI} />
          <input value={f.pass} onChange={e => setF(p => ({ ...p, pass:e.target.value }))} placeholder="Password" type="password" style={SI} onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        {err && <p style={{ color:"#E57373", fontSize:12, marginTop:8, fontWeight:600 }}>{err}</p>}
        <Btn onClick={submit} disabled={loading} style={{ width:"100%", padding:"13px 0", marginTop:18 }}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In ✦" : "Create Account"}
        </Btn>
        <p style={{ textAlign:"center", color:C.faint, fontSize:12, marginTop:14 }}>
          {mode === "login" ? "New here? " : "Have an account? "}
          <span onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setErr(""); }} style={{ color:C.goldL, cursor:"pointer", fontWeight:700 }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function RestaurantApp() {
  const [view, setView]         = useState("home");
  const [cart, setCart]         = useState([]);
  const [user, setUser]         = useState(null);
  const [menu, setMenu]         = useState([]);
  const [orders, setOrders]     = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [showCart, setShowCart]     = useState(false);
  const [showLogin, setShowLogin]   = useState(false);
  const [showBook, setShowBook]     = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [trackingId, setTrackingId] = useState(null);
  const [toast, setToast]           = useState(null);
  const [loading, setLoading]       = useState(true);

  const notify = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) setUser({ id:payload.id, name:payload.name, role:payload.role, phone:payload.phone||"" });
        else clearToken();
      } catch {}
    }
    Promise.all([apiFetch("/menu"), apiFetch("/reviews")])
      .then(([m, r]) => { setMenu(m); setReviews(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role === "admin") apiFetch("/orders").then(setOrders).catch(() => {});
  }, [user]);

  const addToCart = item => {
    const id = item._id || item.id;
    setCart(prev => {
      const ex = prev.find(c => (c._id || c.id) === id);
      return ex ? prev.map(c => (c._id || c.id) === id ? { ...c, qty:c.qty+1 } : c) : [...prev, { ...item, qty:1 }];
    });
    notify(item.name + " added to cart ✦");
  };

  const updateQty = (id, delta) => setCart(prev =>
    prev.map(c => (c._id || c.id) === id ? { ...c, qty:Math.max(0, c.qty+delta) } : c).filter(c => c.qty > 0)
  );

  const placeOrder = async (addr, fees) => {
    const sub = cart.reduce((s, c) => s + c.price * c.qty, 0);
    try {
      const order = await apiFetch("/orders", {
        method:"POST",
        body: JSON.stringify({
          items: cart.map(c => ({ name:c.name, qty:c.qty, price:c.price, img:c.img||"" })),
          total: sub, discount: fees.discount||0, coupon: fees.coupon||"",
          delivery: fees.delivery||0, gst: fees.gst||0, grand: fees.grand||sub,
          addr, phone: user?.phone || user?.name || "N/A",
        }),
      });
      setCart([]);
      setTrackingId(order.orderId);
      setView("tracking");
      notify("Order placed! Khana aa raha hai 🎉");
    } catch(e) { notify("Order failed: " + e.message); }
  };

  const addReview = r => {
    setReviews(prev => [{ ...r, id:Date.now() }, ...prev]);
    notify("Review posted! Shukriya 🙏");
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (loading) {
    return (
      <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <GlobalStyles />
        <img src={LOGO_B64} alt="Veeranj" style={{ width:70, height:70, objectFit:"contain" }} />
        <div className="gt" style={{ fontFamily:SF, fontSize:24, letterSpacing:4 }}>VEERANJ</div>
        <p style={{ color:C.faint, fontSize:12 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily:SN, background:C.bg, color:C.cream, minHeight:"100vh" }}>
      <GlobalStyles />
      {toast && <Toast msg={toast} />}
      <Navbar user={user} cartCount={cartCount} onCart={() => setShowCart(true)} onLogin={() => setShowLogin(true)} onLogout={() => { setUser(null); clearToken(); notify("Phir milenge! 🙏"); }} />
      <div>
        {view === "home"     && <HomePage setView={setView} menuItems={menu} onAddToCart={addToCart} onBook={() => setShowBook(true)} />}
        {view === "menu"     && <MenuPage menuItems={menu} onAddToCart={addToCart} cart={cart} onBook={() => setShowBook(true)} />}
        {view === "services" && <ServicesPage onBook={() => setShowBook(true)} reviews={reviews} onAddReview={() => setShowReview(true)} />}
        {view === "tracking" && <TrackingPage trackingId={trackingId} setTrackingId={setTrackingId} />}
        {view === "contact"  && <ContactPage />}
        {view === "admin" && user?.role === "admin" && <AdminPanel orders={orders} setOrders={setOrders} menuItems={menu} setMenuItems={setMenu} />}
        {view === "admin" && (!user || user.role !== "admin") && (
          <div style={{ textAlign:"center", padding:"80px 20px", color:C.faint }}>
            <img src={LOGO_B64} alt="Veeranj" style={{ width:60, height:60, objectFit:"contain", marginBottom:16, opacity:0.6 }} />
            <p style={{ fontFamily:SF, fontSize:18, color:C.cream, marginBottom:16 }}>Admin Access Required</p>
            <Btn onClick={() => setShowLogin(true)} size="lg">Login as Admin ✦</Btn>
          </div>
        )}
      </div>
      <BottomNav view={view} setView={setView} isAdmin={user?.role === "admin"} />
      {showCart   && <CartDrawer cart={cart} total={cartTotal} onClose={() => setShowCart(false)} onUpdateQty={updateQty} onCheckout={(addr, fees) => { setShowCart(false); placeOrder(addr, fees); }} user={user} onLoginNeeded={() => { setShowCart(false); setShowLogin(true); }} />}
      {showLogin  && <LoginModal onLogin={u => { setUser(u); setShowLogin(false); notify("Swagat hai, " + u.name + "! ✦"); }} onClose={() => setShowLogin(false)} />}
      {showBook   && <BookingModal onClose={() => setShowBook(false)} onConfirm={f => { notify("Table booked for " + f.guests + " guests! 🎉"); }} />}
      {showReview && <ReviewModal onClose={() => setShowReview(false)} onSubmit={addReview} />}
    </div>
  );
}
