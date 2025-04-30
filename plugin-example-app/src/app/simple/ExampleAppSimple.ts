import { AppController, DeploymentStat, SERVICE_STATUS, Logger } from '@ale-run/runtime';

const logger = Logger.getLogger('app:example-simple');

export default class ExampleAppSimple extends AppController {
  public async deploy(): Promise<void> {
    logger.debug(`deploy called`, this.deployment.name);

    const stream = await this.getStream();
    stream.write(`- deploy called\n`);
    stream.write('project: ' + this.project.getAccessName() + '\n');
    stream.write('stage: ' + this.stage.getAccessName() + '\n');
    stream.write('deployment: ' + this.deployment.getAccessName() + '\n');
    stream.write('session: ' + this.session.id + '\n');
    stream.write('app: ' + this.app.getAccessName() + '\n');
    stream.write('plugin: ' + this.plugin?.name + '\n');
    stream.write('plugin options: ' + JSON.stringify(this.plugin?.options) + '\n');
    stream.write('request: ' + JSON.stringify(this.request, null, 2) + '\n');
    stream.write('current stored data: ' + (await this.store.load('status')) + '\n');
  }

  public async destroy(): Promise<void> {
    const stream = await this.getStream();
    stream.write(`destroy called`);
    logger.info(`destroy called`);
  }

  public async getStat(): Promise<DeploymentStat> {
    return {
      status: SERVICE_STATUS.running,
      entrypoints: [
        {
          link: 'https://google.com',
          type: 'http'
        }
      ]
    };
  }
}
