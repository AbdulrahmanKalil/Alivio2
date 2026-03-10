module.exports = (fn) => {
  if (typeof fn !== "function") {
    throw new TypeError(
      `catchAsync expects a function, received: ${typeof fn}`,
    );
  }

  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
