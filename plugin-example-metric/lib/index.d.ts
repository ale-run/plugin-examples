import { Plugin } from '@ale-run/runtime';
export default class ExamplePlugin extends Plugin {
    activate(): Promise<void>;
    deactivate(): Promise<void>;
}
