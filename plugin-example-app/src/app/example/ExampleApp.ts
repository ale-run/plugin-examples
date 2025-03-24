import { AbstractApp } from './AbstractApp';

export default class ExampleApp extends AbstractApp {
  public async deploy(): Promise<void> {
    const stream = await this.getStream();
    stream.write(`- ExampleApp.deploy called ${this.deployment.name}\n`);
    super.deploy();
    stream.write(`- ExampleApp.deploy finished\n`);
  }
}
