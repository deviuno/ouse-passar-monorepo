// Manually define process.env types to support process.env.API_KEY per guidelines.
// Using global augmentation to avoid "Cannot redeclare block-scoped variable 'process'" error.

export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      [key: string]: string | undefined;
    }
  }
}
