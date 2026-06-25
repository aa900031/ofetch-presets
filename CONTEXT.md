# ofetch Presets

This context defines the domain language for composing and publishing reusable option presets for `ofetch`. It exists to keep the meaning of presets, their outputs, and their relationships precise across the runtime API and the preset authoring kit.

## Language

**Preset**:
A named composition unit that can depend on other presets and ultimately resolves to plain `FetchOptions`.
_Avoid_: options factory, config fragment, middleware

**Composition Source**:
An ordered input to option resolution. A composition source is either a preset or a plain `FetchOptions` value that participates in the same resolution pass.
_Avoid_: layer, config fragment, partial

**Option Resolution**:
The process that expands ordered composition sources into one plain `FetchOptions` value using preset-aware composition rules.
_Avoid_: merge, flatten, normalization

**Preset Dependency**:
A preset that is included by another preset through an ordered dependency array and is resolved before the including preset's own options.
_Avoid_: parent preset, inherited preset, upstream config

**Preset Factory**:
A callable that produces a preset, optionally from author-supplied parameters.
_Avoid_: preset, resolver, builder

**Preset Name**:
A human-readable identifier used to diagnose, trace, and explain preset resolution.
_Avoid_: namespace, key, identifier

**Circular Preset Dependency**:
An invalid dependency path in which resolving a preset requires resolving itself through one or more preset dependencies.
_Avoid_: recursive preset, dependency loop

**Repeated Preset Use**:
The valid act of including the same preset more than once within one option resolution pass, with each occurrence resolved in order.
_Avoid_: deduplicated preset, collapsed preset

**Synchronous Option Resolution**:
An option resolution model in which composition sources, preset dependencies, and preset factories all resolve without asynchronous evaluation.
_Avoid_: lazy resolution, async resolution

**Monotonic Composition**:
A composition model in which later sources can add or override values but do not generically remove values introduced earlier in the same resolution pass.
_Avoid_: subtraction, unset, delete semantics

**Preset Options**:
The plain `FetchOptions` contribution owned by a preset itself, resolved after that preset's dependencies.
_Avoid_: inline dependency, preset payload, config fragment

**Composite Preset**:
A preset whose primary role is to compose other presets, optionally without contributing its own preset options.
_Avoid_: bundle preset, wrapper preset, group preset

**Preset Kit**:
The authoring surface that standardizes how preset factories declare names, dependencies, and preset options.
_Avoid_: runtime API, resolver, plugin system

**Runtime Surface**:
The consumer-facing surface used to resolve composition sources into plain `FetchOptions` for `ofetch`.
_Avoid_: authoring API, kit

**Authoring Surface**:
The preset-author-facing surface used to define and publish preset factories.
_Avoid_: runtime API, consumer API

**Resolution-Only Runtime Surface**:
A runtime surface limited to resolving composition sources into plain `FetchOptions`, without wrapping `ofetch` itself in higher-level fetch helpers.
_Avoid_: fetch wrapper, client factory, façade API

**Normalized Headers**:
The canonical `Headers` representation produced by option resolution regardless of how header input was originally provided.
_Avoid_: raw headers, header fragment, header init

**Query Options**:
The canonical query-parameter contribution in option resolution, including values accepted through the deprecated `params` alias and normalized into `query`.
_Avoid_: params, search params, query fragment

**Ordered Hook Execution**:
A hook execution model in which resolved hooks run in the same order they were introduced during option resolution.
_Avoid_: reverse wrapping, LIFO hooks, nested middleware

**Resolution Pass**:
One complete evaluation of ordered composition sources into a single plain `FetchOptions` value, before any further option merging performed by `ofetch` itself.
_Avoid_: global merge, request lifecycle, fetch pipeline

**Preset Package**:
A published package whose primary public value is one or more preset factories intended for composition by consumers.
_Avoid_: options bundle, config package, fetch wrapper

**Host-Owned Preset Runtime**:
A dependency model in which the consuming application owns the `ofetch-presets` runtime version and preset packages integrate with it through peer dependencies instead of bundling their own copy.
_Avoid_: bundled preset runtime, private preset resolver

