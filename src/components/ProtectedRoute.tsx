import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => setShowHint(true), 10000);
      return () => clearTimeout(t);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {showHint && (
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Loading session… If stuck, try refreshing the page.
          </p>
        )}
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (requireAdmin && !isAdmin) {
    toast.error('Admin access only');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
  if (!user) return <Navigate to="/auth" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}