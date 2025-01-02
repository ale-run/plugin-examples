import { ClusterMetricDriver, IDeployment, MetricItem, MetricFilter, MetricData } from '@ale-run/runtime';
export declare class ExampleMetricDriver extends ClusterMetricDriver {
    getMetricItems(deployment: IDeployment): Promise<MetricItem[]>;
    getMetric(deployment: IDeployment, name: string, options: MetricFilter): Promise<MetricData>;
}
