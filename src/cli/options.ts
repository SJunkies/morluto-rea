import { z } from "incur";

import {
  executableFormatHintSchema,
  type ExecutableFormatHint,
} from "../domain/dosCom.js";
import type { BinaryArchitecture } from "../domain/binaryTargetTypes.js";
import {
  binaryArchitectureSchema,
  rawBinaryEntryPointSchema,
  rawBinaryBaseAddressSchema,
} from "../domain/rawBinary.js";
import { analysisProviderSelectorSchema } from "../contracts/providerSelection.js";
import type { AnalysisProviderSelector } from "../contracts/providerSelection.js";
import type { Logger } from "pino";

/** Parse decimal integer tokens before Number coercion can erase their syntax. */
export const cliIntegerArgument = (min: number) =>
  z
    .string()
    .regex(/^[0-9]+$/u, "Expected a decimal integer")
    .pipe(z.coerce.number<string>().safe().min(min));

export const providerSelectionOption = analysisProviderSelectorSchema
  .optional()
  .describe(
    "Bind deep analysis to a provider ID or use deterministic auto selection",
  );

/** Optional path to the local analysis snapshot loaded or updated by a command. */
export const snapshotSelectionOption = z
  .string()
  .min(1)
  .optional()
  .describe("Load and update a local analysis snapshot");

/** Explicit interpretation for headerless native executable formats. */
export const formatSelectionOption = executableFormatHintSchema
  .optional()
  .describe(
    "Explicit interpretation: dos-com or raw-binary (headerless), or gamecube-dol (GameCube/Wii DOL, never auto-detected); omission preserves header-based detection",
  );

export const architectureSelectionOption = binaryArchitectureSchema
  .optional()
  .describe(
    "Caller-supplied CPU family; required with --target-format raw-binary, must be omitted with gamecube-dol",
  );

export const entryPointSelectionOption = rawBinaryEntryPointSchema
  .optional()
  .describe(
    "Caller-supplied code entry address (0xhex); required with --target-format raw-binary, optional with gamecube-dol (must equal the DOL header entry)",
  );

export const baseAddressSelectionOption = rawBinaryBaseAddressSchema
  .optional()
  .describe(
    "Load address of raw file offset 0 (0xhex); defaults to --entry-point",
  );

/** Shared CLI flags that bind a native target interpretation. */
export const nativeOpenOptionFields = {
  "target-format": formatSelectionOption,
  architecture: architectureSelectionOption,
  "entry-point": entryPointSelectionOption,
  "base-address": baseAddressSelectionOption,
  provider: providerSelectionOption,
};

/** Native CLI flags consumed when opening a target for one-shot analysis. */
export interface NativeOpenCliFlags {
  readonly snapshot?: string | undefined;
  readonly provider?: AnalysisProviderSelector | undefined;
  readonly "target-format"?: ExecutableFormatHint | undefined;
  readonly architecture?: BinaryArchitecture | undefined;
  readonly "entry-point"?: string | undefined;
  readonly "base-address"?: string | undefined;
}

export const directAnalysisOptions = (
  logger: Logger,
  snapshotPath: string | undefined,
  providerId: AnalysisProviderSelector | undefined,
  formatHint?: ExecutableFormatHint,
  architecture?: BinaryArchitecture,
  entryPoint?: string,
  baseAddress?: string,
) => ({
  logger,
  snapshotPath,
  ...(formatHint === undefined ? {} : { formatHint }),
  ...(architecture === undefined ? {} : { architecture }),
  ...(entryPoint === undefined ? {} : { entryPoint }),
  ...(baseAddress === undefined ? {} : { baseAddress }),
  ...(providerId === undefined ? {} : { providerId }),
});


/** Map native CLI flags onto the shared one-shot analysis options. */
export const directAnalysisOptionsFromCli = (
  logger: Logger,
  options: NativeOpenCliFlags,
) =>
  directAnalysisOptions(
    logger,
    options.snapshot,
    options.provider,
    options["target-format"],
    options.architecture,
    options["entry-point"],
    options["base-address"],
  );
