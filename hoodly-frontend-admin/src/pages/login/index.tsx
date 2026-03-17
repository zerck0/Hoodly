import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Lock, ShieldCheck, Globe, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (!isLoading && isAuthenticated) window.location.href = '/dashboard';
  }, [isAuthenticated, isLoading]);

  const handleLogin = async () => {
    await loginWithRedirect({
      authorizationParams: { redirect_uri: `${window.location.origin}/dashboard` },
      openUrl: (url) => { window.location.replace(url); },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 text-sm">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-4">H</div>
          <h1 className="text-2xl font-bold text-white">HOODLY</h1>
          <p className="text-gray-500 text-sm mt-1">Back-office Administrateur</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-5">
            <div>
              <h2 className="text-white font-semibold">Connexion</h2>
              <p className="text-gray-500 text-sm mt-0.5">Accès réservé aux administrateurs</p>
            </div>

            <Button className="w-full" size="lg" onClick={handleLogin}>
              <KeyRound size={15} />
              Se connecter avec Auth0
            </Button>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { icon: ShieldCheck, label: 'SSO' },
                { icon: Lock, label: 'MFA' },
                { icon: Globe, label: 'RGPD' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 bg-gray-800/60 rounded-lg py-2.5">
                  <Icon size={13} className="text-indigo-400" />
                  <span className="text-xs text-gray-400 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