**Structural Preset**:
A preset recognized from a plain object only when it includes `name` and at least one of `options` or `presets`, rather than by a runtime brand marker.
_Avoid_: branded preset, tagged preset

**Reserved Preset Fields**:
The top-level fields `name`, `presets`, and `options`, used to describe structural preset shape and content during option resolution.
_Avoid_: user extension fields, custom option keys

**Material Preset**:
A structural preset that contributes preset options, preset dependencies, or both, and therefore participates meaningfully in option resolution.
_Avoid_: empty contribution, inert preset

**Fail-Fast Preset Validation**:
A validation policy in which recognized structural presets are validated as presets immediately and rejected on invalid shape instead of being reinterpreted as plain fetch options.
_Avoid_: silent fallback, permissive reinterpretation

**Preset Resolution Trace**:
The diagnostic path and context used to explain how option resolution reached a preset-related success or failure.
_Avoid_: stack guess, generic error context

**Immutable Resolution**:
An option resolution guarantee that never mutates composition sources and always produces fresh resolved output values.
_Avoid_: in-place merge, source mutation, shared resolved state

**Detached Headers**:
Normalized headers whose resolved `Headers` instance does not share mutable state with any header input provided by composition sources.
_Avoid_: shared headers, aliased headers

**Shallow Option Merge**:
An object-field merge rule that combines only the top-level keys of an option value, with later values replacing earlier ones per key.
_Avoid_: deep merge, recursive merge

**Normalized Hook Arrays**:
The canonical resolved hook representation in which each hook phase is expressed as an ordered array of hook functions.
_Avoid_: single-hook union, raw hook shape

**Augmented Fetch Options**:
Consumer-defined `FetchOptions` fields introduced through `ofetch` type augmentation and preserved by option resolution as valid option contributions.
_Avoid_: unknown option noise, unsupported custom fields

**Opaque Augmented Values**:
Augmented fetch option values whose composition semantics are not interpreted beyond whole-value replacement when later sources provide the same key.
_Avoid_: guessed merge semantics, inferred deep merge

**Non-Unique Preset Names**:
A naming model in which preset names remain diagnostic labels and are not required to be globally unique across a resolution pass or across preset packages.
_Avoid_: registry name, unique key, canonical id

**Positional Resolution Trace**:
A preset resolution trace that supplements preset names with source or dependency positions so repeated or non-unique presets can still be distinguished.
_Avoid_: name-only trace, ambiguous trace

**Factory-Only Authoring**:
An authoring rule in which presets are declared through preset factories only, even when no author-supplied parameters are needed.
_Avoid_: direct preset object authoring, mixed authoring forms

**Host-Owned ofetch Runtime**:
A dependency model in which the consuming application owns the `ofetch` runtime version and preset packages integrate with it through peer dependencies instead of bundling their own copy.
_Avoid_: bundled ofetch runtime, private fetch runtime

**Whole-Value Array Replacement**:
An array composition rule in which non-hook array options are replaced entirely by later sources instead of being concatenated or deduplicated.
_Avoid_: array merge, array concat, inferred dedupe

**Compatible ofetch Core Surface**:
The shared `ofetch` option, hook, and header semantics that inform the preset architecture even when official support is declared more narrowly.
_Avoid_: branch-specific extension, version-locked surface

**V1-First Support Contract**:
A public compatibility contract that officially targets `ofetch` v1 for peer dependencies, documentation, and test coverage even if the architecture stays close to newer shared core semantics.
_Avoid_: implicit v2 promise, undocumented alpha support

**Resolved Options**:
The canonical plain `FetchOptions` value produced by a resolution pass after preset expansion, normalization, and field-specific composition rules have been applied.
_Avoid_: raw options, unresolved options, source options

**Ignored Extra Preset Fields**:
Top-level fields on a structural preset other than `name`, `presets`, and `options` that do not participate in option resolution and are ignored by the runtime.
_Avoid_: runtime preset metadata, active extra preset fields

