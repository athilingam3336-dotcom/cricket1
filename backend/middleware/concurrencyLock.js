/**
 * middleware/concurrencyLock.js
 * In-process concurrency locking and duplicate delivery protection
 */

const activeMatchLocks = new Set();

function acquireMatchLock(req, res, next) {
  const matchId = req.params.matchId;
  if (!matchId) return next();

  if (activeMatchLocks.has(matchId)) {
    return res.status(409).json({
      success: false,
      error: 'Conflict: Another scoring operation is currently in progress for this match. Please retry.',
      code: 'CONCURRENT_SCORING_LOCK'
    });
  }

  activeMatchLocks.add(matchId);

  // Auto-release lock on response finish/close
  const release = () => {
    activeMatchLocks.delete(matchId);
    res.removeListener('finish', release);
    res.removeListener('close', release);
  };

  res.on('finish', release);
  res.on('close', release);

  next();
}

module.exports = {
  acquireMatchLock
};
