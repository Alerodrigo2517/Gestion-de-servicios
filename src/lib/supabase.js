import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akhkkrtciiatyzvdrpji.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Q7GGBQO6XHmAXN9LZbTx7Q_b3axHkXN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
