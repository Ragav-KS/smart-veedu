import { config } from '@dotenvx/dotenvx';

interface LoadAndVerifyEnvProps<T extends readonly string[]> {
  envVariablesToCheck: T;
  envFiles?: string[];
}

export function loadAndVerifyEnv<T extends readonly string[]>({
  envFiles = ['.env', '.env.local'],
  envVariablesToCheck,
}: LoadAndVerifyEnvProps<T>): Record<T[number], string> {
  config({ path: envFiles, override: process.env.CI !== 'true' });

  return envVariablesToCheck.reduce(
    (env, envVar) => {
      if (!process.env[envVar]) {
        throw new Error(`${envVar} is not set`);
      }

      return Object.assign(env, { [envVar]: process.env[envVar] });
    },
    {} as Record<T[number], string>,
  );
}
