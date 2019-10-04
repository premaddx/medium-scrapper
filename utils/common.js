function getErrorMessages(error) {
  if (error.details && error.details.length > 0) {
    return error.details.reduce((acc, v) => {
      acc.push(v.message);
      return acc;
    }, []).join('\n');
  }
  return error.message;
}


module.exports = (obj) => {
  obj.getErrorMessages = getErrorMessages;
};