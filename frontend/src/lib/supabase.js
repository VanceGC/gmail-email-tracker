import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rsrmzsqfxwltwptgvpiz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcm16c3FmeHdsdHdwdGd2cGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY3NTAsImV4cCI6MjA3NTM0Mjc1MH0.ls4S1FOdX3Z-46EKmiqTVQ4LAeJR-I6pix9aUYUfipQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
