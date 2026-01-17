/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents from "../agents.js";
import type * as appRecords from "../appRecords.js";
import type * as appSchemas from "../appSchemas.js";
import type * as applyResult from "../applyResult.js";
import type * as internalMutations from "../internalMutations.js";
import type * as messages from "../messages.js";
import type * as projectFiles from "../projectFiles.js";
import type * as projects from "../projects.js";
import type * as retry from "../retry.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  appRecords: typeof appRecords;
  appSchemas: typeof appSchemas;
  applyResult: typeof applyResult;
  internalMutations: typeof internalMutations;
  messages: typeof messages;
  projectFiles: typeof projectFiles;
  projects: typeof projects;
  retry: typeof retry;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
