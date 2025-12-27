import React, { useState, useEffect } from 'react';
import { isMaintenanceMode, invalidateGeneralSettingsCache } from '../../services/generalSettingsService';
import { MaintenancePage } from '../../pages/MaintenancePage';
import { useAuthStore } from '../../stores';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

/**
 * Guard that shows maintenance page when system is in maintenance mode.
 * Admins can bypass maintenance mode.
 */
export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [inMaintenance, setInMaintenance] = useState(false);
  const { profile } = useAuthStore();

  const checkMaintenance = async () => {
    setIsChecking(true);
    try {
      const maintenance = await isMaintenanceMode();
      setInMaintenance(maintenance);
    } catch (error) {
      console.error('[MaintenanceGuard] Error checking maintenance mode:', error);
      // On error, allow access (fail-open for better UX)
      setInMaintenance(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkMaintenance();

    // Re-check maintenance status periodically (every 30 seconds)
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    // Invalidate cache and recheck
    invalidateGeneralSettingsCache();
    checkMaintenance();
  };

  // Still loading - show nothing to avoid flash
  if (isChecking) {
    return null;
  }

  // Check if user is admin (bypass maintenance)
  const isAdmin = profile?.role === 'admin';

  // In maintenance mode and not an admin - show maintenance page
  if (inMaintenance && !isAdmin) {
    return <MaintenancePage onRetry={handleRetry} />;
  }

  // Not in maintenance or user is admin - show children
  return <>{children}</>;
}

export default MaintenanceGuard;
