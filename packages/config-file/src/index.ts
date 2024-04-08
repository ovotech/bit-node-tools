import { existsSync, readFileSync } from 'fs';

export const resolveValues = <T>(config: Partial<T>, env: NodeJS.ProcessEnv) => {
  const keys = Object.keys(config) as Array<keyof T>;

  return keys.reduce(
    (acc, key) => {
      const value = config[key];
      const resolvedValue =
        typeof value === 'string'
          ? value.replace(/\$\{([A-Za-z][A-Za-z0-9\_]*)\}/g, (match, name, offset, str) => String(env[name]))
          : value;

      return { ...acc, [key]: resolvedValue };
    },
    {} as T,
  );
};

export interface LoadConfigFileOptions<T> {
  env: NodeJS.ProcessEnv;
  file: string;
  defaults?: Partial<T>;
  required?: Array<keyof T>;
}

export const loadConfigFile = <T>({ env, file, defaults = {}, required = [] }: LoadConfigFileOptions<T>): T => {
  if (!existsSync(file)) {
    throw new Error(`Configuration file ${file} not found.`);
  }

  const userConfig: Partial<T> = JSON.parse(String(readFileSync(file)));

  const missingKeys = required.filter(key => !Object.keys(userConfig).includes(String(key)));
  if (missingKeys.length) {
    throw new Error(`Configuration should include ${missingKeys.map(key => `"${String(key)}"`).join(', ')} in ${file}`);
  }
  const config = resolveValues(userConfig, env);

  return { ...defaults, ...config };
};
