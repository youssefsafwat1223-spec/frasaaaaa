// =============== Navigation: Sidebars, Bottom Tabs, Page Navigator ===============

// All pages, grouped, for the Page Navigator overlay
const PAGE_GROUPS = [
  { title: "العامة", color: "gold", items: [
    ["landing","P1 الصفحة الرئيسية"],["register","P2 إنشاء حساب"],["login","P3 تسجيل الدخول"],
    ["otp","P4 التحقق OTP"],["forgot","P5 نسيت كلمة المرور"],["reset","P6 إعادة تعيين"],
  ]},
  { title: "إعداد الحساب", color: "green", items: [
    ["consent","P7 الموافقة"],["profile-setup","P8 الملف الشخصي"],
    ["q-overview","P9 نظرة على الاستبيان"],["q-question","P10 سؤال"],["q-category-done","P11 نهاية القسم"],["q-all-done","P12 نهاية الاستبيان"],
    ["face-intro","P13 تحليل الوجه"],["face-liveness","P14 التحقق من النشاط"],["face-capture","P15 التقاط الصورة"],["face-processing","P16 جاري التحليل"],["face-traits","P17 الصفات"],
    ["self-physical","P18 المظهر الذاتي"],["self-prefs","P19 التفضيلات"],["onboard-done","P20 جاهز"],
  ]},
  { title: "التطبيق", color: "gold", items: [
    ["dashboard","P21 الرئيسية"],["report","P22 التقرير الشخصي"],["matches","P23 التوافقات"],["match-detail","P24 تفاصيل التوافق"],
    ["req-sent","P25 الطلبات المرسلة"],["req-received","P26 الطلبات المستلمة"],["req-detail","P27 طلب مستلم"],
    ["chats","P28 المحادثات"],["chat-room","P29 محادثة"],["notifs","P30 الإشعارات"],
  ]},
  { title: "الاشتراك", color: "gold", items: [
    ["pricing","P31 الخطط"],["payment","P32 الدفع"],["sub-success","P33 تم الاشتراك"],["sub-expired","P34 انتهت"],["settings-sub","P35 إدارة الاشتراك"],
  ]},
  { title: "الإعدادات", color: "green", items: [
    ["settings","P36 الإعدادات"],["settings-edit","P37 تعديل الملف"],["settings-password","P38 كلمة المرور"],
    ["settings-privacy","P39 الخصوصية"],["settings-notifs","P40 الإشعارات"],["settings-account","P41 الحساب"],
  ]},
  { title: "لوحة الإدارة", color: "night", items: [
    ["admin-dashboard","P42 لوحة الإدارة"],["admin-users","P43 المستخدمون"],["admin-user-detail","P44 مستخدم"],
    ["admin-questions","P45 الأسئلة"],["admin-question-edit","P46 سؤال"],["admin-weights","P47 الأوزان"],
    ["admin-traits","P48 قواعد الصفات"],["admin-requests","P49 طابور الطلبات"],["admin-flags","P50 المحادثات المعلّمة"],
    ["admin-chat-view","P51 عرض محادثة"],["admin-reports","P52 البلاغات"],["admin-report-detail","P53 بلاغ"],
    ["admin-words","P54 كلمات محظورة"],["admin-icebreakers","P55 محفّزات الحوار"],["admin-tips","P56 نصائح المحادثة"],
    ["admin-settings","P57 إعدادات المنصة"],["admin-stats","P58 الإحصائيات"],["admin-ml","P59 ML"],
    ["admin-logs","P60 سجل النشاط"],["admin-plans","P61 خطط الاشتراك"],["admin-subs","P62 المشتركون"],["admin-revenue","P63 الإيرادات"],
  ]},
  { title: "الأخطاء", color: "rose", items: [
    ["404","P64 404"],["403","P65 403"],["500","P66 500"],["session","P67 انتهت الجلسة"],["maintenance","P68 صيانة"],
  ]},
];
const ALL_PAGES = PAGE_GROUPS.flatMap(g => g.items.map(([id]) => id));

