import { useUser, useStackApp } from '@stackframe/react';

export function useAuth() {
  const user = useUser();
  const app = useStackApp();

  const signOut = async () => {
    await app.signOut();
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading: user === undefined,
    signOut,
  };
}
