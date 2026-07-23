// =============== Error Pages: P64-P68 ===============

const ErrorShell = ({ code, title, sub, illo, actions }) => (
  <div className="min-h-screen bg-paper dark:bg-night flex flex-col">
    <div className="px-5 lg:px-8 py-5"><Logo/></div>
    <div className="flex-1 flex items-center justify-center px-5">
      <div className="text-center max-w-md py-10">
        <div className="w-32 h-32 mx-auto mb-7 relative">{illo}</div>
        {code && <div className="font-serif-en text-6xl text-gold/30 numerals mb-2">{code}</div>}
        <h1 className="font-display text-3xl mb-3">{title}</h1>
        <p className="text-ink-2 dark:text-fog-2 leading-loose">{sub}</p>
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">{actions}</div>
      </div>
    </div>
    <div className="px-5 lg:px-8 py-5 text-center text-[12px] text-ink-3">© ٢٠٢٦ تَوَافُق</div>
  </div>
);

// Soft illustration helpers
const FloatingShape = ({ children, className }) => <div className={`absolute ${className}`}>{children}</div>;

const Illo404 = () => (
  <div className="w-32 h-32 relative">
    <FloatingShape className="inset-0 rounded-3xl bg-gold/10 rotate-12"><span/></FloatingShape>
    <FloatingShape className="inset-3 rounded-3xl bg-gold/20 -rotate-6"><span/></FloatingShape>
    <div className="absolute inset-0 flex items-center justify-center"><Icon name="search" size={56} className="text-gold"/></div>
  </div>
);
const Illo403 = () => (
  <div className="w-32 h-32 relative">
    <div className="absolute inset-0 rounded-full bg-rose-soft dark:bg-[#3a1f1f]"/>
    <div className="absolute inset-0 flex items-center justify-center"><Icon name="lock" size={56} className="text-rose"/></div>
  </div>
);
const Illo500 = () => (
  <div className="w-32 h-32 relative">
    <div className="absolute inset-0 rounded-3xl bg-amber-soft dark:bg-[#2a2010]"/>
    <div className="absolute inset-0 flex items-center justify-center"><Icon name="alert" size={60} className="text-amber"/></div>
  </div>
);
const IlloSession = () => (
  <div className="w-32 h-32 relative">
    <div className="absolute inset-0 rounded-full bg-paper-2 dark:bg-night-3"/>
    <div className="absolute inset-0 flex items-center justify-center"><Icon name="clock" size={56} className="text-ink-2"/></div>
  </div>
);
const IlloMaint = () => (
  <div className="w-32 h-32 relative">
    <div className="absolute inset-0 rounded-3xl bg-gold/10"/>
    <div className="absolute inset-0 flex items-center justify-center"><Icon name="settings" size={56} className="text-gold animate-[spin_4s_linear_infinite]"/></div>
  </div>
);

// ---- P64: 404 ----
const Page404 = ({ go }) => (
  <ErrorShell code="404" title="الصفحة غير موجودة"
    sub="لا تقلق — قد تكون الصفحة قد نُقلت أو لم تعد متوفرة. لنعدك للطريق الصحيح."
    illo={<Illo404/>}
    actions={<><GoldButton onClick={()=>go("landing")} iconLeft={<Icon name="home" size={16}/>}>الصفحة الرئيسية</GoldButton><OutlineButton onClick={()=>go("dashboard")}>لوحة التحكم</OutlineButton></>}
  />
);

// ---- P65: 403 ----
const Page403 = ({ go }) => (
  <ErrorShell code="403" title="غير مصرّح لك بالدخول"
    sub="هذا المحتوى متاح فقط لمستخدمين محددين. إن كنت تظن أنه خطأ، تواصل معنا."
    illo={<Illo403/>}
    actions={<><OutlineButton onClick={()=>go("dashboard")} iconLeft={<Icon name="arrowRight" size={16}/>}>العودة</OutlineButton><GoldButton onClick={()=>go("landing")}>الصفحة الرئيسية</GoldButton></>}
  />
);

// ---- P66: 500 ----
const Page500 = ({ go }) => (
  <ErrorShell code="500" title="حصل خطأ — نعمل على الإصلاح"
    sub="هذا من جانبنا. سجلنا الحدث وفريقنا يعمل عليه. حاول مجدداً بعد لحظات."
    illo={<Illo500/>}
    actions={<><GoldButton iconLeft={<Icon name="refresh" size={16}/>}>إعادة المحاولة</GoldButton><OutlineButton onClick={()=>go("landing")}>الرئيسية</OutlineButton></>}
  />
);

// ---- P67: Session Expired ----
const PageSessionExpired = ({ go }) => (
  <ErrorShell title="انتهت جلستك"
    sub="حفاظاً على أمان حسابك سجّلنا خروجك تلقائياً بعد فترة من عدم النشاط. أهلاً بعودتك."
    illo={<IlloSession/>}
    actions={<GoldButton onClick={()=>go("login")} iconLeft={<Icon name="logout" size={16} className="rotate-180"/>}>تسجيل الدخول</GoldButton>}
  />
);

// ---- P68: Maintenance ----
const PageMaintenance = ({ go }) => (
  <ErrorShell title="نحن نتحسّن لأجلك"
    sub="الموقع تحت الصيانة لتحديث سريع. نتوقع عودتنا خلال أقل من ساعة. شكراً لصبرك."
    illo={<IlloMaint/>}
    actions={<>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-paper-2 dark:bg-night-3 text-[13px]">
        <Icon name="clock" size={14} className="text-gold"/>
        <span>العودة المتوقعة: <span className="numerals font-serif-en">١٤:٣٠</span></span>
      </div>
    </>}
  />
);

window.PagesErrors = { Page404, Page403, Page500, PageSessionExpired, PageMaintenance };
Object.assign(window, window.PagesErrors);
