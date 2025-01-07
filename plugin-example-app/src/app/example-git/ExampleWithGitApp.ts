import { AppController, SERVICE_STATUS, DeploymentStat, Logger, AnyObject, sleep } from '@ale-run/runtime';
import path from 'path';
import { Readable, PassThrough } from 'stream';

const logger = Logger.getLogger('app:example-git');

export default class ExampleWithGitApp extends AppController {
  public async deploy(): Promise<void> {
    logger.debug(`deploy called`, this.deployment.name);

    const stream = await this.getStream();
    const request = this.request;
    const options = request.options || {};

    const git = Object.assign({}, (request.context && request.context.git) || {}, (request.options && request.options.git) || {});
    if (!git || !git.url) throw new Error(`options.git is required`);

    const shell = await this.getShell();
    stream.write(`- example-git git clone\n`);

    const gitfile = options.file || 'package.json';
    const gitResult = await shell.clone('repo', git.url, { branch: git.branch });
    stream.write('git clone: ' + JSON.stringify(gitResult, null, 2) + '\n');
    stream.write(`git file ${gitfile}: \n`);

    await shell.readFile(path.join('repo', gitfile), { stream });

    await sleep(2 * 1000);

    stream.write(`\n- example-git deploy started\n`);

    stream.write(`\n- deployment info\n`);
    stream.write('project: ' + this.project.getAccessName() + '\n');
    stream.write('stage: ' + this.stage.getAccessName() + '\n');
    stream.write('deployment: ' + this.deployment.getAccessName() + '\n');
    stream.write('session: ' + this.session.id + '\n');
    stream.write('app: ' + this.app.getAccessName() + '\n');
    stream.write('plugin: ' + this.plugin?.name + '\n');
    stream.write('plugin options: ' + JSON.stringify(this.plugin?.options) + '\n');
    stream.write('request: ' + JSON.stringify(request, null, 2) + '\n');

    await sleep(2 * 1000);

    stream.write(`\n- env resolve test\n`);
    const env = this.resolveEnv(options.env);

    await sleep(2 * 1000);

    stream.write(`\n- load & save test\n`);
    stream.write('previous saved text' + (await this.store.load('text')) + '\n');
    stream.write('previous saved object' + JSON.stringify(await this.store.loadObject('object'), null, 2) + '\n');
    stream.write('previous saved text' + (await this.store.load('text')) + '\n');
    await this.store.save('text', 'hello ale');
    await this.store.save('object', {
      key: 'value'
    });

    stream.write('text saved: ' + (await this.store.load('text')) + '\n');
    stream.write('object saved: ' + (await this.store.load('object')) + '\n');

    await sleep(2 * 1000);

    stream.write(`\n- shell test\n`);

    const result = await shell.exec(`ls -al`, { stream });
    stream.write('ls -al result: ' + result + '\n');

    stream.write(`\n- file write/read test\n`);
    await shell.writeFile(`test.txt`, 'file text');
    stream.write('read file test.txt: ' + (await shell.readFile(`test.txt`)) + '\n');

    stream.write(`\n- deployment finished\n`);

    await this.store.save('status', SERVICE_STATUS.created);
  }

  public async undeploy(): Promise<void> {
    const stream = await this.getStream();
    stream.write(`undeploy called`);

    await this.store.save('status', SERVICE_STATUS.stopped);
    await this.store.remove('entrypoint');
  }

  public async start(): Promise<void> {
    const stream = await this.getStream();
    stream.write(`start called`);

    await this.store.save('status', SERVICE_STATUS.running);
    await this.store.save('entrypoint', 'https://ale.run');
  }

  public async stop(): Promise<void> {
    const stream = await this.getStream();
    stream.write(`stop called`);

    await this.store.save('status', SERVICE_STATUS.stopped);
  }

  public async destroy(): Promise<void> {
    const stream = await this.getStream();
    stream.write(`destroy called`);

    await this.store.remove('status');
    await this.store.remove('entrypoint');
  }

  public async list<T>(type?: string): Promise<T[]> {
    if (type === 'service') {
      const status = await this.store.load('status');
      return [
        {
          deployment: this.deployment.name,
          name: 'workload',
          replicas: status === 'running' ? 1 : 0,
          ready: status === 'running' ? 1 : 0,
          available: status === 'running' ? 1 : 0,
          unavailable: status === 'running' ? 0 : 1,
          instances: [
            {
              id: 'id',
              name: 'instance',
              status,
              restarts: 0,
              started: new Date(),
              ip: '192.168.0.1',
              limits: {
                cpu: 1,
                memory: 1
              },
              usage: {
                cpu: 0,
                memory: 0
              },
              expose: [3000],
              description: 'description'
            }
          ],
          description: 'description'
        } as T
      ];
    } else if (type === 'route') {
      const entrypoint = await this.store.load('entrypoint');
      return entrypoint
        ? [
            {
              deployment: this.deployment.name,
              name: 'ingress',
              type: 'http',
              entrypoints: [entrypoint],
              service: 'host',
              servicePort: 3000,
              status: 'bound',
              description: 'description'
            } as T
          ]
        : null;
    } else if (type === 'volume') {
      return [
        {
          deployment: this.deployment.name,
          name: 'volume',
          size: 1000,
          mode: 'rwx',
          status: 'bound',
          description: 'description'
        } as T
      ];
    }
    return null;
  }

  public async getStat(): Promise<DeploymentStat> {
    const status = await this.store.load('status');
    const entrypoint = await this.store.load('entrypoint');

    return {
      status: SERVICE_STATUS[status],
      exposes: [
        {
          hostname: 'host',
          port: 3000,
          protocol: 'http'
        }
      ],
      entrypoints: [
        {
          link: entrypoint,
          type: 'http'
        }
      ]
    };
  }

  public async logs(id?: string, options?: AnyObject): Promise<Readable> {
    const stream = new PassThrough();

    setTimeout(async () => {
      for (let i = 0; i < 20; i++) {
        if (stream.destroyed) break;
        stream.write(`runtime logs (${id || 'default'}) ${i + 1}, destroyed=${stream.destroyed}\n`);
        await sleep(500);
      }
      stream.end();
    }, 500);

    return stream;
  }
}
