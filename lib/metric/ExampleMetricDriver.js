"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleMetricDriver = void 0;
const runtime_1 = require("@ale-run/runtime");
class ExampleMetricDriver extends runtime_1.ClusterMetricDriver {
    getMetricItems(deployment) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log('getMetricItems', deployment.name, this.cluster.env);
            console.log('objects', (_a = deployment.stat) === null || _a === void 0 ? void 0 : _a.objects);
            return [
                {
                    name: 'cpu',
                    title: 'vCPU',
                    unit: 'm'
                }
            ];
        });
    }
    getMetric(deployment, name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const k8sDeployments = (_b = (_a = deployment.stat) === null || _a === void 0 ? void 0 : _a.objects) === null || _b === void 0 ? void 0 : _b.map((o) => (o.kind === 'Deployment' ? o.name : null)).filter((v) => v);
            console.log('getMetric', deployment.name, name, options, this.cluster.env, k8sDeployments);
            const endpoint = this.cluster.env['METRIC_SERVER_ENDPOINT'];
            const token = this.cluster.env['METRIC_SERVER_TOKEN'];
            const c = new Date(options.from);
            const dates = [], values = [];
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
                series: k8sDeployments === null || k8sDeployments === void 0 ? void 0 : k8sDeployments.map((k8sDeployment) => {
                    return {
                        name: k8sDeployment,
                        values
                    };
                })
            };
        });
    }
}
exports.ExampleMetricDriver = ExampleMetricDriver;
//# sourceMappingURL=ExampleMetricDriver.js.map