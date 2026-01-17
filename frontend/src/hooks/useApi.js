import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function useApi(url, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await api.get(url, options)
        setData(response.data.data)
        setError(null)
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (url) {
      fetchData()
    }
  }, [url])

  return { data, loading, error, refetch: () => {} }
}