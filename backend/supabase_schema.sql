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
