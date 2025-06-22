import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xeyryfkcevcsuajolphd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhleXJ5ZmtjZXZjc3Vham9scGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1ODkzMTgsImV4cCI6MjA2NjE2NTMxOH0.ahbfj2Vunz_IOT8BIMOckWAWuYXMxMpyuA2N8cjlUBQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
