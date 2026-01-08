# Planner - Academy (EAD) Ouse Passar

> **Projeto:** Implementar sistema EAD completo baseado na estrutura do Código da Vida
> **Início:** 2025-01-08
> **Status:** Em andamento

---

## Visão Geral

A Academy do Ouse Passar será um sistema EAD completo com:
- **Admin Panel:** Gerenciamento de categorias, cursos, módulos, aulas e materiais
- **Interface do Aluno:** Visualização de cursos, player de vídeo, navegação entre aulas, progresso
- **Suporte a Dark/Light Mode:** Sistema de temas já existente no projeto
- **Vídeos Panda Video:** Embed de videoaulas via iframe
- **Materiais Complementares:** Textos, arquivos para download

---

## Referência: Código da Vida

Estrutura copiada de: `G:\Daniel Rabi\Dev\Clientes\Ouse Passar\Codigo-da-Vida-2\`

### Arquivos Chave do Código da Vida:
- **Types:** `src/types/ead.ts`
- **Migration:** `supabase/migrations/20241218_ead_complete.sql`
- **Components:** `src/components/ead/`
- **Hooks:** `src/hooks/ead/`
- **Pages Admin:** `src/app/admin/ead/`
- **Pages User:** `src/app/ead/`

---

## FASE 1: Banco de Dados (Supabase)

### 1.1 Criar Tabelas EAD
- [ ] **ead_categories** - Categorias de cursos (hierárquicas)
  - id, name, slug, description, icon, color
  - parent_id, sort_order, is_active
  - created_at, updated_at

- [ ] **ead_courses** - Cursos
  - id, title, slug, subtitle, description, short_description
  - category_id, instructor_id
  - thumbnail_url, cover_image_url, preview_video_url
  - difficulty_level (iniciante/intermediario/avancado)
  - estimated_duration_hours
  - is_free, price, original_price
  - access_type (lifetime/subscription/rental)
  - access_days
  - guru_product_id (integração Guru)
  - points_on_complete, badge_id (gamificação)
  - status (draft/published/archived)
  - published_at
  - tags[], requirements[], what_you_learn[], target_audience[]
  - enrolled_count, completion_rate, average_rating, reviews_count, total_lessons
  - included_in_subscription
  - created_at, updated_at

- [ ] **ead_modules** - Módulos dos cursos
  - id, course_id
  - title, description
  - sort_order
  - is_free, is_active, is_locked
  - release_after_days (drip content)
  - estimated_duration_minutes, total_lessons, completed_lessons
  - created_at, updated_at

- [ ] **ead_lessons** - Aulas
  - id, module_id
  - title, slug, description
  - content_type (video/text/quiz/exercise)
  - video_url, video_duration_seconds, video_provider (panda/vimeo/youtube)
  - text_content (HTML)
  - sort_order
  - is_free, is_active, requires_completion
  - points_on_complete
  - created_at, updated_at

- [ ] **ead_materials** - Materiais complementares
  - id, course_id, lesson_id
  - title, description
  - file_url, file_type (pdf/doc/xls/zip/image/audio/other)
  - file_size_bytes, download_count
  - is_active, sort_order
  - created_at, updated_at

- [ ] **ead_enrollments** - Matrículas dos alunos
  - id, user_id, course_id
  - status (active/completed/expired/cancelled)
  - progress_percentage, completed_lessons_count
  - last_lesson_id, last_accessed_at
  - enrolled_at, completed_at, expires_at, started_at
  - transaction_id
  - certificate_issued, certificate_id
  - payment_provider (guru/manual/free)
  - created_at, updated_at

- [ ] **ead_lesson_progress** - Progresso por aula
  - id, user_id, lesson_id, enrollment_id
  - is_completed, completed_at
  - watched_seconds, last_watched_at
  - progress_percentage
  - last_position_seconds (retomar)
  - created_at, updated_at

- [ ] **ead_certificates** - Certificados (opcional, para o futuro)
  - id, user_id, course_id
  - certificate_code
  - issued_at, certificate_url

### 1.2 Criar Políticas RLS
- [ ] Políticas de leitura para cursos publicados (público)
- [ ] Políticas de escrita para admin
- [ ] Políticas de leitura/escrita para enrollment e progresso do próprio usuário
- [ ] Políticas para materiais

### 1.3 Criar Índices
- [ ] Índices em course_id, module_id, lesson_id
- [ ] Índices em user_id para enrollments e progress
- [ ] Índices em slugs para busca

### 1.4 Aplicar Migration
- [ ] Aplicar via MCP Supabase (branch develop)
- [ ] Testar criação das tabelas
- [ ] Verificar RLS policies

---

## FASE 2: Types TypeScript

### 2.1 Criar arquivo de tipos
- [ ] Criar `packages/site/types/ead.ts`
- [ ] Interfaces para todas as tabelas:
  - EadCategory
  - EadCourse
  - EadModule
  - EadLesson
  - EadMaterial
  - EadEnrollment
  - EadLessonProgress
  - EadCertificate

### 2.2 Criar tipos de filtros e helpers
- [ ] CourseFilters (search, categoryId, difficulty, isFree, sortBy)
- [ ] LessonFilters
- [ ] Enums para status, difficulty, content_type, etc.

---

## FASE 3: Admin Panel - Backend (Services/Hooks)

### 3.1 Services
- [ ] Criar `packages/site/services/ead.ts`
- [ ] CRUD para categorias
- [ ] CRUD para cursos
- [ ] CRUD para módulos
- [ ] CRUD para aulas
- [ ] CRUD para materiais
- [ ] Funções de reordenação (drag-and-drop)

### 3.2 Hooks Admin
- [ ] Criar `packages/site/hooks/admin/use-ead-admin.ts`
- [ ] useEadCategories() - listar/criar/editar/deletar categorias
- [ ] useEadCourses() - listar/criar/editar/deletar cursos
- [ ] useEadModules(courseId) - listar/criar/editar/deletar módulos
- [ ] useEadLessons(moduleId) - listar/criar/editar/deletar aulas
- [ ] useEadMaterials() - upload e gerenciamento de materiais

---

## FASE 4: Admin Panel - Interface

### 4.1 Menu e Navegação
- [ ] Adicionar "Academy" no menu lateral (AdminLayout.tsx)
  - Dashboard
  - Categorias
  - Cursos
  - (submenu: Módulos e Aulas dentro de cada curso)

### 4.2 Página: Dashboard Academy
- [ ] Criar `packages/site/pages/admin/academy/Dashboard.tsx`
- [ ] Cards com estatísticas:
  - Total de cursos
  - Cursos publicados
  - Total de alunos matriculados
  - Aulas criadas
- [ ] Lista de cursos recentes
- [ ] Ações rápidas

### 4.3 Página: Categorias
- [ ] Criar `packages/site/pages/admin/academy/Categories.tsx`
- [ ] Listagem de categorias em tabela
- [ ] Modal para criar/editar categoria
- [ ] Campos: nome, slug, descrição, ícone, cor, categoria pai
- [ ] Ações: editar, deletar, ativar/desativar
- [ ] Drag-and-drop para reordenar

### 4.4 Página: Lista de Cursos
- [ ] Criar `packages/site/pages/admin/academy/Courses.tsx`
- [ ] Tabela com colunas: thumbnail, título, status, categoria, alunos, aulas
- [ ] Filtros: status, categoria, busca
- [ ] Botão "Novo Curso"
- [ ] Ações: editar, ver módulos, duplicar, arquivar

### 4.5 Página: Criar/Editar Curso
- [ ] Criar `packages/site/pages/admin/academy/CourseForm.tsx`
- [ ] Abas ou seções:
  - **Informações Básicas:** título, slug, subtítulo, descrição curta, descrição completa
  - **Mídia:** thumbnail, imagem de capa, vídeo preview
  - **Configurações:** categoria, dificuldade, duração estimada
  - **Preço:** gratuito/pago, preço, preço original, tipo de acesso
  - **Integrações:** ID Guru
  - **Gamificação:** pontos ao completar
  - **SEO/Marketing:** tags, requisitos, o que vai aprender, público-alvo
- [ ] Upload de imagens com preview
- [ ] Validação de formulário
- [ ] Salvar como rascunho ou publicar

### 4.6 Página: Módulos e Aulas
- [ ] Criar `packages/site/pages/admin/academy/CourseContent.tsx`
- [ ] Layout com lista de módulos à esquerda
- [ ] Cada módulo expande para mostrar aulas
- [ ] Drag-and-drop para reordenar módulos e aulas
- [ ] Modal/Drawer para criar/editar módulo:
  - Título, descrição
  - Gratuito sim/não
  - Bloqueado sim/não
  - Dias para liberar (drip content)
- [ ] Modal/Drawer para criar/editar aula:
  - Título, slug, descrição
  - Tipo de conteúdo (vídeo/texto/quiz)
  - URL do vídeo (Panda Video)
  - Conteúdo texto (editor WYSIWYG)
  - Gratuito sim/não
  - Pontos ao completar
- [ ] Gerenciar materiais por aula

### 4.7 Componente: Editor de Texto Rico
- [ ] Criar `packages/site/components/admin/academy/RichTextEditor.tsx`
- [ ] Usar biblioteca como TipTap ou React-Quill
- [ ] Suporte a: negrito, itálico, listas, links, imagens, código

### 4.8 Componente: Upload de Materiais
- [ ] Criar `packages/site/components/admin/academy/MaterialUploader.tsx`
- [ ] Upload para Supabase Storage
- [ ] Lista de materiais anexados
- [ ] Tipos suportados: PDF, DOC, XLS, ZIP, imagens
- [ ] Mostrar tamanho do arquivo
- [ ] Permitir reordenar e remover

---

## FASE 5: Interface do Aluno - Backend

### 5.1 Hooks do Aluno
- [ ] Criar `packages/site/hooks/ead/use-courses.ts`
  - useCourses(filters) - listar cursos publicados
  - useFeaturedCourses() - cursos em destaque
  - useCoursesByCategory(categoryId)
  - useCategories() - listar categorias ativas

- [ ] Criar `packages/site/hooks/ead/use-course.ts`
  - useCourse(slug) - detalhes de um curso com módulos e aulas
  - useLesson(lessonId) - detalhes de uma aula
  - useContinueWatching() - aulas recentes do usuário

- [ ] Criar `packages/site/hooks/ead/use-enrollment.ts`
  - useEnrollment(courseId) - status de matrícula do usuário
  - useUserEnrollments() - todos os cursos do usuário
  - useEnroll(courseId) - matricular (se gratuito ou com acesso)
  - canAccess(courseId) - verificar acesso

- [ ] Criar `packages/site/hooks/ead/use-progress.ts`
  - useLessonProgress(lessonId) - progresso de uma aula
  - useMarkComplete(lessonId) - marcar aula como concluída
  - useUpdateProgress(lessonId, seconds) - atualizar progresso do vídeo

---

## FASE 6: Interface do Aluno - Componentes

### 6.1 Layout e Navegação
- [ ] Criar `packages/site/components/ead/layout/AcademyLayout.tsx`
  - Wrapper para páginas da Academy
  - Header com navegação
  - Suporte a tema dark/light

- [ ] Criar `packages/site/components/ead/layout/AcademyNavbar.tsx`
  - Logo
  - Links: Cursos, Meus Cursos, Perfil
  - Busca
  - Toggle de tema
  - Menu mobile

### 6.2 Componentes de Curso
- [ ] Criar `packages/site/components/ead/course/CourseCard.tsx`
  - Thumbnail com badge de status (Gratuito, Premium, Novo)
  - Título, categoria, duração
  - Barra de progresso (se matriculado)
  - Variantes: default, horizontal, featured

- [ ] Criar `packages/site/components/ead/course/CourseGrid.tsx`
  - Grid responsivo de CourseCards
  - Skeleton loading

- [ ] Criar `packages/site/components/ead/course/CourseHero.tsx`
  - Banner grande do curso
  - Título, descrição, instrutor
  - Botão de matrícula/continuar
  - Estatísticas (alunos, duração, aulas)

- [ ] Criar `packages/site/components/ead/course/CourseInfo.tsx`
  - O que você vai aprender
  - Requisitos
  - Público-alvo
  - Conteúdo programático (módulos colapsáveis)

### 6.3 Componentes de Aula
- [ ] Criar `packages/site/components/ead/lesson/LessonPlayer.tsx`
  - Iframe para Panda Video (e YouTube/Vimeo)
  - Detecção automática do provider pela URL
  - Aspect ratio 16:9
  - Controles de fullscreen
  - Tracking de progresso (onProgress callback)
  - Fallback para quando não há vídeo

- [ ] Criar `packages/site/components/ead/lesson/LessonContent.tsx`
  - Renderizar conteúdo HTML sanitizado (DOMPurify)
  - Estilos para markdown/HTML

- [ ] Criar `packages/site/components/ead/lesson/LessonSidebar.tsx`
  - Lista de módulos e aulas
  - Módulos colapsáveis
  - Indicador de progresso por aula (checkmark)
  - Indicador de aula atual
  - Cadeados para aulas bloqueadas
  - Duração de cada aula

- [ ] Criar `packages/site/components/ead/lesson/LessonNavigation.tsx`
  - Botão "Aula Anterior"
  - Botão "Marcar como Concluída"
  - Botão "Próxima Aula"
  - Progresso atual (ex: "Aula 3 de 15")

- [ ] Criar `packages/site/components/ead/lesson/LessonMaterials.tsx`
  - Lista de materiais para download
  - Ícone por tipo de arquivo
  - Nome, descrição, tamanho
  - Botão de download

---

## FASE 7: Interface do Aluno - Páginas

### 7.1 Página: Home da Academy
- [ ] Criar `packages/site/pages/academy/Home.tsx`
- [ ] Hero com curso em destaque ou banner
- [ ] Seção: Cursos em Destaque (carousel)
- [ ] Seção: Continuar Assistindo (se logado)
- [ ] Seção: Categorias
- [ ] Seção: Cursos Populares
- [ ] Seção: Cursos Gratuitos

### 7.2 Página: Catálogo de Cursos
- [ ] Criar `packages/site/pages/academy/Courses.tsx`
- [ ] Grid de cursos
- [ ] Filtros: categoria, dificuldade, gratuito/pago
- [ ] Ordenação: popular, recente, avaliação
- [ ] Busca
- [ ] Paginação ou infinite scroll

### 7.3 Página: Detalhes do Curso
- [ ] Criar `packages/site/pages/academy/CourseDetail.tsx`
- [ ] Hero do curso (CourseHero)
- [ ] Informações do curso (CourseInfo)
- [ ] Conteúdo programático
- [ ] Materiais do curso
- [ ] Botão de matrícula (ou "Continuar" se já matriculado)
- [ ] Verificar acesso (gratuito, assinatura, compra)

### 7.4 Página: Player de Aula
- [ ] Criar `packages/site/pages/academy/LessonView.tsx`
- [ ] Layout dividido:
  - **Esquerda (maior):** Player de vídeo + conteúdo texto + materiais
  - **Direita (sidebar):** Navegação entre módulos e aulas
- [ ] Player de vídeo ocupando largura total
- [ ] Abas abaixo: "Sobre", "Materiais", "Anotações" (futuro)
- [ ] Navegação inferior: anterior, concluir, próxima
- [ ] Responsivo: sidebar vira drawer em mobile

### 7.5 Página: Meus Cursos
- [ ] Criar `packages/site/pages/academy/MyCourses.tsx`
- [ ] Tabs: "Em Andamento", "Concluídos"
- [ ] Cards com progresso
- [ ] Botão "Continuar" em cada curso
- [ ] Ordenar por último acesso

### 7.6 Página: Perfil/Conquistas (futuro)
- [ ] Estatísticas do aluno
- [ ] Certificados obtidos
- [ ] Pontos e nível

---

## FASE 8: Rotas e Navegação

### 8.1 Adicionar Rotas no App.tsx
- [ ] Rotas Admin (protegidas):
  ```
  /admin/academy
  /admin/academy/categorias
  /admin/academy/cursos
  /admin/academy/cursos/novo
  /admin/academy/cursos/:id/editar
  /admin/academy/cursos/:id/conteudo
  ```

- [ ] Rotas do Aluno:
  ```
  /academy
  /academy/cursos
  /academy/cursos/:slug
  /academy/cursos/:slug/aula/:aulaId
  /academy/meus-cursos
  ```

### 8.2 Atualizar AdminLayout
- [ ] Adicionar menu "Academy" com submenu:
  - Dashboard
  - Categorias
  - Cursos

---

## FASE 9: Integrações

### 9.1 Integração com Guru (Pagamentos)
- [ ] Webhook para criar enrollment quando compra curso
- [ ] Verificar guru_product_id no curso
- [ ] Liberar acesso automaticamente

### 9.2 Sistema de Assinatura
- [ ] Verificar se usuário tem assinatura ativa
- [ ] Cursos com `included_in_subscription = true` são liberados

### 9.3 Gamificação (futuro)
- [ ] Dar pontos ao completar aula
- [ ] Dar pontos ao completar curso
- [ ] Badges por conquistas

---

## FASE 10: Polish e UX

### 10.1 Animações e Transições
- [ ] Transições suaves entre páginas
- [ ] Skeleton loading em listas
- [ ] Feedback visual em ações (matricular, concluir aula)
- [ ] Toast notifications

### 10.2 Responsividade
- [ ] Testar em mobile (320px+)
- [ ] Testar em tablet (768px+)
- [ ] Testar em desktop (1024px+)
- [ ] Sidebar colapsável em mobile

### 10.3 Performance
- [ ] Lazy loading de componentes
- [ ] Otimização de imagens
- [ ] Cache de dados com React Query
- [ ] Prefetch de próxima aula

### 10.4 Acessibilidade
- [ ] Navegação por teclado
- [ ] Labels e ARIA
- [ ] Contraste de cores
- [ ] Focus indicators

---

## FASE 11: Testes e Deploy

### 11.1 Testes Manuais
- [ ] Fluxo completo de admin (criar categoria, curso, módulo, aula)
- [ ] Fluxo de aluno (navegar, matricular, assistir, completar)
- [ ] Testar em diferentes browsers
- [ ] Testar tema dark e light

### 11.2 Deploy
- [ ] Merge develop → main (migrations aplicam automaticamente)
- [ ] Verificar ambiente de produção
- [ ] Testes pós-deploy

---

## Cores e Design (Referência)

### Dark Mode (Default)
```css
--color-bg-primary: #121212;
--color-bg-secondary: #1A1A1A;
--color-bg-tertiary: #2A2A2A;
--color-bg-card: #1A1A1A;
--color-text-primary: #E0E0E0;
--color-text-secondary: #A0A0A0;
--color-text-muted: #6E6E6E;
--color-accent: #FFB800;
--color-accent-hover: #FFC933;
--color-border: #3A3A3A;
```

### Light Mode
```css
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #F5F5F5;
--color-bg-tertiary: #EBEBEB;
--color-bg-card: #FFFFFF;
--color-text-primary: #1A1A1A;
--color-text-secondary: #4A4A4A;
--color-text-muted: #7A7A7A;
--color-accent: #D4A000;
--color-accent-hover: #B38900;
--color-border: #D0D0D0;
```

---

## Estrutura de Arquivos Final

```
packages/site/
├── types/
│   └── ead.ts                    # Tipos TypeScript
├── services/
│   └── ead.ts                    # Funções de API
├── hooks/
│   └── ead/
│       ├── use-courses.ts
│       ├── use-course.ts
│       ├── use-enrollment.ts
│       └── use-progress.ts
├── components/
│   └── ead/
│       ├── layout/
│       │   ├── AcademyLayout.tsx
│       │   └── AcademyNavbar.tsx
│       ├── course/
│       │   ├── CourseCard.tsx
│       │   ├── CourseGrid.tsx
│       │   ├── CourseHero.tsx
│       │   └── CourseInfo.tsx
│       └── lesson/
│           ├── LessonPlayer.tsx
│           ├── LessonContent.tsx
│           ├── LessonSidebar.tsx
│           ├── LessonNavigation.tsx
│           └── LessonMaterials.tsx
├── pages/
│   ├── admin/
│   │   └── academy/
│   │       ├── Dashboard.tsx
│   │       ├── Categories.tsx
│   │       ├── Courses.tsx
│   │       ├── CourseForm.tsx
│   │       └── CourseContent.tsx
│   └── academy/
│       ├── Home.tsx
│       ├── Courses.tsx
│       ├── CourseDetail.tsx
│       ├── LessonView.tsx
│       └── MyCourses.tsx
└── supabase/
    └── migrations/
        └── 053_create_ead_system.sql
```

---

## Progresso

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Banco de Dados | Pendente |
| 2 | Types TypeScript | Pendente |
| 3 | Admin Services/Hooks | Pendente |
| 4 | Admin Interface | Pendente |
| 5 | Aluno Services/Hooks | Pendente |
| 6 | Aluno Componentes | Pendente |
| 7 | Aluno Páginas | Pendente |
| 8 | Rotas | Pendente |
| 9 | Integrações | Pendente |
| 10 | Polish/UX | Pendente |
| 11 | Testes/Deploy | Pendente |

---

**Última Atualização:** 2025-01-08
