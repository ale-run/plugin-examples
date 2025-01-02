import { ClusterMetricDriver, IDeployment, MetricItem, MetricFilter, MetricData } from '@ale-run/runtime';

export class ExampleMetricDriver extends ClusterMetricDriver {
  public async getMetricItems(deployment: IDeployment): Promise<MetricItem[]> {
    console.log('getMetricItems', deployment.name, this.cluster.env);
    console.log('objects', deployment.stat?.objects);

    return [
      {
        name: 'cpu',
        title: 'vCPU',
        unit: 'm'
      }
    ];
  }

  public async getMetric(deployment: IDeployment, name: string, options: MetricFilter): Promise<MetricData> {
    const k8sDeployments = deployment.stat?.objects?.map((o) => (o.kind === 'Deployment' ? o.name : null)).filter((v) => v);
    console.log('getMetric', deployment.name, name, options, this.cluster.env, k8sDeployments);
    const endpoint = this.cluster.env['METRIC_SERVER_ENDPOINT'];
    const token = this.cluster.env['METRIC_SERVER_TOKEN'];

    const c = new Date(options.from);
    const dates = [],
      values = [];
    while (c <= options.to) {
      dates.push(new Date(c));
      values.push(Math.floor(Math.random() * 5 * 1000));
      c.setDate(c.getDate() + 1);
    }

    return {
      total: dates.length,
      offset: options.offset,
      limit: options.limit,
      dates,
      series: k8sDeployments?.map((k8sDeployment) => {
        return {
          name: k8sDeployment,
          values
        };
      })
    };
  }
}
