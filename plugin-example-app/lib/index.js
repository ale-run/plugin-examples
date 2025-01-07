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
const path_1 = __importDefault(require("path"));
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const logger = runtime_1.Logger.getLogger('plugin:example-app');
class ExampleAppPlugin extends runtime_1.Plugin {
    activate() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(ansi_colors_1.default.blueBright(`plugin ${this.name} is activate`), this.options);
            const catalog = yield this.context.getCatalog();
            // regist app & preset
            const dirnames = ['example', 'example-git', 'example-metric'];
            for (const dirname of dirnames) {
                const appdir = path_1.default.join(__dirname, 'app', dirname);
                yield catalog.regist(appdir);
                yield catalog.registPreset(appdir);
            }
        });
    }
}
exports.default = ExampleAppPlugin;
//# sourceMappingURL=index.js.map