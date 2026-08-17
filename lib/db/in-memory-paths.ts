export type StoredStageResource = {
  is_primary: boolean;
  order_index: number;
  resources: {
    title: string;
    url: string;
    platform: string;
    resource_type: string;
    price: number;
    currency: string;
  };
};

export type StoredStage = {
  id: string;
  order_index: number;
  title: string;
  description: string;
  estimated_hours: number;
  stage_resources: StoredStageResource[];
  stage_progress: { practice_check: { description: string } }[];
};

export type PathOption = {
  id: string;
  name: string;
  tagline: string;
  total_cost: number;
  total_hours: number;
  stages: StoredStage[];
};

export type PendingPathSet = {
  setId: string;
  field_name: string;
  skill_level: string;
  weekly_hours: number;
  budget_total: number;
  currency: string;
  options: PathOption[];
};

export type StoredPath = {
  id: string;
  field_name: string;
  skill_level: string;
  weekly_hours: number;
  budget_total: number;
  currency: string;
  stages: StoredStage[];
};

const globalForPaths = globalThis as unknown as {
  inMemoryPathsStore?: Map<string, StoredPath>;
  inMemoryPathSetsStore?: Map<string, PendingPathSet>;
};

export const inMemoryPaths =
  globalForPaths.inMemoryPathsStore ?? new Map<string, StoredPath>();

export const inMemoryPathSets =
  globalForPaths.inMemoryPathSetsStore ?? new Map<string, PendingPathSet>();

if (process.env.NODE_ENV !== "production") {
  globalForPaths.inMemoryPathsStore = inMemoryPaths;
  globalForPaths.inMemoryPathSetsStore = inMemoryPathSets;
}
