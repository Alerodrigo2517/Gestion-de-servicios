/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akhkkrtciiatyzvdrpji.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Q7GGBQO6XHmAXN9LZbTx7Q_b3axHkXN';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // Solo advierte en la consola de compilación para no romper el pre-renderizado estático
  if (typeof window !== 'undefined') {
    console.warn('Advertencia: Las variables de entorno de Supabase no están definidas. Se usarán valores de prueba.');
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
