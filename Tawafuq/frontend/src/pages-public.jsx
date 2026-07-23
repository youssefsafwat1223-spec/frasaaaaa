// =============== Public Pages: P1-P6 ===============

// ---- P1: Landing ----
const PageLanding = ({ go }) => {
  return (
    <div className="min-h-screen bg-paper dark:bg-night">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-paper/80 dark:bg-night/80 backdrop-blur-md border-b border-line/60 dark:border-edge/60">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <Logo/>
          <nav className="hidden md:flex items-center gap-7 text-[14px] text-ink-2 dark:text-fog-2">
            <a className="hover:text-gold">كيف يعمل</a>
            <a className="hover:text-gold">الخصوصية</a>
            <a className="hover:text-gold cursor-pointer" onClick={()=>go("pricing")}>الأسعار</a>
            <a className="hover:text-gold">الأسئلة الشائعة</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={()=>go("login")} className="text-[14px] text-ink dark:text-fog hover:text-gold px-3 py-2">دخول</button>
            <GoldButton size="sm" onClick={()=>go("register")}>ابدأ الآن</GoldButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -right-32 w-[480px] h-[480px] rounded-full bg-gold/10 blur-3xl"/>
          <div className="absolute bottom-0 -left-40 w-[420px] h-[420px] rounded-full bg-green/10 blur-3xl"/>
        </div>
        <div className="relative max-w-6xl mx-auto px-5 lg:px-8 pt-16 pb-24 lg:pt-28 lg:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-paper-2 dark:bg-night-2 border border-line dark:border-edge text-[12.5px] text-ink-2 dark:text-fog-2 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-gold"/> منصة جادة للزواج — ليست تطبيق تعارف
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl leading-[1.15] tracking-tight max-w-3xl mx-auto">
            اكتشف <span className="text-gold">توافقك الحقيقي</span>
            <br/>قبل أن تبدأ القصة.
          </h1>
          <p className="mt-6 text-[16px] sm:text-[18px] text-ink-2 dark:text-fog-2 max-w-2xl mx-auto leading-loose">
            استبيان عميق، تحليل ذكي للملامح، ومطابقة قائمة على القيم والشخصية ونمط الحياة — لتلتقي بشخصٍ يناسبك فعلاً، لا بالصورة فقط.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <GoldButton size="lg" onClick={()=>go("register")}>ابدأ رحلتك مجاناً</GoldButton>
            <OutlineButton size="lg" onClick={()=>go("pricing")}>تصفح الخطط</OutlineButton>
          </div>
          <div className="mt-10 flex items-center justify-center gap-8 text-[12.5px] text-ink-3">
            <span className="flex items-center gap-2"><Icon name="shield" size={14}/> خصوصية كاملة</span>
            <span className="flex items-center gap-2"><Icon name="checkCircle" size={14}/> مراجعة بشرية</span>
            <span className="flex items-center gap-2"><Icon name="mosque" size={14}/> مبادئ محترمة</span>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-5 lg:px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: "list",     title: "استبيان شخصي عميق", text: "٤٠ سؤالاً في ٤ أقسام تكشف قيمك وشخصيتك ونمط حياتك وتوقعاتك من الزواج." , badge: "١٠ دقائق"},
            { icon: "sparkles", title: "تحليل الملامح بالذكاء", text: "نموذج فراسة محترم يستخرج انطباعاً أولياً من ملامحك لإثراء التوافق — لا للحكم.", badge: "اختياري" },
            { icon: "handshake",title: "مطابقة ذكية",         text: "خوارزمية تزن القيم بـ٤٠٪، الشخصية ٢٥٪، نمط الحياة ٢٠٪، والمظهر ١٥٪.", badge: "نتائج فورية" },
          ].map(f => (
            <Card key={f.title} className="hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center mb-5"><Icon name={f.icon} size={22}/></div>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">{f.title}</h3>
                <Badge tone="gold">{f.badge}</Badge>
              </div>
              <p className="mt-2.5 text-ink-2 dark:text-fog-2 text-[14.5px] leading-loose">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-paper-2 dark:bg-night-2 border-y border-line dark:border-edge">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-20">
          <div className="text-center mb-12">
            <div className="text-[12px] tracking-[0.3em] text-gold mb-2 uppercase">كيف يعمل</div>
            <h2 className="font-display text-3xl lg:text-4xl">من التسجيل إلى اللقاء — أربع خطوات</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              ["أنشئ ملفك", "اسم، عمر، مدينة، هدف زواجك — بدون التزامات."],
              ["أكمل الاستبيان", "أربعون سؤالاً تستغرق عشر دقائق فقط."],
              ["حلّل ملامحك", "ثلاث صور بإضاءة جيدة، تُحلّل ثم تُحذف."],
              ["اكتشف المتوافقين", "نعرض من يناسبك فعلاً، بنسبٍ مفصّلة."],
            ].map(([t,d], i) => (
              <Card key={t} className="text-center">
                <div className="font-serif-en text-3xl text-gold/40 mb-2">0{i+1}</div>
                <div className="font-display text-lg mb-1.5">{t}</div>
                <p className="text-ink-2 dark:text-fog-2 text-[13.5px] leading-loose">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-6xl mx-auto px-5 lg:px-8 py-20">
        <div className="text-center mb-10">
          <div className="text-[12px] tracking-[0.3em] text-gold mb-2 uppercase">خطط واضحة</div>
          <h2 className="font-display text-3xl lg:text-4xl">التحليل مجاني. نعرض المطابقات فقط عند الاشتراك.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          <Card>
            <Badge tone="neutral">مجاني</Badge>
            <div className="font-display text-2xl mt-3 mb-1">استكشف نفسك</div>
            <div className="numerals font-serif-en text-4xl mt-2">٠ <span className="text-base text-ink-2">ج.م</span></div>
            <ul className="mt-5 space-y-2.5 text-[14px]">
              {["استبيان كامل","تحليل ملامح","تقرير شخصي مفصّل","نسبة جاهزية للزواج"].map(l => (
                <li key={l} className="flex items-center gap-2.5 text-ink-2 dark:text-fog-2"><Icon name="check" size={14} className="text-green"/> {l}</li>
              ))}
            </ul>
            <OutlineButton className="mt-6 w-full" onClick={()=>go("register")}>ابدأ مجاناً</OutlineButton>
          </Card>
          <Card className="ring-2 ring-gold relative">
            <span className="absolute -top-3 right-5 px-3 py-1 rounded-full bg-gold text-white text-[11px]">الأكثر شعبية</span>
            <Badge tone="gold">Pro</Badge>
            <div className="font-display text-2xl mt-3 mb-1">قابل المتوافقين</div>
            <div className="numerals font-serif-en text-4xl mt-2">٩٩ <span className="text-base text-ink-2">ج.م / شهر</span></div>
            <ul className="mt-5 space-y-2.5 text-[14px]">
              {["كل ما في المجاني","عرض كل التوافقات","طلبات تواصل غير محدودة","محادثة آمنة مع تنبيهات","أولوية في المطابقة"].map(l => (
                <li key={l} className="flex items-center gap-2.5"><Icon name="check" size={14} className="text-gold"/> {l}</li>
              ))}
            </ul>
            <GoldButton className="mt-6 w-full" onClick={()=>go("pricing")}>اشترك الآن</GoldButton>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-paper-2 dark:bg-night-2 border-y border-line dark:border-edge">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-20">
          <div className="text-center mb-10">
            <div className="text-[12px] tracking-[0.3em] text-gold mb-2 uppercase">تجارب حقيقية</div>
            <h2 className="font-display text-3xl">قصص بدأت بتوافق صادق</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: "نور و كريم", c: "القاهرة", t: "اتعرفنا عبر تَوَافُق وكان فيه احترام من أول لحظة. اتخطبنا بعد ٥ شهور.", s: 92 },
              { n: "هند و محمود", c: "الإسكندرية", t: "النسب ساعدتني أفهم نفسي قبل ما أفهم شريكي. تجربة جادة بصدق.", s: 88 },
              { n: "سارة و زياد", c: "الجيزة", t: "اللي عجبني إن مفيش ضغط — كل خطوة محترمة وفيها وقت تفكير.", s: 95 },
            ].map(s => (
              <Card key={s.n}>
                <div className="flex items-center gap-3 mb-3">
                  <ProfileAvatar name={s.n} size={48} tone="green"/>
                  <div>
                    <div className="font-medium">{s.n}</div>
                    <div className="text-[12px] text-ink-2 dark:text-fog-2 flex items-center gap-1"><Icon name="location" size={12}/> {s.c}</div>
                  </div>
                  <Badge tone="gold" className="mr-auto">{s.s}٪</Badge>
                </div>
                <p className="text-[14.5px] leading-loose text-ink dark:text-fog">"{s.t}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 lg:px-8 py-20 text-center">
        <h2 className="font-display text-3xl lg:text-5xl leading-tight">جاهز لتلتقي بمن يفهمك حقاً؟</h2>
        <p className="mt-4 text-ink-2 dark:text-fog-2 max-w-xl mx-auto">ابدأ بالتسجيل المجاني — التحليل لا يستغرق أكثر من ربع ساعة.</p>
        <div className="mt-7"><GoldButton size="lg" onClick={()=>go("register")}>ابدأ رحلتك مجاناً</GoldButton></div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line dark:border-edge bg-paper-card dark:bg-night-2">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-12 grid md:grid-cols-4 gap-8 text-[13.5px] text-ink-2 dark:text-fog-2">
          <div className="md:col-span-1">
            <Logo/>
            <p className="mt-3 leading-loose">منصة جادة للتوافق الزواجي، تجمع علم الشخصية بالذكاء الاصطناعي والاحترام لقيم مجتمعنا.</p>
          </div>
          {[
            ["المنصة", ["كيف يعمل","الأسعار","الخصوصية","الشروط"]],
            ["الشركة", ["من نحن","المدونة","الوظائف","تواصل معنا"]],
            ["الدعم", ["مركز المساعدة","الأسئلة الشائعة","التحقق من الحساب","الإبلاغ"]],
          ].map(([t, items]) => (
            <div key={t}>
              <div className="font-medium text-ink dark:text-fog mb-3">{t}</div>
              <ul className="space-y-2">{items.map(i => <li key={i}><a className="hover:text-gold">{i}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="border-t border-line dark:border-edge">
          <div className="max-w-6xl mx-auto px-5 lg:px-8 py-5 text-[12px] text-ink-3 flex items-center justify-between">
            <span>© ٢٠٢٦ تَوَافُق — جميع الحقوق محفوظة</span>
            <span>صُنع بعناية في القاهرة</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ---- Auth shell ----
const AuthShell = ({ title, sub, children, footer, go }) => (
  <div className="min-h-screen bg-paper dark:bg-night flex flex-col">
    <div className="px-5 lg:px-8 py-5 flex items-center justify-between">
      <button onClick={()=>go("landing")} className="inline-flex"><Logo/></button>
      <button onClick={()=>go("landing")} className="text-[13px] text-ink-2 dark:text-fog-2 hover:text-gold inline-flex items-center gap-1"><Icon name="arrowRight" size={14}/> العودة للرئيسية</button>
    </div>
    <div className="flex-1 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-center">{title}</h1>
        {sub && <p className="text-center text-ink-2 dark:text-fog-2 mt-2 text-[14px]">{sub}</p>}
        <Card className="mt-8">{children}</Card>
        {footer && <div className="text-center mt-5 text-[14px] text-ink-2 dark:text-fog-2">{footer}</div>}
      </div>
    </div>
  </div>
);

// ---- P2: Register ----
const PageRegister = ({ go }) => {
  const [mode, setMode] = useState("phone");
  const [show, setShow] = useState(false);
  return (
    <AuthShell go={go} title="إنشاء حساب جديد" sub="ابدأ رحلتك في خطوات بسيطة"
      footer={<>لديك حساب؟ <a onClick={()=>go("login")} className="text-gold cursor-pointer">سجل دخول</a></>}>
      <div className="flex bg-paper-2 dark:bg-night-3 p-1 rounded-xl text-[13px] mb-5">
        {[["phone","رقم الجوال","phone"],["email","البريد الإلكتروني","mail"]].map(([id,lbl,icn]) => (
          <button key={id} onClick={()=>setMode(id)} className={`flex-1 py-2 rounded-lg inline-flex items-center justify-center gap-2 transition ${mode===id?"bg-paper-card dark:bg-night-2 text-ink dark:text-fog shadow-soft":"text-ink-2 dark:text-fog-2"}`}>
            <Icon name={icn} size={14}/> {lbl}
          </button>
        ))}
      </div>

      <div className="space-y-3.5">
        {mode==="phone" ? (
          <TextField label="رقم الجوال" placeholder="١٠٠ ١٢٣ ٤٥٦٧" icon={<span className="text-[13px] text-ink-2">+٢٠</span>}/>
        ) : (
          <TextField label="البريد الإلكتروني" placeholder="you@example.com" icon={<Icon name="mail" size={16}/>} type="email"/>
        )}
        <TextField label="كلمة المرور" type={show?"text":"password"} placeholder="٨ أحرف على الأقل" icon={<Icon name="lock" size={16}/>}/>
        <TextField label="تأكيد كلمة المرور" type={show?"text":"password"} placeholder="أعد كتابتها" icon={<Icon name="lock" size={16}/>}/>
        <button type="button" onClick={()=>setShow(!show)} className="text-[12.5px] text-ink-2 dark:text-fog-2 inline-flex items-center gap-1.5 hover:text-gold">
          <Icon name={show?"eyeOff":"eye"} size={14}/> {show?"إخفاء":"إظهار"} كلمة المرور
        </button>
        <GoldButton className="w-full mt-2" onClick={()=>go("otp")}>إنشاء الحساب</GoldButton>
        <div className="text-[12px] text-ink-3 text-center leading-loose mt-2">
          بإنشاء حسابك فإنك توافق على <a className="text-gold">الشروط</a> و<a className="text-gold">سياسة الخصوصية</a>
        </div>
      </div>
    </AuthShell>
  );
};

// ---- P3: Login ----
const PageLogin = ({ go }) => {
  const [show, setShow] = useState(false);
  return (
    <AuthShell go={go} title="مرحباً بعودتك" sub="سجل دخولك لمتابعة رحلتك"
      footer={<>ليس لديك حساب؟ <a onClick={()=>go("register")} className="text-gold cursor-pointer">أنشئ حساباً</a></>}>
      <div className="space-y-3.5">
        <TextField label="البريد أو رقم الجوال" placeholder="you@example.com" icon={<Icon name="user" size={16}/>}/>
        <TextField label="كلمة المرور" type={show?"text":"password"} placeholder="••••••••" icon={<Icon name="lock" size={16}/>}/>
        <div className="flex items-center justify-between text-[13px]">
          <Checkbox checked={true} onChange={()=>{}} label="تذكرني"/>
          <a onClick={()=>go("forgot")} className="text-gold cursor-pointer">نسيت كلمة المرور؟</a>
        </div>
        <GoldButton className="w-full mt-2" onClick={()=>go("dashboard")}>تسجيل الدخول</GoldButton>
        <div className="relative my-4 text-center">
          <span className="text-[12px] text-ink-3 bg-paper-card dark:bg-night-2 px-3 relative z-10">أو</span>
          <span className="absolute top-1/2 inset-x-0 h-px bg-line dark:bg-edge"/>
        </div>
        <button className="w-full py-3 rounded-xl border border-line dark:border-edge text-[14px] hover:bg-paper-2 dark:hover:bg-night-3 inline-flex items-center justify-center gap-2"><Icon name="phone" size={16}/> الدخول برمز OTP</button>
      </div>
    </AuthShell>
  );
};

// ---- P4: OTP ----
const PageOTP = ({ go }) => {
  const [digits, setDigits] = useState(["","","","","",""]);
  const [seconds, setSeconds] = useState(54);
  const refs = useRef([]);
  useEffect(() => { if (seconds <= 0) return; const t = setTimeout(() => setSeconds(s=>s-1), 1000); return () => clearTimeout(t); }, [seconds]);
  const setD = (i, v) => {
    if (v && !/^\d$/.test(v)) return;
    const arr = [...digits]; arr[i] = v; setDigits(arr);
    if (v && i < 5) refs.current[i+1]?.focus();
  };
  const filled = digits.every(d => d);
  return (
    <AuthShell go={go} title="التحقق من حسابك" sub="أدخل الرمز المُرسل إلى ٠١٠٠ ٠٠٠ ••٤٧">
      <div className="text-center mb-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gold/10 text-gold flex items-center justify-center"><Icon name="shield" size={28}/></div>
      </div>
      <div dir="ltr" className="flex items-center justify-center gap-2.5 mb-6">
        {digits.map((d, i) => (
          <input key={i} ref={el => refs.current[i] = el} value={d} onChange={e=>setD(i, e.target.value.slice(-1))}
            onKeyDown={e => { if (e.key==="Backspace" && !digits[i] && i>0) refs.current[i-1]?.focus(); }}
            maxLength={1} inputMode="numeric"
            className={`w-12 h-14 rounded-xl border-2 bg-paper-card dark:bg-night-3 text-center font-serif-en text-2xl outline-none transition-all ${d?"border-gold":"border-line dark:border-edge"} focus:border-gold`}/>
        ))}
      </div>
      <div className="text-center text-[13px] text-ink-2 dark:text-fog-2 mb-5 numerals">
        {seconds > 0 ? <>إعادة الإرسال خلال <span className="text-gold">{String(seconds).padStart(2,"0")}</span> ث</> : <a className="text-gold cursor-pointer">إعادة الإرسال</a>}
      </div>
      <GoldButton className="w-full" disabled={!filled} onClick={()=>go("consent")}>تأكيد</GoldButton>
      <div className="text-center mt-4 text-[13px] text-ink-2 dark:text-fog-2"><a onClick={()=>go("register")} className="text-gold cursor-pointer">تعديل رقم الجوال</a></div>
    </AuthShell>
  );
};

// ---- P5: Forgot Password ----
const PageForgot = ({ go }) => (
  <AuthShell go={go} title="نسيت كلمة المرور" sub="سنرسل لك رابطاً لإعادة التعيين"
    footer={<a onClick={()=>go("login")} className="text-gold cursor-pointer">العودة لتسجيل الدخول</a>}>
    <div className="space-y-4">
      <TextField label="البريد أو رقم الجوال" placeholder="you@example.com" icon={<Icon name="mail" size={16}/>}/>
      <GoldButton className="w-full" onClick={()=>go("reset")}>إرسال الرابط</GoldButton>
    </div>
  </AuthShell>
);

// ---- P6: Reset Password ----
const PageReset = ({ go }) => (
  <AuthShell go={go} title="كلمة مرور جديدة" sub="اختر كلمة مرور قوية تتذكرها">
    <div className="space-y-3.5">
      <TextField label="كلمة المرور الجديدة" type="password" icon={<Icon name="lock" size={16}/>}/>
      <TextField label="تأكيد كلمة المرور" type="password" icon={<Icon name="lock" size={16}/>}/>
      <div className="bg-paper-2 dark:bg-night-3 rounded-xl p-3 text-[12.5px] text-ink-2 dark:text-fog-2 space-y-1.5">
        <div className="flex items-center gap-1.5"><Icon name="check" size={12} className="text-green"/> ٨ أحرف على الأقل</div>
        <div className="flex items-center gap-1.5"><Icon name="check" size={12} className="text-green"/> حرف كبير وصغير</div>
        <div className="flex items-center gap-1.5"><Icon name="x" size={12} className="text-ink-3"/> رقم واحد على الأقل</div>
      </div>
      <GoldButton className="w-full" onClick={()=>go("login")}>حفظ كلمة المرور</GoldButton>
    </div>
  </AuthShell>
);

window.PagesPublic = { PageLanding, PageRegister, PageLogin, PageOTP, PageForgot, PageReset };
Object.assign(window, window.PagesPublic);
