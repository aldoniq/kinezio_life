import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://riwmzeivmqdcggryedoo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpd216ZWl2bXFkY2dncnllZG9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkyNTEyNiwiZXhwIjoyMDc1NTAxMTI2fQ.l1ESlNDCMJCotUc3QQDxISwiiaI1wgAeRw_Dw-C2RHg';

export const supabase = createClient(supabaseUrl, supabaseKey);