**No Top-Level Option Lifting**:
Extra top-level fields on a structural preset are never promoted into preset options and remain ignored unless explicitly nested under `options`.
_Avoid_: implicit option lifting, auto-normalized top-level options

**Identity-Style Preset Kit**:
A preset kit design in which `definePreset` preserves the factory contract and type inference without introducing a distinct branded runtime preset representation.
_Avoid_: branded kit runtime, wrapped preset instance

**Flexible Factory Signatures**:
An authoring model in which preset factories are not restricted to a specific parameter arity or parameter shape by the preset kit.
_Avoid_: fixed factory params object, constrained factory arity

**Minimal Public Surface**:
A public API policy that exposes only `resolveOptions` and runtime types from the runtime surface, and only `definePreset` and authoring types from the authoring surface.
_Avoid_: leaked internal helpers, low-level normalization API

**Explicit Authoring Import**:
An import policy in which preset authoring APIs are accessed only from `ofetch-presets/kit` and are not re-exported from the runtime package root.
_Avoid_: root kit re-export, mixed root import

**Permissive Structural Authoring**:
An authoring model in which both runtime resolution and the preset kit tolerate extra structural preset fields beyond the reserved preset fields.
_Avoid_: strict preset shape, closed preset schema

**Empty Resolution Pass**:
A valid resolution pass with no composition sources, producing an empty but still well-defined resolved options value.
_Avoid_: invalid empty input, missing resolution

**Canonical Empty Resolution**:
An empty resolution pass result that still materializes the canonical resolved option shapes expected by the runtime surface.
_Avoid_: partial empty result, raw empty output

**Static Resolution Boundary**:
The boundary at which option resolution ends after producing canonical resolved options and ordered hooks, leaving all later hook-driven mutations to the `ofetch` execution lifecycle.
_Avoid_: runtime orchestration, hook conflict resolution, lifecycle execution

**Canonical Query Output**:
A resolved options output form in which query parameters are represented only through `query`, with no `params` alias remaining after resolution.
_Avoid_: params output, dual query representation

**Passive Canonical Output**:
A resolved options output that prefers effective values and canonical empty forms without running an additional cleanup phase to prune arbitrary undefined fields.
_Avoid_: aggressive cleanup, post-resolution pruning

**Array-Only Composition Input**:
An option resolution input model in which composition sources are supplied as one ordered array rather than as variadic arguments.
_Avoid_: variadic composition, positional argument composition

**Falsy No-Op Sources**:
Falsy values inside the composition source array that are ignored during option resolution instead of participating as actual composition sources.
_Avoid_: required explicit filtering, strict non-source rejection

**Flat Composition Array**:
An ordered composition array whose participating entries are direct composition sources rather than implicitly flattened nested arrays.
_Avoid_: nested source array, implicit flattening

**Consistent Dependency Input Rules**:
A rule that preset dependency arrays follow the same no-op and flattening behavior as root composition arrays.
_Avoid_: special dependency array semantics, divergent dependency input rules

**Plain Option Source**:
A plain object that participates in option resolution as direct fetch options when it does not match one of the reserved structural preset shapes.
_Avoid_: arbitrary truthy source, implicit preset

**Ignored Non-Source Values**:
Values that are neither structural presets nor plain option sources and are therefore skipped during option resolution instead of causing runtime errors.
_Avoid_: strict non-source rejection, invalid source failure

**Plain Object Boundary**:
The boundary that treats objects with `Object.prototype` or `null` prototype as plain option sources and excludes arrays, built-in instances, and custom class instances from that role.
_Avoid_: instance-based option source, arbitrary object source

**Reserved Structural Preset Shapes**:
The top-level plain-object shapes `name + options` and `name + presets`, reserved for structural preset recognition even when that prevents the same shape from being used as plain fetch options.
_Avoid_: unreserved preset shape, collision-free structural preset

**First-Class Structural Authoring**:
Handwritten structural presets are an officially supported authoring contract alongside preset factories defined through the preset kit.
_Avoid_: kit-only authoring, incidental structural compatibility
