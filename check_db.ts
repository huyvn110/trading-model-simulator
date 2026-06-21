import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Nạp biến môi trường từ .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function checkSupabase() {
  const { data, error } = await supabaseAdmin
    .from('user_stores')
    .select('*')
    .like('store_name', '%_folder_%');
    
  if (error) {
    console.error("Error fetching:", error);
    return;
  }
  
  console.log("Found records in user_stores:");
  console.log(JSON.stringify(data, null, 2));
}

checkSupabase();
