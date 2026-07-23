-- ============================================================================
-- Tawafuq Database Schema — PostgreSQL
-- ============================================================================
-- Covers: Auth, Profile, Onboarding, Face Engine, Matching, Trait Analysis,
--         Communication, Subscriptions, Moderation, Notifications, Audit
--
-- Conventions:
--   - All tables use snake_case
--   - PKs use UUID (gen_random_uuid)
--   - Timestamps in UTC with timezone
--   - Soft deletes via deleted_at where useful
--   - JSONB used for variable-shape data (answers, metrics, settings)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "vector";     -- pgvector for face embeddings

-- ============================================================================
-- DOMAIN 1: IDENTITY & AUTH
-- ============================================================================

CREATE TYPE user_status        AS ENUM ('pending_verification', 'active', 'suspended', 'banned', 'deleted');
CREATE TYPE gender             AS ENUM ('male', 'female');
CREATE TYPE marital_status     AS ENUM ('single', 'divorced_no_kids', 'divorced_with_kids', 'widowed', 'married_seeking_second');
CREATE TYPE religion           AS ENUM ('muslim', 'christian_coptic', 'christian_catholic', 'christian_orthodox', 'christian_protestant', 'druze');
CREATE TYPE sect               AS ENUM ('sunni', 'shia', 'ibadi', 'none', 'coptic_orthodox', 'catholic', 'protestant');

CREATE TABLE users (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                  TEXT UNIQUE NOT NULL,
    phone                  TEXT UNIQUE NOT NULL,
    password_hash          TEXT NOT NULL,
    status                 user_status NOT NULL DEFAULT 'pending_verification',
    gender                 gender,
    date_of_birth          DATE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at             TIMESTAMPTZ,
    last_login_at          TIMESTAMPTZ,
    last_active_at         TIMESTAMPTZ,
    email_verified_at      TIMESTAMPTZ,
    phone_verified_at      TIMESTAMPTZ,
    locale                 TEXT NOT NULL DEFAULT 'ar',
    timezone               TEXT NOT NULL DEFAULT 'Asia/Riyadh'
);
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_last_active ON users(last_active_at DESC);

CREATE TABLE auth_sessions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash         TEXT NOT NULL,
    device_info        JSONB,
    ip_address         INET,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at         TIMESTAMPTZ NOT NULL,
    revoked_at         TIMESTAMPTZ
);
CREATE INDEX idx_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_sessions_token ON auth_sessions(token_hash);

CREATE TABLE otp_codes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone        TEXT NOT NULL,
    code_hash    TEXT NOT NULL,
    purpose      TEXT NOT NULL,           -- 'register' | 'login' | 'recovery'
    attempts     INT  NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ NOT NULL,
    consumed_at  TIMESTAMPTZ
);
CREATE INDEX idx_otp_phone ON otp_codes(phone, created_at DESC);

-- ============================================================================
-- DOMAIN 2: VERIFICATION (KYC)
-- ============================================================================

CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'expired');

CREATE TABLE identity_verifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_document_type    TEXT,                -- 'national_id' | 'passport'
    id_document_country TEXT,
    id_document_url     TEXT,                -- S3/R2 reference
    selfie_url          TEXT,
    selfie_match_score  REAL,                -- 0..1 confidence id vs selfie
    status              verification_status NOT NULL DEFAULT 'pending',
    reviewed_by         UUID REFERENCES users(id),
    review_notes        TEXT,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at         TIMESTAMPTZ
);
CREATE INDEX idx_kyc_user ON identity_verifications(user_id);
CREATE INDEX idx_kyc_status ON identity_verifications(status);

-- ============================================================================
-- DOMAIN 3: PROFILE
-- ============================================================================

CREATE TABLE user_profiles (
    user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name         TEXT NOT NULL,
    bio                  TEXT,
    country              TEXT,
    city                 TEXT,
    education_level      TEXT,
    occupation           TEXT,
    marital_status       marital_status,
    religion             religion,
    sect                 sect,
    height_cm            INT CHECK (height_cm BETWEEN 120 AND 230),
    weight_kg            INT CHECK (weight_kg BETWEEN 30 AND 250),
    build                TEXT,                -- 'slim' | 'average' | 'curvy' | 'athletic'
    ethnic_background    TEXT,                -- 'tribal' | 'non_tribal' | etc.
    nationality_openness TEXT,                -- from Q8
    photos               JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{url, is_primary, uploaded_at}]
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    visibility           JSONB NOT NULL DEFAULT '{"profile":"public","health":"private","mental":"private"}'::jsonb
);
CREATE INDEX idx_profiles_country_city ON user_profiles(country, city);
CREATE INDEX idx_profiles_religion ON user_profiles(religion, sect);

