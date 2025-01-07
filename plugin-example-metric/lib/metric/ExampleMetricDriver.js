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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleMetricDriver = void 0;
const runtime_1 = require("@ale-run/runtime");
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const logger = runtime_1.Logger.getLogger('metric:example');
class ExampleMetricDriver extends runtime_1.ClusterMetricDriver {
    constructor() {
        super();
        logger.info(ansi_colors_1.default.blueBright('example metric driver initialized'));
    }
    getMetricItems(deployment) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('getMetricItems', deployment.name, this.cluster.env);
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
        });
    }
    getMetric(deployment, name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('getMetric', deployment.name, name, options, this.cluster.env);
            const c = new Date(options.from);
            const dates = [], percents = [], values = [], values1 = [], values2 = [], values3 = [], values4 = [], limits = [];
            while (c <= options.to) {
                dates.push(new Date(c));
                percents.push(Math.floor(Math.random() * 100));
                values.push(Math.floor(Math.random() * 4 * 1000));
                values1.push(Math.floor(Math.random() * 4 * 3000));
                values2.push(Math.floor(Math.random() * 4 * 1000));
                values3.push(Math.floor(Math.random() * 4 * 100));
                values4.push(Math.floor(Math.random() * 4 * 10));
                if (c.getDate() < 5)
                    limits.push(1000);
                else if (c.getDate() < 15)
                    limits.push(2000);
                else
                    limits.push(4000);
                c.setDate(c.getDate() + 1);
            }
            if (name === 'cpu') {
                return {
                    total: dates.length,
                    offset: options.offset,
                    limit: options.limit,
                    dates,
                    series: [
                        {
                            name: deployment.name,
                            values: percents
                        }
                    ]
                };
            }
            else if (name.includes('-limit')) {
                return {
                    total: dates.length,
                    offset: options.offset,
                    limit: options.limit,
                    dates,
                    series: [
                        {
                            name: deployment.name,
                            values: limits
                        }
                    ]
                };
            }
            else if (name === 'http') {
                return {
                    total: dates.length,
                    offset: options.offset,
                    limit: options.limit,
                    dates,
                    series: [
                        {
                            name: '20x',
                            values: values1
                        },
                        {
                            name: '30x',
                            values: values2
                        },
                        {
                            name: '500',
                            // options: { color: 'red' },
                            values: values3
                        },
                        {
                            name: '404',
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
            }
            else {
                return {
                    total: dates.length,
                    offset: options.offset,
                    limit: options.limit,
                    dates,
                    series: [
                        {
                            name: deployment.name,
                            values: values1
                        }
                    ]
                };
            }
        });
    }
}
exports.ExampleMetricDriver = ExampleMetricDriver;
//# sourceMappingURL=ExampleMetricDriver.js.map