/**
 * Supabase Client Configuration
 * 
 * This module initializes and exports the Supabase client for authentication
 * and database operations. It uses environment variables for configuration.
 * 
 * Required Environment Variables:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous/public API key
 * 
 * Setup Instructions:
 * 1. Create a .env file in the project root
 * 2. Add your Supabase credentials:
 *    VITE_SUPABASE_URL=https://your-project.supabase.co
 *    VITE_SUPABASE_ANON_KEY=your-anon-key
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️  Supabase configuration missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

/**
 * Supabase client instance
 * Used for all authentication and database operations
 */
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    // Automatically refresh the session
    autoRefreshToken: true,
    // Persist session in local storage
    persistSession: true,
    // Detect session from URL for OAuth callbacks
    detectSessionInUrl: true,
  },
});

/**
 * Database table names
 * Centralized constants for database table references
 */
export const TABLES = {
  USERS: 'users',
  USER_METADATA: 'user_metadata',
} as const;

/**
 * Helper function to check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
