import { parseStringPromise } from 'xml2js';
import JSZip from 'jszip';

export interface ScormObjective {
  id: string;
  description?: string;
  satisfiedByMeasure?: boolean;
  minNormalizedMeasure?: number;
}

export interface ScormManifest {
  version: 'SCORM_1.2' | 'SCORM_2004';
  title: string;
  description?: string;
  entryPoint: string;
  organizations: ScormOrganization[];
  resources: ScormResource[];
  objectives: ScormObjective[];
}

interface ScormOrganization {
  identifier: string;
  title: string;
  items: ScormItem[];
}

interface ScormItem {
  identifier: string;
  title: string;
  resourceId?: string;
  children?: ScormItem[];
  objectives?: ScormObjective[];
}

interface ScormResource {
  identifier: string;
  type: string;
  href?: string;
  files: string[];
}

// Helper to get a value from an object trying multiple key variations (with/without namespace)
function getWithNS(obj: any, ...keys: string[]): any {
  if (!obj) return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
    // Try with common namespace prefixes
    for (const ns of ['imsss:', 'adlseq:', 'adlcp:', 'adlnav:', '']) {
      if (obj[ns + key] !== undefined) return obj[ns + key];
    }
  }
  return undefined;
}

export async function parseScormManifest(xml: string): Promise<ScormManifest> {
  const result = await parseStringPromise(xml, { explicitArray: false });
  const manifest = result.manifest;

  // Detectar versión
  const schemaVersion =
    manifest.metadata?.schemaversion ||
    manifest['$']?.version ||
    '1.2';
  const version = schemaVersion.includes('2004') ? 'SCORM_2004' : 'SCORM_1.2';

  // Parsear organizaciones
  const orgs = manifest.organizations?.organization;
  const orgArray = Array.isArray(orgs) ? orgs : orgs ? [orgs] : [];

  const organizations: ScormOrganization[] = orgArray.map((org: any) => ({
    identifier: org['$']?.identifier || '',
    title: org.title || '',
    items: parseItems(org.item),
  }));

  // Parsear recursos
  const res = manifest.resources?.resource;
  const resArray = Array.isArray(res) ? res : res ? [res] : [];

  const resources: ScormResource[] = resArray.map((r: any) => ({
    identifier: r['$']?.identifier || '',
    type: r['$']?.type || '',
    href: r['$']?.href,
    files: parseFiles(r.file),
  }));

  // Encontrar entry point
  const entryPoint = resources.find((r) => r.href)?.href || 'index.html';

  // Título del curso
  const title =
    organizations[0]?.title ||
    manifest.metadata?.lom?.general?.title?.string ||
    'Untitled Course';

  // Extraer objetivos del manifest
  const objectives = extractObjectives(manifest, organizations);

  return {
    version,
    title,
    description: manifest.metadata?.lom?.general?.description?.string,
    entryPoint,
    organizations,
    resources,
    objectives,
  };
}

function parseItems(items: any): ScormItem[] {
  if (!items) return [];
  const arr = Array.isArray(items) ? items : [items];
  return arr.map((item: any) => ({
    identifier: item['$']?.identifier || '',
    title: item.title || '',
    resourceId: item['$']?.identifierref,
    children: parseItems(item.item),
    objectives: parseItemObjectives(item),
  }));
}

function parseItemObjectives(item: any): ScormObjective[] {
  const objectives: ScormObjective[] = [];

  // SCORM 2004 objectives can be in various namespaces
  const sequencing = getWithNS(item, 'sequencing');

  if (sequencing) {
    const objectivesContainer = getWithNS(sequencing, 'objectives');

    if (objectivesContainer) {
      // Primary objective
      const primaryObjective = getWithNS(objectivesContainer, 'primaryObjective');

      if (primaryObjective) {
        const objId = primaryObjective['$']?.objectiveID;
        if (objId) {
          const minMeasure = getWithNS(primaryObjective, 'minNormalizedMeasure');
          objectives.push({
            id: objId,
            satisfiedByMeasure: primaryObjective['$']?.satisfiedByMeasure === 'true',
            minNormalizedMeasure: parseFloat(minMeasure || '0'),
          });
        }
      }

      // Secondary objectives
      const otherObjectives = getWithNS(objectivesContainer, 'objective');

      if (otherObjectives) {
        const objArr = Array.isArray(otherObjectives) ? otherObjectives : [otherObjectives];
        objArr.forEach((obj: any) => {
          const objId = obj['$']?.objectiveID;
          if (objId) {
            const minMeasure = getWithNS(obj, 'minNormalizedMeasure');
            objectives.push({
              id: objId,
              satisfiedByMeasure: obj['$']?.satisfiedByMeasure === 'true',
              minNormalizedMeasure: parseFloat(minMeasure || '0'),
            });
          }
        });
      }
    }
  }

  return objectives;
}

function extractObjectives(manifest: any, organizations: ScormOrganization[]): ScormObjective[] {
  const allObjectives: ScormObjective[] = [];
  const seenIds = new Set<string>();

  // Extract objectives from all items in all organizations
  function collectFromItems(items: ScormItem[]) {
    for (const item of items) {
      if (item.objectives) {
        for (const obj of item.objectives) {
          if (!seenIds.has(obj.id)) {
            seenIds.add(obj.id);
            allObjectives.push(obj);
          }
        }
      }
      if (item.children) {
        collectFromItems(item.children);
      }
    }
  }

  for (const org of organizations) {
    collectFromItems(org.items);
  }

  // Also check for global objectives in the manifest
  const globalSeq = getWithNS(manifest, 'sequencingCollection');

  if (globalSeq) {
    const sequencing = getWithNS(globalSeq, 'sequencing');
    if (sequencing) {
      const objectivesContainer = getWithNS(sequencing, 'objectives');
      if (objectivesContainer) {
        const globalObjectives = getWithNS(objectivesContainer, 'objective');

        if (globalObjectives) {
          const objArr = Array.isArray(globalObjectives) ? globalObjectives : [globalObjectives];
          objArr.forEach((obj: any) => {
            const objId = obj['$']?.objectiveID;
            if (objId && !seenIds.has(objId)) {
              seenIds.add(objId);
              const minMeasure = getWithNS(obj, 'minNormalizedMeasure');
              allObjectives.push({
                id: objId,
                satisfiedByMeasure: obj['$']?.satisfiedByMeasure === 'true',
                minNormalizedMeasure: parseFloat(minMeasure || '0'),
              });
            }
          });
        }
      }
    }
  }

  return allObjectives;
}

function parseFiles(files: any): string[] {
  if (!files) return [];
  const arr = Array.isArray(files) ? files : [files];
  return arr.map((f: any) => f['$']?.href || '').filter(Boolean);
}

export async function validateScormPackage(
  zip: JSZip,
  manifest: ScormManifest
): Promise<{ valid: boolean; error?: string }> {
  // Verificar entry point
  if (!zip.file(manifest.entryPoint)) {
    return {
      valid: false,
      error: `Entry point not found: ${manifest.entryPoint}`,
    };
  }

  // Verificar recursos críticos
  for (const resource of manifest.resources) {
    if (resource.href && !zip.file(resource.href)) {
      return { valid: false, error: `Resource not found: ${resource.href}` };
    }
  }

  return { valid: true };
}
