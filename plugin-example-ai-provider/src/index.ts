import { Plugin, Logger } from '@ale-run/runtime';
import { ExampleAIProvider } from './ExampleAIProvider';
import chalk from 'ansi-colors';

const logger = Logger.getLogger('plugin:example-ai-provider');

export default class PluginAssistanExample extends Plugin {
  public async activate(): Promise<void> {
    logger.info(chalk.blueBright(`plugin ${this.name} is activate`), this.options);

    const ai = this.get('@ale-run/plugin-ai-assistant:api');
    if (!ai) return logger.error(`plugin @ale-run/plugin-ai-assistant is required`);

    const API_KEY = this.options.API_KEY;

    ai.registProvider(
      'example',
      new ExampleAIProvider({
        apikey: API_KEY
      })
    );
  }

  public async deactivate(): Promise<void> {
    logger.info(chalk.yellowBright(`plugin ${this.name} is deactivate`));

    const ai = this.get('@ale-run/plugin-ai-assistant:api');
    ai?.unregistProvider('example');
  }
}
