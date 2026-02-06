import { homedir } from 'os';
import { join } from 'path';

const PLATFORM_DEFINITIONS = {
  claude: {
    label: 'Claude Desktop',
    getDefaultConfigPath: () => {
      const platform = process.platform;

      if (platform === 'darwin') {
        return join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
      }

      if (platform === 'win32') {
        const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
        return join(appData, 'Claude', 'claude_desktop_config.json');
      }

      const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
      return join(configHome, 'claude', 'claude_desktop_config.json');
    }
  },
  cursor: {
    label: 'Cursor',
    getDefaultConfigPath: () => null,
    requiresConfig: true
  },
  vscode: {
    label: 'VS Code',
    getDefaultConfigPath: () => null,
    requiresConfig: true
  },
  windsurf: {
    label: 'Windsurf',
    getDefaultConfigPath: () => null,
    requiresConfig: true
  }
};

export function listPlatforms() {
  return Object.entries(PLATFORM_DEFINITIONS).map(([id, platform]) => ({
    id,
    label: platform.label
  }));
}

export function resolvePlatformConfig(options = {}) {
  const platformId = options.platform || process.env.OPENCONDUCTOR_PLATFORM || 'claude';
  const platform = PLATFORM_DEFINITIONS[platformId];

  if (!platform) {
    const available = listPlatforms()
      .map((entry) => `${entry.id} (${entry.label})`)
      .join(', ');
    throw new Error(`Unknown platform "${platformId}". Available platforms: ${available}`);
  }

  const explicitPath = options.config || process.env.OPENCONDUCTOR_CONFIG_PATH;
  const defaultPath = platform.getDefaultConfigPath();
  const configPath = explicitPath || defaultPath;

  if (!configPath) {
    throw new Error(
      `${platform.label} requires a config path. Provide --config <path> or set OPENCONDUCTOR_CONFIG_PATH.`
    );
  }

  return {
    id: platformId,
    label: platform.label,
    configPath
  };
}
