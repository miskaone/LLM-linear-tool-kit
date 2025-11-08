"use strict";
/**
 * Linear Toolkit - Main entry point
 * Exports the public API for using the Linear toolkit
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = exports.initializeCache = exports.getCache = exports.configureLogger = exports.getLogger = exports.getConfigSchema = exports.validateConfig = exports.createConfig = exports.loadConfig = exports.GraphQLClient = exports.SessionManager = exports.LinearAgentClient = void 0;
exports.initializeLinearToolkit = initializeLinearToolkit;
// Core client
var LinearAgentClient_1 = require("@core/client/LinearAgentClient");
Object.defineProperty(exports, "LinearAgentClient", { enumerable: true, get: function () { return LinearAgentClient_1.LinearAgentClient; } });
var SessionManager_1 = require("@core/client/SessionManager");
Object.defineProperty(exports, "SessionManager", { enumerable: true, get: function () { return SessionManager_1.SessionManager; } });
var GraphQLClient_1 = require("@core/client/GraphQLClient");
Object.defineProperty(exports, "GraphQLClient", { enumerable: true, get: function () { return GraphQLClient_1.GraphQLClient; } });
// Types
__exportStar(require("@types/linear.types"), exports);
// Configuration & Utilities
var config_1 = require("@utils/config");
Object.defineProperty(exports, "loadConfig", { enumerable: true, get: function () { return config_1.loadConfig; } });
Object.defineProperty(exports, "createConfig", { enumerable: true, get: function () { return config_1.createConfig; } });
Object.defineProperty(exports, "validateConfig", { enumerable: true, get: function () { return config_1.validateConfig; } });
Object.defineProperty(exports, "getConfigSchema", { enumerable: true, get: function () { return config_1.getConfigSchema; } });
var logger_1 = require("@utils/logger");
Object.defineProperty(exports, "getLogger", { enumerable: true, get: function () { return logger_1.getLogger; } });
Object.defineProperty(exports, "configureLogger", { enumerable: true, get: function () { return logger_1.configureLogger; } });
var cache_1 = require("@utils/cache");
Object.defineProperty(exports, "getCache", { enumerable: true, get: function () { return cache_1.getCache; } });
Object.defineProperty(exports, "initializeCache", { enumerable: true, get: function () { return cache_1.initializeCache; } });
Object.defineProperty(exports, "CacheManager", { enumerable: true, get: function () { return cache_1.CacheManager; } });
/**
 * Initialize the Linear Toolkit with configuration
 * Convenient function for quick setup
 */
async function initializeLinearToolkit(config) {
    const { LinearAgentClient } = await Promise.resolve().then(() => __importStar(require('@core/client/LinearAgentClient')));
    return LinearAgentClient.create(config);
}
//# sourceMappingURL=index.js.map