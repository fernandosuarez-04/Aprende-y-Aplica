# Aprende-y-Aplica
Pagina web de Aprende y Aplica

## Internacionalización (i18n)

El frontend (`apps/web`) integra `next-i18next` + `react-i18next` para soportar Español (por defecto), Inglés y Portugués.  

- **Recursos:** agrega o actualiza traducciones en `apps/web/public/locales/{es,en,pt}/common.json`. Mantén las mismas claves en los tres idiomas.
- **Proveedor:** `I18nProvider` inicializa i18next y expone el hook `useLanguage`. Ya está montado en `src/app/layout.tsx`.
- **Uso en componentes:** importa `useTranslation('common')` y usa `t('clave')` para renderizar textos.  
- **Selector de idioma:** utiliza `useLanguage()` para leer o cambiar el idioma. El menú del usuario muestra un ejemplo práctico.

Después de cambiar traducciones, reinicia el servidor de desarrollo (o limpia la caché) para cargar los nuevos textos.