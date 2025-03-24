import { ClusterMetricDriver, IDeployment, MetricItem, MetricFilter, MetricData, Logger } from '@ale-run/runtime';
import chalk from 'ansi-colors';

const logger = Logger.getLogger('metric:example');

export class ExampleMetricDriver extends ClusterMetricDriver {
  constructor() {
    super();
    logger.info(chalk.blueBright('example metric driver initialized'));
  }

  public async getMetricItems(deployment: IDeployment): Promise<MetricItem[]> {
    logger.info('getMetricItems', deployment.name, this.cluster.env, deployment.stat.objects);

    return [
      {
        name: 'cpu',
        title: 'vCPU',
        unit: '%'
      },
      {
        name: 'memory',
        title: 'Memory',
        unit: 'MB'
      },
      {
        name: 'cpu-limit',
        title: 'vCPU Limit',
        unit: 'cputime'
      },
      {
        name: 'memory-limit',
        title: 'Memory Limit',
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
      },
      {
        name: 'http',
        title: 'HTTP',
        unit: '',
        summary: {
          value: 'request',
          cols: [
            { name: 'path', displayName: 'Path' },
            { name: 'request', displayName: 'Request', size: 140 },
            { name: 'percent', displayName: '%', size: 80, align: 'right' }
          ]
        },
        options: {
          cols: 2,
          mode: 'sum'
        }
      }
    ];
  }

  public async getMetric(deployment: IDeployment, name: string, options: MetricFilter): Promise<MetricData> {
    logger.info('getMetric', deployment.name, name, options, this.cluster.env);

    const c = new Date(options.from);
    const interval = options.interval;
    const dates = [],
      percents = [],
      values = [],
      values1 = [],
      values2 = [],
      values3 = [],
      values4 = [],
      limits = [];
    while (c <= options.to) {
      dates.push(new Date(c));
      percents.push(Math.floor(Math.random() * 100));
      values.push(Math.floor(Math.random() * 4 * 1000));
      values1.push(Math.floor(Math.random() * 4 * 3000));
      values2.push(Math.floor(Math.random() * 4 * 1000));
      values3.push(Math.floor(Math.random() * 4 * 100));
      values4.push(Math.floor(Math.random() * 4 * 10));

      if (c.getDate() < 5) limits.push(1000);
      else if (c.getDate() < 15) limits.push(2000);
      else limits.push(4000);

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
    } else if (name.includes('-limit')) {
      return {
        total: dates.length,
        dates,
        series: [
          {
            name: deployment.name,
            values: limits
          }
        ]
      };
    } else if (name === 'http') {
      return {
        total: dates.length,
        dates,
        series: [
          {
            name: '20x',
            values: values1
          },
          {
            name: '30x',
            options: { color: 'green' },
            values: values2
          },
          {
            name: '500',
            options: { color: 'red' },
            values: values3
          },
          {
            name: '404',
            options: { color: 'yellow' },
            values: values4
          }
        ],
        summary: [
          { path: '/', request: 1200, percent: 9 },
          { path: '/docs', request: 10230, percent: 90 },
          { path: '/page', request: 3, percent: 0 },
          { path: '/pricing', request: 342, percent: 1 }
        ]
      };
    } else {
      return {
        total: dates.length,
        dates,
        series: [
          {
            name: deployment.name,
            values: values1
          }
        ]
      };
    }
  }
}