// ----- Page Navigator (always visible demo helper) -----
const PageNavigator = ({ current, onGo, dark, onToggleDark, onToggleUserType, userType }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const idx = ALL_PAGES.indexOf(current);
  const next = ALL_PAGES[(idx+1) % ALL_PAGES.length];
  const prev = ALL_PAGES[(idx-1+ALL_PAGES.length) % ALL_PAGES.length];
  return (
    <>
      <div className="fixed z-40 bottom-4 left-4 flex items-center gap-2">
        <div className="flex items-center bg-night dark:bg-night-2 text-fog rounded-full shadow-card border border-edge overflow-hidden">
          <button title="السابق" onClick={() => onGo(prev)} className="p-2.5 hover:bg-night-2"><Icon name="chevronRight" size={16}/></button>
          <button onClick={() => setOpen(true)} className="px-3 py-2 text-[12px] tracking-wider numerals flex items-center gap-2 hover:bg-night-2">
            <Icon name="grid" size={14}/> <span>صفحة {idx+1}/68</span>
          </button>
          <button title="التالي" onClick={() => onGo(next)} className="p-2.5 hover:bg-night-2"><Icon name="chevronLeft" size={16}/></button>
        </div>
        <button onClick={onToggleDark} title="الوضع الداكن" className="p-2.5 bg-night dark:bg-night-2 text-fog rounded-full shadow-card border border-edge hover:bg-night-2">
          <Icon name={dark ? "sun" : "moon"} size={16}/>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex fade-in">
          <div className="absolute inset-0 bg-night/60 backdrop-blur-sm" onClick={() => setOpen(false)}/>
          <div className="relative ml-auto h-full w-full sm:w-[420px] bg-paper-card dark:bg-night-2 border-l border-line dark:border-edge overflow-y-auto nice-scroll slide-in">
            <div className="sticky top-0 bg-paper-card dark:bg-night-2 border-b border-line dark:border-edge p-4 z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="font-display text-lg">كل الصفحات (68)</div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-paper-2 dark:hover:bg-night-3"><Icon name="x"/></button>
              </div>
              <div className="flex items-center gap-2 bg-paper-2 dark:bg-night-3 rounded-xl px-3.5 py-2.5">
                <Icon name="search" size={16} className="text-ink-3"/>
                <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث عن صفحة…" className="flex-1 bg-transparent outline-none text-[14px]"/>
              </div>
              <div className="flex items-center gap-2 mt-3 text-[12px]">
                <span className="text-ink-3">نوع المستخدم:</span>
                {["guest","user","subscribed","admin"].map(u => (
                  <button key={u} onClick={() => onToggleUserType(u)} className={`px-2.5 py-1 rounded-full border ${userType===u ? "bg-gold text-white border-gold" : "border-line dark:border-edge text-ink-2 dark:text-fog-2"}`}>{u}</button>
                ))}
              </div>
            </div>
            <div className="p-4 space-y-5">
              {PAGE_GROUPS.map(group => {
                const items = group.items.filter(([id,label]) => !q || label.includes(q) || id.includes(q));
                if (!items.length) return null;
                return (
                  <div key={group.title}>
                    <div className="text-[11px] font-medium tracking-wider text-ink-3 uppercase mb-2">{group.title}</div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {items.map(([id,label]) => (
                        <button key={id} onClick={() => { onGo(id); setOpen(false); }} className={`text-right px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between ${current===id ? "bg-gold/10 border-gold text-gold" : "border-line dark:border-edge hover:bg-paper-2 dark:hover:bg-night-3"}`}>
                          <span className="text-[14px]">{label}</span>
                          {current === id && <Icon name="check" size={14}/>}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ----- Bottom tabs (mobile user app) -----
const BottomTabs = ({ current, onGo }) => {
  const tabs = [
    { id: "dashboard", label: "الرئيسية", icon: "home" },
    { id: "matches",   label: "التوافقات", icon: "heart" },
    { id: "req-received", label: "الطلبات", icon: "inbox" },
    { id: "chats",     label: "المحادثات", icon: "chat" },
    { id: "settings",  label: "حسابي", icon: "user" },
  ];
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper-card/90 dark:bg-night-2/90 backdrop-blur-md border-t border-line dark:border-edge pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around px-2 pt-2 pb-2">
        {tabs.map(t => {
          const active = t.id === current || (t.id==="req-received" && current==="req-sent") || (t.id==="settings" && current.startsWith("settings"));
          return (
            <button key={t.id} onClick={() => onGo(t.id)} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${active ? "text-gold" : "text-ink-2 dark:text-fog-2"}`}>
              <Icon name={t.icon} size={22} stroke={active ? 2 : 1.6}/>
              <span className="text-[10.5px] font-medium">{t.label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-gold"/>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ----- Desktop sidebar (user app, RTL = right) -----
const UserSidebar = ({ current, onGo, user }) => {
  const items = [
    { id: "dashboard", label: "الرئيسية", icon: "home" },
    { id: "matches", label: "التوافقات", icon: "heart" },
    { id: "req-received", label: "الطلبات", icon: "inbox" },
    { id: "chats", label: "المحادثات", icon: "chat" },
    { id: "report", label: "تقريري", icon: "activity" },
    { id: "notifs", label: "الإشعارات", icon: "bell" },
    { id: "settings", label: "الإعدادات", icon: "settings" },
  ];
  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-l border-line dark:border-edge bg-paper-card dark:bg-night-2 h-screen sticky top-0">
      <div className="p-5 border-b border-line dark:border-edge"><Logo/></div>
      <div className="p-3 flex-1">
        <nav className="space-y-1">
          {items.map(it => {
            const active = it.id === current || (it.id==="settings" && current.startsWith("settings"));
            return (
              <button key={it.id} onClick={() => onGo(it.id)} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[14.5px] transition-all ${active ? "bg-gold/10 text-gold" : "text-ink dark:text-fog hover:bg-paper-2 dark:hover:bg-night-3"}`}>
                <Icon name={it.icon} size={18}/>
                <span>{it.label}</span>
                {active && <span className="ms-auto w-1.5 h-1.5 rounded-full bg-gold"/>}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-3 border-t border-line dark:border-edge flex items-center gap-3">
        <ProfileAvatar name={user?.name||"أحمد محمود"} size={40}/>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] truncate">{user?.name||"أحمد محمود"}</div>
          <div className="text-[12px] text-ink-2 dark:text-fog-2 truncate">{user?.email||"ahmed@tawafuq.app"}</div>
        </div>
        <button onClick={() => onGo("login")} className="p-2 rounded-lg hover:bg-paper-2 dark:hover:bg-night-3 text-ink-3"><Icon name="logout" size={18}/></button>
      </div>
    </aside>
  );
};

// ----- App header (mobile) -----
const AppHeader = ({ title, right, onBack, sub }) => (
  <header className="sticky top-0 z-20 bg-paper/90 dark:bg-night/90 backdrop-blur-md border-b border-line dark:border-edge">
    <div className="flex items-center gap-3 px-4 h-14">
      {onBack && <button onClick={onBack} className="p-1.5 -mr-1.5 rounded-lg hover:bg-paper-2 dark:hover:bg-night-3"><Icon name="chevronRight"/></button>}
      <div className="flex-1 min-w-0">
        <div className="font-display text-[17px] truncate">{title}</div>
        {sub && <div className="text-[12px] text-ink-2 dark:text-fog-2 truncate">{sub}</div>}
      </div>
      {right}
    </div>
  </header>
);

// ----- Admin sidebar -----
const AdminSidebar = ({ current, onGo }) => {
  const sections = [
    { title: "نظرة عامة", items: [
      ["admin-dashboard", "لوحة الإدارة", "grid"],
      ["admin-stats", "الإحصائيات", "barChart"],
      ["admin-ml", "ذكاء اصطناعي", "sparkles"],
    ]},
    { title: "المستخدمون", items: [
      ["admin-users", "المستخدمون", "users"],
      ["admin-requests", "طلبات التواصل", "inbox"],
    ]},
    { title: "المحتوى", items: [
      ["admin-questions", "الأسئلة", "list"],
      ["admin-weights", "أوزان المطابقة", "layers"],
      ["admin-traits", "قواعد الصفات", "wand"],
      ["admin-icebreakers", "محفّزات الحوار", "chat"],
      ["admin-tips", "نصائح المحادثة", "info"],
    ]},
    { title: "الأمان", items: [
      ["admin-flags", "محادثات معلّمة", "flag"],
      ["admin-reports", "البلاغات", "alert"],
      ["admin-words", "كلمات محظورة", "shield"],
    ]},
    { title: "الاشتراكات", items: [
      ["admin-plans", "الخطط", "diamond"],
      ["admin-subs", "المشتركون", "users"],
      ["admin-revenue", "الإيرادات", "coin"],
    ]},
    { title: "النظام", items: [
      ["admin-settings", "إعدادات المنصة", "settings"],
      ["admin-logs", "سجل النشاط", "clock"],
    ]},
  ];
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-l border-line dark:border-edge bg-paper-card dark:bg-night-2 h-screen sticky top-0 overflow-y-auto nice-scroll">
      <div className="p-5 border-b border-line dark:border-edge flex items-center justify-between">
        <Logo/>
        <Badge tone="dark">إدارة</Badge>
      </div>
      <div className="flex-1 p-3 space-y-5">
        {sections.map(sec => (
          <div key={sec.title}>
            <div className="text-[10.5px] font-medium tracking-wider text-ink-3 uppercase px-2 mb-1.5">{sec.title}</div>
            {sec.items.map(([id, label, icon]) => {
              const active = current === id;
              return (
                <button key={id} onClick={() => onGo(id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] transition-all ${active ? "bg-gold/10 text-gold" : "text-ink dark:text-fog hover:bg-paper-2 dark:hover:bg-night-3"}`}>
                  <Icon name={icon} size={16}/>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-line dark:border-edge flex items-center gap-3">
        <ProfileAvatar name="إدارة" size={36} tone="night"/>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] truncate">عمر فؤاد</div>
          <div className="text-[11px] text-ink-2 dark:text-fog-2 truncate">Super Admin</div>
        </div>
        <button onClick={() => onGo("login")} className="p-2 rounded-lg hover:bg-paper-2 dark:hover:bg-night-3 text-ink-3"><Icon name="logout" size={16}/></button>
      </div>
    </aside>
  );
};

// ----- Admin top bar -----
const AdminTopBar = ({ title, sub, right }) => (
  <div className="flex items-center justify-between gap-4 px-6 lg:px-8 py-5 border-b border-line dark:border-edge bg-paper dark:bg-night sticky top-0 z-10">
    <div>
      <h1 className="font-display text-2xl">{title}</h1>
      {sub && <p className="text-ink-2 dark:text-fog-2 text-sm mt-0.5">{sub}</p>}
    </div>
    <div className="flex items-center gap-2">
      {right}
      <button className="p-2.5 rounded-xl border border-line dark:border-edge hover:bg-paper-2 dark:hover:bg-night-3"><Icon name="bell" size={18}/></button>
    </div>
  </div>
);

// ----- Page wrapper: phone-frame on desktop, full on mobile -----
const PhoneFrame = ({ children, dark }) => (
  <div className="min-h-screen flex items-center justify-center p-0 sm:p-6">
    <div className="phone-shell relative bg-paper dark:bg-night" style={{ height: 844 }}>
      <div className="absolute top-0 inset-x-0 h-7 flex items-center justify-between px-7 text-[12px] z-50 pointer-events-none">
        <span className="font-medium">9:41</span>
        <span className="w-20 h-5 bg-night rounded-full"/>
        <span className="flex items-center gap-1"><Icon name="activity" size={12}/></span>
      </div>
      <div className="absolute inset-0 pt-7 overflow-y-auto nice-scroll">{children}</div>
    </div>
  </div>
);

window.NAV = { PAGE_GROUPS, ALL_PAGES, PageNavigator, BottomTabs, UserSidebar, AppHeader, AdminSidebar, AdminTopBar, PhoneFrame };
Object.assign(window, window.NAV);
