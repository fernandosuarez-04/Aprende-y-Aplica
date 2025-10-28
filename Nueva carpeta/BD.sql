-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.adopcion_genai (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  pais text,
  indice_aipi numeric,
  fuente text,
  fecha_fuente text,
  CONSTRAINT adopcion_genai_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ai_apps (
  app_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  description text NOT NULL,
  long_description text,
  category_id uuid,
  website_url text,
  logo_url text,
  pricing_model character varying NOT NULL,
  pricing_details jsonb,
  features ARRAY,
  use_cases ARRAY,
  advantages ARRAY,
  disadvantages ARRAY,
  alternatives ARRAY,
  tags ARRAY,
  supported_languages ARRAY,
  integrations ARRAY,
  api_available boolean DEFAULT false,
  mobile_app boolean DEFAULT false,
  desktop_app boolean DEFAULT false,
  browser_extension boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  rating numeric DEFAULT 0.0,
  rating_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT ai_apps_pkey PRIMARY KEY (app_id),
  CONSTRAINT ai_apps_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.ai_categories(category_id)
);
CREATE TABLE public.ai_categories (
  category_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  description text,
  icon character varying,
  color character varying,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT ai_categories_pkey PRIMARY KEY (category_id)
);
CREATE TABLE public.ai_prompts (
  prompt_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  description text NOT NULL,
  content text NOT NULL,
  category_id uuid,
  tags ARRAY,
  difficulty_level character varying DEFAULT 'beginner'::character varying,
  estimated_time_minutes integer,
  use_cases ARRAY,
  tips ARRAY,
  author_id uuid,
  is_featured boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  download_count integer DEFAULT 0,
  rating numeric DEFAULT 0.0,
  rating_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT ai_prompts_pkey PRIMARY KEY (prompt_id),
  CONSTRAINT ai_prompts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.ai_categories(category_id),
  CONSTRAINT ai_prompts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id)
);
CREATE TABLE public.app_favorites (
  favorite_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  app_id uuid,
  user_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT app_favorites_pkey PRIMARY KEY (favorite_id),
  CONSTRAINT app_favorites_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.ai_apps(app_id),
  CONSTRAINT app_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.app_ratings (
  rating_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  app_id uuid,
  user_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT app_ratings_pkey PRIMARY KEY (rating_id),
  CONSTRAINT app_ratings_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.ai_apps(app_id),
  CONSTRAINT app_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.areas (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  nombre text NOT NULL,
  CONSTRAINT areas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_user_id uuid NOT NULL,
  action character varying NOT NULL CHECK (action::text = ANY (ARRAY['CREATE'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying, 'VIEW'::character varying]::text[])),
  table_name character varying NOT NULL,
  record_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT audit_logs_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.certificate_ledger (
  block_id bigint NOT NULL DEFAULT nextval('certificate_ledger_block_id_seq'::regclass),
  cert_id uuid NOT NULL,
  op text NOT NULL CHECK (op = ANY (ARRAY['ISSUE'::text, 'REVOKE'::text, 'EXPIRE'::text])),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  prev_hash character,
  block_hash character NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT certificate_ledger_pkey PRIMARY KEY (block_id),
  CONSTRAINT certificate_ledger_cert_id_fkey FOREIGN KEY (cert_id) REFERENCES public.user_course_certificates(certificate_id)
);
CREATE TABLE public.communities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  slug text NOT NULL UNIQUE,
  image_url text,
  member_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  visibility text NOT NULL DEFAULT 'public'::text CHECK (visibility = ANY (ARRAY['public'::text, 'private'::text, 'unlisted'::text])),
  access_type text NOT NULL CHECK (access_type = ANY (ARRAY['open'::text, 'closed'::text, 'invite_only'::text, 'request'::text])),
  course_id uuid,
  CONSTRAINT communities_pkey PRIMARY KEY (id),
  CONSTRAINT communities_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.community_access_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  requester_id uuid NOT NULL DEFAULT auth.uid(),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  note text,
  reviewed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  CONSTRAINT community_access_requests_pkey PRIMARY KEY (id),
  CONSTRAINT community_access_requests_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_access_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id),
  CONSTRAINT community_access_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.community_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (length(TRIM(BOTH FROM content)) > 0),
  parent_comment_id uuid,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_comments_pkey PRIMARY KEY (id),
  CONSTRAINT community_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT community_comments_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.community_comments(id)
);
CREATE TABLE public.community_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['member'::text, 'moderator'::text, 'admin'::text])),
  joined_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_members_pkey PRIMARY KEY (id),
  CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_community_members_community_id FOREIGN KEY (community_id) REFERENCES public.communities(id)
);
CREATE TABLE public.community_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text,
  content text NOT NULL,
  attachment_url text,
  attachment_type text CHECK (attachment_type = ANY (ARRAY['image'::text, 'video'::text, 'document'::text, 'link'::text, 'poll'::text])),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_edited boolean DEFAULT false,
  edited_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  comment_count integer NOT NULL DEFAULT 0,
  reaction_count integer NOT NULL DEFAULT 0,
  attachment_data jsonb,
  is_hidden boolean DEFAULT false,
  poll_question text,
  poll_options jsonb,
  poll_data jsonb,
  post_type text DEFAULT 'text'::text,
  views_count integer DEFAULT 0,
  CONSTRAINT community_posts_pkey PRIMARY KEY (id),
  CONSTRAINT community_posts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.community_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid,
  comment_id uuid,
  reaction_type text NOT NULL DEFAULT 'like'::text CHECK (reaction_type = ANY (ARRAY['like'::text, 'love'::text, 'laugh'::text, 'wow'::text, 'sad'::text, 'angry'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT community_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT community_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id)
);
CREATE TABLE public.community_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  video_type character varying NOT NULL DEFAULT 'intro'::character varying CHECK (video_type::text = ANY (ARRAY['intro'::character varying::text, 'tutorial'::character varying::text, 'welcome'::character varying::text, 'feature'::character varying::text, 'onboarding'::character varying::text, 'guide'::character varying::text, 'demo'::character varying::text])),
  title character varying NOT NULL,
  description text,
  video_url text NOT NULL,
  video_provider character varying NOT NULL DEFAULT 'youtube'::character varying CHECK (video_provider::text = ANY (ARRAY['youtube'::character varying::text, 'vimeo'::character varying::text, 'direct'::character varying::text, 'custom'::character varying::text])),
  thumbnail_url text,
  duration integer CHECK (duration IS NULL OR duration > 0),
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT community_videos_pkey PRIMARY KEY (id),
  CONSTRAINT community_videos_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id)
);
CREATE TABLE public.coupons (
  coupon_id uuid NOT NULL DEFAULT gen_random_uuid(),
  coupon_code character varying NOT NULL UNIQUE,
  coupon_description text,
  discount_type character varying NOT NULL CHECK (discount_type::text = ANY (ARRAY['percentage'::character varying, 'fixed_amount'::character varying]::text[])),
  discount_value numeric NOT NULL CHECK (discount_value > 0::numeric),
  minimum_amount_cents integer DEFAULT 0 CHECK (minimum_amount_cents >= 0),
  max_uses integer,
  current_uses integer DEFAULT 0 CHECK (current_uses >= 0),
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  course_id uuid,
  CONSTRAINT coupons_pkey PRIMARY KEY (coupon_id),
  CONSTRAINT coupons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.course_lessons (
  lesson_id uuid NOT NULL DEFAULT gen_random_uuid(),
  lesson_title character varying NOT NULL,
  lesson_description text,
  lesson_order_index integer NOT NULL DEFAULT 1 CHECK (lesson_order_index > 0),
  video_provider_id character varying NOT NULL,
  video_provider character varying NOT NULL CHECK (video_provider::text = ANY (ARRAY['youtube'::character varying, 'vimeo'::character varying, 'direct'::character varying, 'custom'::character varying]::text[])),
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  transcript_content text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  module_id uuid NOT NULL,
  instructor_id uuid NOT NULL,
  CONSTRAINT course_lessons_pkey PRIMARY KEY (lesson_id),
  CONSTRAINT course_lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.course_modules(module_id),
  CONSTRAINT course_lessons_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id)
);
CREATE TABLE public.course_modules (
  module_id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_title character varying NOT NULL,
  module_description text,
  module_order_index integer NOT NULL DEFAULT 1 CHECK (module_order_index > 0),
  module_duration_minutes integer DEFAULT 0 CHECK (module_duration_minutes >= 0),
  is_required boolean DEFAULT true,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  course_id uuid NOT NULL,
  CONSTRAINT course_modules_pkey PRIMARY KEY (module_id),
  CONSTRAINT course_modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.course_reviews (
  review_id uuid NOT NULL DEFAULT gen_random_uuid(),
  review_title character varying,
  review_content text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_verified boolean DEFAULT false,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  CONSTRAINT course_reviews_pkey PRIMARY KEY (review_id),
  CONSTRAINT course_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT course_reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  category character varying NOT NULL DEFAULT 'ia'::character varying,
  level character varying NOT NULL DEFAULT 'beginner'::character varying CHECK (level::text = ANY (ARRAY['beginner'::character varying::text, 'intermediate'::character varying::text, 'advanced'::character varying::text])),
  instructor_id uuid,
  duration_total_minutes integer DEFAULT 0 CHECK (duration_total_minutes >= 0),
  thumbnail_url text,
  slug character varying NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  price numeric DEFAULT 0.00,
  average_rating numeric DEFAULT 0.00,
  student_count integer DEFAULT 0,
  review_count integer DEFAULT 0,
  learning_objectives jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT courses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lesson_activities (
  activity_id uuid NOT NULL DEFAULT gen_random_uuid(),
  activity_title character varying NOT NULL,
  activity_description text,
  activity_type character varying NOT NULL CHECK (activity_type::text = ANY (ARRAY['reflection'::character varying, 'exercise'::character varying, 'quiz'::character varying, 'discussion'::character varying, 'ai_chat'::character varying]::text[])),
  activity_content text NOT NULL,
  ai_prompts text,
  activity_order_index integer NOT NULL DEFAULT 1 CHECK (activity_order_index > 0),
  is_required boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  lesson_id uuid NOT NULL,
  CONSTRAINT lesson_activities_pkey PRIMARY KEY (activity_id),
  CONSTRAINT lesson_activities_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(lesson_id)
);
CREATE TABLE public.lesson_checkpoints (
  checkpoint_id uuid NOT NULL DEFAULT gen_random_uuid(),
  checkpoint_time_seconds integer NOT NULL CHECK (checkpoint_time_seconds >= 0),
  checkpoint_label character varying,
  checkpoint_description text,
  is_required_completion boolean DEFAULT false,
  checkpoint_order_index integer DEFAULT 1 CHECK (checkpoint_order_index > 0),
  created_at timestamp with time zone DEFAULT now(),
  lesson_id uuid NOT NULL,
  CONSTRAINT lesson_checkpoints_pkey PRIMARY KEY (checkpoint_id),
  CONSTRAINT lesson_checkpoints_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(lesson_id)
);
CREATE TABLE public.lesson_materials (
  material_id uuid NOT NULL DEFAULT gen_random_uuid(),
  material_title character varying NOT NULL,
  material_description text,
  material_type character varying NOT NULL CHECK (material_type::text = ANY (ARRAY['pdf'::character varying, 'link'::character varying, 'document'::character varying, 'quiz'::character varying, 'exercise'::character varying, 'reading'::character varying]::text[])),
  file_url text,
  external_url text,
  content_data jsonb,
  material_order_index integer DEFAULT 1 CHECK (material_order_index > 0),
  is_downloadable boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  lesson_id uuid NOT NULL,
  CONSTRAINT lesson_materials_pkey PRIMARY KEY (material_id),
  CONSTRAINT lesson_materials_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(lesson_id)
);
CREATE TABLE public.news (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  language text DEFAULT 'es'::text,
  hero_image_url text,
  tldr jsonb DEFAULT '[]'::jsonb,
  intro text,
  sections jsonb DEFAULT '[]'::jsonb,
  metrics jsonb DEFAULT '[]'::jsonb,
  links jsonb DEFAULT '[]'::jsonb,
  cta jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'published'::text,
  published_at timestamp with time zone DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT news_pkey PRIMARY KEY (id)
);
CREATE TABLE public.niveles (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  nombre text NOT NULL,
  CONSTRAINT niveles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.oauth_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider character varying NOT NULL,
  provider_account_id character varying NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamp without time zone,
  scope text,
  token_type character varying,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT oauth_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT oauth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.password_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token character varying NOT NULL UNIQUE,
  expires_at timestamp without time zone NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  used_at timestamp without time zone,
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.payment_methods (
  payment_method_id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_method_type character varying NOT NULL CHECK (payment_method_type::text = ANY (ARRAY['credit_card'::character varying, 'debit_card'::character varying, 'paypal'::character varying, 'bank_transfer'::character varying, 'crypto'::character varying]::text[])),
  payment_method_name character varying NOT NULL,
  encrypted_data jsonb NOT NULL,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL,
  CONSTRAINT payment_methods_pkey PRIMARY KEY (payment_method_id),
  CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.preguntas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  codigo text,
  section text,
  bloque text,
  area_id integer,
  exclusivo_rol_id integer,
  texto text NOT NULL,
  tipo text NOT NULL,
  opciones jsonb,
  locale text,
  peso numeric,
  escala jsonb,
  scoring jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  respuesta_correcta text,
  CONSTRAINT preguntas_pkey PRIMARY KEY (id),
  CONSTRAINT preguntas_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id),
  CONSTRAINT preguntas_exclusivo_rol_id_fkey FOREIGN KEY (exclusivo_rol_id) REFERENCES public.roles(id)
);
CREATE TABLE public.prompt_favorites (
  favorite_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  prompt_id uuid,
  user_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT prompt_favorites_pkey PRIMARY KEY (favorite_id),
  CONSTRAINT prompt_favorites_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.ai_prompts(prompt_id),
  CONSTRAINT prompt_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.prompt_ratings (
  rating_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  prompt_id uuid,
  user_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT prompt_ratings_pkey PRIMARY KEY (rating_id),
  CONSTRAINT prompt_ratings_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.ai_prompts(prompt_id),
  CONSTRAINT prompt_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reel_comment_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reel_comment_replies_pkey PRIMARY KEY (id),
  CONSTRAINT reel_comment_replies_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.reel_comments(id),
  CONSTRAINT reel_comment_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reel_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reel_id uuid,
  user_id uuid,
  parent_id uuid,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reel_comments_pkey PRIMARY KEY (id),
  CONSTRAINT reel_comments_reel_id_fkey FOREIGN KEY (reel_id) REFERENCES public.reels(id),
  CONSTRAINT reel_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reel_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.reel_comments(id)
);
CREATE TABLE public.reel_hashtag_relations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reel_id uuid,
  hashtag_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reel_hashtag_relations_pkey PRIMARY KEY (id),
  CONSTRAINT reel_hashtag_relations_reel_id_fkey FOREIGN KEY (reel_id) REFERENCES public.reels(id),
  CONSTRAINT reel_hashtag_relations_hashtag_id_fkey FOREIGN KEY (hashtag_id) REFERENCES public.reel_hashtags(id)
);
CREATE TABLE public.reel_hashtags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reel_hashtags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reel_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reel_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reel_likes_pkey PRIMARY KEY (id),
  CONSTRAINT reel_likes_reel_id_fkey FOREIGN KEY (reel_id) REFERENCES public.reels(id),
  CONSTRAINT reel_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reel_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reel_id uuid,
  user_id uuid,
  platform character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reel_shares_pkey PRIMARY KEY (id),
  CONSTRAINT reel_shares_reel_id_fkey FOREIGN KEY (reel_id) REFERENCES public.reels(id),
  CONSTRAINT reel_shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reel_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reel_id uuid,
  user_id uuid,
  ip_address inet,
  user_agent text,
  viewed_at timestamp with time zone DEFAULT now(),
  watch_duration_seconds integer DEFAULT 0,
  CONSTRAINT reel_views_pkey PRIMARY KEY (id),
  CONSTRAINT reel_views_reel_id_fkey FOREIGN KEY (reel_id) REFERENCES public.reels(id),
  CONSTRAINT reel_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer,
  category character varying,
  language character varying DEFAULT 'es'::character varying,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  published_at timestamp with time zone,
  CONSTRAINT reels_pkey PRIMARY KEY (id),
  CONSTRAINT reels_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.relaciones (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  nombre text NOT NULL,
  CONSTRAINT relaciones_pkey PRIMARY KEY (id)
);
CREATE TABLE public.respuestas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  pregunta_id bigint NOT NULL,
  valor jsonb,
  respondido_en timestamp with time zone NOT NULL DEFAULT now(),
  user_perfil_id uuid NOT NULL,
  CONSTRAINT respuestas_pkey PRIMARY KEY (id),
  CONSTRAINT respuestas_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES public.preguntas(id),
  CONSTRAINT fk_respuestas_user_perfil_id FOREIGN KEY (user_perfil_id) REFERENCES public.user_perfil(id)
);
CREATE TABLE public.role_synonyms (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  role_id integer,
  alias text NOT NULL UNIQUE,
  CONSTRAINT role_synonyms_pkey PRIMARY KEY (id),
  CONSTRAINT role_synonyms_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.roles (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  nombre text NOT NULL,
  area_id integer,
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id)
);
CREATE TABLE public.sectores (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  nombre text NOT NULL,
  CONSTRAINT sectores_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subscriptions (
  subscription_id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscription_type character varying NOT NULL CHECK (subscription_type::text = ANY (ARRAY['monthly'::character varying, 'yearly'::character varying, 'lifetime'::character varying, 'course_access'::character varying]::text[])),
  subscription_status character varying DEFAULT 'active'::character varying CHECK (subscription_status::text = ANY (ARRAY['active'::character varying, 'paused'::character varying, 'cancelled'::character varying, 'expired'::character varying]::text[])),
  price_cents integer NOT NULL CHECK (price_cents > 0),
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  next_billing_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL,
  course_id uuid,
  CONSTRAINT subscriptions_pkey PRIMARY KEY (subscription_id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT subscriptions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.tamanos_empresa (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  slug text NOT NULL UNIQUE,
  nombre text NOT NULL,
  min_empleados integer,
  max_empleados integer,
  CONSTRAINT tamanos_empresa_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transactions (
  transaction_id uuid NOT NULL DEFAULT gen_random_uuid(),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency character varying NOT NULL DEFAULT 'USD'::character varying,
  transaction_status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (transaction_status::text = ANY (ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying, 'cancelled'::character varying]::text[])),
  transaction_type character varying NOT NULL CHECK (transaction_type::text = ANY (ARRAY['course_purchase'::character varying, 'subscription'::character varying, 'refund'::character varying, 'credit'::character varying]::text[])),
  processor_transaction_id character varying,
  processor_response jsonb,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL,
  course_id uuid,
  payment_method_id uuid NOT NULL,
  CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT transactions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT transactions_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(payment_method_id)
);
CREATE TABLE public.user_activity_log (
  log_id uuid NOT NULL DEFAULT gen_random_uuid(),
  action_type character varying NOT NULL CHECK (action_type::text = ANY (ARRAY['course_view'::character varying, 'lesson_start'::character varying, 'lesson_complete'::character varying, 'video_play'::character varying, 'video_pause'::character varying, 'video_seek'::character varying, 'activity_complete'::character varying, 'note_create'::character varying, 'note_update'::character varying]::text[])),
  action_description text,
  session_id uuid,
  user_agent text,
  ip_address inet,
  action_timestamp timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL,
  course_id uuid,
  lesson_id uuid,
  CONSTRAINT user_activity_log_pkey PRIMARY KEY (log_id),
  CONSTRAINT user_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_activity_log_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT user_activity_log_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(lesson_id)
);
CREATE TABLE public.user_course_certificates (
  certificate_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  certificate_url text NOT NULL CHECK (length(btrim(certificate_url)) > 0),
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  certificate_hash character DEFAULT certificate_hash_immutable(user_id, course_id, enrollment_id, certificate_id, issued_at, certificate_url) UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_course_certificates_pkey PRIMARY KEY (certificate_id),
  CONSTRAINT user_course_certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_course_certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT user_course_certificates_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.user_course_enrollments(enrollment_id)
);
CREATE TABLE public.user_course_enrollments (
  enrollment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  enrollment_status character varying DEFAULT 'active'::character varying CHECK (enrollment_status::text = ANY (ARRAY['active'::character varying, 'completed'::character varying, 'paused'::character varying, 'cancelled'::character varying]::text[])),
  overall_progress_percentage numeric DEFAULT 0.00 CHECK (overall_progress_percentage >= 0.00 AND overall_progress_percentage <= 100.00),
  enrolled_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  last_accessed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  CONSTRAINT user_course_enrollments_pkey PRIMARY KEY (enrollment_id),
  CONSTRAINT user_course_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.user_lesson_notes (
  note_id uuid NOT NULL DEFAULT gen_random_uuid(),
  note_title character varying NOT NULL,
  note_content text NOT NULL,
  note_tags jsonb DEFAULT '[]'::jsonb,
  is_auto_generated boolean DEFAULT false,
  source_type character varying DEFAULT 'manual'::character varying CHECK (source_type::text = ANY (ARRAY['manual'::character varying, 'chat'::character varying, 'import'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  CONSTRAINT user_lesson_notes_pkey PRIMARY KEY (note_id),
  CONSTRAINT user_lesson_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_lesson_notes_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(lesson_id)
);
CREATE TABLE public.user_lesson_progress (
  progress_id uuid NOT NULL DEFAULT gen_random_uuid(),
  lesson_status character varying DEFAULT 'not_started'::character varying CHECK (lesson_status::text = ANY (ARRAY['not_started'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'locked'::character varying]::text[])),
  video_progress_percentage numeric DEFAULT 0.00 CHECK (video_progress_percentage >= 0.00 AND video_progress_percentage <= 100.00),
  current_time_seconds integer DEFAULT 0 CHECK (current_time_seconds >= 0),
  is_completed boolean DEFAULT false,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  time_spent_minutes integer DEFAULT 0 CHECK (time_spent_minutes >= 0),
  last_accessed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  CONSTRAINT user_lesson_progress_pkey PRIMARY KEY (progress_id),
  CONSTRAINT user_lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(lesson_id),
  CONSTRAINT user_lesson_progress_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.user_course_enrollments(enrollment_id)
);
CREATE TABLE public.user_perfil (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cargo_titulo text,
  rol_id integer,
  nivel_id integer,
  area_id integer,
  relacion_id integer,
  tamano_id integer,
  sector_id integer,
  pais text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_perfil_pkey PRIMARY KEY (id),
  CONSTRAINT user_perfil_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_perfil_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id),
  CONSTRAINT user_perfil_nivel_id_fkey FOREIGN KEY (nivel_id) REFERENCES public.niveles(id),
  CONSTRAINT user_perfil_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id),
  CONSTRAINT user_perfil_relacion_id_fkey FOREIGN KEY (relacion_id) REFERENCES public.relaciones(id),
  CONSTRAINT user_perfil_tamano_id_fkey FOREIGN KEY (tamano_id) REFERENCES public.tamanos_empresa(id),
  CONSTRAINT user_perfil_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectores(id)
);
CREATE TABLE public.user_session (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  jwt_id uuid,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  ip inet,
  user_agent text,
  revoked boolean NOT NULL DEFAULT false,
  CONSTRAINT user_session_pkey PRIMARY KEY (id),
  CONSTRAINT user_session_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  email text UNIQUE,
  password_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login_at timestamp with time zone,
  cargo_rol text CHECK (cargo_rol IS NULL OR (lower(btrim(cargo_rol)) = ANY (ARRAY['instructor'::text, 'administrador'::text, 'usuario'::text]))),
  type_rol text,
  first_name text,
  last_name text,
  display_name text,
  phone character varying,
  bio text,
  location text,
  profile_picture_url text,
  curriculum_url text,
  linkedin_url text,
  github_url text,
  website_url text,
  email_verified boolean NOT NULL DEFAULT false,
  email_verified_at timestamp with time zone,
  role_zoom text,
  points integer DEFAULT 0,
  country_code text,
  oauth_provider character varying,
  oauth_provider_id character varying,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);