CREATE TABLE partner_preferences (
    user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age_min              INT NOT NULL DEFAULT 18,
    age_max              INT NOT NULL DEFAULT 60,
    height_min_cm        INT,
    height_max_cm        INT,
    weight_min_kg        INT,
    weight_max_kg        INT,
    preferred_build      TEXT[],
    preferred_countries  TEXT[],
    open_to_relocation   BOOLEAN DEFAULT false,
    religious_commitment_gap INT,             -- max acceptable gap on 0-100 scale
    deal_breakers        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Q63 selections
    flexibility_level    TEXT,                -- 'strict' | 'flexible' | 'open'
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- DOMAIN 4: ONBOARDING ANSWERS (73 MATCHING QUESTIONS)
-- ============================================================================

CREATE TABLE matching_answers (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_num   INT  NOT NULL,            -- 1..73
    answer_value   JSONB NOT NULL,           -- shape varies: int | string | array | object
    answered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, question_num)
);
CREATE INDEX idx_matching_ans_user ON matching_answers(user_id);

-- ============================================================================
-- DOMAIN 5: FACE ENGINE (38 METRICS + EMBEDDINGS)
-- ============================================================================

CREATE TABLE face_scans (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metrics             JSONB NOT NULL,                  -- 38 named metrics
    face_vector         VECTOR(13),                      -- for cosine similarity
    landmarks_hash      TEXT,                            -- for de-duplication
    image_hash          TEXT,                            -- SHA-256, image itself NOT stored
    liveness_passed     BOOLEAN NOT NULL DEFAULT false,
    quality_score       REAL,                            -- 0..1
    scanned_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_primary          BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_face_user ON face_scans(user_id);
CREATE INDEX idx_face_primary ON face_scans(user_id) WHERE is_primary;
CREATE INDEX idx_face_vector ON face_scans USING ivfflat (face_vector vector_cosine_ops);

-- ============================================================================
-- DOMAIN 6: MATCHING PROFILE (computed from answers + face)
-- ============================================================================

CREATE TABLE matching_profiles (
    user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    -- religion & lifestyle
    religious_commitment INT,                          -- 0..100 from Q13
    religious_expectation TEXT,                        -- from Q15
    prayer_score         INT,                          -- 1..5 from Q20
    fajr_score           INT,                          -- 1..5 from Q23
    -- big five (1..7 each)
    big_five             JSONB,                        -- {openness, conscientiousness, extraversion, agreeableness, emotional_stability}
    -- attachment style
    attachment_primary   TEXT,                         -- 'secure' | 'anxious' | 'avoidant' | 'disorganized'
    attachment_breakdown JSONB,
    -- gottman
    gottman              JSONB,                        -- {healthy, contempt}
    -- love languages (ranked)
    love_languages       JSONB,
    -- values
    values               JSONB,
    -- intimacy
    intimacy             JSONB,
    -- safety
    dark_triad_score     INT,                          -- 0..100 (0=clean)
    red_flags            TEXT[],                       -- ['control_jealousy', ...]
    -- meta
    profile_completeness REAL,                          -- 0..1
    last_computed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- DOMAIN 7: TRAIT ANALYSIS (PAID FEATURE)
-- ============================================================================

CREATE TYPE ta_plan AS ENUM ('basic', 'advanced', 'premium');

CREATE TABLE trait_analysis_purchases (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan               ta_plan NOT NULL,
    purchase_id        UUID REFERENCES payments(id),
    purchased_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at         TIMESTAMPTZ,                       -- NULL = one-time lifetime
    UNIQUE(user_id, plan)
);

CREATE TABLE trait_answers (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id    TEXT NOT NULL,                          -- 'q_0001' .. 'q_0951'
    likert_value   INT  NOT NULL CHECK (likert_value BETWEEN 1 AND 5),
    answered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, question_id)
);
CREATE INDEX idx_trait_ans_user ON trait_answers(user_id);

CREATE TABLE trait_scores (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trait_id          TEXT NOT NULL,                       -- 'sabti_001' .. 'sabti_600'
    score             REAL NOT NULL,                       -- 0..100
    confidence        TEXT NOT NULL,                       -- 'high'|'medium'|'low'
    questions_used    INT  NOT NULL,
    structural_used   BOOLEAN NOT NULL,
    computed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, trait_id)
);
CREATE INDEX idx_trait_scores_user ON trait_scores(user_id);

