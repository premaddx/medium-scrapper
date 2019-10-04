module.exports = router => {
  router.get('/test', (req, res, next) => {
    try {
      return res.json({
        success: true,
        message: 'Working Fine',
      });
    } catch (e) {
      next(e);
    }
  });
};
