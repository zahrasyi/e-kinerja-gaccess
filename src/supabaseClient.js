import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vasjixrmmuisuwtqixwz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhc2ppeHJtbXVpc3V3dHFpeHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NzU0NjcsImV4cCI6MjEwNTA1MTQ2N30.bYw_VjKWZGiXh4G4NNyvd84LkM041y9dZUaoLah53X4'

export const supabase = createClient(supabaseUrl, supabaseKey)