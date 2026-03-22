/**
 * Next.js Server Context Type Extensions
 *
 * Extends ServerContextJSONValue to include auth-related properties
 * passed from server components to client components.
 */

import { DefaultSession } from 'next-auth';

declare module 'next/types' {
  export interface ServerContextJSONValue {
    user?: DefaultSession['user'] | null;
    login?: {
      email?: string | null;
    } | null;
    isLoading?: boolean;
    logout?: () => void | Promise<void>;
  }
}
