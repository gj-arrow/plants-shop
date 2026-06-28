'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';

const STORAGE_KEY = 'favorites';

interface FavoritesContextValue {
  favorites: number[];
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [customUserId, setCustomUserId] = useState<number | null>(null);

  const isLoggedIn = !!(session?.user?.email || customUserId);

  // Проверяем кастомную аутентификацию при монтировании
  useEffect(() => {
    fetch('/api/auth')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.authenticated && data?.user?.role === 'user') {
          setCustomUserId(data.user.id);
        } else {
          setCustomUserId(null);
        }
      })
      .catch(() => {});
  }, []);

  // Загружаем избранное при монтировании / смене сессии
  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/favorites')
        .then(res => (res.ok ? res.json() : { favorites: [] }))
        .then(data => {
          const ids = (data.favorites || []).map(
            (f: { product_id: number }) => f.product_id
          );
          setFavorites(ids);

          // Сливаем localStorage избранное в БД после логина
          try {
            const localRaw = localStorage.getItem(STORAGE_KEY);
            if (localRaw) {
              const localIds: number[] = JSON.parse(localRaw);
              for (const pid of localIds) {
                if (!ids.includes(pid)) {
                  fetch(`/api/favorites/${pid}`, { method: 'POST' }).catch(
                    () => {}
                  );
                }
              }
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            // ignore
          }

          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setFavorites(saved ? JSON.parse(saved) : []);
      } catch {
        setFavorites([]);
      }
      setLoading(false);
    }
  }, [isLoggedIn]);

  const toggleFavorite = useCallback(
    (productId: number) => {
      setFavorites(prev => {
        const alreadyFav = prev.includes(productId);
        const updated = alreadyFav
          ? prev.filter(id => id !== productId)
          : [...prev, productId];

        if (isLoggedIn) {
          fetch(`/api/favorites/${productId}`, {
            method: alreadyFav ? 'DELETE' : 'POST',
          }).catch(() => {});
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }

        return updated;
      });
    },
    [isLoggedIn]
  );

  const isFavorite = useCallback(
    (productId: number) => favorites.includes(productId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
