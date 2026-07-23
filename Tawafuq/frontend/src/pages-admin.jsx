// =============== Admin Panel: P42-P63 ===============
const RC = window.Recharts || {};
const { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend } = RC;

// Admin shell
const AdminShell = ({ go, current, title, sub, right, children, padded = true }) => (
  <div className="min-h-screen bg-paper dark:bg-night flex">
    <AdminSidebar current={current} onGo={go}/>
    <main className="flex-1 min-w-0">
      <AdminTopBar title={title} sub={sub} right={right}/>
      <div className={padded ? "p-6 lg:p-8" : ""}>{children}</div>
    </main>
  </div>
);

// Empty fallback for charts when Recharts is not loaded
const ChartFallback = ({ height=160, label }) => (
  <div className="rounded-xl border border-dashed border-line dark:border-edge bg-paper-2 dark:bg-night-3 flex items-center justify-center text-[12px] text-ink-3" style={{height}}>{label||"رسم بياني"}</div>
);

// ---- P42: Admin Dashboard ----
const PageAdminDashboard = ({ go }) => {
  const stats = [
    { l: "إجمالي المستخدمين", v: "12,486", d: "+184 اليوم", tone: "gold", icon: "users" },
    { l: "جدد اليوم", v: "184", d: "+12% عن أمس", tone: "green", icon: "sparkles" },
    { l: "طلبات معلّقة", v: "37", d: "تنتظر مراجعة", tone: "amber", icon: "inbox" },
    { l: "محادثات نشطة", v: "1,243", d: "+8% أسبوعياً", tone: "blue", icon: "chat" },
    { l: "إيرادات الشهر", v: "284K", d: "ج.م — +14%", tone: "gold", icon: "coin" },
    { l: "علامات حمراء", v: "12", d: "خطورة عالية: 2", tone: "rose", icon: "flag" },
  ];
  const reg = [
    {d:"١",v:42},{d:"٥",v:58},{d:"١٠",v:71},{d:"١٥",v:65},{d:"٢٠",v:88},{d:"٢٥",v:102},{d:"٣٠",v:124},
  ];
  const sub = [{n:"Pro", v:62, c:"#B8975A"},{n:"Starter", v:24, c:"#9B9B9B"},{n:"Premium", v:14, c:"#2C5F4A"}];
  const funnel = [{n:"تسجيل", v:1000},{n:"موافقة", v:920},{n:"ملف",v:782},{n:"استبيان",v:564},{n:"تحليل وجه",v:413}];

  return (
    <AdminShell go={go} current="admin-dashboard" title="لوحة الإدارة" sub="نظرة شاملة على نشاط المنصة"
      right={<Select options={["آخر ٣٠ يوماً","الأسبوع","اليوم","السنة"]} defaultValue="آخر ٣٠ يوماً" className="!w-44"/>}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {stats.map(s => {
          const tones = { gold:"text-gold bg-gold/10", green:"text-green bg-green/10", amber:"text-amber bg-amber-soft", rose:"text-rose bg-rose-soft", blue:"text-[#2e548a] bg-[#E8EEF5] dark:text-[#8fb1e3] dark:bg-[#1a253a]" };
          return (
            <Card key={s.l} className="!p-4">
              <div className="flex items-center justify-between mb-2"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[s.tone]}`}><Icon name={s.icon} size={16}/></div></div>
              <div className="font-serif-en text-2xl numerals">{s.v}</div>
              <div className="text-[11.5px] text-ink-2 dark:text-fog-2">{s.l}</div>
              <div className="text-[11px] text-ink-3 mt-1">{s.d}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div><div className="font-display text-[16px]">التسجيلات (٣٠ يوم)</div><div className="text-[11.5px] text-ink-3">٢,٦٤٢ تسجيل</div></div>
            <Badge tone="green">+18%</Badge>
          </div>
          {LineChart ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={reg}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B8975A" stopOpacity={0.5}/><stop offset="1" stopColor="#B8975A" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" strokeOpacity={0.4}/>
                <XAxis dataKey="d" stroke="#9B9B9B" fontSize={11}/>
                <YAxis stroke="#9B9B9B" fontSize={11}/>
                <Tooltip contentStyle={{fontSize:12, borderRadius:12, border:"1px solid #E8E4DC"}}/>
                <Area type="monotone" dataKey="v" stroke="#B8975A" strokeWidth={2.5} fill="url(#g1)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <ChartFallback height={220}/>}
        </Card>
        <Card>
          <div className="font-display text-[16px] mb-1">الاشتراكات</div>
          <div className="text-[11.5px] text-ink-3 mb-3">توزيع الخطط</div>
          {PieChart ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={sub} dataKey="v" nameKey="n" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {sub.map((d,i) => <Cell key={i} fill={d.c}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : <ChartFallback height={180}/>}
          <div className="mt-3 space-y-1.5">
            {sub.map(s => (
              <div key={s.n} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{background:s.c}}/> {s.n}</span>
                <span className="numerals">{s.v}٪</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <div className="font-display text-[16px] mb-3">مسار الإنجاز</div>
          {BarChart ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnel} layout="vertical" margin={{top:5,right:10,left:10,bottom:5}}>
                <XAxis type="number" hide/>
                <YAxis type="category" dataKey="n" stroke="#9B9B9B" fontSize={11} width={64}/>
                <Bar dataKey="v" fill="#B8975A" radius={[0,6,6,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartFallback height={200}/>}
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-[16px]">عاجل</div>
            <Badge tone="rose">٥ بنود</Badge>
          </div>
          <div className="space-y-3 text-[13px]">
            {[
              ["طلبات تنتظر الموافقة","٣٧","admin-requests","inbox","amber"],
              ["علامات حمراء عالية","٢","admin-flags","flag","rose"],
              ["بلاغات معلّقة","٤","admin-reports","alert","amber"],
              ["مدفوعات فاشلة","١","admin-revenue","creditCard","rose"],
            ].map(([t,n,p,icn,tone]) => (
              <button key={t} onClick={()=>go(p)} className="w-full text-right flex items-center gap-3 p-2.5 rounded-lg hover:bg-paper-2 dark:hover:bg-night-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone==="rose"?"bg-rose-soft text-rose":"bg-amber-soft text-amber"}`}><Icon name={icn} size={14}/></div>
                <span className="flex-1">{t}</span>
                <span className="numerals font-serif-en text-gold">{n}</span>
                <Icon name="chevronLeft" size={14} className="text-ink-3"/>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="font-display text-[16px] mb-3">آخر النشاط</div>
          <div className="space-y-3 text-[12.5px]">
            {[
              ["نشر مستخدم جديد ملفه","أحمد م.","منذ ٣ د"],
              ["تم الموافقة على طلب","#9821","منذ ١٠ د"],
              ["اشتراك Pro جديد","سارة ع.","منذ ٢٠ د"],
              ["محادثة معلّمة","#chat-451","منذ نصف ساعة"],
              ["بلاغ جديد","#REP-128","قبل ساعة"],
            ].map((row,i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gold shrink-0"/>
                <div className="flex-1 truncate">{row[0]} <span className="text-ink-3">— {row[1]}</span></div>
                <div className="text-ink-3 numerals">{row[2]}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
};

// ---- P43: Admin Users List ----
const PageAdminUsers = ({ go }) => {
  const rows = Array.from({length:10}, (_, i) => ({
    name: sampleNames[i%sampleNames.length], city: sampleCities[i%sampleCities.length],
    age: 22+(i*3)%18, completion: 60+(i*7)%41, subscribed: i%3!==2 ? (i%3===0?"Pro":"Starter") : null,
    status: i===4?"warned":i===7?"blocked":"active",
  }));
  return (
    <AdminShell go={go} current="admin-users" title="المستخدمون" sub={`${rows.length} عرض من ١٢,٤٨٦`}
      right={<OutlineButton size="sm" icon={<Icon name="download" size={14}/>}>تصدير CSV</OutlineButton>}>
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-paper-2 dark:bg-night-3 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
            <Icon name="search" size={16} className="text-ink-3"/>
            <input placeholder="ابحث بالاسم أو الإيميل أو الجوال…" className="flex-1 bg-transparent outline-none text-[13.5px]"/>
          </div>
          <Select options={["جميع المدن", ...sampleCities]} defaultValue="جميع المدن" className="!w-40"/>
          <Select options={["كل الحالات","نشط","تحذير","محظور"]} defaultValue="كل الحالات" className="!w-32"/>
          <Select options={["كل الاكتمال","أقل من ٥٠٪","٥٠-٨٠٪","فوق ٨٠٪"]} defaultValue="كل الاكتمال" className="!w-36"/>
          <Select options={["الكل","مشترك","غير مشترك"]} defaultValue="الكل" className="!w-28"/>
        </div>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead className="bg-paper-2 dark:bg-night-3 text-[12px] text-ink-2 dark:text-fog-2">
              <tr>
                {["","المستخدم","المدينة","العمر","الاكتمال","الاشتراك","الحالة","إجراءات"].map(h => <th key={h} className="text-right px-4 py-3 font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i) => (
                <tr key={i} className="border-t border-line dark:border-edge hover:bg-paper-2 dark:hover:bg-night-3 cursor-pointer" onClick={()=>go("admin-user-detail")}>
                  <td className="px-4 py-3 w-8"><input type="checkbox"/></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar name={r.name} size={36}/>
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-[11.5px] text-ink-3">{r.name.split(" ")[0].toLowerCase()}@tawafuq.app</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-2 dark:text-fog-2">{r.city}</td>
                  <td className="px-4 py-3 numerals">{r.age}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex-1 max-w-24"><ProgressBar value={r.completion}/></div><span className="numerals text-[12px]">{r.completion}٪</span></div></td>
                  <td className="px-4 py-3">{r.subscribed ? <Badge tone="gold">{r.subscribed}</Badge> : <span className="text-ink-3 text-[12px]">مجاني</span>}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status==="active"?"active":r.status==="warned"?"warned":"blocked"}/></td>
                  <td className="px-4 py-3"><button onClick={e=>e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-paper-card dark:hover:bg-night-2"><Icon name="moreH" size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-line dark:border-edge text-[12px] text-ink-2 dark:text-fog-2">
          <span>عرض ١-١٠ من ١٢,٤٨٦</span>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1.5 rounded-lg border border-line dark:border-edge">«</button>
            <button className="px-3 py-1.5 rounded-lg bg-gold text-white numerals">1</button>
            <button className="px-3 py-1.5 rounded-lg numerals hover:bg-paper-2 dark:hover:bg-night-3">2</button>
            <button className="px-3 py-1.5 rounded-lg numerals hover:bg-paper-2 dark:hover:bg-night-3">3</button>
            <button className="px-2.5 py-1.5 rounded-lg border border-line dark:border-edge">»</button>
          </div>
        </div>
      </Card>
    </AdminShell>
  );
};

// ---- P44: Admin User Detail ----
const PageAdminUserDetail = ({ go }) => {
  const [tab, setTab] = useState("profile");
  const tabs = [["profile","الملف"],["questionnaire","الاستبيان"],["face","تحليل الوجه"],["matches","التوافقات"],["sub","الاشتراك"],["logs","السجل"]];
  return (
    <AdminShell go={go} current="admin-users" title="ملف المستخدم" sub="فاطمة سالم — fatma@tawafuq.app"
      right={<><OutlineButton size="sm">تحذير</OutlineButton><button className="px-4 py-2 rounded-xl border-2 border-rose text-rose text-[13px]">حظر</button></>}>
      <div className="grid lg:grid-cols-4 gap-5 mb-5">
        <Card className="lg:col-span-1 text-center">
          <ProfileAvatar name="فاطمة سالم" size={88} className="mx-auto"/>
          <div className="font-display text-lg mt-3">فاطمة سالم</div>
          <div className="text-[12.5px] text-ink-2 dark:text-fog-2">الإسكندرية • ٢٧ سنة</div>
          <div className="mt-3 flex items-center justify-center gap-2"><Badge tone="gold">Pro</Badge><Badge tone="green">موثّقة</Badge></div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px] text-right">
            <div className="bg-paper-2 dark:bg-night-3 rounded-lg p-2"><div className="text-ink-3">انضمت</div><div className="numerals">١٢ مارس ٢٠٢٦</div></div>
            <div className="bg-paper-2 dark:bg-night-3 rounded-lg p-2"><div className="text-ink-3">آخر دخول</div><div>اليوم</div></div>
          </div>
        </Card>
        <Card className="lg:col-span-3">
          <div className="flex items-center gap-2 overflow-x-auto nice-scroll mb-5 border-b border-line dark:border-edge -m-1 p-1">
            {tabs.map(([id,lbl]) => (
              <button key={id} onClick={()=>setTab(id)} className={`shrink-0 px-4 py-2.5 -mb-px text-[13.5px] transition border-b-2 ${tab===id?"border-gold text-gold":"border-transparent text-ink-2 dark:text-fog-2"}`}>{lbl}</button>
            ))}
          </div>
          {tab==="profile" && (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[13.5px]">
              {[
                ["الاسم","فاطمة سالم محمد"],["البريد","fatma@tawafuq.app"],
                ["الجوال","+٢٠ ١٠٠ ٠٠٠ ٠٠٤٧"],["المدينة","الإسكندرية"],
                ["العمر","٢٧"],["النوع","أنثى"],
                ["المؤهل","ماجستير"],["المهنة","طبيبة أسنان"],
                ["الهدف","الزواج"],["الوضع المجهول","مفعّل"],
              ].map(([k,v],i) => <div key={i} className="flex justify-between py-2 border-b border-line dark:border-edge"><span className="text-ink-3">{k}</span><span className="font-medium">{v}</span></div>)}
              <div className="sm:col-span-2 pt-2">
                <div className="text-ink-3 text-[12px] mb-1.5">النبذة</div>
                <div className="text-[13.5px] leading-loose">طبيبة أسنان. أحب القراءة والسفر وأعمل تطوعياً مع الأطفال. أبحث عن شريك حياة بقيم متقاربة.</div>
              </div>
            </div>
          )}
          {tab==="questionnaire" && (
            <div>
              <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-4">اكتمل ١٠٠٪ — ٤٠ من ٤٠</div>
              <div className="space-y-3">
                {[["القيم والدين",82],["الشخصية",75],["نمط الحياة",88],["توقعات الزواج",79]].map(([n,v]) => (
                  <div key={n}><div className="flex justify-between mb-1.5 text-[13px]"><span>{n}</span><span className="text-gold numerals font-serif-en">{v}٪</span></div><ProgressBar value={v}/></div>
                ))}
              </div>
            </div>
          )}
          {tab==="face" && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-3">الصور</div>
                <div className="grid grid-cols-3 gap-2">
                  {[0,1,2].map(i => <div key={i} className="aspect-square rounded-xl bg-paper-2 dark:bg-night-3 flex items-center justify-center"><Icon name="image" size={24} className="text-ink-3"/></div>)}
                </div>
              </div>
              <div>
                <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-3">الصفات المستخرجة</div>
                <div className="space-y-2">
                  {[["اجتماعية ودودة",82],["هادئة متأنية",71],["عاطفية حساسة",65]].map(([n,v]) => (
                    <div key={n} className="flex items-center justify-between bg-paper-2 dark:bg-night-3 rounded-lg px-3 py-2 text-[13px]">
                      <span>{n}</span><span className="text-gold numerals font-serif-en">{v}٪</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab==="matches" && (
            <div className="text-[13px] text-ink-2 dark:text-fog-2">شاهدتها مع ١٢ توافقاً عالياً (>٧٠٪). أرسلت ٤ طلبات، استلمت ٧.</div>
          )}
          {tab==="sub" && (
            <div className="text-[13px] text-ink-2 dark:text-fog-2">Pro نشط — يجدد في ١٢ يونيو ٢٠٢٦. إجمالي المدفوع: ٤٩٥ ج.م.</div>
          )}
          {tab==="logs" && (
            <div className="space-y-2 text-[13px]">
              {[["تسجيل دخول","١٤:٣٢"],["تحديث ملف","١٢:٠٥"],["إرسال طلب تواصل","الأمس"],["اشتراك Pro","الأسبوع الماضي"]].map((r,i) => (
                <div key={i} className="flex items-center justify-between bg-paper-2 dark:bg-night-3 rounded-lg px-3 py-2"><span>{r[0]}</span><span className="text-ink-3 numerals">{r[1]}</span></div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminShell>
  );
};

// ---- P45: Questions list ----
const PageAdminQuestions = ({ go }) => {
  const cats = [
    { id:1, name:"القيم والدين", weight:40, qs:[
      ["دور الالتزام الديني في الحياة الزوجية","single",5,true],
      ["تربية الأبناء","single",4,true],
      ["العلاقة بالعائلة الممتدة","rating",3,true],
    ]},
    { id:2, name:"الشخصية", weight:25, qs:[
      ["كيف تتعامل مع الخلاف","single",5,true],
      ["مستوى الانبساط","rating",3,true],
      ["تنظيم الوقت","multi",2,false],
    ]},
    { id:3, name:"نمط الحياة", weight:20, qs:[["السفر والترفيه","multi",2,true],["العمل والمشاركة المنزلية","single",4,true]]},
    { id:4, name:"توقعات الزواج", weight:15, qs:[["الإنجاب","single",5,true],["الأدوار العائلية","single",4,true]]},
  ];
  const sum = cats.reduce((a,c)=>a+c.weight,0);
  return (
    <AdminShell go={go} current="admin-questions" title="الأسئلة" sub="إدارة بنك الأسئلة والأوزان"
      right={<><OutlineButton size="sm">تعطيل المعاينة</OutlineButton><GoldButton size="sm" iconLeft={<Icon name="plus" size={14}/>} onClick={()=>go("admin-question-edit")}>إضافة سؤال</GoldButton></>}>
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-display text-[15px]">أوزان الأقسام</div>
            <div className="text-[12px] text-ink-3 mt-0.5">يجب أن يكون المجموع <span className="font-serif-en">١٠٠</span>٪</div>
          </div>
          <Badge tone={sum===100?"green":"rose"}>المجموع: <span className="font-serif-en numerals">{sum}</span>٪</Badge>
        </div>
        <div className="grid sm:grid-cols-4 gap-3 mt-3">
          {cats.map(c => (
            <div key={c.id} className="p-3 rounded-xl border border-line dark:border-edge">
              <div className="text-[13px]">{c.name}</div>
              <div className="font-serif-en text-2xl text-gold numerals mt-1">{c.weight}<span className="text-base">٪</span></div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {cats.map(c => (
          <Card key={c.id} padded={false}>
            <div className="px-5 py-4 flex items-center justify-between border-b border-line dark:border-edge">
              <div className="flex items-center gap-3">
                <Icon name="chevronDown" size={16} className="text-ink-2"/>
                <div className="font-display text-[15px]">{c.name}</div>
                <Badge tone="neutral">{c.qs.length} أسئلة</Badge>
                <Badge tone="gold">{c.weight}٪</Badge>
              </div>
              <button className="text-[12.5px] text-gold">+ سؤال</button>
            </div>
            <div className="divide-y divide-line dark:divide-edge">
              {c.qs.map(([t,type,w,active],i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-paper-2 dark:hover:bg-night-3">
                  <button className="text-ink-3 cursor-grab"><Icon name="drag" size={16}/></button>
                  <div className="flex-1 text-[14px]">{t}</div>
                  <Badge tone={type==="single"?"gold":type==="multi"?"green":"neutral"}>{type==="single"?"اختياري":type==="multi"?"متعدد":"تقييم"}</Badge>
                  <span className="text-[12px] text-ink-3 numerals">وزن: <span className="font-serif-en text-gold">{w}</span></span>
                  <Toggle checked={active} onChange={()=>{}} size="sm"/>
                  <button onClick={()=>go("admin-question-edit")} className="p-1.5 rounded-lg hover:bg-paper-card dark:hover:bg-night-2"><Icon name="edit" size={14}/></button>
                  <button className="p-1.5 rounded-lg hover:bg-paper-card dark:hover:bg-night-2 text-rose"><Icon name="trash" size={14}/></button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
};

// ---- P46: Question Edit ----
const PageAdminQuestionEdit = ({ go }) => {
  const [type, setType] = useState("single");
  return (
    <AdminShell go={go} current="admin-questions" title="تعديل سؤال" sub="القيم والدين • سؤال #٣"
      right={<><OutlineButton size="sm" onClick={()=>go("admin-questions")}>إلغاء</OutlineButton><GoldButton size="sm" onClick={()=>go("admin-questions")}>حفظ التغييرات</GoldButton></>}>
      <div className="grid lg:grid-cols-3 gap-5 max-w-6xl">
        <div className="lg:col-span-2 space-y-5">
          <Card className="space-y-4">
            <Select label="القسم" options={["القيم والدين","الشخصية","نمط الحياة","توقعات الزواج"]} defaultValue="القيم والدين"/>
            <TextArea label="نص السؤال (بالعربية)" defaultValue="إلى أي مدى يؤثر الالتزام الديني في اختيارك لشريك الحياة؟" maxLength={200}/>
            <div>
              <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-2">نوع السؤال</div>
              <div className="grid grid-cols-4 gap-2">
                {[["single","اختياري واحد","list"],["multi","متعدد","grid"],["rating","تقييم ١-٥","star"],["text","نصي","edit"]].map(([id,lbl,icn]) => (
                  <button key={id} onClick={()=>setType(id)} className={`p-3 rounded-xl border-2 transition text-center ${type===id?"border-gold bg-[#FBF6E9] dark:bg-[#2a2417] text-gold":"border-line dark:border-edge"}`}>
                    <Icon name={icn} size={18} className="mx-auto"/>
                    <div className="text-[12px] mt-1">{lbl}</div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-[15px]">الخيارات</div>
              <button className="text-[12.5px] text-gold inline-flex items-center gap-1"><Icon name="plus" size={12}/> إضافة خيار</button>
            </div>
            <div className="space-y-2.5">
              {[
                ["أرى الالتزام الديني أساساً مهماً جداً", 5],
                ["مهم لكن مع مرونة في التفاصيل", 4],
                ["أؤمن بالقيم العامة دون التمسك بالتفاصيل", 3],
                ["أؤمن بالأخلاق أكثر من الطقوس", 2],
              ].map(([t,v],i) => (
                <div key={i} className="flex items-center gap-2 bg-paper-2 dark:bg-night-3 rounded-xl px-3 py-2">
                  <Icon name="drag" size={14} className="text-ink-3 cursor-grab"/>
                  <span className="font-serif-en text-ink-3 text-[12px] numerals w-5">{i+1}</span>
                  <input defaultValue={t} className="flex-1 bg-transparent outline-none text-[14px]"/>
                  <span className="text-[11px] text-ink-3">قيمة:</span>
                  <input type="number" min={1} max={10} defaultValue={v} className="w-14 bg-paper-card dark:bg-night-2 rounded-lg px-2 py-1 outline-none text-center font-serif-en numerals border border-line dark:border-edge"/>
                  <button className="text-rose p-1"><Icon name="trash" size={14}/></button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="font-display text-[15px] mb-3">الإعدادات</div>
            <div className="space-y-4">
              <div>
                <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-1.5">الوزن في القسم</div>
                <input type="number" min={1} max={10} defaultValue={5} className="w-full bg-paper-2 dark:bg-night-3 rounded-xl px-3 py-2.5 outline-none border border-line dark:border-edge font-serif-en numerals"/>
              </div>
              <div className="flex items-center justify-between"><div className="text-[13px]">سؤال إجباري</div><Toggle checked={true} onChange={()=>{}}/></div>
              <div className="flex items-center justify-between"><div className="text-[13px]">نشط</div><Toggle checked={true} onChange={()=>{}}/></div>
              <div className="flex items-center justify-between"><div className="text-[13px]">يُحسب في النتيجة</div><Toggle checked={true} onChange={()=>{}}/></div>
            </div>
          </Card>
          <Card className="bg-paper-2 dark:bg-night-3">
            <div className="flex items-start gap-2 text-[12.5px] text-ink-2 dark:text-fog-2">
              <Icon name="info" size={14} className="text-gold mt-0.5"/>
              <span>التغييرات تطبَّق على المستخدمين الجدد فقط. إعادة الحساب اختيارية.</span>
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
};

// ---- P47: Matching Weights ----
const PageAdminWeights = ({ go }) => {
  const [w, setW] = useState([40,25,20,15]);
  const labels = ["القيم والدين","الشخصية","نمط الحياة","المظهر والتفضيلات"];
  const colors = ["#B8975A","#2C5F4A","#A87528","#9B9B9B"];
  const sum = w.reduce((a,b)=>a+b,0);
  const [confirm, setConfirm] = useState(false);
  return (
    <AdminShell go={go} current="admin-weights" title="أوزان المطابقة" sub="تحكم في كيفية حساب نسبة التوافق"
      right={<GoldButton size="sm" onClick={()=>setConfirm(true)}>إعادة حساب كل التوافقات</GoldButton>}>
      <div className="grid lg:grid-cols-3 gap-5 max-w-6xl">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="font-display text-[16px]">الأوزان</div>
            <Badge tone={sum===100?"green":"rose"}>المجموع: <span className="font-serif-en numerals">{sum}</span>٪</Badge>
          </div>
          <div className="space-y-5">
            {labels.map((lbl, i) => (
              <div key={lbl}>
                <div className="flex items-center justify-between mb-2 text-[14px]">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background:colors[i]}}/> {lbl}</span>
                  <span className="numerals font-serif-en text-xl text-gold">{w[i]}<span className="text-sm">٪</span></span>
                </div>
                <input type="range" min={0} max={100} value={w[i]} onChange={e => setW(arr => arr.map((x,idx)=>idx===i?+e.target.value:x))} className="w-full"/>
                <div className="mt-2"><Select options={["تشابه","تكامل","كلاهما"]} defaultValue={i===0?"تشابه":i===1?"كلاهما":"تشابه"} className="!text-[12px]"/></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="font-display text-[16px] mb-3">المعاينة</div>
          {PieChart ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={labels.map((n,i)=>({n,v:w[i]}))} dataKey="v" nameKey="n" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {labels.map((_,i)=><Cell key={i} fill={colors[i]}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : <ChartFallback height={200}/>}
          <div className="text-[11.5px] text-ink-3 mt-2 leading-loose">الأوزان تُحدد كيفية حساب نتيجة التوافق النهائية. تأكد من المجموع قبل الحفظ.</div>
        </Card>
      </div>
      <Modal open={confirm} onClose={()=>setConfirm(false)} title="إعادة حساب كل التوافقات"
        footer={<><OutlineButton onClick={()=>setConfirm(false)}>إلغاء</OutlineButton><GoldButton onClick={()=>setConfirm(false)}>تأكيد الإعادة</GoldButton></>}>
        <p className="text-[14px] leading-loose">هذه العملية ستعيد حساب نسب التوافق لجميع المستخدمين (١٢,٤٨٦). قد تستغرق ١٠-١٥ دقيقة وتستهلك موارد السيرفر.</p>
        <Card className="mt-3 bg-amber-soft dark:bg-[#2a2010] border-[#e9d4a8]/60 !p-3">
          <div className="flex items-start gap-2 text-[12.5px] text-amber dark:text-[#e4b266]">
            <Icon name="alert" size={14} className="mt-0.5"/> سيتم إرسال إشعارات تحديث لجميع المستخدمين.
          </div>
        </Card>
      </Modal>
    </AdminShell>
  );
};

// ---- P48: Trait Rules ----
const PageAdminTraits = ({ go }) => {
  const traits = [
    { name: "اجتماعي ودود", icon: "smile", features: ["انفتاح في تعابير الوجه","ابتسامة طبيعية متكررة","تناسق ملامح متوسط لعالٍ"], active: true },
    { name: "هادئ متأن", icon: "leaf", features: ["تعبير وجه ثابت","عينان متناسقتان","عدم وجود تجاعيد توتر"], active: true },
    { name: "عملي منظم", icon: "briefcase", features: ["ملامح حادة معتدلة","تماثل عالٍ بين الجانبين"], active: true },
    { name: "عاطفي حساس", icon: "heart", features: ["عينان واسعتان نسبياً","ملامح ناعمة","تعبير دافئ"], active: false },
    { name: "انطوائي تأملي", icon: "book", features: ["تعبير محايد","ملامح هادئة"], active: true },
  ];
  return (
    <AdminShell go={go} current="admin-traits" title="قواعد الصفات" sub="معايير استخراج الصفات من تحليل الوجه"
      right={<GoldButton size="sm" iconLeft={<Icon name="plus" size={14}/>}>إضافة قاعدة</GoldButton>}>
      <div className="grid md:grid-cols-2 gap-4 max-w-6xl">
        {traits.map(t => (
          <Card key={t.name}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gold/10 text-gold flex items-center justify-center"><Icon name={t.icon} size={20}/></div>
                <div>
                  <div className="font-display text-[15px]">{t.name}</div>
                  <div className="text-[11.5px] text-ink-3 numerals">{t.features.length} ميزات</div>
                </div>
              </div>
              <Toggle checked={t.active} onChange={()=>{}}/>
            </div>
            <div className="space-y-1.5">
              {t.features.map(f => (
                <div key={f} className="text-[13px] bg-paper-2 dark:bg-night-3 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-ink-2 dark:text-fog-2">{f}</span>
                  <span className="numerals font-serif-en text-gold text-[11.5px]">×0.8</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end"><button className="text-[12.5px] text-gold">تعديل القاعدة</button></div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
};

// ---- P49: Requests Queue ----
const PageAdminRequests = ({ go }) => {
  const [tab, setTab] = useState("pending");
  const tabs = [["pending","معلّقة",37],["approved","موافق عليها",1284],["rejected","مرفوضة",112]];
  const reqs = Array.from({length:5}, (_, i) => ({
    a: sampleNames[i%sampleNames.length], aCity: sampleCities[i%sampleCities.length],
    b: sampleNames[(i+3)%sampleNames.length], bCity: sampleCities[(i+1)%sampleCities.length],
    score: 78 + (i*4) % 20, when: `منذ ${i+1} ساعة`, id: `REQ-${1840+i}`,
  }));
  return (
    <AdminShell go={go} current="admin-requests" title="طابور طلبات التواصل" sub="مراجعة الطلبات قبل إرسالها للمستلمين">
      <div className="flex items-center gap-2 mb-5">
        {tabs.map(([id,lbl,n]) => (
          <button key={id} onClick={()=>setTab(id)} className={`px-4 py-2 rounded-xl text-[13.5px] inline-flex items-center gap-2 ${tab===id?"bg-gold text-white":"bg-paper-card dark:bg-night-2 border border-line dark:border-edge text-ink-2 dark:text-fog-2"}`}>{lbl} <span className={`numerals text-[11px] px-1.5 py-0.5 rounded-full ${tab===id?"bg-white/20":"bg-paper-2 dark:bg-night-3"}`}>{n}</span></button>
        ))}
      </div>

      <div className="space-y-3">
        {reqs.map((r,i) => (
          <Card key={i} className="!p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-serif-en text-[12px] text-ink-3 numerals">#{r.id}</span>
              <span className="text-[12px] text-ink-3">•</span>
              <span className="text-[12px] text-ink-3">{r.when}</span>
              <Badge tone="amber" className="ms-auto">معلّق</Badge>
            </div>
            <div className="grid sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex items-center gap-3">
                <ProfileAvatar name={r.a} size={48}/>
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.a}</div>
                  <div className="text-[11.5px] text-ink-3">{r.aCity} <span className="text-ink-3">— المرسل</span></div>
                </div>
              </div>
              <div className="text-center">
                <ScoreRing value={r.score} size={64} stroke={6}/>
                <div className="text-[10.5px] text-ink-3 mt-1">توافق</div>
              </div>
              <div className="flex items-center gap-3 sm:flex-row-reverse">
                <ProfileAvatar name={r.b} size={48} tone="green"/>
                <div className="min-w-0 sm:text-left">
                  <div className="font-medium truncate">{r.b}</div>
                  <div className="text-[11.5px] text-ink-3">{r.bCity} <span className="text-ink-3">— المستلم</span></div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-line dark:border-edge">
              <button className="text-[12.5px] text-gold underline">عرض الرسالة</button>
              <div className="me-auto"/>
              <OutlineButton size="sm">رفض</OutlineButton>
              <GreenButton size="sm">موافقة وإرسال</GreenButton>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
};

// ---- P50: Flagged Chats ----
const PageAdminFlags = ({ go }) => {
  const rows = [
    { users:["كريم ح.","نور ا."], flags:3, severity:"high",  time:"منذ ١٠ د", type:"تبادل أرقام" },
    { users:["محمود ط.","سارة ع."], flags:1, severity:"medium", time:"منذ ساعة", type:"لغة غير لائقة" },
    { users:["زياد خ.","ليلى ي."],   flags:2, severity:"high", time:"اليوم", type:"ضغط للقاء" },
    { users:["يوسف ع.","هند ع."],    flags:1, severity:"low",  time:"أمس", type:"خروج عن السياق" },
    { users:["أحمد م.","فاطمة س."],   flags:1, severity:"medium", time:"الأسبوع", type:"كلمة محظورة" },
  ];
  return (
    <AdminShell go={go} current="admin-flags" title="محادثات معلّمة" sub="مرتبة حسب الخطورة">
      <Card padded={false}>
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-line dark:border-edge bg-paper-2 dark:bg-night-3 text-[12px] text-ink-2 dark:text-fog-2">
          <div className="w-6"></div>
          <div>المشاركون</div>
          <div>النوع</div>
          <div>العلامات</div>
          <div>الخطورة</div>
          <div></div>
        </div>
        {rows.map((r,i) => {
          const sev = r.severity;
          const sevTone = sev==="high"?"rose":sev==="medium"?"amber":"neutral";
          const sevLbl = sev==="high"?"عالية":sev==="medium"?"متوسطة":"منخفضة";
          return (
            <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center border-b last:border-0 border-line dark:border-edge hover:bg-paper-2 dark:hover:bg-night-3 cursor-pointer" onClick={()=>go("admin-chat-view")}>
              <div className="flex -space-x-2 rtl:space-x-reverse">
                <ProfileAvatar name={r.users[0]} size={32}/>
                <ProfileAvatar name={r.users[1]} size={32} tone="green"/>
              </div>
              <div>
                <div className="text-[13.5px]">{r.users.join(" ↔ ")}</div>
                <div className="text-[11px] text-ink-3 numerals">{r.time}</div>
              </div>
              <div className="text-[12.5px]"><Badge tone="neutral">{r.type}</Badge></div>
              <div className="text-[13px] numerals font-serif-en">{r.flags}</div>
              <div><Badge tone={sevTone}>{sevLbl}</Badge></div>
              <button className="text-[12.5px] text-gold">عرض</button>
            </div>
          );
        })}
      </Card>
    </AdminShell>
  );
};

// ---- P51: Admin Chat View ----
const PageAdminChatView = ({ go }) => {
  const msgs = [
    { from:"a", text:"السلام عليكم، تشرفت بك", time:"١٠:٠٢" },
    { from:"b", text:"وعليكم السلام، تشرفنا", time:"١٠:٠٣" },
    { from:"a", text:"ممكن نتبادل الواتساب نسرع التواصل؟", time:"١٠:٠٥", flag:{sev:"high", type:"تبادل أرقام", id:1} },
    { from:"b", text:"الأفضل نكمل هنا حالياً", time:"١٠:٠٦" },
    { from:"a", text:"تمام، لكن نتقابل بكرة الصبح؟", time:"١٠:٠٨", flag:{sev:"medium", type:"ضغط للقاء", id:2} },
  ];
  return (
    <AdminShell go={go} current="admin-flags" title="محادثة معلّمة" sub="كريم ح. ↔ نور ا. — للقراءة فقط"
      right={<><Badge tone="rose">٣ علامات</Badge><button className="px-4 py-2 rounded-xl border-2 border-rose text-rose text-[12.5px]">حظر المحادثة</button></>}>
      <div className="grid lg:grid-cols-3 gap-5 max-w-6xl">
        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="h-[28rem] overflow-y-auto nice-scroll p-5 bg-paper-2/60 dark:bg-night-3/40 space-y-3">
            {msgs.map((m,i) => {
              const mine = m.from === "a";
              return (
                <div key={i} className={`flex ${mine?"justify-end":"justify-start"}`}>
                  <div className="max-w-[85%]">
                    <div className={`px-4 py-2.5 rounded-2xl ${m.flag ? m.flag.sev==="high" ? "bg-rose-soft dark:bg-[#3a1f1f] ring-1 ring-rose/40":"bg-amber-soft dark:bg-[#2a2010] ring-1 ring-amber/40" : mine ? "bg-gold/15 dark:bg-[#332a17]" : "bg-paper-card dark:bg-night-2 border border-line dark:border-edge"}`}>
                      <div className="text-[14px]">{m.text}</div>
                      <div className="text-[10.5px] text-ink-3 mt-1 numerals">{m.time}</div>
                    </div>
                    {m.flag && <div className="mt-1 inline-flex items-center gap-1.5 text-[10.5px]"><Icon name="flag" size={10} className="text-rose"/> <span className="text-rose">{m.flag.type}</span></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="font-display text-[15px] mb-3">العلامات (٢)</div>
          <div className="space-y-3">
            {[
              ["تبادل أرقام","عالية","رسالة #٣","rose"],
              ["ضغط للقاء","متوسطة","رسالة #٥","amber"],
            ].map(([t,s,r,tone],i) => (
              <div key={i} className="rounded-xl border border-line dark:border-edge p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[13.5px] font-medium">{t}</div>
                  <Badge tone={tone}>{s}</Badge>
                </div>
                <div className="text-[11.5px] text-ink-3 mb-3">{r}</div>
                <div className="flex gap-2">
                  <button className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg bg-paper-2 dark:bg-night-3">تجاهل</button>
                  <button className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg bg-amber text-white">تحذير</button>
                  <button className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg bg-rose text-white">حظر</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
};

// ---- P52: Reports Queue ----
const PageAdminReports = ({ go }) => {
  const [tab, setTab] = useState("pending");
  const rows = Array.from({length:5},(_,i) => ({
    reporter: sampleNames[i%sampleNames.length],
    reported: sampleNames[(i+2)%sampleNames.length],
    reason: ["لغة غير لائقة","انتحال شخصية","ضغط للقاء","معلومات كاذبة","مضايقة"][i],
    time: ["منذ ١٠ د","منذ ساعة","اليوم","الأمس","الأسبوع"][i],
    id: `REP-${120+i}`,
  }));
  return (
    <AdminShell go={go} current="admin-reports" title="البلاغات" sub="مراجعة وفصل بلاغات المستخدمين">
      <div className="flex items-center gap-2 mb-5">
        {[["pending","معلّقة",rows.length],["review","قيد المراجعة",3],["resolved","تم الحل",148]].map(([id,lbl,n]) => (
          <button key={id} onClick={()=>setTab(id)} className={`px-4 py-2 rounded-xl text-[13.5px] inline-flex items-center gap-2 ${tab===id?"bg-gold text-white":"bg-paper-card dark:bg-night-2 border border-line dark:border-edge text-ink-2 dark:text-fog-2"}`}>{lbl} <span className={`numerals text-[11px] px-1.5 py-0.5 rounded-full ${tab===id?"bg-white/20":"bg-paper-2 dark:bg-night-3"}`}>{n}</span></button>
        ))}
      </div>

      <Card padded={false}>
        <table className="w-full text-[13.5px]">
          <thead className="bg-paper-2 dark:bg-night-3 text-[12px] text-ink-2 dark:text-fog-2">
            <tr>{["#","المُبلِّغ","المُبلَّغ عنه","السبب","الوقت",""].map(h => <th key={h} className="text-right px-4 py-3 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i} className="border-t border-line dark:border-edge hover:bg-paper-2 dark:hover:bg-night-3 cursor-pointer" onClick={()=>go("admin-report-detail")}>
                <td className="px-4 py-3 font-serif-en text-[12px] text-ink-3 numerals">{r.id}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><ProfileAvatar name={r.reporter} size={28}/><span>{r.reporter}</span></div></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><ProfileAvatar name={r.reported} size={28} tone="stone"/><span>{r.reported}</span></div></td>
                <td className="px-4 py-3"><Badge tone="amber">{r.reason}</Badge></td>
                <td className="px-4 py-3 text-ink-2 dark:text-fog-2 text-[12.5px]">{r.time}</td>
                <td className="px-4 py-3"><button className="text-gold text-[12.5px]">عرض</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
};

// ---- P53: Report Detail ----
const PageAdminReportDetail = ({ go }) => (
  <AdminShell go={go} current="admin-reports" title="تفاصيل البلاغ" sub="REP-124 — قيد المراجعة"
    right={<><OutlineButton size="sm" onClick={()=>go("admin-reports")}>العودة</OutlineButton></>}>
    <div className="grid lg:grid-cols-3 gap-5 max-w-6xl">
      <Card>
        <div className="text-[11.5px] text-ink-3 mb-2">المُبلِّغ</div>
        <ProfileAvatar name="أحمد محمود" size={56}/>
        <div className="font-display text-[15.5px] mt-2">أحمد محمود</div>
        <div className="text-[12.5px] text-ink-3">القاهرة • ٢٨ سنة</div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-center">
          <div className="bg-paper-2 dark:bg-night-3 rounded-lg p-2"><div className="text-ink-3">بلاغات سابقة</div><div className="font-serif-en numerals">٠</div></div>
          <div className="bg-paper-2 dark:bg-night-3 rounded-lg p-2"><div className="text-ink-3">منذ</div><div className="numerals">٢٠٢٤</div></div>
        </div>
      </Card>
      <Card>
        <div className="text-[11.5px] text-ink-3 mb-2">المُبلَّغ عنه</div>
        <ProfileAvatar name="زياد خالد" size={56} tone="stone"/>
        <div className="font-display text-[15.5px] mt-2">زياد خالد</div>
        <div className="text-[12.5px] text-ink-3">الجيزة • ٣٢ سنة</div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-center">
          <div className="bg-paper-2 dark:bg-night-3 rounded-lg p-2"><div className="text-ink-3">بلاغات سابقة</div><div className="font-serif-en numerals text-amber">٢</div></div>
          <div className="bg-paper-2 dark:bg-night-3 rounded-lg p-2"><div className="text-ink-3">تحذيرات</div><div className="font-serif-en numerals">١</div></div>
        </div>
      </Card>
      <Card className="lg:col-span-3">
        <div className="font-display text-[16px] mb-2">سبب البلاغ</div>
        <Badge tone="amber">لغة غير لائقة</Badge>
        <p className="mt-3 text-[14px] leading-loose">"المستخدم تجاوز في كلامه واستخدم ألفاظاً غير محترمة بعد رفض طلب التواصل."</p>
        <div className="mt-5">
          <div className="text-[12px] text-ink-3 mb-2">الرسالة المرتبطة</div>
          <div className="rounded-xl bg-rose-soft dark:bg-[#3a1f1f] p-3 text-[13.5px]">"كان لازم تردي بطريقة أحسن..."</div>
        </div>
      </Card>
      <Card className="lg:col-span-3">
        <div className="font-display text-[16px] mb-3">الإجراء</div>
        <TextArea label="ملاحظة الإدارة" placeholder="سبب القرار…" rows={3}/>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <OutlineButton size="sm">رفض البلاغ</OutlineButton>
          <button className="px-4 py-2 rounded-xl bg-amber text-white text-[13px]">إرسال تحذير</button>
          <button className="px-4 py-2 rounded-xl bg-rose text-white text-[13px]">حظر المستخدم</button>
        </div>
      </Card>
    </div>
  </AdminShell>
);

// ---- P54: Banned Words ----
const PageAdminWords = ({ go }) => {
  const rows = [
    { w: "كلمة ١", sev: "high", repl: "***", active: true },
    { w: "كلمة ٢", sev: "medium", repl: "—", active: true },
    { w: "كلمة ٣", sev: "low", repl: "تحذير", active: true },
    { w: "كلمة ٤", sev: "high", repl: "***", active: false },
    { w: "كلمة ٥", sev: "medium", repl: "—", active: true },
  ];
  return (
    <AdminShell go={go} current="admin-words" title="الكلمات المحظورة" sub="ترشيح المحتوى في المحادثات"
      right={<><OutlineButton size="sm" icon={<Icon name="upload" size={14}/>}>استيراد</OutlineButton><OutlineButton size="sm" icon={<Icon name="download" size={14}/>}>تصدير</OutlineButton></>}>
      <Card className="mb-4">
        <div className="flex items-center gap-2 bg-paper-2 dark:bg-night-3 rounded-xl px-3 py-2 mb-3">
          <Icon name="search" size={16} className="text-ink-3"/>
          <input placeholder="ابحث عن كلمة…" className="flex-1 bg-transparent outline-none text-[13.5px]"/>
        </div>
        <div className="flex items-center gap-2">
          <TextField placeholder="أضف كلمة جديدة…" className="flex-1"/>
          <Select options={["خطورة عالية","متوسطة","منخفضة"]} defaultValue="خطورة عالية" className="!w-32"/>
          <GoldButton size="sm">إضافة</GoldButton>
        </div>
      </Card>

      <Card padded={false}>
        <table className="w-full text-[13.5px]">
          <thead className="bg-paper-2 dark:bg-night-3 text-[12px] text-ink-2 dark:text-fog-2">
            <tr>{["الكلمة","الخطورة","الاستبدال","نشط",""].map(h => <th key={h} className="text-right px-4 py-3 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i} className="border-t border-line dark:border-edge">
                <td className="px-4 py-3 font-medium">{r.w}</td>
                <td className="px-4 py-3"><Badge tone={r.sev==="high"?"rose":r.sev==="medium"?"amber":"neutral"}>{r.sev==="high"?"عالية":r.sev==="medium"?"متوسطة":"منخفضة"}</Badge></td>
                <td className="px-4 py-3 text-ink-2 dark:text-fog-2">{r.repl}</td>
                <td className="px-4 py-3"><Toggle checked={r.active} onChange={()=>{}} size="sm"/></td>
                <td className="px-4 py-3"><button className="p-1.5 rounded-lg hover:bg-paper-2 dark:hover:bg-night-3 text-rose"><Icon name="trash" size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
};

// ---- P55: Ice Breakers ----
const PageAdminIceBreakers = ({ go }) => {
  const [tab, setTab] = useState("general");
  const tabs = [["general","عام"],["values","قيم"],["personality","شخصية"],["fun","مرح"],["deep","عميق"]];
  const items = [
    ["ما هي قيمة لا تساومين عليها في حياتك؟", true],
    ["ما الكتاب الذي غيّر طريقتك في التفكير مؤخراً؟", true],
    ["كيف تتخيل يوم جمعة مثالياً؟", true],
    ["ما الصفة التي تتمنى لو يمتلكها شريك حياتك؟", false],
    ["لو رحلت للأبد لمكان واحد، أين سيكون؟", true],
  ];
  return (
    <AdminShell go={go} current="admin-icebreakers" title="محفّزات الحوار" sub="أسئلة بدء المحادثة المقترحة"
      right={<GoldButton size="sm" iconLeft={<Icon name="plus" size={14}/>}>إضافة محفّز</GoldButton>}>
      <div className="flex items-center gap-2 mb-5 overflow-x-auto">
        {tabs.map(([id,lbl]) => (
          <button key={id} onClick={()=>setTab(id)} className={`shrink-0 px-4 py-2 rounded-full text-[13px] border transition ${tab===id?"bg-gold text-white border-gold":"border-line dark:border-edge"}`}>{lbl}</button>
        ))}
      </div>
      <Card padded={false}>
        <div className="divide-y divide-line dark:divide-edge">
          {items.map(([t,active],i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-3">
              <button className="text-ink-3 cursor-grab"><Icon name="drag" size={14}/></button>
              <div className="flex-1 text-[14px]">{t}</div>
              <Toggle checked={active} onChange={()=>{}} size="sm"/>
              <button className="p-1.5 hover:bg-paper-2 dark:hover:bg-night-3 rounded-lg"><Icon name="edit" size={14}/></button>
              <button className="p-1.5 hover:bg-paper-2 dark:hover:bg-night-3 rounded-lg text-rose"><Icon name="trash" size={14}/></button>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-4">
        <div className="font-display text-[15px] mb-3">إضافة محفّز جديد</div>
        <TextArea label="نص المحفّز" placeholder="اكتب سؤالاً يبدأ حواراً صادقاً…" rows={3}/>
        <div className="flex justify-end mt-3"><GoldButton size="sm">إضافة</GoldButton></div>
      </Card>
    </AdminShell>
  );
};

// ---- P56: Conversation Tips ----
const PageAdminTips = ({ go }) => {
  const groups = [
    { trigger: "في بداية المحادثة", tips: ["ابدأ بسؤال يكشف القيم لا الشكليات","تجنّب تبادل الأرقام في البداية"] },
    { trigger: "عند الاختلاف", tips: ["استمع قبل أن تردّ","فرّق بين الاختلاف في الرأي والاختلاف في القيم"] },
    { trigger: "بعد ٧ أيام بدون رسالة", tips: ["تواصل بسؤال بسيط — لا تستعجل"] },
    { trigger: "قبل اللقاء الأول", tips: ["أبلغ شخصاً موثوقاً بالمكان والوقت","اختر مكاناً عاماً ومريحاً"] },
  ];
  return (
    <AdminShell go={go} current="admin-tips" title="نصائح المحادثة" sub="تظهر للمستخدمين داخل المحادثة"
      right={<GoldButton size="sm" iconLeft={<Icon name="plus" size={14}/>}>إضافة نصيحة</GoldButton>}>
      <div className="space-y-4 max-w-4xl">
        {groups.map(g => (
          <Card key={g.trigger}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="info" size={16} className="text-gold"/>
              <div className="font-display text-[14.5px]">{g.trigger}</div>
              <Badge tone="neutral">{g.tips.length} نصائح</Badge>
            </div>
            <div className="space-y-2">
              {g.tips.map((t,i) => (
                <div key={i} className="flex items-center gap-2 bg-paper-2 dark:bg-night-3 rounded-xl px-3 py-2.5">
                  <div className="flex-1 text-[13.5px]">{t}</div>
                  <button className="p-1.5 hover:bg-paper-card dark:hover:bg-night-2 rounded-lg"><Icon name="edit" size={13}/></button>
                  <button className="p-1.5 hover:bg-paper-card dark:hover:bg-night-2 rounded-lg text-rose"><Icon name="trash" size={13}/></button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
};

// ---- P57: Platform Settings ----
const PageAdminSettings = ({ go }) => {
  const groups = [
    { title:"الطلبات", icon:"inbox", items:[
      ["الحد اليومي للطلبات","٥","number"],
      ["الحد الأسبوعي","٢٠","number"],
      ["مدة انتهاء الطلب (أيام)","٧","number"],
    ]},
    { title:"المحادثات", icon:"chat", items:[
      ["حد طول الرسالة","١٠٠٠ حرف","number"],
      ["حد الحظر التلقائي (علامات)","٣","number"],
      ["تنبيهات في الوقت الفعلي","مفعّل","toggle", true],
    ]},
    { title:"المطابقة", icon:"layers", items:[
      ["أقل نسبة للعرض","٦٥٪","number"],
      ["أقصى عدد توافقات/مستخدم","٥٠","number"],
      ["تحديث يومي للنتائج","مفعّل","toggle", true],
    ]},
    { title:"الأمان", icon:"shield", items:[
      ["فلتر الكلمات","مفعّل","toggle", true],
      ["فلتر الأرقام والروابط","مفعّل","toggle", true],
      ["مراجعة بشرية للطلبات","مفعّل","toggle", true],
      ["التحقق من الوجه","إجباري","toggle", true],
    ]},
  ];
  return (
    <AdminShell go={go} current="admin-settings" title="إعدادات المنصة" sub="الإعدادات العامة لتشغيل تَوَافُق">
      <div className="grid lg:grid-cols-2 gap-5 max-w-6xl">
        {groups.map(g => (
          <Card key={g.title}>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-line dark:border-edge">
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center"><Icon name={g.icon} size={18}/></div>
              <div className="font-display text-[16px]">{g.title}</div>
              <button className="ms-auto text-[12.5px] text-gold">حفظ</button>
            </div>
            <div className="space-y-3">
              {g.items.map((row, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="text-[14px]">{row[0]}</div>
                  {row[2]==="toggle" ? <Toggle checked={row[3]} onChange={()=>{}}/> : <div className="font-serif-en numerals text-gold text-[15px]">{row[1]}</div>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
};

// ---- P58: Statistics ----
const PageAdminStats = ({ go }) => {
  const reg = Array.from({length:12},(_,i)=>({m:`ش${i+1}`,v:120+Math.round(Math.sin(i)*60)+i*8}));
  const dist = [{n:"٦٠-٧٠٪",v:120},{n:"٧٠-٨٠٪",v:280},{n:"٨٠-٩٠٪",v:420},{n:"٩٠٪+",v:180}];
  const rev = Array.from({length:12},(_,i)=>({m:`ش${i+1}`,v:18000+Math.round(Math.cos(i)*4000)+i*1500}));
  return (
    <AdminShell go={go} current="admin-stats" title="الإحصائيات" sub="رؤى شاملة عن نشاط المنصة"
      right={<Select options={["كل الوقت","السنة","الشهر","الأسبوع","اليوم"]} defaultValue="السنة" className="!w-36"/>}>
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Card className="lg:col-span-2">
          <SectionHead title="المستخدمون الجدد" sub="عبر السنة"/>
          {LineChart ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={reg}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" strokeOpacity={0.4}/>
                <XAxis dataKey="m" stroke="#9B9B9B" fontSize={11}/>
                <YAxis stroke="#9B9B9B" fontSize={11}/>
                <Tooltip contentStyle={{fontSize:12, borderRadius:12, border:"1px solid #E8E4DC"}}/>
                <Line type="monotone" dataKey="v" stroke="#B8975A" strokeWidth={2.5} dot={{r:3, fill:"#B8975A"}}/>
              </LineChart>
            </ResponsiveContainer>
          ) : <ChartFallback height={220}/>}
        </Card>
        <Card>
          <SectionHead title="إكمال الاستبيان"/>
          <div className="space-y-3">
            {[["لم يبدأ",12],["جزئي",24],["مكتمل ٧٥٪",18],["مكتمل ١٠٠٪",46]].map(([n,v]) => (
              <div key={n}><div className="flex justify-between mb-1 text-[12.5px]"><span>{n}</span><span className="numerals text-gold">{v}٪</span></div><ProgressBar value={v}/></div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Card>
          <SectionHead title="توزيع نسب التوافق"/>
          {BarChart ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" strokeOpacity={0.4}/>
                <XAxis dataKey="n" stroke="#9B9B9B" fontSize={11}/>
                <YAxis stroke="#9B9B9B" fontSize={11}/>
                <Bar dataKey="v" fill="#B8975A" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartFallback height={200}/>}
        </Card>
        <Card>
          <SectionHead title="معدل قبول الطلبات"/>
          <div className="flex items-center justify-center py-4"><ScoreRing value={64} size={140} stroke={10}/></div>
          <div className="text-center text-[12.5px] text-ink-2 dark:text-fog-2">٦٤٪ من الطلبات تنتهي بالقبول</div>
        </Card>
        <Card>
          <SectionHead title="أنواع العلامات الحمراء"/>
          <div className="space-y-2.5 text-[13px]">
            {[["تبادل أرقام",42,"rose"],["لغة غير لائقة",24,"amber"],["ضغط للقاء",18,"amber"],["خروج عن السياق",16,"neutral"]].map(([n,v,t]) => (
              <div key={n} className="flex items-center justify-between bg-paper-2 dark:bg-night-3 rounded-lg px-3 py-2">
                <span>{n}</span>
                <Badge tone={t}><span className="numerals">{v}</span></Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <SectionHead title="الإيرادات الشهرية" sub="ج.م"/>
          {AreaChart ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={rev}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2C5F4A" stopOpacity={0.5}/><stop offset="1" stopColor="#2C5F4A" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" strokeOpacity={0.4}/>
                <XAxis dataKey="m" stroke="#9B9B9B" fontSize={11}/>
                <YAxis stroke="#9B9B9B" fontSize={11}/>
                <Tooltip contentStyle={{fontSize:12, borderRadius:12, border:"1px solid #E8E4DC"}}/>
                <Area type="monotone" dataKey="v" stroke="#2C5F4A" strokeWidth={2.5} fill="url(#rev)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <ChartFallback height={220}/>}
        </Card>
        <Card>
          <SectionHead title="السلامة"/>
          <div className="space-y-3 text-[13px]">
            {[["محادثات معلّمة",112,"amber"],["محظورة آلياً",38,"rose"],["بلاغات مفتوحة",4,"amber"],["حسابات محظورة",26,"rose"]].map(([n,v,t]) => (
              <div key={n} className="flex justify-between items-center">
                <span>{n}</span>
                <Badge tone={t}><span className="numerals font-serif-en">{v}</span></Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
};

// ---- P59: ML Insights ----
const PageAdminML = ({ go }) => {
  const insights = [
    { t: "زيادة وزن الشخصية إلى ٣٠٪", conf: 87, d: "تحليل ٢٠٠٠ زواج ناجح يشير إلى توافق شخصية أهم من نمط الحياة." },
    { t: "تعديل خوارزمية الكشف عن 'الهدوء'", conf: 74, d: "النتائج الحالية متحيزة قليلاً لصور الإضاءة العالية." },
    { t: "إضافة سؤال جديد لتوقعات الإنجاب", conf: 68, d: "هذه نقطة خلاف أساسية بعد القبول، يستحسن استكشافها مبكراً." },
  ];
  return (
    <AdminShell go={go} current="admin-ml" title="رؤى الذكاء الاصطناعي" sub="اقتراحات تحسين مبنية على بيانات المنصة"
      right={<Badge tone="gold">٣ معلّقة</Badge>}>
      <div className="flex items-center gap-2 mb-4">
        <button className="px-3 py-1.5 rounded-full bg-gold text-white text-[12.5px]">معلّقة (٣)</button>
        <button className="px-3 py-1.5 rounded-full border border-line dark:border-edge text-[12.5px]">مطبّقة (١٢)</button>
        <button className="px-3 py-1.5 rounded-full border border-line dark:border-edge text-[12.5px]">مرفوضة (٤)</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        {insights.map(ins => (
          <Card key={ins.t}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <Icon name="sparkles" size={20} className="text-gold"/>
              <Badge tone="green">ثقة <span className="numerals">{ins.conf}</span>٪</Badge>
            </div>
            <div className="font-display text-[15px] leading-relaxed">{ins.t}</div>
            <p className="text-[13px] text-ink-2 dark:text-fog-2 mt-2.5 leading-loose">{ins.d}</p>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line dark:border-edge">
              <OutlineButton size="sm" className="flex-1">رفض</OutlineButton>
              <GoldButton size="sm" className="flex-1">تطبيق</GoldButton>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHead title="دقة النموذج عبر الزمن"/>
        {LineChart ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={Array.from({length:8},(_,i)=>({m:`ش${i+1}`,v:78+Math.round(Math.sin(i)*5)+i}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" strokeOpacity={0.4}/>
              <XAxis dataKey="m" stroke="#9B9B9B" fontSize={11}/>
              <YAxis stroke="#9B9B9B" fontSize={11} domain={[70, 100]}/>
              <Tooltip contentStyle={{fontSize:12, borderRadius:12, border:"1px solid #E8E4DC"}}/>
              <Line type="monotone" dataKey="v" stroke="#2C5F4A" strokeWidth={2.5} dot={{r:3, fill:"#2C5F4A"}}/>
            </LineChart>
          </ResponsiveContainer>
        ) : <ChartFallback height={220}/>}
      </Card>
    </AdminShell>
  );
};

// ---- P60: Activity Logs ----
const PageAdminLogs = ({ go }) => {
  const rows = [
    ["عمر فؤاد","موافقة على طلب","REQ-1842","١٤:٣٢","156.220.x.x"],
    ["مريم خ.","حظر مستخدم","USR-1248","١٣:١٥","156.220.x.x"],
    ["عمر فؤاد","تعديل وزن المطابقة","الشخصية ٢٥→٣٠","١٢:٤٠","156.220.x.x"],
    ["خالد ع.","إضافة كلمة محظورة","كلمة #٢٤","الأمس","156.220.x.x"],
    ["عمر فؤاد","إرسال تحذير","USR-998","الأمس","156.220.x.x"],
    ["مريم خ.","تعديل سؤال","Q-12","منذ يومين","156.220.x.x"],
  ];
  return (
    <AdminShell go={go} current="admin-logs" title="سجل النشاط" sub="عمليات الإدارة عبر النظام"
      right={<OutlineButton size="sm" icon={<Icon name="download" size={14}/>}>تصدير</OutlineButton>}>
      <Card className="mb-4">
        <div className="flex flex-wrap gap-2">
          <Select options={["كل المدراء","عمر فؤاد","مريم خ.","خالد ع."]} defaultValue="كل المدراء" className="!w-40"/>
          <Select options={["كل الأنواع","موافقة","حظر","تعديل","حذف"]} defaultValue="كل الأنواع" className="!w-32"/>
          <Select options={["آخر شهر","الأسبوع","اليوم"]} defaultValue="آخر شهر" className="!w-32"/>
        </div>
      </Card>
      <Card padded={false}>
        <table className="w-full text-[13.5px]">
          <thead className="bg-paper-2 dark:bg-night-3 text-[12px] text-ink-2 dark:text-fog-2">
            <tr>{["المدير","الإجراء","الهدف","الوقت","IP"].map(h => <th key={h} className="text-right px-4 py-3 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i} className="border-t border-line dark:border-edge hover:bg-paper-2 dark:hover:bg-night-3">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><ProfileAvatar name={r[0]} size={28} tone="night"/>{r[0]}</div></td>
                <td className="px-4 py-3"><Badge tone={r[1].includes("حظر")?"rose":r[1].includes("موافقة")?"green":"neutral"}>{r[1]}</Badge></td>
                <td className="px-4 py-3 font-serif-en numerals text-[12px] text-ink-2">{r[2]}</td>
                <td className="px-4 py-3 text-ink-2 dark:text-fog-2 numerals text-[12.5px]">{r[3]}</td>
                <td className="px-4 py-3 font-serif-en numerals text-[12px] text-ink-3">{r[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
};

// ---- P61: Subscription Plans ----
const PageAdminPlans = ({ go }) => {
  const plans = [
    { id:"starter", n:"Starter", p:49, color:"neutral", active:true, features:["عرض المتوافقين","٣ طلبات/شهر","محادثة آمنة"] },
    { id:"pro", n:"Pro", p:99, color:"gold", active:true, popular:true, features:["طلبات غير محدودة","أولوية المطابقة","كشف هوية أسرع"] },
    { id:"premium", n:"Premium", p:199, color:"green", active:true, features:["Profile Boost","تحليلات متقدمة","مستشار شخصي"] },
  ];
  const [edit, setEdit] = useState(null);
  return (
    <AdminShell go={go} current="admin-plans" title="خطط الاشتراك" sub="إدارة خطط Tawafuq المتاحة"
      right={<GoldButton size="sm" iconLeft={<Icon name="plus" size={14}/>}>إضافة خطة</GoldButton>}>
      <div className="grid lg:grid-cols-3 gap-5 max-w-6xl">
        {plans.map(p => (
          <Card key={p.id} className={p.popular?"ring-2 ring-gold":""}>
            <div className="flex items-center justify-between mb-3">
              <Badge tone={p.color}>{p.n}</Badge>
              <Toggle checked={p.active} onChange={()=>{}}/>
            </div>
            <div className="font-serif-en text-4xl numerals">{p.p} <span className="text-base text-ink-2">ج.م</span></div>
            <div className="text-[12px] text-ink-3">شهرياً</div>
            <ul className="mt-4 space-y-1.5 text-[13px]">
              {p.features.map(f => <li key={f} className="flex items-center gap-2"><Icon name="check" size={12} className="text-green"/> {f}</li>)}
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-paper-2 dark:bg-night-3 rounded-lg p-2"><div className="text-ink-3">مشتركون</div><div className="font-serif-en numerals">{p.id==="pro"?842:p.id==="starter"?326:184}</div></div>
              <div className="bg-paper-2 dark:bg-night-3 rounded-lg p-2"><div className="text-ink-3">إيراد/شهر</div><div className="font-serif-en numerals">{Math.round(p.p*(p.id==="pro"?842:p.id==="starter"?326:184)/1000)}K</div></div>
              <div className="bg-paper-2 dark:bg-night-3 rounded-lg p-2"><div className="text-ink-3">معدل البقاء</div><div className="font-serif-en numerals">{p.id==="premium"?92:84}٪</div></div>
            </div>
            <button onClick={()=>setEdit(p)} className="mt-4 w-full px-4 py-2.5 rounded-xl border border-line dark:border-edge text-[13px] hover:bg-paper-2 dark:hover:bg-night-3 inline-flex items-center justify-center gap-2"><Icon name="edit" size={14}/> تعديل الخطة</button>
          </Card>
        ))}
      </div>

      <Modal open={!!edit} onClose={()=>setEdit(null)} title={`تعديل خطة ${edit?.n||""}`}
        footer={<><OutlineButton onClick={()=>setEdit(null)}>إلغاء</OutlineButton><GoldButton onClick={()=>setEdit(null)}>حفظ</GoldButton></>}>
        <div className="space-y-3">
          <TextField label="اسم الخطة" defaultValue={edit?.n}/>
          <TextField label="السعر (ج.م/شهر)" type="number" defaultValue={edit?.p}/>
          <TextArea label="الميزات (سطر لكل ميزة)" defaultValue={edit?.features?.join("\n")}/>
          <div className="flex items-center justify-between"><span className="text-[14px]">الأكثر شعبية</span><Toggle checked={edit?.popular||false} onChange={()=>{}}/></div>
          <div className="flex items-center justify-between"><span className="text-[14px]">نشطة</span><Toggle checked={edit?.active||false} onChange={()=>{}}/></div>
        </div>
      </Modal>
    </AdminShell>
  );
};

// ---- P62: Subscribers ----
const PageAdminSubs = ({ go }) => {
  const rows = Array.from({length:8},(_,i)=>({
    name: sampleNames[i%sampleNames.length], plan: ["Pro","Starter","Premium"][i%3], start:"١٢ مارس", expiry:"١٢ يونيو",
    status: i===5?"expired":"active", rev: [99,49,199][i%3],
  }));
  return (
    <AdminShell go={go} current="admin-subs" title="المشتركون" sub="١,٣٥٢ مشترك نشط"
      right={<OutlineButton size="sm" icon={<Icon name="download" size={14}/>}>تصدير</OutlineButton>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          ["مشتركون نشطون","1,352","users","gold"],
          ["Pro","842","crown","gold"],
          ["Premium","184","diamond","green"],
          ["إيراد متكرر شهري","138K","coin","amber"],
        ].map(([l,v,icn,tone]) => (
          <Card key={l} className="!p-4">
            <div className={`w-9 h-9 rounded-xl mb-2 flex items-center justify-center ${tone==="gold"?"bg-gold/10 text-gold":tone==="green"?"bg-green/10 text-green":"bg-amber-soft text-amber"}`}><Icon name={icn} size={16}/></div>
            <div className="font-serif-en text-2xl numerals">{v}</div>
            <div className="text-[11.5px] text-ink-2 dark:text-fog-2">{l}</div>
          </Card>
        ))}
      </div>
      <Card padded={false}>
        <table className="w-full text-[13.5px]">
          <thead className="bg-paper-2 dark:bg-night-3 text-[12px] text-ink-2 dark:text-fog-2">
            <tr>{["المستخدم","الخطة","البداية","الانتهاء","الحالة","الإيراد"].map(h => <th key={h} className="text-right px-4 py-3 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i} className="border-t border-line dark:border-edge hover:bg-paper-2 dark:hover:bg-night-3">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><ProfileAvatar name={r.name} size={28}/>{r.name}</div></td>
                <td className="px-4 py-3"><Badge tone={r.plan==="Pro"?"gold":r.plan==="Premium"?"green":"neutral"}>{r.plan}</Badge></td>
                <td className="px-4 py-3 numerals text-ink-2 dark:text-fog-2">{r.start}</td>
                <td className="px-4 py-3 numerals text-ink-2 dark:text-fog-2">{r.expiry}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status==="active"?"active":"expired"}/></td>
                <td className="px-4 py-3 font-serif-en numerals">{r.rev} ج.م</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
};

// ---- P63: Revenue ----
const PageAdminRevenue = ({ go }) => {
  const data = Array.from({length:30},(_,i)=>({d:i+1, v:6000+Math.round(Math.sin(i/3)*1500)+i*120}));
  const dist = [{n:"Pro",v:62,c:"#B8975A"},{n:"Starter",v:24,c:"#9B9B9B"},{n:"Premium",v:14,c:"#2C5F4A"}];
  const failed = [
    ["أحمد م.","Pro","99 ج.م","Card declined","اليوم"],
    ["سارة ع.","Premium","199 ج.م","Insufficient funds","الأمس"],
  ];
  return (
    <AdminShell go={go} current="admin-revenue" title="الإيرادات" sub="مالية المنصة">
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Card>
          <div className="text-[12.5px] text-ink-2 dark:text-fog-2">MRR — الإيراد الشهري المتكرر</div>
          <div className="font-serif-en text-3xl numerals mt-1.5">138,420 <span className="text-base text-ink-2">ج.م</span></div>
          <div className="text-[12px] text-green mt-1.5 inline-flex items-center gap-1"><Icon name="arrowLeft" size={12} className="rotate-45"/> +14٪ شهرياً</div>
        </Card>
        <Card>
          <div className="text-[12.5px] text-ink-2 dark:text-fog-2">ARR — الإيراد السنوي المتوقع</div>
          <div className="font-serif-en text-3xl numerals mt-1.5">1,661,040 <span className="text-base text-ink-2">ج.م</span></div>
          <div className="text-[12px] text-ink-3 mt-1.5">مبني على معدل الاحتفاظ ٨٤٪</div>
        </Card>
        <Card>
          <div className="text-[12.5px] text-ink-2 dark:text-fog-2">إيراد اليوم</div>
          <div className="font-serif-en text-3xl numerals mt-1.5">9,840 <span className="text-base text-ink-2">ج.م</span></div>
          <div className="text-[12px] text-green mt-1.5">+ ٢١ اشتراك جديد</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Card className="lg:col-span-2">
          <SectionHead title="إيرادات آخر ٣٠ يوماً"/>
          {AreaChart ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data}>
                <defs><linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B8975A" stopOpacity={0.4}/><stop offset="1" stopColor="#B8975A" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" strokeOpacity={0.4}/>
                <XAxis dataKey="d" stroke="#9B9B9B" fontSize={11}/>
                <YAxis stroke="#9B9B9B" fontSize={11}/>
                <Tooltip contentStyle={{fontSize:12, borderRadius:12, border:"1px solid #E8E4DC"}}/>
                <Area type="monotone" dataKey="v" stroke="#B8975A" strokeWidth={2.5} fill="url(#rev2)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <ChartFallback height={240}/>}
        </Card>
        <Card>
          <SectionHead title="توزيع الخطط"/>
          {PieChart ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dist} dataKey="v" nameKey="n" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {dist.map((d,i)=><Cell key={i} fill={d.c}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : <ChartFallback height={200}/>}
        </Card>
      </div>

      <Card>
        <SectionHead title="مدفوعات فاشلة" sub="تحتاج إعادة محاولة"/>
        <table className="w-full text-[13.5px]">
          <thead className="text-[12px] text-ink-2 dark:text-fog-2">
            <tr>{["المستخدم","الخطة","المبلغ","السبب","الوقت"].map(h => <th key={h} className="text-right py-2 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {failed.map((r,i) => (
              <tr key={i} className="border-t border-line dark:border-edge">
                <td className="py-3">{r[0]}</td>
                <td className="py-3"><Badge tone="gold">{r[1]}</Badge></td>
                <td className="py-3 font-serif-en numerals">{r[2]}</td>
                <td className="py-3"><Badge tone="rose">{r[3]}</Badge></td>
                <td className="py-3 text-ink-3">{r[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
};

window.PagesAdmin = {
  PageAdminDashboard, PageAdminUsers, PageAdminUserDetail, PageAdminQuestions, PageAdminQuestionEdit,
  PageAdminWeights, PageAdminTraits, PageAdminRequests, PageAdminFlags, PageAdminChatView, PageAdminReports,
  PageAdminReportDetail, PageAdminWords, PageAdminIceBreakers, PageAdminTips, PageAdminSettings,
  PageAdminStats, PageAdminML, PageAdminLogs, PageAdminPlans, PageAdminSubs, PageAdminRevenue,
};
Object.assign(window, window.PagesAdmin);
