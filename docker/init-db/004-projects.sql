-- docker/init-db/004-projects.sql

-- 项目表
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    grade_min INTEGER CHECK (grade_min BETWEEN 1 AND 12),
    grade_max INTEGER CHECK (grade_max BETWEEN 1 AND 12),
    subject VARCHAR(50),
    tags TEXT[],
    difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    estimated_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_premium BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    completed_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_grade_range CHECK (grade_min <= grade_max)
);

-- 项目任务表
CREATE TABLE project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    agent_type VARCHAR(50),
    expected_output TEXT,
    rubric JSONB,
    prerequisites UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(project_id, order_index),
    CONSTRAINT chk_order_positive CHECK (order_index >= 0)
);

-- 索引
CREATE INDEX idx_projects_grade ON projects(grade_min, grade_max);
CREATE INDEX idx_projects_subject ON projects(subject);
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);

-- 触发器
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
