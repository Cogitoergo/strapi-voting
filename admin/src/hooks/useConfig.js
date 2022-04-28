import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchConfig, restartStrapi, restoreConfig, updateConfig } from '../pages/Settings/utils/api';

const useConfig = (toggleNotification) => {
  const queryClient = useQueryClient();
  
  const fetch = useQuery('get-config', () =>
    fetchConfig(toggleNotification)
  );

  const handleError = (type, callback = () => {}) => {
    toggleNotification({
      type: 'warning',
      message: 'There was an error updating configuration. Please try again.',
    });
    callback();
  };

  const handleSuccess = (type, callback = () => {}, invalidateQueries = true) => {
    if (invalidateQueries) {
      queryClient.invalidateQueries('get-config');
    };
    toggleNotification({
      type: 'success',
      message: 'Configuration successfuly updated!',
    });
    callback();
  };

  const submitMutation = useMutation(updateConfig, {
    onSuccess: () => handleSuccess('submit'),
    onError: () => handleError('submit'),
  });

  const restoreMutation = useMutation(restoreConfig, {
    onSuccess: () => handleSuccess('restore'),
    onError: () => handleError('restore'),
  });

  const restartMutation = useMutation(restartStrapi, {
    onSuccess: () => handleSuccess('restart', () => {}, false),
    onError: () => handleError('restart'),
  });

  return { fetch, restartMutation, submitMutation, restoreMutation };
};

export default useConfig;