-- ============================================================================
-- DOMAIN 8: MATCHING SUBSCRIPTION
-- ============================================================================

CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'paused', 'trialing');
CREATE TYPE billing_cycle      AS ENUM ('monthly', 'annual', 'lifetime');

CREATE TABLE subscriptions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan               TEXT NOT NULL,                     -- 'basic'|'advanced'|'premium'
    cycle              billing_cycle NOT NULL,
    status             subscription_status NOT NULL DEFAULT 'active',
    started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end   TIMESTAMPTZ NOT NULL,
    cancelled_at       TIMESTAMPTZ,
    cancelled_reason   TEXT,
    auto_renew         BOOLEAN NOT NULL DEFAULT true,
    revenue_cat_id     TEXT                                -- external IAP reference
);
CREATE INDEX idx_subs_user ON subscriptions(user_id);
CREATE INDEX idx_subs_active ON subscriptions(user_id) WHERE status = 'active';

-- ============================================================================
-- DOMAIN 9: PAYMENTS
-- ============================================================================

CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    purpose             TEXT NOT NULL,                    -- 'matching_subscription'|'trait_analysis_basic'|'trait_analysis_advanced'|'trait_analysis_premium'
    amount_minor        BIGINT NOT NULL,                  -- in piastres (1 EGP = 100)
    currency            CHAR(3) NOT NULL DEFAULT 'EGP',
    status              payment_status NOT NULL DEFAULT 'pending',
    provider            TEXT NOT NULL,                    -- 'stripe'|'tap'|'stc_pay'|'apple_iap'|'google_iap'
    provider_txn_id     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    refunded_at         TIMESTAMPTZ,
    refund_reason       TEXT,
    metadata            JSONB
);
CREATE INDEX idx_payments_user ON payments(user_id, created_at DESC);

-- ============================================================================
-- DOMAIN 10: MATCHES (server-computed, cached)
-- ============================================================================

CREATE TABLE matches (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score              REAL NOT NULL,                     -- 0..100
    tag                TEXT NOT NULL,                     -- 'high'|'medium'|'low'
    dimensions         JSONB NOT NULL,                    -- 8 dim breakdown
    red_flags          TEXT[],
    computed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    seen_by_a_at       TIMESTAMPTZ,                       -- when A saw this match
    seen_by_b_at       TIMESTAMPTZ,
    CHECK (user_a_id < user_b_id),                        -- canonical pair ordering
    UNIQUE(user_a_id, user_b_id)
);
CREATE INDEX idx_matches_a ON matches(user_a_id, score DESC);
CREATE INDEX idx_matches_b ON matches(user_b_id, score DESC);

-- ============================================================================
-- DOMAIN 11: CONTACT REQUESTS & CHAT
-- ============================================================================

CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected', 'expired', 'cancelled');

CREATE TABLE contact_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id        UUID REFERENCES matches(id),
    message         TEXT,                                  -- short intro
    status          request_status NOT NULL DEFAULT 'pending',
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ
);
CREATE INDEX idx_req_sender ON contact_requests(sender_id, sent_at DESC);
CREATE INDEX idx_req_recipient ON contact_requests(recipient_id, sent_at DESC);

CREATE TABLE chat_rooms (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opened_via_request UUID REFERENCES contact_requests(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at  TIMESTAMPTZ,
    closed_at        TIMESTAMPTZ,
    -- free-tier message counters
    free_messages_a  INT NOT NULL DEFAULT 0,
    free_messages_b  INT NOT NULL DEFAULT 0,
    CHECK (user_a_id < user_b_id),
    UNIQUE(user_a_id, user_b_id)
);
CREATE INDEX idx_chat_users ON chat_rooms(user_a_id, user_b_id);

CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id         UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at         TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ,
    flagged_at      TIMESTAMPTZ
);
CREATE INDEX idx_msg_room ON chat_messages(room_id, sent_at DESC);

-- ============================================================================
-- DOMAIN 12: MODERATION
-- ============================================================================

CREATE TYPE report_reason AS ENUM ('inappropriate_content', 'fake_profile', 'harassment', 'spam', 'underage', 'other');
CREATE TYPE report_status AS ENUM ('pending', 'in_review', 'resolved_action_taken', 'resolved_no_action');

