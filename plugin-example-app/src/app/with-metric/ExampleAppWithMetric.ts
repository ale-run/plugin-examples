import { AppController, SERVICE_STATUS, DeploymentStat, Logger, MetricItem, MetricData, MetricFilter, AnyObject, sleep } from '@ale-run/runtime';
import { Readable, PassThrough } from 'stream';

const logger = Logger.getLogger('app:example-metric');

export default class ExampleAppWithMetric extends AppController {
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

  public async getMetricItems(): Promise<MetricItem[]> {
    logger.debug('getMetricItems', this.deployment.name);

    const cluster = await this.getCluster();
    logger.debug('cluster.env', cluster.env);

    return [
      {
        name: 'cpu',
        title: 'CPU',
        unit: '%'
      },
      {
        name: 'memory',
        title: 'Memory',
        unit: 'MB'
      },
      {
        name: 'inbound',
        title: 'Network In',
        unit: 'MB',
        options: {
          mode: 'sum'
        }
      },
      {
        name: 'outbound',
        title: 'Network Out',
        unit: 'MB',
        options: {
          mode: 'sum'
        }
      }
    ];
  }

  public async getMetric(name: string, options: MetricFilter): Promise<MetricData> {
    logger.debug('getMetric', name, options);

    const deployment = this.deployment;
    const c = new Date(options.from);
    const interval = options.interval;
    const dates = [],
      percents = [],
      values = [];
    while (c <= options.to) {
      dates.push(new Date(c));
      percents.push(Math.floor(Math.random() * 100));
      values.push(Math.floor(Math.random() * 4 * 1000));

      const intervalNumber = +interval.substring(0, interval.length - 1) || 1;
      if (interval.endsWith('d')) {
        c.setDate(c.getDate() + intervalNumber);
      } else if (interval.endsWith('h')) {
        c.setHours(c.getHours() + intervalNumber);
      } else if (interval.endsWith('m')) {
        c.setMinutes(c.getMinutes() + intervalNumber);
      } else {
        throw new Error(`unsupported interval: ${options.interval}`);
      }
    }

    if (name === 'cpu') {
      return {
        total: dates.length,
        dates,
        series: [
          {
            name: deployment.name,
            values: percents
          }
        ]
      };
    } else {
      return {
        total: dates.length,
        dates,
        series: [
          {
            name: deployment.name,
            values: values
          }
        ]
      };
    }
  }
}
