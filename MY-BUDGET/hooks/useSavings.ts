import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { archiveSavingsGoal, createSavingsGoal, listSavingsGoals } from '@/services/savings';
import type { NewSavingsGoalInput } from '@/types/database';

export function useSavingsGoals() {
  return useQuery({ queryKey: ['savings-goals'], queryFn: listSavingsGoals });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewSavingsGoalInput) => createSavingsGoal(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings-goals'] }),
  });
}

export function useArchiveSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveSavingsGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings-goals'] }),
  });
}
