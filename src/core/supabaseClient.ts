import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not defined');
}

if (!supabasePublishableKey) {
    throw new Error('SUPABASE_PUBLISHABLE_KEY is not defined');
}

const supabase = createClient(supabaseUrl, supabasePublishableKey);

export default supabase;