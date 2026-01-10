/**
 * Hooks de Contexto de LIA
 * 
 * Exportaciones de todos los hooks para captura de contexto del frontend.
 * 
 * @example
 * ```tsx
 * import { useLiaEnrichedContext, liaComponentProps } from '@/lib/lia-context/hooks';
 * 
 * function MyComponent() {
 *   const { getEnrichedMetadata, addContextMarker, hasErrors } = useLiaEnrichedContext();
 *   
 *   return (
 *     <div {...liaComponentProps('MyComponent', { someState: true })}>
 *       ...
 *     </div>
 *   );
 * }
 * ```
 */

// Hook principal que combina todos los demás
export { 
  useLiaEnrichedContext, 
  type LiaEnrichedContextMetadata 
} from './useLiaEnrichedContext';

// Hooks individuales
export { useErrorCapture, type CapturedError } from './useErrorCapture';
export { 
  useActiveComponents, 
  liaComponentProps, 
  withLiaComponent,
  type ActiveComponent 
} from './useActiveComponents';
export { useApiTracking, type ApiCall } from './useApiTracking';

