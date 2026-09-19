// Augments Express's Request type so req.userId (set by requireAuth /
// optionalAuth) is recognized everywhere without casting.
export {};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
