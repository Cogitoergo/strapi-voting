const handleAPIError = (err = null, toggleNotification = null, message = '') => {
  toggleNotification({
    type: 'warning',
    message: message || err.message,
  });
  if (err) {
    throw err;
  } else {
    throw new Error('error');
  }
}

export default handleAPIError;