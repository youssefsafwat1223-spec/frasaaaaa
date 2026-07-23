// =============== Onboarding Pages: P7-P20 ===============

const ONBOARD_STEPS = [
  { id: 1, label: "الموافقة" },
  { id: 2, label: "الملف الشخصي" },
  { id: 3, label: "الاستبيان" },
  { id: 4, label: "تحليل الوجه" },
  { id: 5, label: "جاهز" },
];

const Stepper = ({ active = 1 }) => (
  <div className="bg-paper-card dark:bg-night-2 border-b border-line dark:border-edge">
    <div className="max-w-3xl mx-auto px-5 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-2 relative">
        {ONBOARD_STEPS.map((s, i) => {
          const done = s.id < active, current = s.id === active;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1.5 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif-en text-[14px] transition-all ${done ? "bg-green text-white" : current ? "bg-gold text-white ring-4 ring-gold/15" : "bg-paper-2 dark:bg-night-3 text-ink-3 border border-line dark:border-edge"}`}>
                  {done ? <Icon name="check" size={14} stroke={2.6}/> : s.id}
                </div>
                <div className={`text-[11.5px] ${current ? "text-gold" : done ? "text-green" : "text-ink-3"}`}>{s.label}</div>
              </div>
              {i < ONBOARD_STEPS.length - 1 && (
                <div className="flex-1 h-px bg-line dark:bg-edge -mt-4 relative">
                  <div className={`absolute inset-y-0 right-0 ${s.id < active ? "bg-green w-full" : "bg-transparent"}`}/>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  </div>
);

const OnboardShell = ({ step, title, sub, children, footer, onBack }) => (
  <div className="min-h-screen bg-paper dark:bg-night">
    <header className="px-5 lg:px-8 py-4 flex items-center justify-between border-b border-line/60 dark:border-edge/60">
      <Logo/>
      <div className="text-[12px] text-ink-3">احفظ التقدم تلقائياً</div>
    </header>
    <Stepper active={step}/>
    <div className="max-w-3xl mx-auto px-5 lg:px-8 py-8 pb-32">
      {onBack && <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] text-ink-2 dark:text-fog-2 hover:text-gold"><Icon name="arrowRight" size={14}/> السابق</button>}
      <h1 className="font-display text-3xl">{title}</h1>
      {sub && <p className="text-ink-2 dark:text-fog-2 mt-2 text-[15px] leading-loose">{sub}</p>}
      <div className="mt-8">{children}</div>
    </div>
    {footer && (
      <div className="fixed bottom-0 inset-x-0 bg-paper-card/95 dark:bg-night-2/95 backdrop-blur-md border-t border-line dark:border-edge">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 py-4">{footer}</div>
      </div>
    )}
  </div>
);

// ---- P7: Consent ----
const PageConsent = ({ go }) => {
  const items = [
    ["استخدام صورك في التحليل", "نُحلّل ٣ صور لاستخراج انطباع أولي من ملامحك. الصور تبقى في خصوصيتك ولا تظهر علناً."],
    ["استخدام بياناتك في المطابقة", "تُستخدم إجاباتك ونتائج التحليل في حساب نِسب التوافق مع المستخدمين الآخرين فقط."],
    ["النتائج تقديرية", "أفهم أن نتائج التحليل تقديرية وليست علمية بنسبة ١٠٠٪، وأنها أداة استرشادية."],
    ["الشروط والأحكام", "أوافق على الشروط والأحكام وسياسة الخصوصية وأتعهد بصدق المعلومات المُقدّمة."],
  ];
  const [checked, setChecked] = useState([false,false,false,false]);
  const allOk = checked.every(Boolean);
  return (
    <OnboardShell step={1} title="أهلاً بك في تَوَافُق"
      sub="قبل أن نبدأ، نحتاج موافقتك على بضع نقاط أساسية. اقرأها بهدوء — رحلتك تستحق ذلك."
      footer={<GoldButton className="w-full" disabled={!allOk} onClick={()=>go("profile-setup")}>متابعة</GoldButton>}>
      <Card className="space-y-5">
        {items.map(([t,d], i) => (
          <div key={i} className="pb-5 border-b last:border-0 border-line dark:border-edge last:pb-0">
            <Checkbox checked={checked[i]} onChange={v => setChecked(c => c.map((x,idx)=>idx===i?v:x))} label={t} sub={d}/>
          </div>
        ))}
      </Card>
      <div className="mt-5 flex items-center gap-2 text-[12.5px] text-ink-3"><Icon name="shield" size={14}/> ملفك خاص. لا نشارك بياناتك مع أي طرف خارجي.</div>
    </OnboardShell>
  );
};

// ---- P8: Profile Setup ----
const PageProfileSetup = ({ go }) => {
  const [gender, setGender] = useState("male");
  const [goal, setGoal] = useState("marriage");
  const [anon, setAnon] = useState(true);
  const [bio, setBio] = useState("");
  return (
    <OnboardShell step={2} title="عرّفنا بك" sub="معلومات أساسية تساعدنا في تحضير ملفك. تستطيع تعديلها لاحقاً."
      footer={<GoldButton className="w-full" onClick={()=>go("q-overview")}>حفظ ومتابعة</GoldButton>}>
      <div className="space-y-5">
        <Card>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="الاسم المعروض" placeholder="مثال: أحمد م." defaultValue="أحمد محمود"/>
            <TextField label="العمر" type="number" min={18} max={60} defaultValue="28" placeholder="٢٨"/>
          </div>
          <div className="mt-4">
            <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-2">النوع</div>
            <div className="grid grid-cols-2 gap-3">
              {[["male","ذكر","male"],["female","أنثى","female"]].map(([id,lbl,icn]) => (
                <button key={id} onClick={()=>setGender(id)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${gender===id?"border-gold bg-[#FBF6E9] dark:bg-[#2a2417]":"border-line dark:border-edge"}`}>
                  <Icon name={icn} size={28} className={gender===id?"text-gold":"text-ink-3"}/>
                  <span className="text-[14px]">{lbl}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Select label="المدينة" placeholder="اختر مدينتك" options={sampleCities}/>
            <Select label="المؤهل" placeholder="اختر مؤهلك" options={["ثانوي","دبلوم","بكالوريوس","ماجستير","دكتوراه"]}/>
          </div>
          <div className="mt-4"><TextField label="المهنة" placeholder="مثال: مهندس برمجيات"/></div>
        </Card>

        <Card>
          <div className="text-[13px] text-ink-2 dark:text-fog-2 mb-3">هدفك من تَوَافُق</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[["marriage","الزواج","تبحث عن شريك حياة"],["serious","علاقة جادة","تبحث عن تعارف بنيّة الزواج"]].map(([id,t,d]) => (
              <button key={id} onClick={()=>setGoal(id)} className={`p-4 rounded-2xl border-2 text-right transition-all ${goal===id?"border-gold bg-[#FBF6E9] dark:bg-[#2a2417]":"border-line dark:border-edge"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <Icon name={id==="marriage"?"diamond":"handshake"} size={20} className="text-gold"/>
                  {goal===id && <Icon name="check" size={16} className="text-gold"/>}
                </div>
                <div className="font-medium">{t}</div>
                <div className="text-[12.5px] text-ink-2 dark:text-fog-2 mt-1">{d}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <TextArea label="نبذة قصيرة (اختياري)" maxLength={150} value={bio} onChange={e=>setBio(e.target.value)} placeholder="عرّف عن نفسك في سطرين…"/>
          <div className="mt-5 flex items-start justify-between gap-4 pt-5 border-t border-line dark:border-edge">
            <div>
              <div className="font-medium text-[15px]">الوضع المجهول</div>
              <div className="text-[13px] text-ink-2 dark:text-fog-2 mt-1 leading-loose">اسمك وصورتك مخفيان للمتوافقين حتى يتم قبول طلب التواصل بينكما.</div>
            </div>
            <Toggle checked={anon} onChange={setAnon}/>
          </div>
        </Card>
      </div>
    </OnboardShell>
  );
};

// ---- P9: Questionnaire Overview ----
const PageQuestionnaireOverview = ({ go }) => {
  const cats = [
    { id: 1, name: "القيم والدين", icon: "mosque", count: 10, done: 10, status: "done" },
    { id: 2, name: "الشخصية",     icon: "smile",  count: 10, done: 6,  status: "progress" },
    { id: 3, name: "نمط الحياة",  icon: "leaf",   count: 10, done: 0,  status: "new" },
    { id: 4, name: "توقعات الزواج", icon: "diamond", count: 10, done: 0, status: "new" },
  ];
  const totalDone = cats.reduce((a,c)=>a+c.done,0);
  return (
    <OnboardShell step={3} title="الاستبيان الشخصي" sub="٤٠ سؤال في ٤ أقسام — ما يقارب ١٠ دقائق. تستطيع التوقف والعودة في أي وقت.">
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[14px]">التقدم الإجمالي</div>
          <div className="numerals text-[14px] text-gold"><span className="font-serif-en">{totalDone}</span>/40</div>
        </div>
        <ProgressBar value={totalDone} max={40}/>
      </Card>
      <div className="space-y-3">
        {cats.map(c => {
          const pct = c.done/c.count;
          const status = c.status==="done" ? <Badge tone="green">مكتمل</Badge> : c.status==="progress" ? <Badge tone="amber">قيد التقدم</Badge> : <Badge tone="neutral">لم يبدأ</Badge>;
          return (
            <Card key={c.id} className="hover:shadow-soft">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${c.status==="done" ? "bg-green/10 text-green" : "bg-gold/10 text-gold"}`}><Icon name={c.icon} size={22}/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="font-display text-[17px]">{c.name}</div>
                    {status}
                  </div>
                  <div className="numerals text-[12.5px] text-ink-2 dark:text-fog-2 mb-2"><span className="font-serif-en">{c.done}</span> من {c.count} أسئلة</div>
                  <ProgressBar value={pct*100}/>
                </div>
                <button onClick={()=>go("q-question")} className="px-4 py-2.5 rounded-xl bg-gold text-white text-[13px] shrink-0">
                  {c.status==="done" ? "مراجعة" : c.status==="progress" ? "متابعة" : "ابدأ"}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="mt-7 flex justify-end">
        <GoldButton onClick={()=>go("q-all-done")} disabled={totalDone < 40} icon={<Icon name="arrowLeft" size={16}/>}>إنهاء الاستبيان</GoldButton>
      </div>
    </OnboardShell>
  );
};

// ---- P10: Single Question ----
const PageQuestion = ({ go }) => {
  const total = 10, current = 3;
  const [answer, setAnswer] = useState("");
  const options = [
    { id: "a", text: "أرى أن الالتزام الديني أساس مهم جداً في الحياة الزوجية", weight: 5 },
    { id: "b", text: "الالتزام الديني مهم لكن مع مرونة في التفاصيل", weight: 4 },
    { id: "c", text: "أؤمن بالقيم العامة دون التمسك بكل التفاصيل الشكلية", weight: 3 },
    { id: "d", text: "أؤمن بالأخلاق أكثر من الطقوس الدينية", weight: 2 },
  ];
  return (
    <OnboardShell step={3} title=" " onBack={()=>go("q-overview")}>
      <div className="-mt-6">
        <div className="flex items-center justify-between mb-2 text-[12.5px] text-ink-2 dark:text-fog-2">
          <span className="inline-flex items-center gap-2"><Icon name="mosque" size={14} className="text-gold"/> القيم والدين</span>
          <span className="numerals">سؤال <span className="font-serif-en text-gold">{current}</span> من {total}</span>
        </div>
        <ProgressBar value={(current/total)*100} className="mb-8"/>

        <h2 className="font-display text-2xl leading-relaxed mb-6 page-enter">إلى أي مدى يؤثر الالتزام الديني في اختيارك لشريك الحياة؟</h2>

        <div className="space-y-3 page-enter">
          {options.map(o => (
            <RadioCard key={o.id} checked={answer===o.id} onClick={()=>setAnswer(o.id)}>
              <div className="text-[15.5px] leading-relaxed">{o.text}</div>
            </RadioCard>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <OutlineButton onClick={()=>go("q-overview")} iconLeft={<Icon name="arrowRight" size={16}/>}>السابق</OutlineButton>
          <GoldButton disabled={!answer} onClick={()=>go("q-category-done")} icon={<Icon name="arrowLeft" size={16}/>}>التالي</GoldButton>
        </div>

        <div className="mt-10">
          <div className="text-[12px] text-ink-3 mb-3">أمثلة على أنواع الأسئلة الأخرى</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Card padded={false} className="p-4">
              <div className="text-[12px] text-ink-2 dark:text-fog-2 mb-2">سؤال تقييمي ١-٥</div>
              <div className="text-[14px] mb-3">ما مدى أهمية العائلة الممتدة لك؟</div>
              <div className="flex items-center justify-between gap-1.5">
                {[1,2,3,4,5].map(n => (
                  <button key={n} className={`flex-1 aspect-square rounded-full border-2 font-serif-en flex items-center justify-center transition ${n===4?"border-gold bg-[#FBF6E9] dark:bg-[#2a2417] text-gold":"border-line dark:border-edge text-ink-3"}`}>{n}</button>
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-ink-3 mt-2"><span>غير مهمة</span><span>مهمة جداً</span></div>
            </Card>
            <Card padded={false} className="p-4">
              <div className="text-[12px] text-ink-2 dark:text-fog-2 mb-2">سؤال متعدد الاختيارات</div>
              <div className="text-[14px] mb-3">ما هواياتك المفضلة؟</div>
              <div className="flex flex-wrap gap-2">
                {["القراءة","الرياضة","الطبخ","السفر","الموسيقى","الزراعة"].map((t,i) => (
                  <span key={t} className={`px-3 py-1.5 rounded-full text-[12.5px] border ${i<3?"bg-gold/10 border-gold text-gold":"border-line dark:border-edge text-ink-2 dark:text-fog-2"}`}>{t}</span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </OnboardShell>
  );
};

// ---- P11: Category Complete ----
const PageCategoryDone = ({ go }) => {
  return (
    <OnboardShell step={3} title=" ">
      <div className="-mt-6 text-center max-w-xl mx-auto py-8">
        <div className="w-24 h-24 mx-auto rounded-full bg-green/10 text-green flex items-center justify-center mb-6 page-enter">
          <Icon name="check" size={48} stroke={2.4}/>
        </div>
        <h2 className="font-display text-3xl mb-3">أحسنت!</h2>
        <p className="text-ink-2 dark:text-fog-2 text-[15px] leading-loose mb-8">أكملت قسم "القيم والدين" بنجاح. إجاباتك تساعدنا في فهم أعمق لما يهمك.</p>

        <Card className="text-right mb-7">
          <div className="font-display text-[15px] mb-3">ملخص إجاباتك</div>
          <div className="space-y-2.5 text-[13.5px]">
            {[
              ["الالتزام الديني","مهم جداً مع مرونة"],
              ["الصلاة","منتظم"],
              ["العائلة الممتدة","مهمة جداً (٤/٥)"],
              ["تربية الأبناء","تربية محافظة منفتحة"],
            ].map(([k,v]) => (
              <div key={k} className="flex items-center justify-between py-2 border-b last:border-0 border-line dark:border-edge">
                <span className="text-ink-2 dark:text-fog-2">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <OutlineButton onClick={()=>go("q-overview")}>العودة للأقسام</OutlineButton>
          <GoldButton onClick={()=>go("q-question")} icon={<Icon name="arrowLeft" size={16}/>}>القسم التالي</GoldButton>
        </div>
      </div>
    </OnboardShell>
  );
};

// ---- P12: All Done ----
const PageQuestionnaireDone = ({ go }) => {
  return (
    <OnboardShell step={3} title=" ">
      <div className="-mt-6 text-center max-w-xl mx-auto py-6">
        <div className="relative w-32 h-32 mx-auto mb-7">
          <div className="absolute inset-0 rounded-full bg-gold/10 animate-ping"/>
          <div className="absolute inset-3 rounded-full bg-gold flex items-center justify-center">
            <Icon name="sparkles" size={48} className="text-white"/>
          </div>
        </div>
        <h2 className="font-display text-3xl mb-3">أكملت الاستبيان بنجاح</h2>
        <p className="text-ink-2 dark:text-fog-2 text-[15.5px] leading-loose mb-7">٤٠ سؤالاً، أربعة أقسام، صورة كاملة عنك. تبقى خطوة واحدة لاكتمال ملفك.</p>

        <div className="grid grid-cols-2 gap-3 mb-7">
          {[
            ["القيم والدين","mosque"],
            ["الشخصية","smile"],
            ["نمط الحياة","leaf"],
            ["توقعات الزواج","diamond"],
          ].map(([t,icn]) => (
            <Card key={t} className="text-center !p-4">
              <div className="w-10 h-10 mx-auto rounded-full bg-green/10 text-green flex items-center justify-center mb-2"><Icon name="check" size={18} stroke={2.4}/></div>
              <div className="text-[13.5px]">{t}</div>
            </Card>
          ))}
        </div>

        <GoldButton size="lg" onClick={()=>go("face-intro")} icon={<Icon name="arrowLeft" size={16}/>}>متابعة لتحليل الوجه</GoldButton>
      </div>
    </OnboardShell>
  );
};

// ---- P13: Face Analysis Intro ----
const PageFaceIntro = ({ go }) => {
  const steps = [
    { icon: "shield",  t: "سنتحقق من أنك شخص حقيقي", d: "خطوة بسيطة بحركات الوجه لمنع الحسابات الوهمية." },
    { icon: "camera",  t: "ستلتقط ٣ صور بسيطة",     d: "صورة من الأمام واثنتان من الجانب — دقائق فقط." },
    { icon: "lock",    t: "الخصوصية محفوظة",        d: "الصور للتحليل فقط، ولا تظهر لأي مستخدم." },
  ];
  return (
    <OnboardShell step={4} title="تحليل الوجه" sub="خطوة بسيطة لتحليل انطباعي من ملامحك — لا حُكم نهائي، فقط إثراء للتوافق.">
      <div className="space-y-3 mb-6">
        {steps.map((s,i) => (
          <Card key={i} className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center shrink-0"><Icon name={s.icon} size={22}/></div>
            <div className="flex-1">
              <div className="font-medium text-[15.5px]">{s.t}</div>
              <div className="text-[13.5px] text-ink-2 dark:text-fog-2 leading-loose mt-1">{s.d}</div>
            </div>
            <span className="font-serif-en text-2xl text-ink-3">{i+1}</span>
          </Card>
        ))}
      </div>

      <Card className="bg-amber-soft dark:bg-[#2a2010] border-[#e9d4a8] dark:border-[#5b4720]">
        <div className="flex items-start gap-3 text-[13.5px]">
          <Icon name="info" size={18} className="text-amber shrink-0 mt-0.5"/>
          <div className="text-amber dark:text-[#e4b266] leading-loose">تأكد من <span className="font-medium">الإضاءة الجيدة</span> ووضوح وجهك في الإطار، وأن لا يوجد نظارة شمسية أو قناع.</div>
        </div>
      </Card>

      <div className="flex items-center justify-between mt-8">
        <button onClick={()=>go("self-physical")} className="text-[13px] text-ink-2 dark:text-fog-2 hover:text-gold">تخطي</button>
        <GoldButton onClick={()=>go("face-liveness")} icon={<Icon name="camera" size={16}/>}>ابدأ التحقق</GoldButton>
      </div>
    </OnboardShell>
  );
};

// ---- P14: Liveness Check ----
const PageLiveness = ({ go }) => {
  const [step, setStep] = useState(2);
  const steps = ["انظر للكاميرا","ارمش","لف يميناً","لف يساراً"];
  return (
    <OnboardShell step={4} title=" ">
      <div className="-mt-4 max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-serif-en text-[13px] transition ${i<step?"bg-green text-white":i===step?"bg-gold text-white ring-4 ring-gold/15":"bg-paper-2 dark:bg-night-3 text-ink-3 border border-line dark:border-edge"}`}>
              {i<step ? <Icon name="check" size={14}/> : i+1}
            </div>
          ))}
        </div>

        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-night border border-edge mb-5">
          <div className="absolute inset-0 bg-gradient-to-b from-night-2 via-night to-night flex items-center justify-center">
            <div className="w-60 h-72 rounded-[50%] border-2 border-dashed border-gold/60 flex items-center justify-center">
              <Icon name="user" size={88} className="text-gold/30"/>
            </div>
          </div>
          <div className="absolute inset-0 ring-4 ring-inset ring-gold/0"/>
          {/* corner brackets */}
          {["top-4 right-4 border-t-2 border-r-2","top-4 left-4 border-t-2 border-l-2","bottom-4 right-4 border-b-2 border-r-2","bottom-4 left-4 border-b-2 border-l-2"].map(c => (
            <span key={c} className={`absolute w-6 h-6 border-gold ${c}`}/>
          ))}
          <div className="absolute top-4 inset-x-0 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-night/60 text-fog text-[11.5px] backdrop-blur"><span className="w-1.5 h-1.5 rounded-full bg-rose animate-pulse"/> LIVE</span>
          </div>
        </div>

        <div className="text-center mb-5">
          <div className="text-[12.5px] text-ink-3 mb-1.5">الخطوة الحالية</div>
          <div className="font-display text-3xl text-gold">{steps[step]}</div>
        </div>

        <Card className="bg-amber-soft dark:bg-[#2a2010] border-[#e9d4a8] dark:border-[#5b4720] !p-3.5">
          <div className="flex items-center gap-2.5 text-[13px] text-amber dark:text-[#e4b266]">
            <Icon name="alert" size={16}/>
            الإضاءة ضعيفة قليلاً — جرب في مكان أفضل للحصول على دقة أعلى.
          </div>
        </Card>

        <div className="flex gap-3 mt-5">
          <OutlineButton className="flex-1" onClick={()=>setStep(Math.max(0,step-1))}>إعادة</OutlineButton>
          <GoldButton className="flex-1" onClick={()=>{ if(step<3) setStep(step+1); else go("face-capture"); }}>متابعة</GoldButton>
        </div>
      </div>
    </OnboardShell>
  );
};

// ---- P15: Photo Capture ----
const PagePhotoCapture = ({ go }) => {
  const [shot, setShot] = useState(false);
  return (
    <OnboardShell step={4} title=" ">
      <div className="-mt-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[13px] text-ink-2 dark:text-fog-2">صورة <span className="font-serif-en text-gold">١</span> من <span className="font-serif-en">٣</span></div>
          <Badge tone="gold">من الأمام</Badge>
        </div>

        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-night mb-5">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-60 h-72 rounded-[50%] border-2 border-gold flex items-center justify-center">
              <ProfileAvatar name="أحمد" size={140} tone="gold"/>
            </div>
          </div>
          {/* gold filling ring */}
          <svg className="absolute inset-0 -rotate-90 m-auto" width="100" height="100" style={{top:"calc(50% - 50px)", left:"calc(50% - 50px)"}}>
            <circle cx="50" cy="50" r="44" stroke="#ffffff20" strokeWidth="3" fill="none"/>
            <circle cx="50" cy="50" r="44" stroke="#B8975A" strokeWidth="3" fill="none" strokeDasharray="276" strokeDashoffset={shot?0:80} strokeLinecap="round" style={{transition:"all 1.5s ease"}}/>
          </svg>
          <div className="absolute bottom-4 inset-x-0 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-night/70 text-fog text-[12px] backdrop-blur">
              <Icon name="check" size={12} className="text-green"/> الإضاءة ممتازة — لا تتحرك
            </div>
          </div>
        </div>

        <div className="text-center mb-4 text-[14px] text-ink-2 dark:text-fog-2">انظر للأمام مباشرة وأبقِ وجهك داخل الإطار</div>

        {!shot ? (
          <button onClick={()=>setShot(true)} className="mx-auto w-20 h-20 rounded-full bg-gold ring-4 ring-gold/30 flex items-center justify-center text-white shadow-card active:scale-95 transition">
            <span className="w-12 h-12 rounded-full bg-white"/>
          </button>
        ) : (
          <div className="flex gap-3">
            <OutlineButton className="flex-1" onClick={()=>setShot(false)}>إعادة</OutlineButton>
            <GoldButton className="flex-1" onClick={()=>go("face-processing")}>التالي</GoldButton>
          </div>
        )}
      </div>
    </OnboardShell>
  );
};

// ---- P16: Face Processing ----
const PageFaceProcessing = ({ go }) => {
  useEffect(() => { const t = setTimeout(() => go("face-traits"), 3500); return () => clearTimeout(t); }, []);
  return (
    <OnboardShell step={4} title=" ">
      <div className="-mt-6 text-center max-w-md mx-auto py-12">
        <div className="flex items-center justify-center gap-3 mb-7">
          {[0,1,2].map(i => (
            <div key={i} className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-gold">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/30 to-green/30 flex items-center justify-center">
                <Icon name="user" size={28} className="text-white/80"/>
              </div>
              <div className="absolute -bottom-0 -right-0 w-5 h-5 rounded-full bg-green flex items-center justify-center"><Icon name="check" size={12} className="text-white"/></div>
            </div>
          ))}
        </div>
        <div className="font-display text-2xl mb-3 inline-flex items-center gap-2">جاري تحليل ملامحك <span className="dots text-gold"><span/><span/><span/></span></div>
        <ProgressBar value={62} className="my-5"/>
        <p className="text-[13.5px] text-ink-2 dark:text-fog-2">هذا قد يستغرق لحظة. نمر على ٥ مؤشرات للملامح بدقة.</p>
        <div className="grid grid-cols-3 gap-2 mt-7 text-[11px] text-ink-3">
          {["كشف الوجه","قياس النقاط","حساب التماثل","التعبير","الانطباع"].slice(0,3).map(s => (
            <div key={s} className="bg-paper-2 dark:bg-night-3 rounded-lg py-2"><Icon name="check" size={12} className="text-green inline ms-1"/> {s}</div>
          ))}
        </div>
      </div>
    </OnboardShell>
  );
};

// ---- P17: Trait Confirmation ----
const PageTraits = ({ go }) => {
  const traitsInit = [
    { name: "اجتماعي ودود", pct: 78, ok: true },
    { name: "هادئ متأني",  pct: 65, ok: true },
    { name: "عملي منظم",   pct: 72, ok: true },
    { name: "عاطفي حساس",  pct: 54, ok: false },
    { name: "انطوائي تأملي", pct: 41, ok: true },
  ];
  const [traits, setTraits] = useState(traitsInit);
  return (
    <OnboardShell step={4} title="الانطباع الأولي من ملامحك" sub="هذا انطباع تقديري فقط — أنت من يعرف نفسه. أكّد ما يناسبك واستبعد البقية.">
      <div className="grid sm:grid-cols-2 gap-3">
        {traits.map((t,i) => (
          <Card key={t.name} className="flex items-center gap-4">
            <ScoreRing value={t.pct} size={64} stroke={6}/>
            <div className="flex-1">
              <div className="font-medium text-[15px]">{t.name}</div>
              <div className="text-[12px] text-ink-3 mt-0.5">دقة التحليل: <span className="font-serif-en">{t.pct}</span>٪</div>
              <div className="flex items-center gap-2 mt-2.5">
                <button onClick={()=>setTraits(arr=>arr.map((x,idx)=>idx===i?{...x,ok:true}:x))} className={`px-2.5 py-1 rounded-full text-[12px] border ${t.ok?"bg-green text-white border-green":"border-line dark:border-edge text-ink-2 dark:text-fog-2"}`}>مناسب</button>
                <button onClick={()=>setTraits(arr=>arr.map((x,idx)=>idx===i?{...x,ok:false}:x))} className={`px-2.5 py-1 rounded-full text-[12px] border ${!t.ok?"bg-rose text-white border-rose":"border-line dark:border-edge text-ink-2 dark:text-fog-2"}`}>غير مناسب</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-5 bg-paper-2 dark:bg-night-3 !p-4">
        <div className="flex items-start gap-2.5 text-[13px] text-ink-2 dark:text-fog-2">
          <Icon name="info" size={16} className="text-gold shrink-0 mt-0.5"/>
          <div>هذا انطباع تقديري فقط — ليس حكماً قاطعاً. ما تختاره أنت يحدد كيف نقدّمك في المطابقة.</div>
        </div>
      </Card>
      <div className="mt-7 flex justify-end">
        <GoldButton onClick={()=>go("self-physical")} icon={<Icon name="arrowLeft" size={16}/>}>متابعة</GoldButton>
      </div>
    </OnboardShell>
  );
};

// ---- P18: Self Report Physical ----
const PageSelfPhysical = ({ go }) => {
  const [height, setHeight] = useState(178);
  const [bodyType, setBodyType] = useState("athletic");
  const [skin, setSkin] = useState(2);
  return (
    <OnboardShell step={4} title="أخبرنا عن نفسك" sub="بياناتك الجسدية تساعدنا في تحسين دقة التوافق.">
      <div className="space-y-5">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[14px]">الطول</div>
            <div className="numerals text-gold font-serif-en text-2xl">{height} <span className="text-base text-ink-2 font-body">سم</span></div>
          </div>
          <input type="range" min={140} max={210} value={height} onChange={e=>setHeight(+e.target.value)} className="w-full"/>
          <div className="flex justify-between text-[11px] text-ink-3 mt-1 numerals"><span>١٤٠</span><span>٢١٠</span></div>
        </Card>

        <Card>
          <div className="text-[14px] mb-3">بنية الجسم</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[["slim","نحيف","leaf"],["athletic","رياضي","activity"],["average","متوسط","user"],["fuller","ممتلئ","heart"]].map(([id,lbl,icn]) => (
              <button key={id} onClick={()=>setBodyType(id)} className={`p-3 rounded-2xl border-2 transition flex flex-col items-center gap-1.5 ${bodyType===id?"border-gold bg-[#FBF6E9] dark:bg-[#2a2417]":"border-line dark:border-edge"}`}>
                <Icon name={icn} size={22} className={bodyType===id?"text-gold":"text-ink-3"}/>
                <span className="text-[13px]">{lbl}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="text-[14px] mb-3">لون البشرة</div>
          <div className="flex items-center justify-around">
            {["#F1D6B2","#E0B388","#C29066","#8E6440"].map((c,i) => (
              <button key={c} onClick={()=>setSkin(i)} className={`w-14 h-14 rounded-full ring-2 transition ${skin===i?"ring-gold ring-offset-2 ring-offset-paper-card dark:ring-offset-night-2":"ring-line dark:ring-edge"}`} style={{background:c}}/>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-7 flex justify-end">
        <GoldButton onClick={()=>go("self-prefs")} icon={<Icon name="arrowLeft" size={16}/>}>التالي</GoldButton>
      </div>
    </OnboardShell>
  );
};

// ---- P19: Self Report Preferences ----
const PageSelfPrefs = ({ go }) => {
  const [bodyTypes, setBodyTypes] = useState(["athletic","average"]);
  const [heightRange, setHeightRange] = useState([155,175]);
  const [ageRange, setAgeRange] = useState([24,32]);
  const [importance, setImportance] = useState(3);
  return (
    <OnboardShell step={4} title="تفضيلاتك" sub="ما الذي يقترب من تصورك؟ تستطيع تعديلها لاحقاً.">
      <div className="space-y-5">
        <Card>
          <div className="text-[14px] mb-3">بنية الجسم المفضلة (متعدد)</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[["slim","نحيف"],["athletic","رياضي"],["average","متوسط"],["fuller","ممتلئ"]].map(([id,lbl]) => {
              const sel = bodyTypes.includes(id);
              return <button key={id} onClick={()=>setBodyTypes(b=>sel?b.filter(x=>x!==id):[...b,id])} className={`p-3 rounded-2xl border-2 text-[13px] transition ${sel?"border-gold bg-[#FBF6E9] dark:bg-[#2a2417] text-gold":"border-line dark:border-edge"}`}>{lbl}</button>;
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[14px]">نطاق الطول</div>
            <div className="numerals text-gold font-serif-en">{heightRange[0]}–{heightRange[1]} <span className="text-[13px] text-ink-2 font-body">سم</span></div>
          </div>
          <div className="space-y-2">
            <input type="range" min={140} max={210} value={heightRange[0]} onChange={e=>setHeightRange([+e.target.value, heightRange[1]])} className="w-full"/>
            <input type="range" min={140} max={210} value={heightRange[1]} onChange={e=>setHeightRange([heightRange[0], +e.target.value])} className="w-full"/>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[14px]">نطاق العمر</div>
            <div className="numerals text-gold font-serif-en">{ageRange[0]}–{ageRange[1]} <span className="text-[13px] text-ink-2 font-body">سنة</span></div>
          </div>
          <div className="space-y-2">
            <input type="range" min={18} max={60} value={ageRange[0]} onChange={e=>setAgeRange([+e.target.value, ageRange[1]])} className="w-full"/>
            <input type="range" min={18} max={60} value={ageRange[1]} onChange={e=>setAgeRange([ageRange[0], +e.target.value])} className="w-full"/>
          </div>
        </Card>

        <Card>
          <div className="text-[14px] mb-3">أهمية المظهر لك</div>
          <div className="flex items-center justify-between gap-1.5">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={()=>setImportance(n)} className={`flex-1 aspect-square rounded-full border-2 font-serif-en flex items-center justify-center transition ${n===importance?"border-gold bg-[#FBF6E9] dark:bg-[#2a2417] text-gold":"border-line dark:border-edge text-ink-3"}`}>{n}</button>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-ink-3 mt-2"><span>غير مهم</span><span>مهم جداً</span></div>
        </Card>

        <Card className="bg-paper-2 dark:bg-night-3 !p-4">
          <div className="flex items-start gap-2.5 text-[13px] text-ink-2 dark:text-fog-2">
            <Icon name="info" size={16} className="text-gold shrink-0 mt-0.5"/>
            <div>التفضيلات الشكلية تمثل <span className="font-serif-en text-gold">١٥٪</span> فقط من حساب التوافق. الباقي للقيم والشخصية ونمط الحياة.</div>
          </div>
        </Card>
      </div>

      <div className="mt-7 flex justify-end">
        <GoldButton onClick={()=>go("onboard-done")} icon={<Icon name="arrowLeft" size={16}/>}>إنهاء</GoldButton>
      </div>
    </OnboardShell>
  );
};

// ---- P20: Onboarding Complete ----
const PageOnboardDone = ({ go }) => {
  return (
    <OnboardShell step={5} title=" ">
      <div className="-mt-6 text-center max-w-xl mx-auto py-6">
        <div className="relative w-32 h-32 mx-auto mb-7">
          <div className="absolute inset-0 rounded-full bg-gold/15 animate-ping"/>
          <div className="absolute inset-2 rounded-full bg-paper-card dark:bg-night-2 border-2 border-gold flex items-center justify-center">
            <Icon name="sparkles" size={56} className="text-gold"/>
          </div>
        </div>
        <h2 className="font-display text-3xl mb-2">ملفك جاهز ✨</h2>
        <p className="text-ink-2 dark:text-fog-2 text-[15px] leading-loose mb-7">عرفناك جيداً. وقت لقاء من يناسبك.</p>

        <Card className="text-right mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[11.5px] text-ink-3 mb-1.5">نوع الشخصية</div>
              <div className="font-display text-[15.5px]">عقلاني<br/>اجتماعي</div>
            </div>
            <div className="text-center">
              <div className="text-[11.5px] text-ink-3 mb-2">جاهزية الزواج</div>
              <ScoreRing value={84} size={92} stroke={7}/>
            </div>
            <div>
              <div className="text-[11.5px] text-ink-3 mb-1.5">الصفة الغالبة</div>
              <div className="font-display text-[15.5px]">اجتماعي<br/>ودود</div>
            </div>
          </div>
        </Card>

        <GoldButton size="lg" onClick={()=>go("dashboard")} icon={<Icon name="arrowLeft" size={16}/>}>اكتشف التوافقات</GoldButton>
        <div className="mt-3"><GhostButton onClick={()=>go("report")}>عرض التقرير الكامل</GhostButton></div>
      </div>
    </OnboardShell>
  );
};

window.PagesOnboarding = { PageConsent, PageProfileSetup, PageQuestionnaireOverview, PageQuestion, PageCategoryDone, PageQuestionnaireDone, PageFaceIntro, PageLiveness, PagePhotoCapture, PageFaceProcessing, PageTraits, PageSelfPhysical, PageSelfPrefs, PageOnboardDone };
Object.assign(window, window.PagesOnboarding);
