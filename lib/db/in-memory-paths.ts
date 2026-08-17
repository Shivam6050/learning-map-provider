export type StoredPath = {
  id: string;
  field_name: string;
  skill_level: string;
  weekly_hours: number;
  budget_total: number;
  currency: string;
  stages: {
    id: string;
    order_index: number;
    title: string;
    description: string;
    estimated_hours: number;
    stage_resources: {
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
    }[];
    stage_progress: { practice_check: { description: string } }[];
  }[];
};

const globalForPaths = globalThis as unknown as {
  inMemoryPathsStore?: Map<string, StoredPath>;
};

export const inMemoryPaths =
  globalForPaths.inMemoryPathsStore ?? new Map<string, StoredPath>();

if (process.env.NODE_ENV !== "production") {
  globalForPaths.inMemoryPathsStore = inMemoryPaths;
}
