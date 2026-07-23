// =============== Settings Pages: P36-P41 ===============

// ---- P36: Settings Hub ----
const PageSettings = ({ go }) => {
  const groups = [
    { title: "الحساب", items: [
      { id: "settings-edit", label: "الملف الشخصي", icon: "user", to: "settings-edit" },
      { id: "settings-password", label: "كلمة المرور", icon: "lock", to: "settings-password" },
      { id: "settings-sub", label: "الاشتراك", icon: "crown", to: "settings-sub", badge: <Badge tone="gold">Pro</Badge> },
    ]},
    { title: "الخصوصية", items: [
      { id: "settings-privacy", label: "الخصوصية والظهور", icon: "shield", to: "settings-privacy" },
      { id: "settings-privacy", label: "من يمكنه رؤيتي", icon: "eye", to: "settings-privacy" },
    ]},
    { title: "التنبيهات", items: [
      { id: "settings-notifs", label: "تخصيص الإشعارات", icon: "bell", to: "settings-notifs" },
    ]},
    { title: "المساعدة", items: [
      { id: "help", label: "الدعم الفني", icon: "info" },
      { id: "about", label: "عن التطبيق", icon: "book" },
      { id: "terms", label: "الشروط والأحكام", icon: "shield" },
    ]},
    { title: "إدارة الحساب", items: [
      { id: "settings-account", label: "تعطيل/حذف الحساب", icon: "alert", to: "settings-account" },
      { id: "logout", label: "تسجيل الخروج", icon: "logout", danger: true, to: "login" },
    ]},
  ];
  return (
    <AppLayout go={go} current="settings" title="الإعدادات">
      <div className="max-w-3xl space-y-6">
        <Card className="!p-5">
          <div className="flex items-center gap-4">
            <ProfileAvatar name="أحمد محمود" size={64}/>
            <div className="flex-1 min-w-0">
              <div className="font-display text-lg">أحمد محمود</div>
              <div className="text-[13px] text-ink-2 dark:text-fog-2">ahmed.mahmoud@tawafuq.app</div>
              <div className="flex items-center gap-2 mt-1.5"><Badge tone="gold">Pro</Badge><Badge tone="green">موثّق</Badge></div>
            </div>
            <button onClick={()=>go("settings-edit")} className="p-2.5 rounded-xl border border-line dark:border-edge hover:bg-paper-2 dark:hover:bg-night-3"><Icon name="edit" size={16}/></button>
          </div>
        </Card>

        {groups.map(g => (
          <div key={g.title}>
            <div className="text-[11.5px] font-medium tracking-wider text-ink-3 uppercase px-2 mb-2">{g.title}</div>
            <Card padded={false} className="overflow-hidden">
              {g.items.map((it,i) => (
                <button key={i} onClick={() => it.to && go(it.to)} className="w-full text-right px-4 py-4 flex items-center gap-3 border-b last:border-0 border-line dark:border-edge hover:bg-paper-2 dark:hover:bg-night-3 transition">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${it.danger?"bg-rose-soft text-rose dark:bg-[#3a1f1f] dark:text-[#e89090]":"bg-paper-2 dark:bg-night-3 text-ink-2 dark:text-fog-2"}`}><Icon name={it.icon} size={18}/></div>
                  <span className={`flex-1 text-[14.5px] ${it.danger?"text-rose dark:text-[#e89090]":""}`}>{it.label}</span>
                  {it.badge}
                  <Icon name="chevronLeft" size={16} className="text-ink-3"/>
                </button>
              ))}
            </Card>
          </div>
        ))}

        <div className="text-center text-[12px] text-ink-3 numerals py-3">تَوَافُق v1.0.0 (2026.05)</div>
      </div>
    </AppLayout>
  );
};

// ---- P37: Edit Profile ----
const PageSettingsEdit = ({ go }) => (
  <AppLayout go={go} current="settings-edit" title="تعديل الملف الشخصي">
    <div className="max-w-2xl space-y-5">
      <Card>
        <div className="flex items-center gap-5">
          <div className="relative">
            <ProfileAvatar name="أحمد محمود" size={88}/>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center shadow-card"><Icon name="camera" size={14}/></button>
          </div>
          <div>
            <div className="font-display text-lg">صورة الملف</div>
            <div className="text-[13px] text-ink-2 dark:text-fog-2 mt-0.5">JPG أو PNG، حتى 5MB</div>
            <button className="text-[12.5px] text-gold mt-1.5">تغيير الصورة</button>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="الاسم" defaultValue="أحمد محمود"/>
          <TextField label="العمر" type="number" defaultValue="28"/>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="المدينة" options={sampleCities} defaultValue="القاهرة"/>
          <Select label="المؤهل" options={["ثانوي","دبلوم","بكالوريوس","ماجستير","دكتوراه"]} defaultValue="بكالوريوس"/>
        </div>
        <TextField label="المهنة" defaultValue="مهندس برمجيات"/>
        <TextArea label="نبذة" maxLength={150} defaultValue="مهندس برمجيات. أحب القراءة والسفر الهادئ. أبحث عن شريكة حياة متفاهمة."/>
      </Card>

      <div className="flex gap-3">
        <OutlineButton className="flex-1" onClick={()=>go("settings")}>إلغاء</OutlineButton>
        <GoldButton className="flex-1" onClick={()=>go("settings")}>حفظ التعديلات</GoldButton>
      </div>
    </div>
  </AppLayout>
);

// ---- P38: Password ----
const PageSettingsPassword = ({ go }) => (
  <AppLayout go={go} current="settings-password" title="كلمة المرور">
    <div className="max-w-md space-y-5">
      <Card className="space-y-4">
        <TextField label="كلمة المرور الحالية" type="password" icon={<Icon name="lock" size={16}/>}/>
        <TextField label="كلمة المرور الجديدة" type="password" icon={<Icon name="lock" size={16}/>}/>
        <TextField label="تأكيد كلمة المرور" type="password" icon={<Icon name="lock" size={16}/>}/>
      </Card>
      <Card className="bg-paper-2 dark:bg-night-3 !p-4 text-[12.5px] text-ink-2 dark:text-fog-2 space-y-1.5">
        <div className="flex items-center gap-1.5"><Icon name="check" size={12} className="text-green"/> ٨ أحرف على الأقل</div>
        <div className="flex items-center gap-1.5"><Icon name="check" size={12} className="text-green"/> حرف كبير وصغير</div>
        <div className="flex items-center gap-1.5"><Icon name="check" size={12} className="text-green"/> رقم واحد على الأقل</div>
      </Card>
      <div className="flex gap-3">
        <OutlineButton className="flex-1" onClick={()=>go("settings")}>إلغاء</OutlineButton>
        <GoldButton className="flex-1" onClick={()=>go("settings")}>حفظ</GoldButton>
      </div>
    </div>
  </AppLayout>
);

// ---- P39: Privacy ----
const PageSettingsPrivacy = ({ go }) => {
  const [anon, setAnon] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [showCity, setShowCity] = useState(true);
  const [whoSees, setWhoSees] = useState("matched");
  return (
    <AppLayout go={go} current="settings-privacy" title="الخصوصية" sub="تحكم في من يراك وكيف">
      <div className="max-w-2xl space-y-5">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-display text-[16px]">الوضع المجهول</div>
              <div className="text-[13px] text-ink-2 dark:text-fog-2 mt-1.5 leading-loose">اسمك وصورتك مخفيان حتى يتم قبول طلب التواصل بينكما. هذا الوضع مُفضّل في بداية رحلتك.</div>
            </div>
            <Toggle checked={anon} onChange={setAnon}/>
          </div>
        </Card>

        <Card>
          <div className="font-display text-[16px] mb-3">من يمكنه رؤية ملفي</div>
          <div className="space-y-2">
            {[
              ["all","الجميع","أي شخص في تَوَافُق"],
              ["matched","المتوافقون فقط","من يتجاوز توافقه ٧٠٪"],
              ["accepted","بعد قبول الطلب","الأكثر خصوصية"],
            ].map(([id,t,d]) => (
              <RadioCard key={id} checked={whoSees===id} onClick={()=>setWhoSees(id)}>
                <div className="font-medium text-[14px]">{t}</div>
                <div className="text-[12.5px] text-ink-2 dark:text-fog-2 mt-0.5">{d}</div>
              </RadioCard>
            ))}
          </div>
        </Card>

        <Card padded={false}>
          {[
            ["إظهار سني", showAge, setShowAge],
            ["إظهار مدينتي", showCity, setShowCity],
          ].map(([t, val, setVal]) => (
            <div key={t} className="px-5 py-4 flex items-center justify-between border-b last:border-0 border-line dark:border-edge">
              <div className="text-[14.5px]">{t}</div>
              <Toggle checked={val} onChange={setVal}/>
            </div>
          ))}
        </Card>

        <div className="flex justify-end gap-3">
          <GoldButton onClick={()=>go("settings")}>حفظ الإعدادات</GoldButton>
        </div>
      </div>
    </AppLayout>
  );
};

// ---- P40: Notifications ----
const PageSettingsNotifs = ({ go }) => {
  const [state, setState] = useState({
    newMatch: true, newReq: true, reqStatus: true, newMsg: true, tips: false, email: true,
  });
  const items = [
    ["newMatch","توافق جديد","تنبيه عند ظهور توافق عالٍ"],
    ["newReq","طلب تواصل جديد","عندما يطلب أحد التواصل معك"],
    ["reqStatus","تغيير حالة الطلب","قبول/اعتذار طلباتك المرسلة"],
    ["newMsg","رسالة جديدة","رسائل المحادثات النشطة"],
    ["tips","تذكيرات ونصائح","نصائح أسبوعية لتحسين ملفك"],
  ];
  return (
    <AppLayout go={go} current="settings-notifs" title="الإشعارات">
      <div className="max-w-2xl space-y-5">
        <Card padded={false}>
          {items.map(([k,t,d],i) => (
            <div key={k} className="px-5 py-4 flex items-start justify-between gap-4 border-b last:border-0 border-line dark:border-edge">
              <div className="flex-1">
                <div className="text-[14.5px]">{t}</div>
                <div className="text-[12.5px] text-ink-2 dark:text-fog-2 mt-0.5">{d}</div>
              </div>
              <Toggle checked={state[k]} onChange={v => setState(s=>({...s,[k]:v}))}/>
            </div>
          ))}
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium text-[15px]">إشعارات البريد الإلكتروني</div>
              <div className="text-[13px] text-ink-2 dark:text-fog-2 mt-0.5 leading-loose">نخبرك بالأمور المهمة على بريدك أيضاً.</div>
            </div>
            <Toggle checked={state.email} onChange={v=>setState(s=>({...s, email:v}))}/>
          </div>
        </Card>

        <div className="flex justify-end">
          <GoldButton onClick={()=>go("settings")}>حفظ</GoldButton>
        </div>
      </div>
    </AppLayout>
  );
};

// ---- P41: Account (deactivate/delete) ----
const PageSettingsAccount = ({ go }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <AppLayout go={go} current="settings-account" title="إدارة الحساب">
      <div className="max-w-2xl space-y-5">
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-soft text-amber flex items-center justify-center shrink-0"><Icon name="pause" size={20}/></div>
            <div className="flex-1">
              <div className="font-display text-[16px]">تعطيل الحساب مؤقتاً</div>
              <p className="text-[13px] text-ink-2 dark:text-fog-2 mt-1.5 leading-loose">يخفي ملفك من جميع المستخدمين ويُوقِف ظهورك في المطابقات. يمكنك العودة في أي وقت بتسجيل الدخول.</p>
              <OutlineButton size="sm" className="mt-3">تعطيل مؤقت</OutlineButton>
            </div>
          </div>
        </Card>

        <Card className="border-rose/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-soft text-rose dark:bg-[#3a1f1f] dark:text-[#e89090] flex items-center justify-center shrink-0"><Icon name="trash" size={20}/></div>
            <div className="flex-1">
              <div className="font-display text-[16px] text-rose dark:text-[#e89090]">حذف الحساب نهائياً</div>
              <p className="text-[13px] text-ink-2 dark:text-fog-2 mt-1.5 leading-loose">سيتم حذف ملفك وجميع بياناتك (الاستبيان، تحليل الوجه، المحادثات) بشكل نهائي ولا يمكن استعادتها.</p>
              <button onClick={()=>setShowConfirm(true)} className="mt-3 px-4 py-2 rounded-xl border-2 border-rose text-rose dark:border-[#7a3a3a] dark:text-[#e89090] text-[13px]">حذف الحساب نهائياً</button>
            </div>
          </div>
        </Card>
      </div>

      <Modal open={showConfirm} onClose={()=>setShowConfirm(false)} title="تأكيد حذف الحساب"
        footer={<><OutlineButton onClick={()=>setShowConfirm(false)}>إلغاء</OutlineButton><button onClick={()=>{ setShowConfirm(false); go("login"); }} className="px-5 py-3 rounded-xl bg-rose text-white text-[14px]">حذف نهائياً</button></>}>
        <p className="text-[14px] leading-loose text-ink-2 dark:text-fog-2">هذا الإجراء <span className="text-rose font-medium">نهائي</span> ولا يمكن التراجع عنه. سيتم حذف:</p>
        <ul className="mt-3 space-y-1.5 text-[13.5px]">
          <li className="flex items-center gap-2"><Icon name="x" size={14} className="text-rose"/> ملفك الشخصي</li>
          <li className="flex items-center gap-2"><Icon name="x" size={14} className="text-rose"/> إجابات الاستبيان وتقريرك</li>
          <li className="flex items-center gap-2"><Icon name="x" size={14} className="text-rose"/> صور تحليل الوجه</li>
          <li className="flex items-center gap-2"><Icon name="x" size={14} className="text-rose"/> سجل المحادثات</li>
        </ul>
        <div className="mt-4"><TextField label="اكتب 'حذف' للتأكيد" placeholder="حذف"/></div>
      </Modal>
    </AppLayout>
  );
};

window.PagesSettings = { PageSettings, PageSettingsEdit, PageSettingsPassword, PageSettingsPrivacy, PageSettingsNotifs, PageSettingsAccount };
Object.assign(window, window.PagesSettings);
