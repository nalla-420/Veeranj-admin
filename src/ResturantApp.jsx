import { useState, useEffect, createContext, useContext } from "react";

const API = import.meta.env.VITE_API_URL || "https://veeranj-backend-npbf.onrender.com/api";

const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => { try { return JSON.parse(localStorage.getItem("vrj_admin")); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("vrj_token") || "");
  const login = (data) => { setAdmin(data.admin); setToken(data.token); localStorage.setItem("vrj_admin", JSON.stringify(data.admin)); localStorage.setItem("vrj_token", data.token); };
  const logout = () => { setAdmin(null); setToken(""); localStorage.removeItem("vrj_admin"); localStorage.removeItem("vrj_token"); };
  return <AuthCtx.Provider value={{ admin, token, login, logout }}>{children}</AuthCtx.Provider>;
}

function useApi() {
  const { token } = useAuth();
  const h = () => ({ "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) });
  const get = (path) => fetch(`${API}${path}`, { headers: h() }).then(r => r.json());
  const post = (path, body) => fetch(`${API}${path}`, { method: "POST", headers: h(), body: JSON.stringify(body) }).then(r => r.json());
  const put = (path, body) => fetch(`${API}${path}`, { method: "PUT", headers: h(), body: JSON.stringify(body) }).then(r => r.json());
  const del = (path) => fetch(`${API}${path}`, { method: "DELETE", headers: h() }).then(r => r.json());
  return { get, post, put, del };
}

const statusColors = { pending:"#f59e0b", confirmed:"#3b82f6", preparing:"#8b5cf6", ready:"#06b6d4", out_for_delivery:"#f97316", delivered:"#22c55e", cancelled:"#ef4444", completed:"#22c55e", no_show:"#6b7280" };
const Badge = ({ status }) => <span style={{ background:(statusColors[status]||"#6b7280")+"22", color:statusColors[status]||"#6b7280", border:`1px solid ${statusColors[status]||"#6b7280"}44`, padding:"2px 10px", borderRadius:99, fontSize:12, fontWeight:600, textTransform:"capitalize" }}>{status?.replace(/_/g," ")}</span>;
const Loader = () => <div style={{ display:"flex", justifyContent:"center", padding:60 }}><div style={{ width:40, height:40, border:"4px solid #f3f4f6", borderTop:"4px solid #b45309", borderRadius:"50%", animation:"spin 1s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

const ls = { display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 };
const is = { width:"100%", padding:"10px 14px", border:"1.5px solid #e5e7eb", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"#fff" };
const bs = (bg, inline=false) => ({ background:bg, color:"#fff", border:"none", padding:inline?"10px 20px":"12px 20px", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:14, width:inline?"auto":"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6 });
const sb = (bg) => ({ background:bg+"18", color:bg, border:`1px solid ${bg}44`, padding:"5px 10px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, display:"inline-flex", alignItems:"center", gap:4 });
const fb = (active) => ({ background:active?"#b45309":"#f3f4f6", color:active?"#fff":"#555", border:"none", padding:"6px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:active?700:400, textTransform:"capitalize" });
const card = { background:"#fff", borderRadius:16, padding:20, boxShadow:"0 2px 12px #0001" };
const mo = { position:"fixed", inset:0, background:"#0007", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:20 };
const mb = { background:"#fff", borderRadius:20, padding:28, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 25px 60px #0005" };
const cb = { background:"#f3f4f6", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" };
const ib = { background:"#f9fafb", borderRadius:10, padding:"12px 16px", marginBottom:8 };

function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email:"", password:"" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (data.success) login(data); else setError(data.message || "Invalid credentials");
    } catch { setError("Cannot connect to server"); }
    setLoading(false);
  };
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1a0a00,#3d1a00,#1a0a00)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"48px 40px", width:"100%", maxWidth:400, boxShadow:"0 25px 60px #0007" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:48 }}>🍽️</div>
          <h1 style={{ margin:"8px 0 0", fontSize:24, fontWeight:800, color:"#1a0a00" }}>Veeranj Admin</h1>
          <p style={{ color:"#888", fontSize:14 }}>Restaurant Management Panel</p>
        </div>
        {error && <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", marginBottom:16, color:"#dc2626", fontSize:14 }}>{error}</div>}
        <div style={{ marginBottom:16 }}><label style={ls}>Email</label><input style={is} type="email" placeholder="admin@veeranj.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} /></div>
        <div style={{ marginBottom:24 }}><label style={ls}>Password</label><input style={is} type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} /></div>
        <button onClick={submit} disabled={loading} style={bs("#b45309")}>{loading?"Logging in...":"Login"}</button>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, unread }) {
  const { admin, logout } = useAuth();
  const nav = [{ key:"dashboard", label:"Dashboard", icon:"📊" }, { key:"orders", label:"Orders", icon:"📦" }, { key:"bookings", label:"Bookings", icon:"🪑" }, { key:"menu", label:"Menu", icon:"🍽️" }, { key:"messages", label:"Messages", icon:"💬", badge:unread }];
  return (
    <div style={{ width:220, minHeight:"100vh", background:"#1a0a00", display:"flex", flexDirection:"column", position:"fixed", left:0, top:0, zIndex:100 }}>
      <div style={{ padding:"28px 20px 20px", borderBottom:"1px solid #ffffff15" }}>
        <div style={{ fontSize:28 }}>🍽️</div>
        <div style={{ color:"#fff", fontWeight:800, fontSize:16, marginTop:6 }}>Veeranj</div>
        <div style={{ color:"#ffffff60", fontSize:12 }}>Admin Panel</div>
      </div>
      <nav style={{ flex:1, padding:"12px 0" }}>
        {nav.map(n=>(
          <button key={n.key} onClick={()=>setPage(n.key)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"12px 20px", background:page===n.key?"#b45309":"transparent", border:"none", color:page===n.key?"#fff":"#ffffff80", cursor:"pointer", fontSize:14, fontWeight:page===n.key?700:400, borderRadius:page===n.key?"0 12px 12px 0":0 }}>
            <span>{n.icon}</span>
            <span style={{ flex:1, textAlign:"left" }}>{n.label}</span>
            {n.badge>0&&<span style={{ background:"#ef4444", color:"#fff", borderRadius:99, padding:"1px 7px", fontSize:11, fontWeight:700 }}>{n.badge}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding:"16px 20px", borderTop:"1px solid #ffffff15" }}>
        <div style={{ color:"#ffffff80", fontSize:12 }}>{admin?.name}</div>
        <div style={{ color:"#ffffff40", fontSize:11, marginBottom:10 }}>{admin?.role}</div>
        <button onClick={logout} style={{ background:"none", border:"1px solid #ffffff20", color:"#ffffff60", padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:13, width:"100%" }}>🚪 Logout</button>
      </div>
    </div>
  );
}

function Dashboard() {
  const api = useApi();
  const [stats, setStats] = useState(null); const [recent, setRecent] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([api.get("/admin/stats"), api.get("/admin/recent")]).then(([s,r])=>{ setStats(s.data); setRecent(r.data); setLoading(false); }); }, []);
  if (loading) return <Loader />;
  const cards = [
    { label:"Today's Orders", value:stats?.orders?.today, sub:`${stats?.orders?.pending} pending`, color:"#f97316" },
    { label:"Today's Bookings", value:stats?.bookings?.today, sub:`${stats?.bookings?.pending} pending`, color:"#3b82f6" },
    { label:"Menu Items", value:stats?.menu?.totalItems, sub:"active items", color:"#22c55e" },
    { label:"Month Revenue", value:`₹${(stats?.revenue?.thisMonth||0).toLocaleString()}`, sub:"delivered orders", color:"#8b5cf6" },
  ];
  return (
    <div>
      <h2 style={{ margin:"0 0 20px", fontSize:24, fontWeight:800 }}>Dashboard</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:32 }}>
        {cards.map(c=>(
          <div key={c.label} style={{ background:"#fff", borderRadius:16, padding:"20px 24px", boxShadow:"0 2px 12px #0001", borderLeft:`4px solid ${c.color}` }}>
            <div style={{ fontSize:26, fontWeight:800 }}>{c.value}</div>
            <div style={{ fontSize:14, color:"#666", fontWeight:600, marginTop:2 }}>{c.label}</div>
            <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div style={card}>
          <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700 }}>Recent Orders</h3>
          {recent?.recentOrders?.map(o=>(
            <div key={o._id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f3f4f6" }}>
              <div><div style={{ fontWeight:600, fontSize:14 }}>{o.orderNumber}</div><div style={{ fontSize:12, color:"#888" }}>{o.customer?.name}</div></div>
              <div style={{ textAlign:"right" }}><Badge status={o.status} /><div style={{ fontSize:12, color:"#888", marginTop:4 }}>₹{o.totalAmount}</div></div>
            </div>
          ))}
        </div>
        <div style={card}>
          <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700 }}>Recent Bookings</h3>
          {recent?.recentBookings?.map(b=>(
            <div key={b._id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f3f4f6" }}>
              <div><div style={{ fontWeight:600, fontSize:14 }}>{b.bookingNumber}</div><div style={{ fontSize:12, color:"#888" }}>{b.customer?.name} • {b.guests} guests</div></div>
              <div style={{ textAlign:"right" }}><Badge status={b.status} /><div style={{ fontSize:12, color:"#888", marginTop:4 }}>{new Date(b.date).toLocaleDateString()} {b.timeSlot}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersPage() {
  const api = useApi();
  const [orders, setOrders] = useState([]); const [filter, setFilter] = useState(""); const [loading, setLoading] = useState(true); const [selected, setSelected] = useState(null);
  const load = () => { setLoading(true); api.get(`/orders${filter?`?status=${filter}`:""}`).then(r=>{ setOrders(r.data||[]); setLoading(false); }); };
  useEffect(load, [filter]);
  const next = { pending:"confirmed", confirmed:"preparing", preparing:"ready", ready:"out_for_delivery", out_for_delivery:"delivered" };
  const updateStatus = async (id, status) => { await api.put(`/orders/${id}/status`, { status }); load(); };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:24, fontWeight:800 }}>Orders</h2>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["","pending","confirmed","preparing","delivered","cancelled"].map(s=><button key={s} onClick={()=>setFilter(s)} style={fb(filter===s)}>{s||"All"}</button>)}
          <button onClick={load} style={fb(false)}>🔄</button>
        </div>
      </div>
      {loading?<Loader/>:(
        <div style={card}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"2px solid #f3f4f6" }}>{["Order#","Customer","Type","Items","Amount","Status","Time","Action"].map(h=><th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:12, fontWeight:700, color:"#6b7280", textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>
              {orders.map(o=>(
                <tr key={o._id} style={{ borderBottom:"1px solid #f3f4f6", cursor:"pointer" }} onClick={()=>setSelected(o)}>
                  <td style={{ padding:"12px" }}><strong>{o.orderNumber}</strong></td>
                  <td style={{ padding:"12px" }}><div style={{ fontWeight:500 }}>{o.customer?.name}</div><div style={{ fontSize:12, color:"#888" }}>{o.customer?.phone}</div></td>
                  <td style={{ padding:"12px" }}><Badge status={o.orderType} /></td>
                  <td style={{ padding:"12px" }}>{o.items?.length} items</td>
                  <td style={{ padding:"12px" }}><strong>₹{o.totalAmount}</strong></td>
                  <td style={{ padding:"12px" }}><Badge status={o.status} /></td>
                  <td style={{ padding:"12px" }}><div style={{ fontSize:12, color:"#888" }}>{new Date(o.createdAt).toLocaleTimeString()}</div></td>
                  <td style={{ padding:"12px" }} onClick={e=>e.stopPropagation()}>
                    {next[o.status]&&<button onClick={()=>updateStatus(o._id,next[o.status])} style={sb("#22c55e")}>→ {next[o.status].replace(/_/g," ")}</button>}
                    {o.status==="pending"&&<button onClick={()=>updateStatus(o._id,"cancelled")} style={{ ...sb("#ef4444"), marginTop:4, display:"block" }}>Cancel</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length===0&&<div style={{ textAlign:"center", padding:40, color:"#888" }}>No orders found</div>}
        </div>
      )}
      {selected&&(
        <div style={mo} onClick={()=>setSelected(null)}>
          <div style={mb} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}><h3 style={{ margin:0 }}>Order {selected.orderNumber}</h3><button onClick={()=>setSelected(null)} style={cb}>✕</button></div>
            <div style={ib}><div style={{ fontWeight:600 }}>{selected.customer?.name}</div><div style={{ fontSize:13, color:"#888" }}>{selected.customer?.phone} • {selected.customer?.email}</div></div>
            <div style={ib}>
              {selected.items?.map((item,i)=><div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f3f4f6" }}><span>{item.name} × {item.quantity}</span><span style={{ fontWeight:600 }}>₹{item.price*item.quantity}</span></div>)}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0 0", fontWeight:700 }}><span>Total</span><span>₹{selected.totalAmount}</span></div>
            </div>
            <div style={{ marginTop:16 }}>
              <label style={ls}>Update Status</label>
              <select defaultValue={selected.status} onChange={async e=>{ await api.put(`/orders/${selected._id}/status`,{status:e.target.value}); load(); setSelected(null); }} style={is}>
                {["pending","confirmed","preparing","ready","out_for_delivery","delivered","cancelled"].map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingsPage() {
  const api = useApi();
  const [bookings, setBookings] = useState([]); const [filter, setFilter] = useState(""); const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); api.get(`/bookings${filter?`?status=${filter}`:""}`).then(r=>{ setBookings(r.data||[]); setLoading(false); }); };
  useEffect(load, [filter]);
  const upd = async (id, status) => { await api.put(`/bookings/${id}`, { status }); load(); };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:24, fontWeight:800 }}>Bookings</h2>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["","pending","confirmed","cancelled","completed"].map(s=><button key={s} onClick={()=>setFilter(s)} style={fb(filter===s)}>{s||"All"}</button>)}
          <button onClick={load} style={fb(false)}>🔄</button>
        </div>
      </div>
      {loading?<Loader/>:(
        <div style={card}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"2px solid #f3f4f6" }}>{["Booking#","Customer","Date & Time","Guests","Occasion","Status","Actions"].map(h=><th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:12, fontWeight:700, color:"#6b7280", textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>
              {bookings.map(b=>(
                <tr key={b._id} style={{ borderBottom:"1px solid #f3f4f6" }}>
                  <td style={{ padding:"12px" }}><strong>{b.bookingNumber}</strong></td>
                  <td style={{ padding:"12px" }}><div style={{ fontWeight:500 }}>{b.customer?.name}</div><div style={{ fontSize:12, color:"#888" }}>{b.customer?.phone}</div></td>
                  <td style={{ padding:"12px" }}><div style={{ fontWeight:500 }}>{new Date(b.date).toLocaleDateString()}</div><div style={{ fontSize:12, color:"#888" }}>{b.timeSlot}</div></td>
                  <td style={{ padding:"12px" }}>{b.guests} 👥</td>
                  <td style={{ padding:"12px" }}>{b.occasion||"—"}</td>
                  <td style={{ padding:"12px" }}><Badge status={b.status} /></td>
                  <td style={{ padding:"12px" }}>
                    {b.status==="pending"&&<><button onClick={()=>upd(b._id,"confirmed")} style={sb("#22c55e")}>Confirm</button> <button onClick={()=>upd(b._id,"cancelled")} style={sb("#ef4444")}>Cancel</button></>}
                    {b.status==="confirmed"&&<><button onClick={()=>upd(b._id,"completed")} style={sb("#3b82f6")}>Complete</button> <button onClick={()=>upd(b._id,"no_show")} style={sb("#6b7280")}>No Show</button></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length===0&&<div style={{ textAlign:"center", padding:40, color:"#888" }}>No bookings found</div>}
        </div>
      )}
    </div>
  );
}

function MenuPage() {
  const api = useApi();
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [editing, setEditing] = useState(null); const [showForm, setShowForm] = useState(false); const [filterCat, setFilterCat] = useState("");
  const cats = ["Starters","Main Course","Breads","Rice & Biryani","Desserts","Beverages","Specials"];
  const load = () => { setLoading(true); api.get("/menu/all").then(r=>{ setItems(r.data||[]); setLoading(false); }); };
  useEffect(load, []);
  const del = async (id) => { if (!confirm("Delete this item?")) return; await api.del(`/menu/${id}`); load(); };
  const toggle = async (item) => { await api.put(`/menu/${item._id}`, { isAvailable:!item.isAvailable }); load(); };
  const filtered = filterCat
