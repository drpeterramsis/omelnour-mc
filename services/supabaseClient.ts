import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vulllioagnrprzqjndfa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bGxsaW9hZ25ycHJ6cWpuZGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTY3MjMsImV4cCI6MjA4MDY3MjcyM30.T6aJt1ROKS8_YAX2lvCkRn1IoBMoy7Z0BjBj2a9U6KM';

export const supabase = createClient(supabaseUrl, supabaseKey);