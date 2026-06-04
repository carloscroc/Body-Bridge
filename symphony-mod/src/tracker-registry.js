// Tracker Registry - manages tracker plugins
class TrackerRegistry {
  constructor() {
    this.plugins = new Map();
  }

  register(plugin) {
    this.plugins.set(plugin.kind, plugin);
  }

  get(kind) {
    return this.plugins.get(kind);
  }

  createClient(kind, config, logger) {
    const plugin = this.get(kind);
    if (!plugin) {
      throw new Error(`Unknown tracker kind: ${kind}`);
    }
    return plugin.createClient(config, logger);
  }
}

export { TrackerRegistry };