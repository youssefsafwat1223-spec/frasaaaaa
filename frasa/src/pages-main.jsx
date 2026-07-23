// =============== Main App Pages: P21-P30 ===============

// Reusable layout for the main app: sidebar on desktop, header+bottom-tabs on mobile.
const AppLayout = ({ go, current, title, sub, headerRight, children, hideBottomNav, user, fullBleed }) => (
  <div className="min-h-screen bg-paper dark:bg-night flex flex-col lg:flex-row">
    <UserSidebar current={current} onGo={go} user={user}/>
    <main className="flex-1 min-w-0 flex flex-col">
      <div className="lg:hidden"><AppHeader title={title} sub={sub} right={headerRight}/></div>
      <div className={`hidden lg:block px-8 py-6 border-b border-line dark:border-edge sticky top-0 bg-paper/90 dark:bg-night/90 backdrop-blur-md z-10`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl">{title}</h1>
            {sub && <p className="text-ink-2 dark:text-fog-2 text-sm mt-1">{sub}</p>}
          </div>
          <div className="flex items-center gap-2">{headerRight}</div>
        </div>
      </div>
      <div className={`flex-1 ${fullBleed ? "" : "px-4 lg:px-8 py-5 lg:py-7 pb-28 lg:pb-10"}`}>{children}</div>
      {!hideBottomNav && <BottomTabs current={current} onGo={go}/>}
    </main>
  </div>
);

// ---- P21: Dashboard ----
const PageDashboard = ({ go, subscribed }) => {
  return (
    <AppLayout go={go} current="dashboard" title="مرحباً، أحمد 👋" sub="إليك ملخص اليوم"
      headerRight={<button onClick={()=>go("notifs")} className="relative p-2.5 rounded-xl border border-line dark:border-edge"><Icon name="bell" size={18}/><span className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-gold"/></button>}>
      <div className="space-y-5 lg:space-y-6 max-w-5xl">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "توافقات", value: 12, icon: "heart", tone: "gold" },
            { label: "طلبات", value: 3, icon: "inbox", tone: "green" },
            { label: "رسائل", value: 5, icon: "chat", tone: "amber" },
          ].map(s => (
            <Card key={s.label} className="!p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.tone==="gold"?"bg-gold/10 text-gold":s.tone==="green"?"bg-green/10 text-green":"bg-amber-soft text-amber"}`}><Icon name={s.icon} size={18}/></div>
              <div className="font-serif-en text-2xl numerals">{s.value}</div>
              <div className="text-[12px] text-ink-2 dark:text-fog-2">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Personal report card */}
        <Card className="relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-gold/10 blur-2xl"/>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <ScoreRing value={84} size={108} stroke={8} sublabel="جاهزية الزواج"/>
            <div className="flex-1">
              <Badge tone="gold">تقريرك الشخصي</Badge>
              <div className="font-display text-2xl mt-2">عقلاني اجتماعي</div>
              <p className="text-ink-2 dark:text-fog-2 text-[14px] mt-1.5 leading-loose">شخصية متوازنة بين المنطق والعاطفة، تنجذب للحوار العميق والاستقرار العملي.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {["استقرار","عائلة","نمو","تواصل صريح"].map(t => <Badge key={t} tone="neutral">{t}</Badge>)}
              </div>
            </div>
            <OutlineButton onClick={()=>go("report")} icon={<Icon name="arrowLeft" size={14}/>}>عرض التقرير</OutlineButton>
          </div>
        </Card>

        {/* Latest matches */}
        <div>
          <SectionHead title="آخر التوافقات" sub={subscribed ? "نسب التوافق محدّثة الآن" : "اشترك لتشاهد من وافقوا معك"} action={<button onClick={()=>go("matches")} className="text-[13px] text-gold inline-flex items-center gap-1">عرض الكل <Icon name="arrowLeft" size={14}/></button>}/>
          <div className="grid sm:grid-cols-3 gap-3">
            {[0,1,2].map(i => {
              const m = buildMatch(i, {anonymous: !subscribed});
              const locked = !subscribed;
              return (
                <Card key={i} className={`!p-4 relative ${locked?"overflow-hidden":""}`}>
                  {locked && <div className="absolute inset-0 backdrop-blur-md bg-paper-card/60 dark:bg-night-2/60 flex flex-col items-center justify-center gap-2 z-10 rounded-2xl">
                    <Icon name="lock" size={22} className="text-gold"/>
                    <button onClick={()=>go("pricing")} className="text-[12px] text-gold underline">اشترك للعرض</button>
                  </div>}
                  <div className="flex items-center gap-3">
                    <ProfileAvatar name={m.name} anonymous={m.anonymous} size={48} tone={m.tone}/>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{m.anonymous ? "مستخدم مجهول" : m.name}</div>
                      <div className="text-[12px] text-ink-3">{m.age} • {m.city}</div>
                    </div>
                    <div className="font-serif-en text-gold text-xl numerals">{m.score}<span className="text-[11px]">٪</span></div>
                  </div>
                  <div className="mt-3 text-[12.5px] text-ink-2 dark:text-fog-2 line-clamp-1">{m.reasons[0]}</div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Profile completion / banner */}
        <Card className="bg-gradient-to-l from-[#FBF6E9] to-transparent dark:from-[#332a17] dark:to-night-2 border-gold/30">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold flex items-center justify-center"><Icon name="sparkles" size={22}/></div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[16px]">اكتمل ملفك بنسبة <span className="text-gold font-serif-en">٨٤٪</span></div>
              <ProgressBar value={84} className="mt-2"/>
              <div className="text-[12.5px] text-ink-2 dark:text-fog-2 mt-2">أضف صورة ملف لزيادة فرص التوافق إلى ٩٢٪.</div>
            </div>
            <OutlineButton size="sm" onClick={()=>go("settings-edit")}>إكمال الملف</OutlineButton>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

// ---- P22: Personal Report ----
const PageReport = ({ go }) => {
  const cats = [
    { name: "القيم والدين", value: 78, icon: "mosque" },
    { name: "الشخصية", value: 65, icon: "smile" },
    { name: "نمط الحياة", value: 82, icon: "leaf" },
    { name: "توقعات الزواج", value: 71, icon: "diamond" },
  ];
  return (
    <AppLayout go={go} current="report" title="تقريرك الشخصي" sub="تحليل عميق لشخصيتك وقيمك"
      headerRight={<OutlineButton size="sm" icon={<Icon name="share" size={14}/>}>شارك</OutlineButton>}>
      <div className="space-y-5 max-w-4xl">
        <Card>
          <div className="flex items-center gap-4">
            <ProfileAvatar name="أحمد محمود" size={72}/>
            <div className="flex-1">
              <div className="font-display text-xl">أحمد محمود</div>
              <div className="text-[13px] text-ink-2 dark:text-fog-2">القاهرة • ٢٨ سنة • مهندس برمجيات</div>
              <Badge tone="gold" className="mt-2">عقلاني اجتماعي</Badge>
            </div>
            <div className="hidden sm:block text-[12px] text-ink-3 text-left">
              <div>أنشئ في</div>
              <div className="numerals">٢٠ مايو ٢٠٢٦</div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <div className="font-display text-lg mb-4">النسب التفصيلية</div>
            <div className="space-y-4">
              {cats.map(c => (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-[14px]"><Icon name={c.icon} size={16} className="text-gold"/> {c.name}</span>
                    <span className="font-serif-en text-gold numerals">{c.value}٪</span>
                  </div>
                  <ProgressBar value={c.value}/>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-line dark:border-edge">
              <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-2.5">القيم الغالبة</div>
              <div className="flex flex-wrap gap-2">
                {["الاستقرار","العائلة","الصراحة","النمو الذاتي","الاحترام","الصبر"].map(t => <Badge key={t} tone="gold">{t}</Badge>)}
              </div>
            </div>
          </Card>

          <Card className="text-center">
            <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-2">جاهزية الزواج</div>
            <ScoreRing value={84} size={150} stroke={10}/>
            <div className="text-[12.5px] text-ink-2 dark:text-fog-2 mt-3 leading-loose">جاهزية مرتفعة — وضوح في القيم والتوقعات.</div>
          </Card>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Card>
            <div className="font-display text-lg mb-3 flex items-center gap-2"><Icon name="checkCircle" size={18} className="text-green"/> نقاط قوتك</div>
            <ul className="space-y-2.5 text-[14px]">
              {["تواصل صريح ومباشر","استقرار عاطفي عالٍ","قدرة على حل الخلاف بهدوء","التزام بالقيم العائلية"].map(t => (
                <li key={t} className="flex items-start gap-2"><Icon name="check" size={16} className="text-green mt-0.5 shrink-0"/> <span>{t}</span></li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="font-display text-lg mb-3 flex items-center gap-2"><Icon name="sparkles" size={18} className="text-amber"/> فرص للنمو</div>
            <ul className="space-y-2.5 text-[14px]">
              {["العمل على المرونة في التغيير","التعبير عن العواطف بشكل أوضح","تخصيص وقت للترفيه والاهتمامات"].map(t => (
                <li key={t} className="flex items-start gap-2"><Icon name="arrowLeft" size={14} className="text-amber mt-1 shrink-0"/> <span>{t}</span></li>
              ))}
            </ul>
          </Card>
        </div>

        <Card>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold flex items-center justify-center shrink-0"><Icon name="sparkles" size={26}/></div>
            <div className="flex-1">
              <div className="font-display text-lg mb-1">انطباع الملامح</div>
              <div className="text-[13.5px] text-ink-2 dark:text-fog-2 leading-loose">صفاتك المرئية الغالبة: اجتماعي ودود، هادئ متأن. هذه السمات تتوافق مع شريكٍ متعاطف ومنفتح.</div>
              <div className="flex flex-wrap gap-2 mt-3">
                {["اجتماعي ودود","هادئ","عملي"].map(t => <Badge key={t} tone="green">{t}</Badge>)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

// ---- P23: Matches List ----
const PageMatches = ({ go, subscribed, setUserType }) => {
  const [tab, setTab] = useState("all");
  const tabs = [["all","الكل"],["high","عالية (>٨٠٪)"],["medium","متوسطة"],["new","جديدة"]];
  const matches = Array.from({length: 8}, (_, i) => buildMatch(i));
  const filtered = tab==="high" ? matches.filter(m=>m.score>=80) : tab==="medium" ? matches.filter(m=>m.score<80) : matches;
  return (
    <AppLayout go={go} current="matches" title="التوافقات" sub={`${filtered.length} نتيجة بناءً على ملفك`}
      headerRight={<button className="p-2.5 rounded-xl border border-line dark:border-edge"><Icon name="filter" size={18}/></button>}>

      {!subscribed && (
        <Card className="mb-5 bg-gradient-to-l from-[#FBF6E9] to-transparent dark:from-[#332a17] dark:to-night-2 border-gold/40">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-2xl bg-gold text-white flex items-center justify-center"><Icon name="crown" size={22}/></div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[16px]">اشترك لتكشف من وافقوا معك</div>
              <div className="text-[12.5px] text-ink-2 dark:text-fog-2 mt-0.5">١٢ توافقاً عالياً ينتظر الكشف. ابدأ بـ ٤٩ ج.م/شهر.</div>
            </div>
            <GoldButton size="sm" onClick={()=>go("pricing")}>اشترك الآن</GoldButton>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2 mb-5 overflow-x-auto nice-scroll -mx-1 px-1">
        {tabs.map(([id,lbl]) => (
          <button key={id} onClick={()=>setTab(id)} className={`shrink-0 px-3.5 py-2 rounded-full text-[13px] border transition ${tab===id?"bg-gold text-white border-gold":"border-line dark:border-edge text-ink-2 dark:text-fog-2"}`}>{lbl}</button>
        ))}
        <div className="me-auto"/>
        {!subscribed && <button onClick={()=>setUserType("subscribed")} className="shrink-0 text-[11px] text-ink-3 underline">تجربة المشترك</button>}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="heart" title="لا توجد توافقات بعد" sub="حاول لاحقاً — نطابقك مع المنضمين الجدد يومياً."/>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m, i) => {
            const locked = !subscribed;
            return (
              <Card key={m.id} className="relative !p-0 overflow-hidden">
                {locked && (
                  <div className="absolute inset-0 backdrop-blur-[8px] bg-paper-card/50 dark:bg-night-2/60 flex flex-col items-center justify-center gap-2 z-10 shimmer">
                    <Icon name="lock" size={28} className="text-gold"/>
                    <div className="text-[12px] text-ink-2 dark:text-fog-2">اشترك لكشف هذا التوافق</div>
                  </div>
                )}
                <div className="aspect-[4/5] bg-gradient-to-br from-paper-2 to-paper dark:from-night-3 dark:to-night flex items-center justify-center relative">
                  <ProfileAvatar name={m.name} anonymous={m.anonymous} size={120} tone={m.tone}/>
                  <div className="absolute top-3 right-3">
                    <ScoreRing value={m.score} size={58} stroke={5} trackColor="rgba(255,255,255,.25)"/>
                  </div>
                  <div className="absolute top-3 left-3"><Badge tone={m.type==="متشابه"?"gold":"green"}>{m.type}</Badge></div>
                </div>
                <div className="p-4">
                  <div className="font-medium">{m.anonymous ? "مستخدم مجهول" : m.name}</div>
                  <div className="text-[12px] text-ink-3 mt-0.5 flex items-center gap-1"><Icon name="location" size={12}/> {m.city} • <span className="numerals">{m.age}</span> سنة</div>
                  <div className="mt-3 space-y-1.5">
                    {m.reasons.slice(0,2).map(r => <div key={r} className="flex items-center gap-1.5 text-[12.5px] text-ink-2 dark:text-fog-2"><Icon name="check" size={12} className="text-green"/> {r}</div>)}
                  </div>
                  <OutlineButton className="mt-4 w-full" size="sm" onClick={()=>go("match-detail")}>عرض التفاصيل</OutlineButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

// ---- P24: Match Detail ----
const PageMatchDetail = ({ go, subscribed }) => {
  const cats = [
    { name: "القيم والدين", you: 85, them: 88 },
    { name: "الشخصية", you: 72, them: 68 },
    { name: "نمط الحياة", you: 82, them: 79 },
    { name: "توقعات الزواج", you: 76, them: 72 },
  ];
  return (
    <AppLayout go={go} current="matches" title="تفاصيل التوافق"
      headerRight={<button className="p-2.5 rounded-xl border border-line dark:border-edge"><Icon name="moreV" size={18}/></button>}>
      <div className="max-w-4xl space-y-5">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 -top-20 h-40 bg-gold/5 blur-2xl"/>
          <div className="relative flex items-center justify-around gap-3">
            <div className="text-center">
              <ProfileAvatar name="أحمد" size={88}/>
              <div className="font-medium text-[13.5px] mt-2">أنت</div>
              <div className="text-[11px] text-ink-3">عقلاني اجتماعي</div>
            </div>
            <div className="text-center">
              <ScoreRing value={87} size={132} stroke={10}/>
              <div className="mt-2"><Badge tone="green">توافق ممتاز</Badge></div>
            </div>
            <div className="text-center">
              <ProfileAvatar name="نور الهدى" size={88} tone="green" anonymous={!subscribed}/>
              <div className="font-medium text-[13.5px] mt-2">{subscribed?"نور الهدى":"مستخدمة مجهولة"}</div>
              <div className="text-[11px] text-ink-3">عاطفي هادئ</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="font-display text-lg mb-4">المقارنة التفصيلية</div>
          <div className="space-y-5">
            {cats.map(c => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1.5 text-[13.5px]">
                  <span>{c.name}</span>
                  <span className="text-ink-3 numerals">أنت <span className="text-gold font-serif-en">{c.you}</span> • هي <span className="text-green font-serif-en">{c.them}</span></span>
                </div>
                <div className="relative h-2 bg-line dark:bg-edge rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 right-0 bg-gold/60 rounded-full" style={{width:`${c.you}%`}}/>
                  <div className="absolute inset-y-0 right-0 bg-green/60 rounded-full" style={{width:`${c.them}%`, mixBlendMode:"multiply"}}/>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid sm:grid-cols-2 gap-5">
          <Card>
            <div className="font-display text-lg mb-3 flex items-center gap-2 text-green"><Icon name="checkCircle" size={18}/> لماذا أنتما متوافقان</div>
            <div className="space-y-2.5">
              {[
                ["قيم متقاربة", "تشترك معها في الاهتمام بالعائلة والاستقرار الديني."],
                ["تواصل متقارب", "كلاكما يفضل الحوار الصريح والمباشر."],
                ["نظرة مشتركة للحياة", "تشاركان رؤية مماثلة لطبيعة العلاقة الزوجية."],
              ].map(([t,d]) => (
                <div key={t} className="p-3 rounded-xl bg-green/5 dark:bg-green/10 border border-green/15">
                  <div className="font-medium text-[14px]">{t}</div>
                  <div className="text-[12.5px] text-ink-2 dark:text-fog-2 mt-0.5">{d}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="font-display text-lg mb-3 flex items-center gap-2 text-amber"><Icon name="info" size={18}/> نقاط الاختلاف</div>
            <div className="space-y-2.5">
              {[
                ["مستوى التلقائية", "هي أكثر تخطيطاً، أنت أكثر تلقائية — توازن صحي."],
                ["النشاط الاجتماعي", "اختلاف بسيط يفتح بابا للتنوع في الحياة."],
              ].map(([t,d]) => (
                <div key={t} className="p-3 rounded-xl bg-amber-soft dark:bg-[#2a2010] border border-[#e9d4a8]/60 dark:border-[#5b4720]/60">
                  <div className="font-medium text-[14px] text-amber dark:text-[#e4b266]">{t}</div>
                  <div className="text-[12.5px] text-ink-2 dark:text-fog-2 mt-0.5">{d}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <div className="font-display text-lg mb-3">انطباع الملامح المتقاطع</div>
          <div className="grid sm:grid-cols-3 gap-3 text-center">
            {[["اجتماعي ودود",82,"hand"],["هادئ متأن",74,"leaf"],["عاطفي حساس",68,"heart"]].map(([t,v,icn]) => (
              <div key={t} className="p-3 rounded-xl bg-paper-2 dark:bg-night-3">
                <ScoreRing value={v} size={64} stroke={6}/>
                <div className="text-[13px] mt-2">{t}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="sticky bottom-20 lg:bottom-6 flex gap-3">
          <OutlineButton onClick={()=>go("matches")} className="lg:flex-none">العودة</OutlineButton>
          <GoldButton disabled={!subscribed} className="flex-1" icon={<Icon name="send" size={16}/>}>{subscribed ? "طلب تواصل" : "اشترك للتواصل"}</GoldButton>
        </div>
      </div>
    </AppLayout>
  );
};

// ---- P25 & P26 share layout ----
const RequestsTabs = ({ current, go }) => (
  <div className="inline-flex bg-paper-2 dark:bg-night-3 p-1 rounded-xl text-[13px]">
    {[["req-received","المستلمة"],["req-sent","المرسلة"]].map(([id,lbl]) => (
      <button key={id} onClick={()=>go(id)} className={`px-5 py-2 rounded-lg transition ${current===id?"bg-paper-card dark:bg-night-2 shadow-soft":"text-ink-2 dark:text-fog-2"}`}>{lbl}</button>
    ))}
  </div>
);

// ---- P25: Sent Requests ----
const PageRequestsSent = ({ go }) => {
  const data = [
    { name: "نور الهدى", score: 87, status: "waiting", anonymous: false, time: "منذ ساعتين", tone: "green" },
    { name: "هند علي",   score: 82, status: "pending", anonymous: true,  time: "أمس",        tone: "gold"  },
    { name: "ليلى يوسف", score: 91, status: "accepted",anonymous: false, time: "منذ ٣ أيام",  tone: "green" },
    { name: "سارة عبدالله", score: 73, status: "rejected",anonymous: true, time: "الأسبوع الماضي", tone: "stone" },
    { name: "فاطمة سالم",  score: 79, status: "expired", anonymous: true, time: "منذ شهر",   tone: "stone" },
  ];
  return (
    <AppLayout go={go} current="req-sent" title="طلبات التواصل" sub="ما أرسلتَه وما يُنتظر">
      <div className="max-w-3xl">
        <RequestsTabs current="req-sent" go={go}/>
        <div className="space-y-3 mt-5">
          {data.map((r,i) => (
            <Card key={i} className="!p-4">
              <div className="flex items-center gap-3">
                <ProfileAvatar name={r.name} anonymous={r.anonymous} size={48} tone={r.tone}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{r.anonymous?"مستخدمة مجهولة":r.name}</span>
                    <StatusBadge status={r.status}/>
                  </div>
                  <div className="text-[12px] text-ink-3 mt-0.5">{r.time}</div>
                </div>
                <div className="text-center">
                  <div className="font-serif-en text-gold text-xl numerals">{r.score}<span className="text-[11px]">٪</span></div>
                </div>
                {r.status==="pending" && <button className="ms-2 px-3 py-1.5 rounded-lg border border-line dark:border-edge text-[12px]">إلغاء</button>}
                {r.status==="accepted" && <GoldButton size="sm" onClick={()=>go("chat-room")}>محادثة</GoldButton>}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

// ---- P26: Received Requests ----
const PageRequestsReceived = ({ go }) => {
  const data = [
    { name: "كريم حسن", score: 89, time: "منذ ساعة", reasons:["قيم متقاربة","نمط حياة متوافق"], tone:"gold" },
    { name: "زياد خالد", score: 81, time: "اليوم",   reasons:["نظرة مماثلة للعائلة","صراحة في التواصل"], tone:"green" },
    { name: "محمود طارق", score: 76, time: "أمس",    reasons:["اهتمامات مشتركة"], tone:"stone" },
  ];
  return (
    <AppLayout go={go} current="req-received" title="طلبات التواصل" sub="طلبات تنتظر ردك">
      <div className="max-w-3xl">
        <RequestsTabs current="req-received" go={go}/>
        <div className="space-y-3 mt-5">
          {data.map((r,i) => (
            <Card key={i} className="!p-4 hover:shadow-soft cursor-pointer" onClick={()=>go("req-detail")}>
              <div className="flex items-start gap-3">
                <ProfileAvatar name={r.name} anonymous size={52} tone={r.tone}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">مستخدم مجهول</div>
                      <div className="text-[12px] text-ink-3">{r.time}</div>
                    </div>
                    <ScoreRing value={r.score} size={52} stroke={5}/>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {r.reasons.map(t => <div key={t} className="flex items-center gap-1.5 text-[12.5px] text-ink-2 dark:text-fog-2"><Icon name="check" size={12} className="text-green"/> {t}</div>)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <GreenButton size="sm" className="flex-1">قبول</GreenButton>
                <OutlineButton size="sm" className="flex-1">اعتذار</OutlineButton>
              </div>
            </Card>
          ))}
        </div>
        {data.length===0 && <EmptyState icon="inbox" title="لا توجد طلبات" sub="ستظهر هنا عندما يطلب أحد التواصل معك."/>}
      </div>
    </AppLayout>
  );
};

// ---- P27: Request Detail ----
const PageRequestDetail = ({ go }) => (
  <AppLayout go={go} current="req-received" title="طلب تواصل" sub="مستخدم مجهول">
    <div className="max-w-2xl space-y-5">
      <Card className="text-center">
        <ProfileAvatar name="ك" anonymous size={92} tone="gold" className="mx-auto"/>
        <div className="mt-3"><Badge tone="neutral">مجهول حتى القبول</Badge></div>
        <div className="mt-5"><ScoreRing value={89} size={140} stroke={10}/></div>
        <div className="text-[12.5px] text-ink-2 dark:text-fog-2 mt-3 max-w-xs mx-auto">توافق ممتاز في القيم والشخصية ونمط الحياة.</div>
      </Card>

      <Card>
        <div className="font-display text-lg mb-3">رسالة تعريفية</div>
        <p className="text-[14.5px] leading-loose text-ink dark:text-fog">السلام عليكم، قرأت تقريرك ووجدت توافقاً كبيراً في القيم. أبحث عن شريكة حياة جادة، أحب القراءة والسفر الهادئ. أتطلع للتعرف عليكِ بشكل محترم.</p>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <div className="font-display text-[15px] mb-2 flex items-center gap-2 text-green"><Icon name="checkCircle" size={16}/> ما يجمعنا</div>
          <ul className="space-y-2 text-[13.5px]">
            {["نظرة مشتركة للعائلة","اهتمام بالقراءة والمعرفة","تفضيل الحوار الصريح"].map(t => <li key={t} className="flex items-start gap-2"><Icon name="check" size={14} className="text-green mt-0.5"/> {t}</li>)}
          </ul>
        </Card>
        <Card>
          <div className="font-display text-[15px] mb-2 flex items-center gap-2 text-amber"><Icon name="info" size={16}/> اختلافات بسيطة</div>
          <ul className="space-y-2 text-[13.5px]">
            {["مستوى تخطيط أعلى لديه","يفضل النشاط الاجتماعي الأهدأ"].map(t => <li key={t} className="flex items-start gap-2 text-ink-2 dark:text-fog-2"><Icon name="arrowLeft" size={12} className="text-amber mt-1"/> {t}</li>)}
          </ul>
        </Card>
      </div>

      <Card className="bg-paper-2 dark:bg-night-3 !p-4">
        <div className="flex items-start gap-2.5 text-[13px] text-ink-2 dark:text-fog-2">
          <Icon name="info" size={16} className="text-gold shrink-0 mt-0.5"/>
          <div>بعد القبول، سيتم كشف الهوية ويمكنكما التواصل مباشرة عبر المحادثة. القرار قرارك بالكامل.</div>
        </div>
      </Card>

      <div className="flex gap-3 sticky bottom-20 lg:bottom-6">
        <OutlineButton className="flex-1" onClick={()=>go("req-received")}>اعتذار</OutlineButton>
        <GreenButton className="flex-1" onClick={()=>go("chat-room")}>قبول وبدء المحادثة</GreenButton>
      </div>
    </div>
  </AppLayout>
);

// ---- P28: Chats List ----
const PageChats = ({ go }) => {
  const chats = [
    { name: "نور الهدى", last: "إن شاء الله نتفاهم على موعد قريب", time: "١٤:٣٢", unread: 2, score: 87, online: true },
    { name: "هند علي",   last: "تمام، نتكلم بكرة الصبح", time: "أمس",  unread: 0, score: 82, online: false },
    { name: "ليلى يوسف", last: "أنت أرسلت طلب التواصل", time: "الأحد", unread: 0, score: 91, online: true, system: true },
    { name: "سارة عبدالله", last: "شكراً جزيلاً 🙏 — تم استبدالها بأيقونة", time: "السبت", unread: 0, score: 73, online: false },
  ];
  return (
    <AppLayout go={go} current="chats" title="المحادثات">
      <div className="max-w-3xl">
        <div className="mb-4 flex items-center gap-2 bg-paper-card dark:bg-night-2 border border-line dark:border-edge rounded-xl px-3.5 py-2.5">
          <Icon name="search" size={16} className="text-ink-3"/>
          <input placeholder="ابحث في المحادثات…" className="flex-1 bg-transparent outline-none text-[14px]"/>
        </div>
        <div className="bg-paper-card dark:bg-night-2 border border-line dark:border-edge rounded-2xl overflow-hidden">
          {chats.map((c,i) => (
            <button key={i} onClick={()=>go("chat-room")} className="w-full text-right p-4 flex items-center gap-3 border-b last:border-0 border-line dark:border-edge hover:bg-paper-2 dark:hover:bg-night-3 transition">
              <ProfileAvatar name={c.name} size={52} online={c.online}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{c.name}</span>
                    <Badge tone="gold" className="!py-0">{c.score}٪</Badge>
                  </div>
                  <span className="text-[11.5px] text-ink-3 numerals shrink-0">{c.time}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className={`text-[13px] truncate ${c.unread?"text-ink dark:text-fog font-medium":"text-ink-2 dark:text-fog-2"}`}>{c.last}</span>
                  {c.unread > 0 && <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-gold text-white text-[11px] flex items-center justify-center numerals">{c.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
        {/* Empty state preview */}
      </div>
    </AppLayout>
  );
};

// ---- P29: Chat Room ----
const PageChatRoom = ({ go }) => {
  const msgs = [
    { from: "system", text: "تم قبول طلب التواصل. تم كشف الأسماء.", time: "السبت ٢٠:١٠" },
    { from: "them",   text: "السلام عليكم، تشرفت بمعرفتك", time: "١٠:٠٢", seen: true },
    { from: "me",     text: "وعليكم السلام ورحمة الله، تشرفت بك أيضاً", time: "١٠:٠٤", seen: true },
    { from: "them",   text: "قرأت تقريرك وأعجبني فكرك في موضوع العائلة", time: "١٠:٠٥", seen: true },
    { from: "me",     text: "شكراً لكِ — أرى أن نظرتنا متقاربة جداً. هل تحبين الحديث عن خطط المستقبل؟", time: "١٠:٠٧", seen: true },
    { from: "them",   text: "بالتأكيد. الاستقرار العائلي أولوية بالنسبة لي", time: "١٠:٠٩", seen: false },
  ];
  return (
    <AppLayout go={go} current="chats" hideBottomNav fullBleed
      title="نور الهدى"
      sub="عاطفي هادئ • متصلة الآن"
      headerRight={<><Badge tone="gold">٨٧٪</Badge><button className="p-2 rounded-lg hover:bg-paper-2 dark:hover:bg-night-3"><Icon name="moreV"/></button></>}>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-5.5rem)]">
        {/* Ice breaker bar */}
        <div className="px-4 lg:px-8 py-2.5 bg-gold/10 dark:bg-[#332a17] border-b border-gold/20 flex items-center gap-2 text-[12.5px]">
          <Icon name="sparkles" size={14} className="text-gold"/>
          <span className="flex-1 truncate text-ink-2 dark:text-fog-2"><span className="text-gold">اقتراح:</span> "ما هي قيمة لا تساومين عليها في حياتك؟"</span>
          <button className="text-ink-3 p-1"><Icon name="x" size={14}/></button>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto nice-scroll px-4 lg:px-8 py-5 space-y-3 bg-paper-2/60 dark:bg-night-3/40">
          <div className="text-center text-[11px] text-ink-3 numerals">السبت ٢٠ مايو</div>
          {msgs.map((m,i) => {
            if (m.from === "system") return <div key={i} className="text-center text-[11px] text-ink-3 px-3 py-1.5 inline-block mx-auto"><span className="bg-paper-2 dark:bg-night-3 rounded-full px-3 py-1">{m.text}</span></div>;
            const mine = m.from === "me";
            return (
              <div key={i} className={`flex ${mine?"justify-end":"justify-start"}`}>
                <div className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl ${mine?"bg-gold text-white rounded-bl-md":"bg-paper-card dark:bg-night-2 border border-line dark:border-edge rounded-br-md"}`}>
                  <div className="text-[14.5px] leading-relaxed">{m.text}</div>
                  <div className={`text-[10.5px] mt-1 flex items-center gap-1 ${mine?"text-white/70 justify-end":"text-ink-3"}`}>
                    <span className="numerals">{m.time}</span>
                    {mine && (m.seen ? <span className="text-[#cfe3ff]">✓✓</span> : <span>✓✓</span>)}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Tip card */}
          <Card className="!p-3.5 bg-green/5 border-green/15">
            <div className="flex items-start gap-2.5 text-[12.5px]">
              <Icon name="info" size={14} className="text-green mt-0.5 shrink-0"/>
              <div className="text-ink-2 dark:text-fog-2"><span className="text-green font-medium">نصيحة:</span> اسأل عن خطط الخمس سنوات القادمة — تكشف الكثير عن التوقعات.</div>
            </div>
          </Card>
          {/* Typing */}
          <div className="flex justify-start">
            <div className="bg-paper-card dark:bg-night-2 border border-line dark:border-edge px-4 py-3 rounded-2xl rounded-br-md">
              <div className="dots text-ink-3"><span/><span/><span/></div>
            </div>
          </div>
          {/* Red flag alert */}
          <Card className="bg-amber-soft dark:bg-[#2a2010] border-[#e9d4a8] dark:border-[#5b4720] !p-3">
            <div className="flex items-start gap-2.5 text-[12.5px] text-amber dark:text-[#e4b266]">
              <Icon name="alert" size={14} className="mt-0.5 shrink-0"/>
              <div className="flex-1">يُفضّل عدم تبادل أرقام التواصل المباشرة في بداية المحادثة.</div>
              <button className="text-ink-3"><Icon name="x" size={12}/></button>
            </div>
          </Card>
        </div>

        {/* Input */}
        <div className="border-t border-line dark:border-edge bg-paper-card dark:bg-night-2 px-3 lg:px-6 py-3 flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-paper-2 dark:hover:bg-night-3 text-ink-2"><Icon name="plus" size={20}/></button>
          <input placeholder="اكتب رسالتك…" className="flex-1 bg-paper-2 dark:bg-night-3 rounded-full px-4 py-2.5 outline-none text-[14px]"/>
          <button className="w-10 h-10 rounded-full bg-gold text-white flex items-center justify-center shrink-0"><Icon name="send" size={18}/></button>
        </div>
      </div>
    </AppLayout>
  );
};

// ---- P30: Notifications ----
const PageNotifs = ({ go }) => {
  const items = [
    { icon: "heart",    tone: "gold",  t: "توافق جديد!", d: "نور الهدى — توافق ٨٧٪", time: "منذ ١٠ د", unread: true, go: "match-detail" },
    { icon: "inbox",    tone: "green", t: "طلب تواصل جديد", d: "مستخدم مجهول أرسل طلباً", time: "منذ ساعة", unread: true, go: "req-detail" },
    { icon: "checkCircle", tone: "green", t: "تم قبول طلبك", d: "ليلى يوسف قبلت طلبك", time: "أمس", unread: false, go: "chat-room" },
    { icon: "chat",     tone: "gold",  t: "رسالة جديدة", d: "هند: تمام، نتكلم بكرة", time: "منذ يومين", unread: false, go: "chat-room" },
    { icon: "alert",    tone: "amber", t: "تنتهي خطتك قريباً", d: "بعد ٥ أيام — جدد قبل الانقطاع", time: "أمس", unread: false, go: "settings-sub" },
    { icon: "sparkles", tone: "gold",  t: "نصيحة اليوم", d: "أكمل ٪١٠ من ملفك لزيادة فرص التوافق", time: "اليوم", unread: false },
  ];
  return (
    <AppLayout go={go} current="notifs" title="الإشعارات" headerRight={<OutlineButton size="sm">تعليم الكل كمقروء</OutlineButton>}>
      <div className="max-w-3xl space-y-2.5">
        {items.map((n,i) => {
          const tones = { gold: "bg-gold/10 text-gold", green: "bg-green/10 text-green", amber: "bg-amber-soft text-amber" };
          return (
            <Card key={i} className={`!p-4 flex items-start gap-3 cursor-pointer hover:shadow-soft ${n.unread?"bg-gold/5 dark:bg-[#1f1a10]":""}`} onClick={()=>n.go && go(n.go)}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tones[n.tone]}`}><Icon name={n.icon} size={18}/></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[14.5px]">{n.t}</span>
                  <span className="text-[11px] text-ink-3 shrink-0">{n.time}</span>
                </div>
                <div className="text-[13px] text-ink-2 dark:text-fog-2 mt-0.5 truncate">{n.d}</div>
              </div>
              {n.unread && <span className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0"/>}
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
};

window.PagesMain = { AppLayout, PageDashboard, PageReport, PageMatches, PageMatchDetail, PageRequestsSent, PageRequestsReceived, PageRequestDetail, PageChats, PageChatRoom, PageNotifs };
Object.assign(window, window.PagesMain);
