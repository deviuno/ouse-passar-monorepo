import React, { useEffect } from 'react';
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

  useEffect(() => {
    // Wait for settings to load
    if (isLoading) return;

    // If user has full access or module is enabled, allow access
    if (hasFullAccess || config.enabled) return;

    // Module is disabled for this user - redirect
    navigate(redirectTo, { replace: true });
  }, [isLoading, hasFullAccess, config.enabled, navigate, redirectTo]);

  // While loading, show nothing to avoid flash
  if (isLoading) {
    return null;
  }

  // If user has full access or module is enabled, render children
  if (hasFullAccess || config.enabled) {
    return <>{children}</>;
  }

  // Otherwise, return null (redirect will happen in useEffect)
  return null;
}

export default ModuleGuard;
