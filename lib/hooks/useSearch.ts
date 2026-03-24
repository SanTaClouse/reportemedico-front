'use client'

import { useState, useEffect, useRef } from 'react'
import type { Article } from '@/lib/api'

export interface SearchArticle extends Article {
  score?: number
  headline?: string // snippet con <mark> destacando los términos buscados
}

interface UseSearchResult {
  results: SearchArticle[]
  loading: boolean
  error: boolean
  query: string
  setQuery: (q: string) => void
  clear: () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useSearch(debounceMs = 300): UseSearchResult {
  const [query, setQuery]             = useState('')
  const [debouncedQuery, setDebounced] = useState('')
  const [results, setResults]         = useState<SearchArticle[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(false)
  const abortRef                      = useRef<AbortController | null>(null)

  // ── Debounce ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), debounceMs)
    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // ── Fetch con AbortController (evita race conditions) ─────────────────────
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(false)

    fetch(
      `${API_URL}/articles/search?q=${encodeURIComponent(debouncedQuery)}&limit=6`,
      { signal: abortRef.current.signal },
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: { data: SearchArticle[] }) => {
        setResults(data.data ?? [])
        setLoading(false)
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return // request cancelado intencionalmente
        setError(true)
        setLoading(false)
      })

    return () => abortRef.current?.abort()
  }, [debouncedQuery])

  const clear = () => {
    setQuery('')
    setResults([])
    setError(false)
  }

  return { results, loading, error, query, setQuery, clear }
}
