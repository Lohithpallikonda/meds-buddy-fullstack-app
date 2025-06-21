import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { medicationApi } from '../utils/medicationApi'

export const useMedications = () => {
  return useQuery({
    queryKey: ['medications'],
    queryFn: medicationApi.getMedications,
    staleTime: 5 * 60 * 1000,
  })
}

export const useTodaysMedications = () => {
  return useQuery({
    queryKey: ['medications', 'today'],
    queryFn: medicationApi.getTodaysMedications,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

export const useMedicationStats = () => {
  return useQuery({
    queryKey: ['medications', 'stats'],
    queryFn: medicationApi.getMedicationStats,
    staleTime: 2 * 60 * 1000,
  })
}

export const useMedicationLogs = (params = {}) => {
  return useQuery({
    queryKey: ['medications', 'logs', params],
    queryFn: () => medicationApi.getMedicationLogs(params),
    staleTime: 1 * 60 * 1000,
  })
}

export const useCreateMedication = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: medicationApi.createMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })
}

export const useUpdateMedication = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => medicationApi.updateMedication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })
}

export const useDeleteMedication = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: medicationApi.deleteMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })
}

export const useMarkAsTaken = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }) => medicationApi.markAsTaken(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })
}

export const useMarkAsMissed = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }) => medicationApi.markAsMissed(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })
}

export const useUploadProof = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ logId, formData }) => medicationApi.uploadProof(logId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
    onError: (error) => {
      console.error("Proof upload failed:", error);
    }
  })
}