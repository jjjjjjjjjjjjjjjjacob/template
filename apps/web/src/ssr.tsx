import { createClerkHandler } from '@clerk/tanstack-react-start/server';
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';
import { createRouter } from './router';

const handler = createStartHandler({
  createRouter,
});

// Configure Clerk handler - let it handle auth internally
export default createClerkHandler(handler)(defaultStreamHandler);
