import { useQuery } from '@tanstack/react-query'
import { fetchSteelTrackData } from './api'

export const useSteelTrackData = () =>
  useQuery({
    queryKey: ['steeltrack-data'],
    queryFn: fetchSteelTrackData,
  })
