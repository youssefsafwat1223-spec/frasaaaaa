// =============== Shared UI Components ===============
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---- Button primitives ----
const GoldButton = ({ children, onClick, disabled, size = "md", className = "", icon, iconLeft, type="button", as: As="button", ...rest }) => {
  const sizes = { sm: "px-4 py-2 text-sm", md: "px-5 py-3 text-[15px]", lg: "px-6 py-3.5 text-base" };
  return (
    <As type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gold text-white font-medium tracking-wide transition-all duration-300 hover:bg-[#a48652] active:scale-[.98] disabled:bg-line disabled:text-ink-3 disabled:cursor-not-allowed shadow-[0_8px_24px_-12px_rgba(184,151,90,.55)] ${sizes[size]} ${className}`}
      {...rest}>
      {iconLeft}
      <span>{children}</span>
      {icon}
    </As>
  );
};
const OutlineButton = ({ children, onClick, size="md", className="", icon, iconLeft, ...rest }) => {
  const sizes = { sm: "px-4 py-2 text-sm", md: "px-5 py-3 text-[15px]", lg: "px-6 py-3.5 text-base" };
  return (
    <button onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-line dark:border-edge text-ink dark:text-fog font-medium transition-all hover:bg-paper-2 dark:hover:bg-night-2 ${sizes[size]} ${className}`}
      {...rest}>
      {iconLeft}<span>{children}</span>{icon}
    </button>
  );
};
const GhostButton = ({ children, onClick, className="", ...rest }) => (
  <button onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-xl text-ink-2 dark:text-fog-2 font-medium hover:text-gold transition-all px-3 py-2 ${className}`} {...rest}>{children}</button>
);
const GreenButton = ({ children, onClick, size="md", className="", icon, ...rest }) => {
  const sizes = { sm: "px-4 py-2 text-sm", md: "px-5 py-3 text-[15px]", lg: "px-6 py-3.5 text-base" };
  return <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl bg-green text-white font-medium hover:bg-green-light active:scale-[.98] shadow-[0_8px_24px_-12px_rgba(44,95,74,.55)] transition-all ${sizes[size]} ${className}`} {...rest}>{children}{icon}</button>;
};

// ---- Card ----
const Card = ({ children, className = "", padded = true, ...rest }) => (
  <div className={`bg-paper-card dark:bg-night-2 border border-line dark:border-edge rounded-2xl ${padded ? "p-5" : ""} ${className}`} {...rest}>{children}</div>
);

// ---- Badge / Pill ----
const Badge = ({ children, tone="neutral", className="" }) => {
  const tones = {
    neutral: "bg-paper-2 dark:bg-night-3 text-ink-2 dark:text-fog-2 border border-line dark:border-edge",
    gold: "bg-[#FBF6E9] dark:bg-[#332a17] text-[#7d6224] dark:text-gold-light border border-[#E8D8AE] dark:border-[#5a4720]",
    green: "bg-[#E7F2EC] dark:bg-[#16302a] text-green dark:text-[#9bd2b8] border border-[#C6E0CF] dark:border-[#2a4f3f]",
    amber: "bg-amber-soft dark:bg-[#3a2d12] text-amber dark:text-[#e4b266] border border-[#EAD9B6] dark:border-[#5b4720]",
    rose:  "bg-rose-soft dark:bg-[#3a1f1f] text-rose dark:text-[#e89090] border border-[#E8C5C0] dark:border-[#5a2f2f]",
    blue:  "bg-[#E8EEF5] dark:bg-[#1a253a] text-[#2e548a] dark:text-[#8fb1e3] border border-[#CFDBEC] dark:border-[#2f3f5a]",
    dark:  "bg-night text-fog border border-edge",
  };
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${tones[tone]} ${className}`}>{children}</span>;
};

// ---- Status Badge ----
const StatusBadge = ({ status }) => {
  const map = {
    pending:  { label: "قيد المراجعة", tone: "amber" },
    waiting:  { label: "في انتظار الرد", tone: "blue"  },
    accepted: { label: "تم القبول",     tone: "green"  },
    rejected: { label: "اعتذر",          tone: "neutral"},
    expired:  { label: "انتهت المدة",    tone: "neutral"},
    active:   { label: "مفعل",           tone: "green"  },
    blocked:  { label: "محظور",          tone: "rose"   },
    warned:   { label: "تحذير",          tone: "amber"  },
  };
  const s = map[status] || { label: status, tone: "neutral" };
  return <Badge tone={s.tone}>{s.label}</Badge>;
};

// ---- Progress Bar ----
const ProgressBar = ({ value = 0, max = 100, height=6, className="" }) => (
  <div className={`w-full bg-line dark:bg-edge rounded-full overflow-hidden ${className}`} style={{ height }}>
    <div className="h-full bg-gold rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (value/max)*100)}%` }} />
  </div>
);

