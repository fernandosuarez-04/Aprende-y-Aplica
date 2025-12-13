-- Tabla para almacenar feedback (like/dislike) por lección
CREATE TABLE IF NOT EXISTS lesson_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(10) NOT NULL CHECK (feedback_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lesson_id, user_id)
);

-- Índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_lesson ON lesson_feedback(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_user ON lesson_feedback(user_id);

-- Trigger para mantener updated_at
CREATE OR REPLACE FUNCTION update_lesson_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lesson_feedback_updated_at ON lesson_feedback;
CREATE TRIGGER trigger_update_lesson_feedback_updated_at
  BEFORE UPDATE ON lesson_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_feedback_updated_at();

