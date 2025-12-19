// Components
export { SCORMPlayer } from './components/SCORMPlayer';
export { SCORMUploader } from './components/SCORMUploader';
export { SCORMProgress } from './components/SCORMProgress';

// Hooks
export { useScormPackage } from './hooks/useScormPackage';
export { useScormAttempts } from './hooks/useScormAttempts';
export { useBusinessUserScormPackages } from './hooks/useBusinessUserScormPackages';
export type { AssignedScormPackage, ScormPackageStats } from './hooks/useBusinessUserScormPackages';

// Types (re-export from lib for convenience)
export type {
  ScormPackage,
  ScormAttempt,
  SCORMVersion,
  SCORMPlayerProps,
  SCORMUploaderProps,
  SCORMAdapterConfig
} from '@/lib/scorm/types';
