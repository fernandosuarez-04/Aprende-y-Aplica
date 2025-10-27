SELECT column_name, is_nullable, column_default, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash';
