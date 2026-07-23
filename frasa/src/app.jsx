// =============== App Router ===============

const PAGE_REGISTRY = {
  // Public
  landing: PageLanding, register: PageRegister, login: PageLogin, otp: PageOTP, forgot: PageForgot, reset: PageReset,
  // Onboarding
  consent: PageConsent, "profile-setup": PageProfileSetup,
  "q-overview": PageQuestionnaireOverview, "q-question": PageQuestion, "q-category-done": PageCategoryDone, "q-all-done": PageQuestionnaireDone,
  "face-intro": PageFaceIntro, "face-liveness": PageLiveness, "face-capture": PagePhotoCapture, "face-processing": PageFaceProcessing, "face-traits": PageTraits,
  "self-physical": PageSelfPhysical, "self-prefs": PageSelfPrefs, "onboard-done": PageOnboardDone,
  // Main
  dashboard: PageDashboard, report: PageReport, matches: PageMatches, "match-detail": PageMatchDetail,
  "req-sent": PageRequestsSent, "req-received": PageRequestsReceived, "req-detail": PageRequestDetail,
  chats: PageChats, "chat-room": PageChatRoom, notifs: PageNotifs,
  // Subscription
  pricing: PagePricing, payment: PagePayment, "sub-success": PageSubSuccess, "sub-expired": PageSubExpired, "settings-sub": PageSettingsSubscription,
  // Settings
  settings: PageSettings, "settings-edit": PageSettingsEdit, "settings-password": PageSettingsPassword,
  "settings-privacy": PageSettingsPrivacy, "settings-notifs": PageSettingsNotifs, "settings-account": PageSettingsAccount,
  // Admin
  "admin-dashboard": PageAdminDashboard, "admin-users": PageAdminUsers, "admin-user-detail": PageAdminUserDetail,
  "admin-questions": PageAdminQuestions, "admin-question-edit": PageAdminQuestionEdit,
  "admin-weights": PageAdminWeights, "admin-traits": PageAdminTraits,
  "admin-requests": PageAdminRequests, "admin-flags": PageAdminFlags, "admin-chat-view": PageAdminChatView,
  "admin-reports": PageAdminReports, "admin-report-detail": PageAdminReportDetail,
  "admin-words": PageAdminWords, "admin-icebreakers": PageAdminIceBreakers, "admin-tips": PageAdminTips,
  "admin-settings": PageAdminSettings, "admin-stats": PageAdminStats, "admin-ml": PageAdminML, "admin-logs": PageAdminLogs,
  "admin-plans": PageAdminPlans, "admin-subs": PageAdminSubs, "admin-revenue": PageAdminRevenue,
  // Errors
  "404": Page404, "403": Page403, "500": Page500, session: PageSessionExpired, maintenance: PageMaintenance,
};

function App() {
  const [page, setPage] = useState(() => {
    try {
      const hash = window.location.hash.replace("#","");
      return hash && PAGE_REGISTRY[hash] ? hash : "landing";
    } catch { return "landing"; }
  });
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("tw-dark") === "1"; } catch { return false; }
  });
  const [userType, setUserType] = useState(() => {
    try { return localStorage.getItem("tw-utype") || "guest"; } catch { return "guest"; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("tw-dark", dark?"1":"0"); } catch {}
  }, [dark]);

  useEffect(() => {
    try { localStorage.setItem("tw-utype", userType); } catch {}
  }, [userType]);

  useEffect(() => {
    try {
      window.location.hash = page;
      window.scrollTo({top:0, behavior:"instant"});
    } catch {}
  }, [page]);

  // Listen to hash changes (back button)
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#","");
      if (h && PAGE_REGISTRY[h] && h !== page) setPage(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [page]);

  const go = useCallback((id) => {
    if (PAGE_REGISTRY[id]) setPage(id);
    else { console.warn("Unknown page:", id); setPage("404"); }
  }, []);

  const subscribed = userType === "subscribed" || userType === "admin";

  const Cmp = PAGE_REGISTRY[page] || PageLanding;
  return (
    <div className="min-h-screen bg-paper dark:bg-night text-ink dark:text-fog font-body">
      <div key={page} className="page-enter">
        <Cmp go={go} subscribed={subscribed} userType={userType} setUserType={setUserType}/>
      </div>
      <PageNavigator
        current={page}
        onGo={go}
        dark={dark}
        onToggleDark={() => setDark(d=>!d)}
        userType={userType}
        onToggleUserType={setUserType}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
