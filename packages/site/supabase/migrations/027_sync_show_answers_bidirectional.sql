-- Sincronizar show_answers entre admin_users e user_profiles
-- Isso garante que quando o admin ativa "Ver Respostas" no painel,
-- o usuário veja a estrela nas alternativas corretas no app Ouse Questões

-- 1. Sincronizar valores existentes de admin_users para user_profiles
UPDATE user_profiles up
SET show_answers = au.show_answers
FROM admin_users au
WHERE up.id = au.id
AND up.show_answers != au.show_answers;

-- 2. Criar função para sincronizar admin_users -> user_profiles
CREATE OR REPLACE FUNCTION sync_show_answers_to_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando show_answers é atualizado em admin_users, atualizar em user_profiles
  IF NEW.show_answers IS DISTINCT FROM OLD.show_answers THEN
    UPDATE user_profiles
    SET show_answers = NEW.show_answers
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger em admin_users
DROP TRIGGER IF EXISTS sync_show_answers_to_user_profiles_trigger ON admin_users;
CREATE TRIGGER sync_show_answers_to_user_profiles_trigger
  AFTER UPDATE ON admin_users
  FOR EACH ROW
  WHEN (NEW.show_answers IS DISTINCT FROM OLD.show_answers)
  EXECUTE FUNCTION sync_show_answers_to_user_profiles();

-- 4. Criar função para sincronizar user_profiles -> admin_users (bidirecional)
CREATE OR REPLACE FUNCTION sync_show_answers_to_admin_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando show_answers é atualizado em user_profiles, atualizar em admin_users se existir
  IF NEW.show_answers IS DISTINCT FROM OLD.show_answers THEN
    UPDATE admin_users
    SET show_answers = NEW.show_answers
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger em user_profiles
DROP TRIGGER IF EXISTS sync_show_answers_to_admin_users_trigger ON user_profiles;
CREATE TRIGGER sync_show_answers_to_admin_users_trigger
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (NEW.show_answers IS DISTINCT FROM OLD.show_answers)
  EXECUTE FUNCTION sync_show_answers_to_admin_users();

-- Comentários
COMMENT ON FUNCTION sync_show_answers_to_user_profiles() IS 'Sincroniza show_answers de admin_users para user_profiles quando alterado no painel admin';
COMMENT ON FUNCTION sync_show_answers_to_admin_users() IS 'Sincroniza show_answers de user_profiles para admin_users (sincronização bidirecional)';
