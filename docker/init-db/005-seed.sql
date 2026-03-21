-- docker/init-db/005-seed.sql

-- 插入平台预设智能体
INSERT INTO agents (name, agent_type, description, personality, skills, avatar_url, is_platform) VALUES
('智慧导师', 'mentor', '引导学生探索知识的 AI 导师',
 '{"traits": ["patient", "encouraging", "socratic"], "tone": "warm", "teaching_style": "inquiry_based"}',
 '{"capabilities": ["explain_concepts", "ask_guiding_questions", "break_down_tasks"]}',
 '/avatars/mentor.png', true),

('创意设计师', 'designer', '帮助学生进行创意设计和视觉创作',
 '{"traits": ["creative", "detail_oriented", "visual_thinker"], "tone": "enthusiastic", "style": "modern"}',
 '{"capabilities": ["visual_design", "3d_modeling", "color_theory", "layout"]}',
 '/avatars/designer.png', true),

('数据分析师', 'analyst', '协助学生分析数据和信息',
 '{"traits": ["analytical", "logical", "precise"], "tone": "professional", "approach": "data_driven"}',
 '{"capabilities": ["data_analysis", "chart_creation", "pattern_recognition"]}',
 '/avatars/analyst.png', true),

('运营推广师', 'marketer', '帮助学生推广和展示作品',
 '{"traits": ["communicative", "persuasive", "trend_aware"], "tone": "energetic", "focus": "audience"}',
 '{"capabilities": ["content_writing", "social_media", "presentation"]}',
 '/avatars/marketer.png', true),

('CEO 助手', 'assistant', '协助 CEO(学生) 协调各智能体工作',
 '{"traits": ["organized", "efficient", "proactive"], "tone": "professional", "role": "coordinator"}',
 '{"capabilities": ["task_coordination", "progress_tracking", "reminders"]}',
 '/avatars/assistant.png', true);
