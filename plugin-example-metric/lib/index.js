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
const runtime_1 = require("@ale-run/runtime");
const metric_1 = require("./metric");
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const logger = runtime_1.Logger.getLogger('plugin:example');
class ExamplePlugin extends runtime_1.Plugin {
    activate() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(ansi_colors_1.default.blueBright(`plugin ${this.name} is activate`), this.options);
            const { key } = this.options;
            console.log('key', key);
            // add api route
            const api = this.get('api-server');
            if (!api)
                throw new Error(`api-server is required`);
            const router = api.routers.body.get(this.name);
            router.post('/example/:space', (req, res) => __awaiter(this, void 0, void 0, function* () {
                res.send({
                    key
                });
            }));
            // add metric driver
            const clustermgr = this.context.getClusterManager();
            clustermgr.addMetricDriver('example', metric_1.ExampleMetricDriver);
        });
    }
    deactivate() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            logger.info(ansi_colors_1.default.red(`plugin ${this.name} will be deactivate`));
            const server = this.get('api-server');
            (_b = (_a = server === null || server === void 0 ? void 0 : server.routers) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.remove(this.name);
            // remove metric driver
            const clustermgr = this.context.getClusterManager();
            clustermgr.removeMetricDriver('example');
        });
    }
}
exports.default = ExamplePlugin;
//# sourceMappingURL=index.js.map