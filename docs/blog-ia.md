
-- Migration Script: Blog & AI Article Generation Structure
-- Extracted from project: dhqkispslsifxzsrendv
-- Date: 2025-11-23
-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ==========================================
-- 1. Core Blog Tables
-- ==========================================
-- Table: admin_settings
-- Stores general configuration for the blog
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    blog_name text DEFAULT 'Limpow Blog',
    blog_description text DEFAULT 'Blog sobre finanças pessoais e recuperação de crédito',
    blog_url text DEFAULT 'https://blog.limpow.com.br',
    posts_per_page integer DEFAULT 10,
    meta_title text DEFAULT 'Limpow Blog - Finanças e Crédito',
    meta_description text DEFAULT 'Dicas e informações sobre finanças pessoais, recuperação de crédito e muito mais.',
    meta_keywords text DEFAULT 'finanças, crédito, nome limpo, dívidas',
    facebook_url text,
    instagram_url text,
    linkedin_url text,
    password_hash text NOT NULL DEFAULT '$2a$10$xVfYx9JTr0RYrPmFrRd7..QkwWqHwXK.0uO9kD7.j8VzxU1KY2K6q', -- Default hash, change immediately
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Table: categories
-- Blog categories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Table: posts
-- Main blog posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    content text,
    excerpt text,
    featured_image text,
    status text DEFAULT 'draft' NOT NULL, -- 'draft', 'published', 'archived'
    category_id uuid REFERENCES public.categories(id),
    author_id uuid, -- References auth.users (handled by Supabase Auth)
    meta_title text,
    meta_description text,
    views integer DEFAULT 0,
    featured boolean DEFAULT false,
    published_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Table: posts_views
-- Analytics for post views
CREATE TABLE IF NOT EXISTS public.posts_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    ip_address text,
    user_agent text,
    viewed_at timestamptz DEFAULT now()
);
-- Table: artigos
-- Alternative/Rich article structure (possibly for AI generation workflow)
CREATE TABLE IF NOT EXISTS public.artigos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    titulo text NOT NULL,
    slug text NOT NULL,
    descricao text NOT NULL,
    conteudo text NOT NULL,
    categoria text, -- Text based category or reference
    tags text[], -- Array of tags
    palavras_chave text[], -- Array of keywords
    status_publicacao text DEFAULT 'rascunho',
    autor_nome text,
    autor_avatar text,
    imagem_capa text,
    tempo_leitura integer,
    data_publicacao timestamptz,
    data_criacao timestamptz DEFAULT now(),
    data_atualizacao timestamptz DEFAULT now()
);
-- ==========================================
-- 2. AI Writers & Generation Tables
-- ==========================================
-- Table: writers_profiles
-- Profiles for AI writers/personas
CREATE TABLE IF NOT EXISTS public.writers_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    role text,
    bio text,
    avatar_url text,
    instagram_url text,
    linkedin_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Table: writers_settings
-- Configuration for specific writers
CREATE TABLE IF NOT EXISTS public.writers_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    writer_id uuid REFERENCES public.writers_profiles(id) UNIQUE,
    temperature float8 DEFAULT 0.7,
    max_tokens integer DEFAULT 2500,
    frequency_penalty float8 DEFAULT 0.0,
    presence_penalty float8 DEFAULT 0.0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Table: writers_prompts
-- Prompts assigned to writers and categories
CREATE TABLE IF NOT EXISTS public.writers_prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    prompt text NOT NULL,
    writer_id uuid REFERENCES public.writers_profiles(id),
    category_id uuid REFERENCES public.categories(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Table: writers_history
-- Log of actions by writers
CREATE TABLE IF NOT EXISTS public.writers_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    writer_id uuid REFERENCES public.writers_profiles(id),
    action text,
    details jsonb,
    created_at timestamptz DEFAULT now()
);
-- ==========================================
-- 3. Virtual Writer (Newer/Alternative System)
-- ==========================================
-- Table: writer_virtual_profiles
CREATE TABLE IF NOT EXISTS public.writer_virtual_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    prompt_base text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Table: writer_virtual_articles
CREATE TABLE IF NOT EXISTS public.writer_virtual_articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text,
    content text,
    status text DEFAULT 'draft',
    writer_id uuid REFERENCES public.writer_virtual_profiles(id),
    topic text,
    keywords text[],
    generated_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Table: writer_virtual_history
CREATE TABLE IF NOT EXISTS public.writer_virtual_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    writer_id uuid REFERENCES public.writer_virtual_profiles(id),
    article_id uuid REFERENCES public.writer_virtual_articles(id),
    action text,
    details jsonb,
    created_at timestamptz DEFAULT now()
);
-- ==========================================
-- 4. General AI Generation
-- ==========================================
-- Table: generation_settings
CREATE TABLE IF NOT EXISTS public.generation_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    model text DEFAULT 'gpt-4',
    max_tokens integer DEFAULT 2000,
    temperature float8 DEFAULT 0.7,
    top_p float8 DEFAULT 1.0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- Table: generation_history
CREATE TABLE IF NOT EXISTS public.generation_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    prompt text,
    response text,
    tokens_used integer,
    model_used text,
    cost float8,
    user_id uuid, -- References auth.users
    created_at timestamptz DEFAULT now()
);
-- ==========================================
-- Indexes (Recommended)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_artigos_slug ON public.artigos(slug);
-- ==========================================
-- Notes
-- ==========================================
-- 1. This script assumes the 'public' schema.
-- 2. Foreign keys to 'auth.users' have been omitted or commented out as the 'auth' schema is managed by Supabase internally.
-- 3. RLS (Row Level Security) policies are NOT included in this script. You should define policies based on your new project's requirements.