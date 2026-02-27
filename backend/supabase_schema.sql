-- ============================================================
--  CampusSync Edge — Supabase Schema
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. resumes
CREATE TABLE IF NOT EXISTS resumes (
    id                BIGSERIAL    PRIMARY KEY,
    filename          TEXT         NOT NULL,
    raw_text          TEXT,
    detected_skills   JSONB        NOT NULL DEFAULT '[]',
    sections_detected JSONB        NOT NULL DEFAULT '[]',
    links             JSONB        NOT NULL DEFAULT '[]',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. role_analyses
CREATE TABLE IF NOT EXISTS role_analyses (
    id                        BIGSERIAL   PRIMARY KEY,
    resume_id                 BIGINT      NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    role                      TEXT        NOT NULL,
    final_score               INTEGER     NOT NULL,
    readiness_category        TEXT,
    core_coverage_percent     INTEGER,
    optional_coverage_percent INTEGER,
    project_score_percent     INTEGER,
    ats_score_percent         INTEGER,
    structure_score_percent   INTEGER,
    missing_core_skills       JSONB       NOT NULL DEFAULT '[]',
    missing_optional_skills   JSONB       NOT NULL DEFAULT '[]',
    recommendations           JSONB       NOT NULL DEFAULT '[]',
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_role_analyses_resume_id  ON role_analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_role_analyses_role       ON role_analyses(role);
CREATE INDEX IF NOT EXISTS idx_role_analyses_created_at ON role_analyses(created_at);

-- Row Level Security — disabled (backend uses service_role key)
ALTER TABLE resumes       DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_analyses DISABLE ROW LEVEL SECURITY;

-- 3. Synthetic ML training dataset (Phase 4A)
CREATE TABLE IF NOT EXISTS resume_analysis_synthetic (
    id                        BIGSERIAL   PRIMARY KEY,
    detected_skills           JSONB       NOT NULL DEFAULT '[]',
    role                      TEXT        NOT NULL,
    final_score               INTEGER     NOT NULL,
    readiness_category        TEXT,
    core_coverage_percent     INTEGER,
    optional_coverage_percent INTEGER,
    project_score_percent     INTEGER,
    ats_score_percent         INTEGER,
    structure_score_percent   INTEGER,
    missing_core_skills       JSONB       NOT NULL DEFAULT '[]',
    missing_optional_skills   JSONB       NOT NULL DEFAULT '[]',
    data_type                 TEXT        DEFAULT 'synthetic',
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_synthetic_role       ON resume_analysis_synthetic(role);
CREATE INDEX IF NOT EXISTS idx_synthetic_final_score ON resume_analysis_synthetic(final_score);
CREATE INDEX IF NOT EXISTS idx_synthetic_data_type  ON resume_analysis_synthetic(data_type);

ALTER TABLE resume_analysis_synthetic DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE resume_analysis_synthetic TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE resume_analysis_synthetic_id_seq TO anon, authenticated, service_role;

-- 4. Synthetic ML training dataset v2 — high-ambiguity, realistic (Phase 4B)
CREATE TABLE IF NOT EXISTS resume_analysis_synthetic_v2 (
    id                        BIGSERIAL   PRIMARY KEY,
    detected_skills           JSONB       NOT NULL DEFAULT '[]',
    role                      TEXT        NOT NULL,
    final_score               INTEGER     NOT NULL,
    readiness_category        TEXT,
    core_coverage_percent     INTEGER,
    optional_coverage_percent INTEGER,
    project_score_percent     INTEGER,
    ats_score_percent         INTEGER,
    structure_score_percent   INTEGER,
    missing_core_skills       JSONB       NOT NULL DEFAULT '[]',
    missing_optional_skills   JSONB       NOT NULL DEFAULT '[]',
    data_type                 TEXT        DEFAULT 'synthetic_v2',
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syn_v2_role        ON resume_analysis_synthetic_v2(role);
CREATE INDEX IF NOT EXISTS idx_syn_v2_final_score ON resume_analysis_synthetic_v2(final_score);
CREATE INDEX IF NOT EXISTS idx_syn_v2_data_type   ON resume_analysis_synthetic_v2(data_type);

ALTER TABLE resume_analysis_synthetic_v2 DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE    resume_analysis_synthetic_v2         TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE resume_analysis_synthetic_v2_id_seq  TO anon, authenticated, service_role;
