/**
 * Next.js Server Context Type Extensions
 *
 * Extends ServerContextJSONValue to include auth-related properties
 */

declare module 'next/types' {
  export interface ServerContextJSONValue {
    user?: {
      id?: string;
      username?: string;
      nickname?: string | null;
      grade?: number | null;
      invitationCode?: string | null;
    } | null;
    login?: {
      email?: string | null;
    } | null;
    isLoading?: boolean;
    logout?: () => void | Promise<void>;
  }
}
