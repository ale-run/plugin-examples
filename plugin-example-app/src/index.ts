import { Plugin, Logger } from '@ale-run/runtime';
import path from 'path';
import chalk from 'ansi-colors';

const logger = Logger.getLogger('plugin:example-app');

export default class ExampleAppPlugin extends Plugin {
  public async activate(): Promise<void> {
    logger.info(chalk.blueBright(`plugin ${this.name} is activate`), this.options);

    const catalog = await this.context.getCatalog();

    // regist app & preset
    const dirnames = ['simple', 'complex', 'with-git', 'with-description', 'with-metric', 'with-k8s'];

    for (const dirname of dirnames) {
      const appdir = path.join(__dirname, 'app', dirname);
      await catalog.regist(appdir);
      await catalog.registPreset(appdir);
    }
  }
}