// ---- Score Ring ----
const ScoreRing = ({ value = 0, size = 120, stroke = 8, color = "#B8975A", trackColor, label, sublabel, className="" }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke={trackColor || "currentColor"} className={trackColor ? "" : "text-line dark:text-edge"} strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-serif-en text-2xl leading-none" style={{ fontSize: size * 0.26 }}>{label ?? <>{Math.round(value)}<span className="text-[0.55em] align-top">%</span></>}</div>
        {sublabel && <div className="text-[11px] mt-1 text-ink-2 dark:text-fog-2">{sublabel}</div>}
      </div>
    </div>
  );
};

// ---- Profile Avatar ----
const ProfileAvatar = ({ name = "م", size = 48, src, online, anonymous, className = "", tone="gold" }) => {
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("");
  const tones = {
    gold: "bg-gradient-to-br from-[#E7D9B8] to-[#B8975A] text-white",
    green: "bg-gradient-to-br from-[#A7CFBA] to-[#2C5F4A] text-white",
    stone: "bg-gradient-to-br from-[#E8E4DC] to-[#9B9B9B] text-white",
    night: "bg-gradient-to-br from-[#2A2825] to-[#0F0F0E] text-fog",
  };
  return (
    <div className={`relative inline-flex items-center justify-center rounded-full overflow-hidden ring-1 ring-line dark:ring-edge ${tones[tone]} ${className}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {anonymous ? <Icon name="user" size={size*0.55}/> : src ? <img src={src} alt="" className="w-full h-full object-cover"/> : <span className="font-display font-medium">{initials}</span>}
      {online && <span className="absolute bottom-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-green ring-2 ring-paper-card dark:ring-night-2"/>}
    </div>
  );
};

// ---- Modal ----
const Modal = ({ open, onClose, title, children, footer, size = "md" }) => {
  if (!open) return null;
  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 fade-in">
      <div className="absolute inset-0 bg-night/40 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative bg-paper-card dark:bg-night-2 w-full ${widths[size]} rounded-t-3xl sm:rounded-2xl shadow-card border border-line dark:border-edge slide-in`}>
        <div className="flex items-center justify-between p-5 border-b border-line dark:border-edge">
          <h3 className="font-display text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-paper-2 dark:hover:bg-night-3"><Icon name="x"/></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="p-5 pt-0 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

// ---- Toast ----
const Toast = ({ message, tone="green", show }) => {
  if (!show) return null;
  const tones = {
    green: "bg-green text-white",
    gold:  "bg-gold text-white",
    rose:  "bg-rose text-white",
  };
  return <div className={`fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-card slide-in ${tones[tone]}`}>{message}</div>;
};

// ---- Inputs ----
const TextField = ({ label, hint, error, icon, type="text", className="", ...rest }) => (
  <label className={`block ${className}`}>
    {label && <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-1.5">{label}</div>}
    <div className={`flex items-center gap-2 bg-paper-card dark:bg-night-3 border ${error ? "border-rose" : "border-line dark:border-edge"} focus-within:border-gold rounded-xl px-3.5 transition-colors`}>
      {icon && <span className="text-ink-3">{icon}</span>}
      <input type={type} className="flex-1 bg-transparent py-3 outline-none text-[15px] placeholder:text-ink-3 dark:placeholder:text-fog-2/60" {...rest}/>
    </div>
    {hint && !error && <div className="text-[12px] text-ink-3 mt-1.5">{hint}</div>}
    {error && <div className="text-[12px] text-rose mt-1.5">{error}</div>}
  </label>
);

const TextArea = ({ label, maxLength, value, onChange, ...rest }) => (
  <label className="block">
    {label && <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-1.5 flex items-center justify-between"><span>{label}</span>{maxLength && <span className="text-ink-3 text-[11px] numerals">{(value||"").length}/{maxLength}</span>}</div>}
    <textarea value={value} onChange={onChange} maxLength={maxLength} rows={4} className="w-full bg-paper-card dark:bg-night-3 border border-line dark:border-edge focus:border-gold rounded-xl px-3.5 py-3 outline-none text-[15px] resize-none placeholder:text-ink-3" {...rest}/>
  </label>
);

const Select = ({ label, options=[], value, onChange, placeholder, ...rest }) => (
  <label className="block">
    {label && <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-1.5">{label}</div>}
    <div className="relative">
      <select value={value} onChange={onChange} className="w-full appearance-none bg-paper-card dark:bg-night-3 border border-line dark:border-edge focus:border-gold rounded-xl px-3.5 py-3 outline-none text-[15px] pl-9" {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={typeof o==="string"?o:o.value} value={typeof o==="string"?o:o.value}>{typeof o==="string"?o:o.label}</option>)}
      </select>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"><Icon name="chevronDown" size={16}/></span>
    </div>
  </label>
);

const Checkbox = ({ checked, onChange, label, sub }) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <button type="button" onClick={() => onChange(!checked)} className={`check mt-0.5 ${checked ? "on" : ""}`}>
      {checked && <Icon name="check" size={14} stroke={2.6} className="text-white"/>}
    </button>
    <div className="flex-1">
      <div className="text-[15px]">{label}</div>
      {sub && <div className="text-[13px] text-ink-2 dark:text-fog-2 mt-0.5 leading-relaxed">{sub}</div>}
    </div>
  </label>
);

const Toggle = ({ checked, onChange, size="md" }) => {
  const w = size === "sm" ? 36 : 44, h = size === "sm" ? 20 : 24, d = size === "sm" ? 16 : 20;
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative rounded-full transition-colors ${checked ? "bg-gold" : "bg-line dark:bg-edge"}`}
      style={{ width: w, height: h }}>
      <span className="absolute top-0.5 bg-white rounded-full transition-all shadow-sm" style={{ width: d, height: d, [checked ? "right" : "left"]: 2 }}/>
    </button>
  );
};

const RadioCard = ({ checked, onClick, children, className="" }) => (
  <button onClick={onClick} className={`w-full text-right p-4 rounded-2xl border-2 transition-all ${checked ? "border-gold bg-[#FBF6E9] dark:bg-[#2a2417]" : "border-line dark:border-edge hover:border-gold/40 bg-paper-card dark:bg-night-2"} ${className}`}>
    <div className="flex items-center gap-3">
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${checked ? "border-gold" : "border-line dark:border-edge"}`}>
        {checked && <span className="w-2.5 h-2.5 rounded-full bg-gold"/>}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  </button>
);

// ---- Empty state ----
const EmptyState = ({ icon = "inbox", title, sub, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="w-20 h-20 rounded-full bg-paper-2 dark:bg-night-3 flex items-center justify-center text-ink-3 mb-5"><Icon name={icon} size={32}/></div>
    <div className="font-display text-lg mb-1">{title}</div>
    {sub && <div className="text-ink-2 dark:text-fog-2 text-sm max-w-xs">{sub}</div>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// ---- Mini logo / wordmark ----
const Logo = ({ size = 24, withWord = true, dark }) => (
  <div className="inline-flex items-center gap-2.5">
    <svg width={size*1.2} height={size*1.2} viewBox="0 0 40 40" className="text-gold">
      <path d="M8 30c5-1 8-5 12-15 4 10 7 14 12 15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 15v15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="20" cy="11" r="2.4" fill="currentColor"/>
    </svg>
    {withWord && <div className="leading-none">
      <div className={`font-display text-[18px] tracking-wide ${dark ? "text-fog" : "text-ink dark:text-fog"}`}>تَوَافُق</div>
      <div className={`text-[10px] tracking-[0.2em] mt-0.5 ${dark ? "text-fog-2" : "text-ink-3"}`}>TAWAFUQ</div>
    </div>}
  </div>
);

// ---- Section heading helper ----
const SectionHead = ({ title, sub, action }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <h2 className="font-display text-xl">{title}</h2>
      {sub && <p className="text-ink-2 dark:text-fog-2 text-sm mt-1">{sub}</p>}
    </div>
    {action}
  </div>
);

// Avatar placeholder gradient by seed
const avatarTones = ["gold","green","stone","night"];
const toneFor = (seed=0) => avatarTones[seed % avatarTones.length];

// Persisted Egyptian sample data
const sampleNames = ["أحمد محمود", "فاطمة سالم", "يوسف عمر", "نور الهدى", "هند علي", "كريم حسن", "سارة عبدالله", "محمود طارق", "ليلى يوسف", "زياد خالد"];
const sampleCities = ["القاهرة","الإسكندرية","الجيزة","المنصورة","أسيوط","طنطا","الزقازيق","المنيا","شرم الشيخ"];
const personalityTypes = ["عقلاني اجتماعي","عاطفي هادئ","مثالي مرن","عملي منظم"];

const buildMatch = (i, opts={}) => ({
  id: `m-${i}`,
  name: sampleNames[i % sampleNames.length],
  city: sampleCities[i % sampleCities.length],
  age: 24 + (i*3) % 14,
  score: 95 - (i * 4) % 27,
  type: i % 2 === 0 ? "متشابه" : "متكامل",
  reasons: [
    "اهتمام مشترك بالقراءة والمعرفة",
    "نظرة متقاربة حول العائلة",
    "نمط حياة متوافق",
  ],
  personality: personalityTypes[i % personalityTypes.length],
  anonymous: opts.anonymous ?? (i % 3 === 0),
  tone: avatarTones[i % avatarTones.length],
});

window.UI = {
  GoldButton, OutlineButton, GhostButton, GreenButton, Card, Badge, StatusBadge, ProgressBar, ScoreRing,
  ProfileAvatar, Modal, Toast, TextField, TextArea, Select, Checkbox, Toggle, RadioCard, EmptyState, Logo, SectionHead,
  sampleNames, sampleCities, personalityTypes, buildMatch, toneFor,
};
Object.assign(window, window.UI);
