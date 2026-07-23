// =============== Subscription Pages: P31-P35 ===============

// ---- P31: Pricing ----
const PagePricing = ({ go }) => {
  const [annual, setAnnual] = useState(false);
  const plans = [
    {
      id: "basic", name: "Basic", price: 79, color: "neutral",
      tagline: "تحليل سريع وعملي",
      questions: "30-45",
      traits: 155,
      coverage: "26%",
      features: [
        "كل ميزات الـ Matching (مطابقات + شات + طلبات)",
        "30-45 سؤال شخصية إضافي",
        "تصوير الوجه (38 قياس)",
        "تحليل سريع: 155 سمة شخصية",
        "تقرير توافق بسيط مع المطابقات",
      ],
    },
    {
      id: "advanced", name: "Advanced", price: 149, color: "gold", popular: true,
      tagline: "الأكثر اختياراً — تحليل أعمق",
      questions: "50-80",
      traits: 287,
      coverage: "48%",
      features: [
        "كل ميزات Basic",
        "50-80 سؤال شخصية إضافي",
        "تحليل أعمق: 287 سمة شخصية",
        "تقرير توافق تفصيلي (8 محاور كاملة)",
        "كشف نمط التعلق والـ Dark Triad",
        "أولوية في عرض المطابقات",
      ],
    },
    {
      id: "premium", name: "Premium", price: 249, color: "green",
      tagline: "التجربة الكاملة",
      questions: "80-100",
      traits: 317,
      coverage: "53%",
      features: [
        "كل ميزات Advanced",
        "80-100 سؤال شخصية إضافي",
        "تحليل شامل: 317 سمة من علم الفراسة",
        "تقرير مفصّل بقراءة كاملة لشخصيتك",
        "Matching محسَّن بدمج بيانات السمات",
        "أولوية قصوى + دعم 24/7",
        "تحديثات التحليل مع تطوّر النظام",
      ],
    },
  ];
  const factor = annual ? 0.8 : 1;
  const suffix = annual ? " /شهر — يُحسب سنوياً" : " /شهر";

  return (
    <div className="min-h-screen bg-paper dark:bg-night">
      <div className="px-5 lg:px-8 py-5 flex items-center justify-between border-b border-line/60 dark:border-edge/60">
        <button onClick={()=>go("dashboard")} className="inline-flex"><Logo/></button>
        <button onClick={()=>go("dashboard")} className="text-[13px] text-ink-2 dark:text-fog-2 hover:text-gold">العودة</button>
      </div>

      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-12 lg:py-16">

        {/* HERO — يربط الـ free experience بالـ paywall */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="text-[12px] tracking-[0.3em] text-gold mb-2 uppercase">الاشتراك</div>
          <h1 className="font-display text-4xl leading-tight">من نسبة توافق بسيطة إلى <span className="text-gold">قراءة كاملة لشخصيتك</span></h1>
          <p className="text-ink-2 dark:text-fog-2 mt-4 leading-loose text-[15px]">
            حصلت مجاناً على إشعار بأن هناك توافقات لك. الاشتراك يكشف لك:
            <br/>
            <span className="text-ink dark:text-fog">من هم هؤلاء الأشخاص</span> ·
            <span className="text-ink dark:text-fog"> كيف تتوافقون</span> ·
            <span className="text-ink dark:text-fog"> ما الذي يميّز شخصيتك</span>
          </p>

          {/* الإطار: الـ free vs paid */}
          <div className="grid sm:grid-cols-2 gap-3 mt-7 text-right">
            <Card className="!p-4 !bg-paper-2 dark:!bg-night-2">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="lock" size={14} className="text-ink-3"/>
                <span className="text-[11.5px] tracking-wider text-ink-3 uppercase">مجاناً</span>
              </div>
              <ul className="space-y-1.5 text-[13px] text-ink-2 dark:text-fog-2">
                <li>• إشعار "في توافقات لك"</li>
                <li>• استقبال طلبات + 10 رسائل شات</li>
                <li>• نسبة توافق فقط (بدون تفاصيل)</li>
              </ul>
            </Card>
            <Card className="!p-4 ring-1 ring-gold/30">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="crown" size={14} className="text-gold"/>
                <span className="text-[11.5px] tracking-wider text-gold uppercase">مع الاشتراك</span>
              </div>
              <ul className="space-y-1.5 text-[13px]">
                <li>• رؤية المطابقات بالأسماء والصور</li>
                <li>• شات بلا حدود + إرسال طلبات</li>
                <li>• <b className="text-gold">تحليل سمات شخصيتك (155-317 سمة)</b></li>
                <li>• <b className="text-gold">تقرير توافق تفصيلي مع كل شخص</b></li>
              </ul>
            </Card>
          </div>

          {/* Toggle شهري / سنوي */}
          <div className="inline-flex items-center gap-3 bg-paper-2 dark:bg-night-2 p-1 rounded-full mt-9 text-[13px]">
            <button onClick={()=>setAnnual(false)} className={`px-4 py-2 rounded-full transition ${!annual?"bg-paper-card dark:bg-night-3 shadow-soft":""}`}>شهري</button>
            <button onClick={()=>setAnnual(true)}  className={`px-4 py-2 rounded-full transition flex items-center gap-2 ${annual?"bg-paper-card dark:bg-night-3 shadow-soft":""}`}>سنوي <Badge tone="green">-20%</Badge></button>
          </div>
        </div>

        {/* PLAN CARDS */}
        <div className="grid lg:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto">
          {plans.map(p => {
            const pop = p.popular;
            return (
              <Card key={p.id} className={`relative ${pop?"ring-2 ring-gold lg:scale-105 lg:-mt-2":""} !p-7`}>
                {pop && <span className="absolute -top-3.5 right-7 px-3 py-1.5 rounded-full bg-gold text-white text-[11px] tracking-wider">الأكثر شعبية</span>}
                <Badge tone={p.color==="gold"?"gold":p.color==="green"?"green":"neutral"}>{p.name}</Badge>
                <div className="font-display text-xl mt-3 leading-snug">{p.tagline}</div>

                {/* الأرقام الرئيسية */}
                <div className="mt-4 flex items-end gap-2">
                  <div className="font-serif-en text-5xl numerals">{Math.round(p.price*factor)}</div>
                  <div className="text-[13px] text-ink-2 dark:text-fog-2 pb-2">ج.م<span className="block text-[11px] text-ink-3">{suffix}</span></div>
                </div>

                {/* Stats bar — يوضح القيمة فوراً */}
                <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-line dark:border-edge">
                  <div className="text-center">
                    <div className="font-serif-en text-lg numerals">{p.questions}</div>
                    <div className="text-[10.5px] text-ink-3 mt-0.5">سؤال</div>
                  </div>
                  <div className="text-center border-r border-l border-line dark:border-edge">
                    <div className="font-serif-en text-lg numerals">{p.traits}</div>
                    <div className="text-[10.5px] text-ink-3 mt-0.5">سمة</div>
                  </div>
                  <div className="text-center">
                    <div className="font-serif-en text-lg numerals">{p.coverage}</div>
                    <div className="text-[10.5px] text-ink-3 mt-0.5">تغطية</div>
                  </div>
                </div>

                {/* Features list */}
                <ul className="mt-5 space-y-2.5 text-[13.5px]">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Icon name="check" size={15} className={`shrink-0 mt-0.5 ${p.color==="gold"?"text-gold":p.color==="green"?"text-green":"text-ink-2"}`}/>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {pop ? (
                  <GoldButton className="w-full mt-7" onClick={()=>go("payment")}>اشترك في Advanced</GoldButton>
                ) : p.color === "green" ? (
                  <GreenButton className="w-full mt-7" onClick={()=>go("payment")}>اشترك في {p.name}</GreenButton>
                ) : (
                  <OutlineButton className="w-full mt-7" onClick={()=>go("payment")}>اختر {p.name}</OutlineButton>
                )}
              </Card>
            );
          })}
        </div>

        {/* Comparison table */}
        <Card className="mt-12">
          <div className="font-display text-lg mb-4">مقارنة كاملة</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-ink-3 text-[12px]">
                  <th className="text-right py-2.5 font-normal">الميزة</th>
                  <th className="text-center py-2.5 font-normal">Basic</th>
                  <th className="text-center py-2.5 font-normal text-gold">Advanced</th>
                  <th className="text-center py-2.5 font-normal text-green">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["عدد أسئلة الشخصية","30-45","50-80","80-100"],
                  ["السمات المُحلَّلة","155","287","317"],
                  ["تصوير الوجه (38 قياس)","✓","✓","✓"],
                  ["رؤية كل المطابقات","✓","✓","✓"],
                  ["إرسال طلبات تعارف","5/أسبوع","5/أسبوع","غير محدودة"],
                  ["شات بلا حد","✓","✓","✓"],
                  ["تقرير 8 محاور توافق","موجز","تفصيلي","شامل + رسوم"],
                  ["كشف Dark Triad ⚠","—","✓","✓"],
                  ["Matching محسَّن بالسمات","—","—","✓"],
                  ["أولوية في المطابقة","—","عادية","قصوى"],
                  ["تحديثات التحليل","—","—","✓"],
                  ["الدعم","عادي","سريع","24/7"],
                ].map(row => (
                  <tr key={row[0]} className="border-t border-line dark:border-edge">
                    <td className="py-3 text-ink-2 dark:text-fog-2">{row[0]}</td>
                    <td className="py-3 text-center text-ink-2 numerals">{row[1]}</td>
                    <td className="py-3 text-center font-medium text-gold numerals">{row[2]}</td>
                    <td className="py-3 text-center font-medium text-green numerals">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* FAQ مختصر */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h3 className="font-display text-xl text-center mb-5">أسئلة شائعة</h3>
          <div className="space-y-3">
            {[
              ["هل أحتاج اشتراك لاستخدام التطبيق؟",
               "لا. يمكنك إكمال الـ Onboarding واستقبال طلبات التعارف + 10 رسائل شات مجاناً. الاشتراك يفتح لك رؤية كل المطابقات وقراءة شخصيتك."],
              ["ما الفرق بين الـ Matching المجاني والمدفوع؟",
               "المجاني يخبرك أن هناك توافقات (بدون أسماء). المدفوع يكشفها لك ويعطيك تقرير 8 محاور توافق مع كل شخص."],
              ["هل يمكنني الترقية من Basic إلى Premium لاحقاً؟",
               "نعم. تدفع الفرق فقط، وتُحدَّث أسئلتك وتحليلاتك تلقائياً."],
              ["كيف تُحفظ بيانات وجهي؟",
               "تُعالَج الصورة محلياً في متصفحك (MediaPipe). تُخزَّن فقط القياسات الرقمية (38 رقم)، وليس الصورة نفسها."],
            ].map(([q,a]) => (
              <details key={q} className="bg-paper-card dark:bg-night-2 rounded-2xl border border-line/60 dark:border-edge/60 p-4 group">
                <summary className="cursor-pointer flex items-center justify-between font-display text-[15px]">
                  <span>{q}</span>
                  <Icon name="chevronDown" size={16} className="text-ink-3 group-open:rotate-180 transition"/>
                </summary>
                <p className="text-[13.5px] text-ink-2 dark:text-fog-2 leading-loose mt-3">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-10">
          <p className="text-[13px] text-ink-3 mb-3">جميع الخطط: ضمان استرداد خلال 7 أيام · إلغاء في أي وقت · بدون التزامات خفية</p>
          <a onClick={()=>go("dashboard")} className="text-[14px] text-ink-2 dark:text-fog-2 hover:text-gold cursor-pointer underline-offset-4 hover:underline">أريد المتابعة مجاناً للآن</a>
        </div>
      </div>
    </div>
  );
};

// ---- P32: Payment ----
const PagePayment = ({ go }) => {
  const [method, setMethod] = useState("card");
  return (
    <div className="min-h-screen bg-paper dark:bg-night">
      <div className="px-5 lg:px-8 py-5 flex items-center justify-between border-b border-line/60 dark:border-edge/60">
        <button onClick={()=>go("pricing")} className="inline-flex"><Logo/></button>
        <button onClick={()=>go("pricing")} className="text-[13px] text-ink-2 dark:text-fog-2 hover:text-gold inline-flex items-center gap-1"><Icon name="arrowRight" size={14}/> الخطط</button>
      </div>

      <div className="max-w-3xl mx-auto px-5 lg:px-8 py-10">
        <h1 className="font-display text-3xl mb-1.5">إتمام الاشتراك</h1>
        <p className="text-ink-2 dark:text-fog-2">آمن ومحمي بالكامل</p>

        <div className="grid lg:grid-cols-5 gap-6 mt-7">
          <div className="lg:col-span-3 space-y-5">
            <Card>
              <div className="font-display text-[16px] mb-3">طريقة الدفع</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["card","بطاقة","creditCard"],
                  ["fawry","فوري","tag"],
                  ["vodafone","فودافون كاش","phone"],
                ].map(([id,lbl,icn]) => (
                  <button key={id} onClick={()=>setMethod(id)} className={`p-3 rounded-2xl border-2 transition text-center ${method===id?"border-gold bg-[#FBF6E9] dark:bg-[#2a2417]":"border-line dark:border-edge"}`}>
                    <Icon name={icn} size={22} className={`mx-auto ${method===id?"text-gold":"text-ink-3"}`}/>
                    <div className="text-[12.5px] mt-1.5">{lbl}</div>
                  </button>
                ))}
              </div>
            </Card>

            {method === "card" && (
              <Card>
                <div className="font-display text-[16px] mb-3">بيانات البطاقة</div>
                <div className="space-y-3.5">
                  <TextField label="الاسم على البطاقة" placeholder="AHMED MAHMOUD"/>
                  <TextField label="رقم البطاقة" placeholder="•••• •••• •••• ٤٢٤٢" icon={<Icon name="creditCard" size={16}/>}/>
                  <div className="grid grid-cols-2 gap-3">
                    <TextField label="انتهاء" placeholder="MM/YY"/>
                    <TextField label="CVV" placeholder="•••" icon={<Icon name="lock" size={16}/>}/>
                  </div>
                </div>
              </Card>
            )}
            {method === "fawry" && (
              <Card className="text-center">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-paper-2 dark:bg-night-3 flex items-center justify-center"><Icon name="qr" size={56} className="text-ink"/></div>
                <div className="font-display text-lg mt-4">كود فوري</div>
                <div className="font-serif-en text-3xl tracking-widest mt-1 text-gold numerals">٧٨٢٣ ٤٥٩١</div>
                <div className="text-[12.5px] text-ink-2 dark:text-fog-2 mt-2">صالح لمدة ٢٤ ساعة</div>
              </Card>
            )}
            {method === "vodafone" && (
              <Card>
                <TextField label="رقم فودافون كاش" placeholder="٠١٠٠ ٠٠٠ ٠٠٠٠" icon={<span className="text-[12px]">+٢٠</span>}/>
                <div className="text-[12.5px] text-ink-2 dark:text-fog-2 mt-3">سيصلك رابط دفع برسالة نصية لاستكمال العملية.</div>
              </Card>
            )}
          </div>

          <Card className="lg:col-span-2 self-start sticky top-6">
            <Badge tone="gold">الأكثر شعبية</Badge>
            <div className="font-display text-xl mt-3">خطة Advanced</div>
            <div className="text-[12.5px] text-ink-2 dark:text-fog-2">شهري — يتجدد تلقائياً</div>

            {/* ملخص اللي يدخل في الباقة */}
            <div className="mt-4 space-y-1.5 text-[12px] text-ink-2 dark:text-fog-2">
              <div className="flex items-center gap-1.5"><Icon name="check" size={12} className="text-gold"/>50-80 سؤال شخصية</div>
              <div className="flex items-center gap-1.5"><Icon name="check" size={12} className="text-gold"/>تصوير الوجه + 38 قياس</div>
              <div className="flex items-center gap-1.5"><Icon name="check" size={12} className="text-gold"/>287 سمة + 8 محاور توافق</div>
              <div className="flex items-center gap-1.5"><Icon name="check" size={12} className="text-gold"/>كشف Dark Triad</div>
            </div>

            <div className="mt-5 space-y-2.5 text-[13.5px] border-t border-line dark:border-edge pt-4">
              <div className="flex justify-between"><span>السعر</span><span className="numerals font-medium">١٤٩.٠٠ ج.م</span></div>
              <div className="flex justify-between text-ink-2 dark:text-fog-2"><span>ضريبة (١٤٪)</span><span className="numerals">٢٠.٨٦ ج.م</span></div>
              <div className="flex justify-between text-green"><span>خصم ترحيبي</span><span className="numerals">- ١٥.٠٠ ج.م</span></div>
              <div className="border-t border-line dark:border-edge pt-3 mt-3 flex justify-between font-display text-lg">
                <span>الإجمالي</span><span className="text-gold numerals">١٥٤.٨٦ ج.م</span>
              </div>
            </div>
            <GoldButton className="w-full mt-5" onClick={()=>go("sub-success")}>تأكيد الاشتراك</GoldButton>
            <div className="flex items-center justify-center gap-3 mt-4 text-[11.5px] text-ink-3">
              <span className="flex items-center gap-1"><Icon name="shield" size={12}/> 256-bit SSL</span>
              <span className="flex items-center gap-1"><Icon name="lock" size={12}/> PCI DSS</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ---- P33: Subscription Success ----
const PageSubSuccess = ({ go }) => (
  <div className="min-h-screen bg-paper dark:bg-night flex items-center justify-center px-5 py-12">
    <div className="max-w-md w-full text-center">
      <div className="relative w-28 h-28 mx-auto mb-7">
        <div className="absolute inset-0 rounded-full bg-gold/15 animate-ping"/>
        <div className="absolute inset-2 rounded-full bg-gold flex items-center justify-center text-white shadow-card"><Icon name="check" size={56} stroke={2.6}/></div>
      </div>
      <h1 className="font-display text-3xl mb-2">تم الاشتراك بنجاح 🎉</h1>
      <p className="text-ink-2 dark:text-fog-2 leading-loose">أهلاً بك في خطة Advanced. الخطوة التالية: أكمل أسئلة الشخصية (50-80 سؤال) لنبني تقريرك الكامل.</p>
      <Card className="mt-7 text-right">
        <div className="flex items-center justify-between mb-2.5"><span className="text-[13px] text-ink-2 dark:text-fog-2">الخطة</span><Badge tone="gold">Advanced الشهرية</Badge></div>
        <div className="flex items-center justify-between mb-2.5"><span className="text-[13px] text-ink-2 dark:text-fog-2">تنتهي في</span><span className="numerals font-medium">٢٠ يونيو ٢٠٢٦</span></div>
        <div className="flex items-center justify-between"><span className="text-[13px] text-ink-2 dark:text-fog-2">رقم العملية</span><span className="numerals font-serif-en text-[13px]">TWFQ-984231</span></div>
      </Card>
      <GoldButton className="w-full mt-7" onClick={()=>go("q-overview")} icon={<Icon name="arrowLeft" size={16}/>}>ابدأ أسئلة الشخصية</GoldButton>
      <button onClick={()=>go("matches")} className="text-[13px] text-gold mt-3 hover:underline">أو اعرض المطابقات الآن</button>
      <button onClick={()=>go("dashboard")} className="text-[13px] text-ink-2 dark:text-fog-2 mt-3 hover:text-gold">العودة للرئيسية</button>
    </div>
  </div>
);

// ---- P34: Subscription Expired ----
const PageSubExpired = ({ go }) => (
  <div className="min-h-screen bg-paper dark:bg-night flex items-center justify-center px-5 py-12">
    <div className="max-w-md w-full text-center">
      <div className="w-24 h-24 mx-auto rounded-3xl bg-amber-soft text-amber flex items-center justify-center mb-6"><Icon name="clock" size={44}/></div>
      <h1 className="font-display text-3xl mb-2">انتهى اشتراكك</h1>
      <p className="text-ink-2 dark:text-fog-2 leading-loose">لا داعي للقلق — ملفك وتقريرك محفوظان. جدد لتعود لرؤية المتوافقين والمحادثات.</p>

      <Card className="mt-7 text-right">
        <div className="font-display text-[15px] mb-3">ما الذي ستستعيده</div>
        <ul className="space-y-2 text-[14px]">
          {["عرض جميع التوافقات","طلبات التواصل غير المحدودة","المحادثات النشطة","الأولوية في المطابقة"].map(t => (
            <li key={t} className="flex items-center gap-2.5"><Icon name="check" size={14} className="text-gold"/> {t}</li>
          ))}
        </ul>
      </Card>

      <GoldButton className="w-full mt-7" onClick={()=>go("pricing")}>جدد اشتراكك</GoldButton>
      <button onClick={()=>go("dashboard")} className="text-[13px] text-ink-2 dark:text-fog-2 mt-3 hover:text-gold">تصفح مجاناً</button>
    </div>
  </div>
);

// ---- P35: Settings — Subscription ----
const PageSettingsSubscription = ({ go }) => {
  const remaining = 18, total = 30;
  return (
    <AppLayout go={go} current="settings-sub" title="اشتراكك" sub="إدارة الخطة والفواتير">
      <div className="max-w-3xl space-y-5">
        <Card className="ring-2 ring-gold relative overflow-hidden">
          <div className="absolute -top-10 left-10 w-40 h-40 rounded-full bg-gold/10 blur-2xl"/>
          <div className="relative flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold flex items-center justify-center"><Icon name="crown" size={22}/></div>
            <div className="flex-1 min-w-0">
              <Badge tone="gold">نشط</Badge>
              <div className="font-display text-xl mt-2">خطة Advanced الشهرية</div>
              <div className="text-[13px] text-ink-2 dark:text-fog-2">يتم التجديد في <span className="numerals">٢٠ يونيو ٢٠٢٦</span> — <span className="numerals">١٤٩ ج.م</span>/شهر</div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5 text-[12.5px] text-ink-2 dark:text-fog-2">
                  <span>متبقي <span className="font-serif-en text-gold numerals">{remaining}</span> يوماً</span>
                  <span className="numerals">{total-remaining}/{total}</span>
                </div>
                <ProgressBar value={(total-remaining)/total*100}/>
              </div>
            </div>
            <GoldButton size="sm" onClick={()=>go("pricing")}>ترقية</GoldButton>
          </div>
        </Card>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            ["طلبات هذا الشهر","12 / ∞","inbox","gold"],
            ["كشف الهوية","٣","eye","green"],
            ["محادثات نشطة","٥","chat","amber"],
          ].map(([l,v,icn,tone]) => (
            <Card key={l} className="!p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${tone==="gold"?"bg-gold/10 text-gold":tone==="green"?"bg-green/10 text-green":"bg-amber-soft text-amber"}`}><Icon name={icn} size={18}/></div>
              <div className="font-serif-en text-xl numerals">{v}</div>
              <div className="text-[12px] text-ink-2 dark:text-fog-2">{l}</div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-[15px]">سجل الفواتير</div>
            <button className="text-[12.5px] text-gold">تصدير</button>
          </div>
          <div className="divide-y divide-line dark:divide-edge text-[13.5px]">
            {[
              ["٢٠ مايو ٢٠٢٦","Advanced الشهرية","149.00","paid"],
              ["٢٠ أبريل ٢٠٢٦","Advanced الشهرية","149.00","paid"],
              ["٢٠ مارس ٢٠٢٦","Basic الشهرية","79.00","paid"],
            ].map((row,i) => (
              <div key={i} className="py-3 flex items-center justify-between gap-3">
                <div className="numerals text-ink-2 dark:text-fog-2 text-[12.5px]">{row[0]}</div>
                <div className="flex-1 truncate">{row[1]}</div>
                <div className="numerals font-medium">{row[2]} ج.م</div>
                <Badge tone="green">مدفوع</Badge>
              </div>
            ))}
          </div>
        </Card>

        <button className="text-[13px] text-ink-3 hover:text-rose mx-auto block">إلغاء الاشتراك</button>
      </div>
    </AppLayout>
  );
};

window.PagesSubscription = { PagePricing, PagePayment, PageSubSuccess, PageSubExpired, PageSettingsSubscription };
Object.assign(window, window.PagesSubscription);
