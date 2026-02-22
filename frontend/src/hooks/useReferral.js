import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

const useReferral = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['referral'],
    queryFn: () => client.get('/users/referral/').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  return { referralData: data, isLoading, refetch };
};

export default useReferral;
