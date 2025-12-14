import { createAnalysisStore } from "./analysis-store";
import { createStaticAssetStore } from "./static-asset-store";

type ContainersArgs = {
  analyzeDir: string;
};

export const createContainer = async (args: ContainersArgs) => {
  const analysisStore = await createAnalysisStore(args.analyzeDir);
  const staticAssetStore = createStaticAssetStore();

  return {
    analysisStore,
    staticAssetStore,
  };
};

export type Container = Awaited<ReturnType<typeof createContainer>>;
