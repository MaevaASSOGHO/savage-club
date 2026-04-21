// hooks/useInfiniteMedia.ts
import { useState, useEffect, useCallback } from 'react';
import { Media } from '@/types';

interface UseInfiniteMediaProps {
  initialPage?: number;
  limit?: number;
  tab?: string;
}

export function useInfiniteMedia({ 
  initialPage = 1, 
  limit = 9,
  tab = 'trending'
}: UseInfiniteMediaProps = {}) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialPage);

  const fetchMedia = useCallback(async (pageNum: number, isReset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Simulation d'appel API - à remplacer par votre vraie API
      const response = await fetch(`/api/media?page=${pageNum}&limit=${limit}&tab=${tab}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const data = await response.json();
      
      if (isReset || pageNum === 1) {
        setMedia(data.media);
      } else {
        setMedia(prev => [...prev, ...data.media]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [limit, tab]);

  // Reset function pour changer d'onglet
  const reset = useCallback(() => {
    setMedia([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    fetchMedia(1, true);
  }, [fetchMedia]);

  // Chargement initial
  useEffect(() => {
    fetchMedia(1, true);
  }, [fetchMedia]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchMedia(page + 1);
    }
  }, [loading, hasMore, page, fetchMedia]);

  return {
    media,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    page
  };
}