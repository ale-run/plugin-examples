import { AppController, DeployedObject, SERVICE_STATUS, DeploymentStat, Logger, MetricItem, MetricData, MetricFilter, AnyObject, DeployedWorkload, DeployedIngress, DeployedVolume, DeployedDomain, DeployedExpose, sleep } from '@ale-run/runtime';
import { Readable, PassThrough } from 'stream';

const logger = Logger.getLogger('app:example');

export class AbstractApp extends AppController {
  public async deploy(): Promise<void> {
    logger.debug('AbstractApp.deploy', this.deployment.name);

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

    await this.store.save('status', SERVICE_STATUS.undeployed);
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

  public async list(kind?: string): Promise<DeployedObject[]> {
    const status = await this.store.load('status');
    const entrypoint = await this.store.load('entrypoint');
    const resources: DeployedObject[] = ((await this.store.loadObject('resources')) as DeployedObject[]) || [];

    return [
      {
        kind: 'workload',
        name: `service-1`,
        replicas: status === 'running' ? 1 : 0,
        ready: status === 'running' ? 1 : 0,
        instances: [
          {
            kind: 'pod',
            id: 'id',
            name: 'instance',
            status,
            restarts: 0,
            started: new Date(),
            ip: '192.168.0.1',
            limits: {
              cpu: 1,
              memory: 512 * 1024 * 1024
            },
            usage: {
              cpu: 0.3,
              memory: 256 * 1024 * 1024
            },
            expose: [3000],
            description: 'description'
          }
        ],
        description: 'description'
      } as DeployedWorkload,
      entrypoint &&
        ({
          kind: 'ingress',
          name: `ingress-1`,
          type: 'http',
          entrypoints: [entrypoint],
          service: 'host',
          servicePort: 3000,
          status: 'bound',
          description: 'description'
        } as DeployedIngress),
      {
        kind: 'domain',
        name: 'domain-1',
        entrypoints: ['https://domain.com'],
        service: 'host',
        servicePort: 3000,
        status: 'bound',
        description: 'description'
      } as DeployedDomain,
      {
        kind: 'domain',
        name: 'domain-2',
        entrypoints: ['https://api.domain.com'],
        service: 'host',
        servicePort: 9000,
        status: 'unbound',
        description: 'description'
      } as DeployedDomain,
      {
        kind: 'expose',
        name: 'expose-1',
        hostname: 'host',
        port: 3306,
        protocol: 'tcp',
        description: 'description'
      } as DeployedExpose,
      {
        kind: 'volume',
        name: 'volume-1',
        size: 1000,
        mode: 'rwx',
        status: 'bound',
        description: 'description'
      } as DeployedVolume,
      {
        kind: 'custom',
        name: `custom-2`,
        displayName: 'Internal Object',
        timestamp: new Date(),
        description: 'description'
      },
      {
        kind: 'custom',
        name: `custom-1`,
        displayName: 'Custom Resource',
        status: 'warning',
        removable: true,
        description: 'description'
      },
      ...resources
    ].filter((o) => {
      if (!o) return false;
      if (kind && kind !== o.kind) return false;
      return true;
    });
  }

  public async get(kind: string, name: string): Promise<DeployedObject> {
    const list = await this.list();
    return list.find((o) => o.kind === kind && o.name === name);
  }

  public async add(resource: DeployedObject): Promise<void> {
    const resources: DeployedObject[] = ((await this.store.loadObject('resources')) as DeployedObject[]) || [];
    if (resources?.find((o) => o.kind === resource.kind && o.name === resource.name)) throw new Error(`already exist resource: ${resource.kind}/${resource.name}`);

    resources.push(resource);
    await this.store.save('resources', resources);
  }

  public async remove(kind: string, name: string): Promise<void> {
    const resources: DeployedObject[] = ((await this.store.loadObject('resources')) as DeployedObject[]) || [];
    const resource = resources?.find((o) => o.kind === kind && o.name === name);
    if (!resource) throw new Error(`resource not found: ${kind}/${name}`);

    resources.splice(resources.indexOf(resource), 1);
    await this.store.save('resources', resources);
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
    logger.info('getMetricItems', this.deployment.name);

    const cluster = await this.getCluster();
    logger.info('cluster.env', cluster.env);

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
    logger.info('getMetric', name, options);

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
