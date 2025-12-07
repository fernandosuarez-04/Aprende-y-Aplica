# ⚠️ ADVERTENCIA DE SEGURIDAD - API KEYS EXPUESTAS

## 🚨 Acción Inmediata Requerida

Se detectó que las siguientes API keys fueron expuestas en la documentación:

### 1. Gemini API Key
- **Estado**: ❌ EXPUESTA
- **Ubicación**: Documentación (ya corregida)
- **Acción**: **REVOCAR INMEDIATAMENTE**

### 2. ElevenLabs API Key
- **Estado**: ❌ EXPUESTA (en código fuente)
- **Ubicación**: Componentes de React (hardcodeada)
- **Acción**: **REVOCAR INMEDIATAMENTE**

---

## ✅ Pasos para Remediar

### 1. Revocar API Key de Gemini (URGENTE)

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Encuentra la API key comprometida
3. Haz clic en "Delete" o "Revoke"
4. Genera una nueva API key
5. Actualiza `.env.local` con la nueva key:
   ```bash
   NEXT_PUBLIC_GEMINI_API_KEY=tu_nueva_api_key_aqui
   ```

### 2. Revocar API Key de ElevenLabs (URGENTE)

1. Ve a [ElevenLabs API Settings](https://elevenlabs.io/app/settings/api-keys)
2. Revoca la API key comprometida
3. Genera una nueva API key
4. Actualiza `.env.local`:
   ```bash
   NEXT_PUBLIC_ELEVENLABS_API_KEY=tu_nueva_api_key_aqui
   ```

### 3. Limpiar Historial de Git (Opcional pero Recomendado)

Si las API keys fueron commiteadas al repositorio Git:

```bash
# ⚠️ ADVERTENCIA: Esto reescribe el historial de Git
# Solo hacer si las keys están en commits

# Instalar BFG Repo Cleaner (si no lo tienes)
# https://reps-cleaner.github.io/

# O usar git filter-branch (más complejo)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch apps/web/.env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Forzar push (si el repo es privado y estás seguro)
git push origin --force --all
```

**IMPORTANTE**: Solo hacer esto si:
- El repositorio es privado
- Coordinas con todo el equipo
- Entiendes las consecuencias de reescribir historial

### 4. Verificar que .env.local NO esté en Git

```bash
# Verificar .gitignore
grep ".env.local" .gitignore

# Verificar que no esté trackeado
git ls-files | grep ".env.local"

# Si aparece, elimínalo del tracking:
git rm --cached apps/web/.env.local
git commit -m "Remove .env.local from tracking"
```

---

## 🛡️ Mejores Prácticas Implementadas

### ✅ Cambios Realizados

1. **Documentación Limpia**
   - ✅ Todas las API keys en docs/ reemplazadas con placeholders
   - ✅ `.env.example` usa solo valores de ejemplo
   - ✅ README.md no contiene keys reales

2. **Variables de Entorno**
   - ✅ API keys movidas a `.env.local`
   - ✅ `.env.local` está en `.gitignore`
   - ✅ Código lee desde `process.env`

3. **Código Fuente**
   - ⚠️ PENDIENTE: Eliminar API key hardcodeada de componentes
   - ✅ Sistema nuevo usa variables de entorno

### ⚠️ Acciones Pendientes

1. **Actualizar Componentes Legacy**

   En estos archivos, la API key de ElevenLabs está hardcodeada:
   - `apps/web/src/core/components/ContextualVoiceGuide/ContextualVoiceGuide.tsx` (línea 240)
   - `apps/web/src/core/components/OnboardingAgent/OnboardingAgent.tsx` (línea 271)

   **Cambiar de:**
   ```typescript
   const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
   ```

   **A:**
   ```typescript
   const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
   ```

---

## 🔒 Prevención Futura

### 1. Git Hooks (Pre-commit)

Instalar git-secrets para detectar API keys antes de commit:

```bash
# Instalar git-secrets
npm install -g git-secrets

# Configurar en el repo
git secrets --install
git secrets --register-aws
git secrets --add 'sk_[a-zA-Z0-9]{48}'  # ElevenLabs pattern
git secrets --add 'AIzaSy[a-zA-Z0-9_-]{33}'  # Google API pattern
```

### 2. GitHub Security Alerts

Si usas GitHub:
1. Ve a Settings → Security & analysis
2. Activa "Secret scanning"
3. Activa "Push protection"

### 3. Variables de Entorno en Producción

Para deploy en Vercel/Netlify/etc:

1. **Nunca** commitees `.env.local` o `.env.production`
2. Usa el dashboard de tu plataforma para configurar variables
3. Rota las keys regularmente (cada 3-6 meses)

### 4. Checklist Antes de Commit

- [ ] ¿Hay API keys en el código?
- [ ] ¿Los archivos .env están en .gitignore?
- [ ] ¿La documentación usa solo placeholders?
- [ ] ¿Las keys están en variables de entorno?

---

## 📊 Estado Actual de Seguridad

| Componente | Estado | Acción Requerida |
|------------|--------|------------------|
| Documentación | ✅ Corregido | Ninguna |
| .env.example | ✅ Seguro | Ninguna |
| .env.local | ⚠️ Contiene keys reales | Revocar y regenerar keys |
| Componentes Legacy | ❌ Hardcoded | Actualizar a usar env vars |
| Sistema Nuevo | ✅ Usa env vars | Ninguna |

---

## 🆘 Contacto de Emergencia

Si detectas más exposiciones de API keys:

1. **Revocar inmediatamente** la key comprometida
2. Generar nueva key
3. Actualizar `.env.local`
4. Notificar al equipo
5. Revisar logs de uso de la API para detectar acceso no autorizado

---

## 📚 Referencias

- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Git Secrets](https://github.com/awslabs/git-secrets)
- [BFG Repo-Cleaner](https://reps-cleaner.github.io/)

---

**Fecha de incidente**: 2025-12-06
**Severidad**: Alta
**Estado**: En remediación
**Última actualización**: 2025-12-06
