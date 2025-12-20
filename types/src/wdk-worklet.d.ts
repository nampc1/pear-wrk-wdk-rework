export type WdkWorkletInit = {
    seedPhrase: string;
    items: WdkModuleMetadata[];
};
export type WdkModuleMetadata = {
    type: "wallet" | "protocol";
    name: string;
    moduleName: string;
    network: string;
    config: Record<string, any>;
};