CREATE TABLE user_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID NOT NULL REFERENCES users(id),
    reported_id     UUID NOT NULL REFERENCES users(id),
    reason          report_reason NOT NULL,
    details         TEXT,
    evidence_urls   TEXT[],
    related_message_id UUID REFERENCES chat_messages(id),
    status          report_status NOT NULL DEFAULT 'pending',
    reviewed_by     UUID REFERENCES users(id),
    review_notes    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at     TIMESTAMPTZ
);
CREATE INDEX idx_reports_status ON user_reports(status, created_at);

CREATE TABLE blocks (
    blocker_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason        TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- abuse detection signals (anti-spam)
CREATE TABLE abuse_signals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signal_type  TEXT NOT NULL,    -- 'duplicate_message','too_many_requests','repeated_intro_text'
    severity     INT  NOT NULL,    -- 1..5
    metadata     JSONB,
    detected_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_abuse_user ON abuse_signals(user_id, detected_at DESC);

-- ============================================================================
-- DOMAIN 13: NOTIFICATIONS
-- ============================================================================

CREATE TYPE notification_type AS ENUM (
    'new_match', 'new_request', 'request_accepted', 'request_rejected',
    'new_message', 'subscription_expiring', 'subscription_expired',
    'verification_approved', 'verification_rejected',
    'trait_report_ready', 'system_announcement'
);

CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         notification_type NOT NULL,
    title        TEXT NOT NULL,
    body         TEXT,
    payload      JSONB,                    -- {match_id, sender_id, ...}
    read_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

CREATE TABLE push_tokens (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform      TEXT NOT NULL,         -- 'ios'|'android'|'web'
    token         TEXT NOT NULL,
    device_info   JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at    TIMESTAMPTZ,
    UNIQUE(user_id, token)
);

-- ============================================================================
-- DOMAIN 14: SETTINGS & PREFERENCES
-- ============================================================================

CREATE TABLE user_settings (
    user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notifications      JSONB NOT NULL DEFAULT '{"match":true,"request":true,"message":true,"marketing":false}'::jsonb,
    privacy            JSONB NOT NULL DEFAULT '{}'::jsonb,
    theme              TEXT NOT NULL DEFAULT 'system',     -- 'light'|'dark'|'system'
    locale             TEXT NOT NULL DEFAULT 'ar',
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- DOMAIN 15: ADMIN & AUDIT
-- ============================================================================

CREATE TABLE admin_users (
    user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL,         -- 'super_admin'|'moderator'|'support'|'finance'
    permissions  JSONB NOT NULL DEFAULT '{}'::jsonb,
    granted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    granted_by   UUID REFERENCES users(id)
);

CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id     UUID REFERENCES users(id),
    action       TEXT NOT NULL,         -- 'user.suspend','question.update', etc.
    target_type  TEXT,
    target_id    UUID,
    before_state JSONB,
    after_state  JSONB,
    ip_address   INET,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);

-- ============================================================================
-- DOMAIN 16: CONTENT BANK (server-side question/trait dictionaries)
-- ============================================================================

CREATE TABLE matching_question_bank (
    num            INT PRIMARY KEY,                    -- 1..73
    stage          TEXT NOT NULL,
    dimension      TEXT NOT NULL,
    type           TEXT NOT NULL,
    text_ar        TEXT NOT NULL,
    options        JSONB,
    gender_gate    TEXT,
    religion_gate  TEXT,
    version        INT NOT NULL DEFAULT 1,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trait_question_bank (
    id             TEXT PRIMARY KEY,                   -- 'q_0001'
    text_ar        TEXT NOT NULL,
    type           TEXT NOT NULL DEFAULT 'likert_5',
    source_indicators TEXT[],
    plan_tier      TEXT NOT NULL,                       -- 'basic'|'advanced'|'premium'
    rank_score     REAL,
    traits_covered INT,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trait_dictionary (
    id             TEXT PRIMARY KEY,                   -- 'sabti_001'
    name_ar        TEXT NOT NULL,
    symbol         TEXT,
    psychological_root TEXT,
    description    TEXT,
    facial_indicators JSONB,
    refinement     TEXT,
    category       TEXT,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trait_question_weights (
    trait_id       TEXT NOT NULL REFERENCES trait_dictionary(id),
    question_id    TEXT NOT NULL REFERENCES trait_question_bank(id),
    weight         REAL NOT NULL,
    PRIMARY KEY (trait_id, question_id)
);

-- ============================================================================
-- DOMAIN 17: ANALYTICS EVENTS (lightweight; heavy work goes to Mixpanel/etc.)
-- ============================================================================

CREATE TABLE events (
    id           BIGSERIAL PRIMARY KEY,
    user_id      UUID REFERENCES users(id),
    session_id   UUID,
    event_name   TEXT NOT NULL,                        -- 'paywall.viewed','onboarding.completed',...
    properties   JSONB,
    ip_address   INET,
    user_agent   TEXT,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_user_time ON events(user_id, occurred_at DESC);
CREATE INDEX idx_events_name_time ON events(event_name, occurred_at DESC);

-- ============================================================================
-- DOMAIN 18.5: TRAIT COMPATIBILITY RULES (admin-curated pair rules)
-- ============================================================================
-- لكل زوج سمات نحدد:
--   - same_trait_penalty: لو الاتنين عندهم نفس السمة بـ score >= threshold
--   - anti_pair_penalty:  لو طرف عنده سمة A والطرف الآخر عنده سمة B
--   - complement_bonus:   لو طرف عنده سمة A والطرف الآخر عنده سمة B (مكمّلة)
-- النتيجة بتتطبق فوق الـ algorithmic score النهائي.
-- ============================================================================

CREATE TYPE rule_kind AS ENUM ('same_trait_penalty', 'anti_pair_penalty', 'complement_bonus');

CREATE TABLE trait_compatibility_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind            rule_kind NOT NULL,
    -- إذا same_trait_penalty: trait_a = trait_b (نفس السمة)
    -- إذا anti_pair / complement: trait_a و trait_b مختلفتان
    trait_a         TEXT NOT NULL REFERENCES trait_dictionary(id),
    trait_b         TEXT NOT NULL REFERENCES trait_dictionary(id),
    -- الحد الأدنى لـ score السمة عند الطرفين عشان الـ rule تنطبق
    threshold_a     REAL NOT NULL DEFAULT 70,    -- 0..100
    threshold_b     REAL NOT NULL DEFAULT 70,
    -- الأثر على الـ match score النهائي (موجب أو سالب)
    score_delta     REAL NOT NULL,                -- -50 .. +30
    -- شرح يظهر للمستخدم (لو الـ rule اشتغلت)
    insight_ar      TEXT,
    severity        TEXT NOT NULL DEFAULT 'info', -- 'info' | 'warn' | 'critical'
    -- شرط الـ symmetry: لو true يعمل match سواء A عند المستخدم 1 وB عند 2 أو العكس
    symmetric       BOOLEAN NOT NULL DEFAULT true,
    enabled         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES users(id),
    CHECK (kind != 'same_trait_penalty' OR trait_a = trait_b)
);
CREATE INDEX idx_compat_rules_a ON trait_compatibility_rules(trait_a) WHERE enabled;
CREATE INDEX idx_compat_rules_b ON trait_compatibility_rules(trait_b) WHERE enabled;

-- جدول مساعد: كل rule اشتغلت لكل match (audit + UI)
CREATE TABLE applied_compatibility_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    rule_id         UUID NOT NULL REFERENCES trait_compatibility_rules(id),
    score_a         REAL NOT NULL,        -- score الطرف الأول للسمة
    score_b         REAL NOT NULL,        -- score الطرف الثاني
    applied_delta   REAL NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_applied_match ON applied_compatibility_rules(match_id);

-- ============================================================================
-- DOMAIN 18: CONVERSATION INTELLIGENCE (Ice Breakers + Tips + Moderation)
-- ============================================================================

-- ---------- 18.1: Ice Breaker Templates (bank — admin-managed) -------------
CREATE TYPE icebreaker_category AS ENUM (
    'shared_value','shared_interest','shared_belief',
    'lifestyle_gap','personality_gap','growth_question',
    'getting_to_know','deep_dive','playful'
);

CREATE TABLE icebreaker_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category        icebreaker_category NOT NULL,
    text_ar         TEXT NOT NULL,
    -- conditions for triggering (any/all match)
    trigger_rules   JSONB NOT NULL,
    -- example: {"both_high":["religion"], "both_low":["intimacy_public"]}
    -- or:      {"both_score_above": {"dimension":"values","threshold":80}}
    -- or:      {"trait_match":"sabti_123","both_score_above":70}
    priority        INT NOT NULL DEFAULT 50,    -- 1..100
    locale          TEXT NOT NULL DEFAULT 'ar',
    enabled         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES users(id)
);
CREATE INDEX idx_ib_category ON icebreaker_templates(category) WHERE enabled;

-- ---------- 18.2: Personalized Ice Breakers per chat room -----------------
CREATE TABLE icebreakers_for_chat (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id         UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    template_id     UUID NOT NULL REFERENCES icebreaker_templates(id),
    rendered_text   TEXT NOT NULL,
    rank            INT  NOT NULL,
    shown_at        TIMESTAMPTZ,
    used_at         TIMESTAMPTZ,
    dismissed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ib_room ON icebreakers_for_chat(room_id, rank);

-- ---------- 18.3: Conversation Tips Bank ----------------------------------
CREATE TYPE tip_trigger AS ENUM (
    'first_message','after_n_messages','after_hours','after_days',
    'silence_detected','single_word_replies','red_flag_text','reply_imbalance'
);

CREATE TABLE conversation_tip_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type    tip_trigger NOT NULL,
    -- trigger params, e.g. {"n":10} or {"hours":24} or {"days":7}
    trigger_params  JSONB NOT NULL DEFAULT '{}'::jsonb,
    text_ar         TEXT NOT NULL,
    -- conditional rules — only show if these match
    conditions      JSONB DEFAULT '{}'::jsonb,
    -- e.g. {"both_religious_high": true} or {"plan_at_least":"advanced"}
    priority        INT NOT NULL DEFAULT 50,
    enabled         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 18.4: Tips shown to specific chat (audit + dedupe) ------------
CREATE TABLE conversation_tips_shown (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id         UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id     UUID NOT NULL REFERENCES conversation_tip_templates(id),
    rendered_text   TEXT NOT NULL,
    context         JSONB,                       -- snapshot of trigger state
    shown_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    dismissed_at    TIMESTAMPTZ,
    UNIQUE(room_id, template_id)                -- show each tip once per chat
);

-- ---------- 18.5: Conversation Moderation Rules (Red Flags) ---------------
CREATE TYPE moderation_severity AS ENUM ('info','warn','block','escalate');

CREATE TABLE moderation_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    -- detection: regex | semantic_match | template_id
    detection_type  TEXT NOT NULL,
    pattern         TEXT NOT NULL,
    -- e.g. '\d{8,}' for phone numbers, or 'IG:' for Instagram handles
    severity        moderation_severity NOT NULL,
    action          TEXT NOT NULL,
    -- 'redact_and_warn' | 'block_send' | 'flag_admin' | 'auto_suspend'
    user_message_ar TEXT,
    admin_notify    BOOLEAN NOT NULL DEFAULT false,
    enabled         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 18.6: Moderation Events (every rule hit logged) ---------------
CREATE TABLE moderation_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    room_id         UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    rule_id         UUID NOT NULL REFERENCES moderation_rules(id),
    severity        moderation_severity NOT NULL,
    action_taken    TEXT NOT NULL,
    matched_text    TEXT,
    original_text   TEXT,                          -- before redaction (admin-only)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mod_sender ON moderation_events(sender_id, created_at DESC);
CREATE INDEX idx_mod_room ON moderation_events(room_id, created_at DESC);

-- ---------- 18.7: Chat Health Metrics (per room — drives tip timing) -----
CREATE TABLE chat_health (
    room_id              UUID PRIMARY KEY REFERENCES chat_rooms(id) ON DELETE CASCADE,
    message_count        INT NOT NULL DEFAULT 0,
    avg_message_length   REAL,                     -- in chars
    reply_ratio          REAL,                     -- 0..1 (balance of who sends)
    last_silence_hours   REAL,
    sentiment_avg        REAL,                     -- -1..+1 if sentiment analysis on
    flags_count          INT NOT NULL DEFAULT 0,
    momentum_score       REAL,                     -- 0..100 — derived index
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

CREATE VIEW v_active_subscriptions AS
SELECT s.*, u.email, u.phone
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE s.status = 'active' AND s.current_period_end > now();

CREATE VIEW v_user_full_profile AS
SELECT
    u.id, u.email, u.phone, u.status, u.gender, u.date_of_birth,
    p.display_name, p.country, p.city, p.religion, p.sect,
    mp.attachment_primary, mp.dark_triad_score, mp.red_flags,
    mp.profile_completeness,
    (SELECT count(*) FROM matching_answers WHERE user_id = u.id) AS matching_answers_count,
    (SELECT count(*) FROM trait_answers WHERE user_id = u.id) AS trait_answers_count,
    EXISTS(SELECT 1 FROM subscriptions
           WHERE user_id = u.id AND status = 'active' AND current_period_end > now()) AS has_active_sub
FROM users u
LEFT JOIN user_profiles p ON p.user_id = u.id
LEFT JOIN matching_profiles mp ON mp.user_id = u.id;
