/**
 * Script de diagnóstico para verificar usuarios en la base de datos
 *
 * USO:
 * node apps/web/debug-login.js "FerSG" "tu_contraseña"
 *
 * Este script verifica:
 * 1. Si el usuario existe en la base de datos
 * 2. Si tiene password_hash
 * 3. Si la contraseña coincide con el hash
 */

require('dotenv').config({ path: 'apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no configuradas');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLogin(emailOrUsername, password) {
  console.log('\n🔍 DIAGNÓSTICO DE LOGIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Buscando usuario:', emailOrUsername);
  console.log('🔐 Contraseña proporcionada:', password ? `${password.substring(0, 3)}***` : '(vacía)');
  console.log('');

  // 1. Primero, obtener todas las columnas disponibles
  console.log('🔎 Paso 1: Verificando schema de la tabla users...');
  const { data: schemaTest } = await supabase
    .from('users')
    .select('*')
    .eq('username', emailOrUsername)
    .single();

  if (schemaTest) {
    console.log('   Columnas disponibles en la tabla users:');
    Object.keys(schemaTest).forEach(col => {
      console.log(`   - ${col}`);
    });
    console.log('');
  }

  // 2. Buscar usuario (exactamente como en login.ts)
  console.log('🔎 Paso 2: Buscando usuario en la base de datos...');
  console.log('   Query: .select("id, username, email, password_hash, email_verified, cargo_rol, type_rol, is_banned, ban_reason, organization_id, role")');
  console.log('   Filter: .or(`username.ilike.${emailOrUsername},email.ilike.${emailOrUsername}`)');

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, email, password_hash, email_verified, cargo_rol, type_rol, is_banned, ban_reason, organization_id, role')
    .or(`username.ilike.${emailOrUsername},email.ilike.${emailOrUsername}`)
    .single();

  console.log('   Resultado error:', error);
  console.log('   Resultado data:', user ? 'Usuario encontrado' : 'null');

  if (error) {
    console.error('❌ Error al buscar usuario:', error);

    // Intentar buscar con match exacto
    console.log('\n🔎 Intentando búsqueda con match exacto en username...');
    const { data: exactUser, error: exactError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('username', emailOrUsername)
      .single();

    if (!exactError && exactUser) {
      console.log('✅ Usuario encontrado con match exacto:');
      console.log('   ID:', exactUser.id);
      console.log('   Username:', exactUser.username);
      console.log('   Email:', exactUser.email);
    } else {
      console.log('❌ Usuario no encontrado con match exacto');

      // Listar primeros 5 usuarios para referencia
      console.log('\n📋 Primeros 5 usuarios en la base de datos:');
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, username, email')
        .limit(5);

      if (allUsers && allUsers.length > 0) {
        allUsers.forEach(u => {
          console.log(`   - ${u.username} (${u.email})`);
        });
      } else {
        console.log('   ⚠️ No hay usuarios en la base de datos');
      }
    }

    return;
  }

  if (!user) {
    console.error('❌ Usuario no encontrado');
    return;
  }

  console.log('✅ Usuario encontrado:');
  console.log('   ID:', user.id);
  console.log('   Username:', user.username);
  console.log('   Email:', user.email);
  console.log('   Cargo/Rol:', user.cargo_rol);
  console.log('   Organization ID:', user.organization_id || '(ninguna)');
  console.log('   Está baneado:', user.is_banned ? '🚫 SÍ' : '✅ NO');

  // 2. Verificar password_hash
  console.log('\n🔑 Paso 2: Verificando password_hash...');
  if (!user.password_hash) {
    console.error('❌ El usuario NO tiene password_hash configurado');
    console.error('   Esto puede pasar si el usuario fue creado con OAuth o si hubo un error en el registro');
    return;
  }

  console.log('✅ El usuario tiene password_hash configurado');
  console.log('   Hash (primeros 20 caracteres):', user.password_hash.substring(0, 20) + '...');

  // 3. Verificar contraseña
  if (!password) {
    console.warn('⚠️ No se proporcionó contraseña para verificar');
    return;
  }

  console.log('\n🔐 Paso 3: Verificando contraseña...');
  try {
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (passwordValid) {
      console.log('✅ ¡Contraseña CORRECTA!');
      console.log('   El login debería funcionar correctamente');
    } else {
      console.error('❌ Contraseña INCORRECTA');
      console.error('   La contraseña proporcionada no coincide con el hash en la base de datos');

      // Intentar hashear la contraseña para comparar formato
      const newHash = await bcrypt.hash(password, 10);
      console.log('\n   Hash de la contraseña proporcionada:');
      console.log('   ' + newHash.substring(0, 20) + '...');
      console.log('\n   Hash en la base de datos:');
      console.log('   ' + user.password_hash.substring(0, 20) + '...');
    }
  } catch (bcryptError) {
    console.error('❌ Error al verificar contraseña con bcrypt:', bcryptError);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Diagnóstico completado\n');
}

// Ejecutar diagnóstico
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('❌ Uso: node apps/web/debug-login.js <emailOrUsername> [password]');
  console.error('Ejemplo: node apps/web/debug-login.js "FerSG" "miContraseña"');
  process.exit(1);
}

const [emailOrUsername, password] = args;
debugLogin(emailOrUsername, password).catch(console.error);
