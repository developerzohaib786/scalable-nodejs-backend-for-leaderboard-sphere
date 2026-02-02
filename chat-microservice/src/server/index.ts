import { router } from './trpc';

// this is our root router 
const appRouter = router({
  
});
 

export type AppRouter = typeof appRouter;