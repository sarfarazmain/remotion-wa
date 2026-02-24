/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(65); // Intermediary JPEG quality — final h264 CRF 18 re-encodes anyway
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig(enableTailwind);
Config.setOffthreadVideoCacheSizeInBytes(300 * 1024 * 1024); // 300MB — safe for 8GB Mac M3
