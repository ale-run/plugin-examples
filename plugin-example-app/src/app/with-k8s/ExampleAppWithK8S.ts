import { ClusterAppController, Logger } from '@ale-run/runtime';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const logger = Logger.getLogger('example:k8s');

export default class ExampleAppWithK8S extends ClusterAppController {
  public async deploy(): Promise<void> {
    logger.info('deploy started', this.deployment.getAccessName());

    const request = this.request;
    const options = request.options || {};
    const tag = options.tag || 'latest';

    const stream = await this.getStream();
    stream.write(`tag: ${tag}\n`);

    // load ogirinal yaml & replace tag
    const text = fs.readFileSync(path.join(__dirname, 'descriptions', 'httpbin.yaml')).toString().split('${tag}').join(tag);
    const descriptions = yaml.parseAllDocuments(text)?.map((doc) => doc.toJSON());

    stream.write(`descriptions:\n\n${descriptions?.map((o) => yaml.stringify(o)).join('---\n')}\n`);

    const applied = await this.apply(descriptions);

    // save applied descriptions
    await this.store.save('applied', applied?.map((o) => yaml.stringify(o)).join('---\n'));
  }
}
