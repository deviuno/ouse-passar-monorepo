import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ModuleName } from '../../stores/useModuleSettingsStore';

interface ModuleGuardProps {
  module: ModuleName;
  children: React.ReactNode;
  /** Where to redirect if module is blocked. Defaults to /praticar */
  redirectTo?: string;
}

/**
 * Guard that protects routes based on module access configuration.
 * Admins and users with show_answers=true have full access.
 * Regular users are redirected if the module is disabled.
 */
export function ModuleGuard({
  module,
  children,
  redirectTo = '/praticar',
}: ModuleGuardProps) {
  const navigate = useNavigate();
  const { hasFullAccess, isLoading, [module]: config } = useModuleAccess();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Timeout de segurança para evitar loading infinito
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('[ModuleGuard] Timeout ao carregar configurações de módulo');
        setLoadingTimedOut(true);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  useEffect(() => {
    // Wait for settings to load (or timeout)
    if (isLoading && !loadingTimedOut) return;

    // If user has full access or module is enabled, allow access
    if (hasFullAccess || config.enabled || loadingTimedOut) return;

    // Module is disabled for this user - redirect
    navigate(redirectTo, { replace: true });
  }, [isLoading, loadingTimedOut, hasFullAccess, config.enabled, navigate, redirectTo]);

  // While loading (and not timed out), show nothing to avoid flash
  if (isLoading && !loadingTimedOut) {
    return null;
  }

  // If user has full access or module is enabled (or timed out - allow access as fallback), render children
  if (hasFullAccess || config.enabled || loadingTimedOut) {
    return <>{children}</>;
  }

  // Otherwise, return null (redirect will happen in useEffect)
  return null;
}

export default ModuleGuard;
