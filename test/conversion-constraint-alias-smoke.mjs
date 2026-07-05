import { strict as assert } from 'node:assert';
import { parseFrontierSource } from '../src/index.js';

const doc = parseFrontierSource(`
module ConversionAliasProbe @id("mod_conversion_alias_probe")

conversion AliasProbe @id("conversion_alias_probe") {
  sourceLanguage javascript
  target rust
  constraint package-manager rustReqwest @id("package_manager_rust_reqwest") role target kind dependency packageName reqwest packageManager cargo packageVersion 0.12 dependencyName reqwest dependencyVersion 0.12 workspace app registry crates evidence evidence_package_manager
  constraint package-boundary jsPackage @id("package_boundary_js_package") role source kind package-boundary moduleId module:todo modulePath src/todo.ts packageName @app/todo packageSubpath ./todo packageManager npm evidence evidence_package_boundary
  constraint package barePackage @id("package_bare_package") role source kind package manager npm package @pkg/demo abi napi evidence evidence_bare_package
  constraint module-constraint modulePackage @id("module_package_alias") role source kind package specifier ./demo package @pkg/demo packageCondition import evidence evidence_module_package
  constraint abi-boundary rustFfi @id("abi_boundary_rust_ffi") role target kind c-abi functionName saveUser abi cdecl abiVersion v1 callConv cdecl linkage dynamic symbolVersion saveUser@1 evidence evidence_abi
  constraint name-resolution userRename @id("name_resolution_user_rename") role source kind binding symbol symbol:User definition def:User use use:User resolvedSymbol symbol:UserFull canonicalName UserFull qualifiedName models.UserFull referenceName User evidence evidence_name_resolution
  constraint use-def saveUse @id("use_def_save_use") role target kind reference definition def:saveUser use use:saveUser localName saveUser resolvedSymbol symbol:saveUser evidence evidence_use_def
  constraint runtime nodeRuntime @id("runtime_node_runtime") role source kind runtime sourceRuntime node targetRuntime browser runtimeId runtime:node runtimeVersion 20 sourceHost node targetHost browser platform web os darwin arch arm64 engine v8 sandbox process policy trusted adapter fetchAdapter adapterId adapter:fetch evidence evidence_runtime_constraint
}
`);

const plan = doc.metadata.universalConversionPlan;
const byId = (entries, id) => entries.find((entry) => entry.id === id);

const packageManagerEntry = byId(plan.dependencySemanticsConstraints, 'package_manager_rust_reqwest');
const packageManagerRecord = packageManagerEntry.targetDependencies[0];
assert.equal(packageManagerEntry.targetDependencySemanticsRecords[0], packageManagerRecord);
assert.equal(packageManagerEntry.metadata.family, 'dependencySemantics');
assert.equal(packageManagerEntry.metadata.authoredFamily, 'package-manager');
assert.equal(packageManagerRecord.packageManager, 'cargo');
assert.equal(packageManagerRecord.packageVersion, '0.12');
assert.equal(packageManagerRecord.dependencyName, 'reqwest');
assert.equal(packageManagerRecord.dependencyVersion, '0.12');

const packageBoundaryEntry = byId(plan.dependencySemanticsConstraints, 'package_boundary_js_package');
const packageBoundaryRecord = packageBoundaryEntry.sourceDependencies[0];
assert.equal(packageBoundaryRecord.moduleId, 'module:todo');
assert.equal(packageBoundaryRecord.modulePath, 'src/todo.ts');
assert.equal(packageBoundaryRecord.packageName, '@app/todo');
const barePackageEntry = byId(plan.dependencySemanticsConstraints, 'package_bare_package');
const barePackageRecord = barePackageEntry.sourceDependencies[0];
assert.equal(barePackageEntry.metadata.family, 'dependencySemantics');
assert.equal(barePackageEntry.metadata.authoredFamily, 'package');
assert.equal(barePackageRecord.packageName, '@pkg/demo');
assert.equal(barePackageRecord.packageManager, 'npm');
assert.equal(barePackageRecord.nativeAbi, 'napi');
assert.equal(plan['package-managerConstraints'], undefined);
assert.equal(plan['package-boundaryConstraints'], undefined);
assert.equal(plan.packageConstraints, undefined);

const modulePackageEntry = byId(plan.moduleConstraints, 'module_package_alias');
const modulePackageRecord = modulePackageEntry.sourceModules[0];
assert.equal(modulePackageRecord.kind, 'package');
assert.equal(modulePackageRecord.packageName, '@pkg/demo');
assert.equal(modulePackageRecord.packageCondition, 'import');

const abiEntry = byId(plan.callableBoundaryConstraints, 'abi_boundary_rust_ffi');
const abiRecord = abiEntry.targetCallables[0];
assert.equal(abiEntry.targetCallableBoundaryRecords[0], abiRecord);
assert.equal(abiEntry.metadata.family, 'callableBoundary');
assert.equal(abiEntry.metadata.authoredFamily, 'abi-boundary');
assert.equal(abiRecord.abi, 'cdecl');
assert.equal(abiRecord.abiVersion, 'v1');
assert.equal(abiRecord.callingConvention, 'cdecl');
assert.equal(abiRecord.linkage, 'dynamic');
assert.equal(abiRecord.symbolVersion, 'saveUser@1');
assert.equal(plan['abi-boundaryConstraints'], undefined);

const nameResolutionEntry = byId(plan.scopeBindingConstraints, 'name_resolution_user_rename');
const nameResolutionRecord = nameResolutionEntry.sourceBindings[0];
assert.equal(nameResolutionEntry.sourceScopeBindingRecords[0], nameResolutionRecord);
assert.equal(nameResolutionEntry.metadata.family, 'scopeBinding');
assert.equal(nameResolutionEntry.metadata.authoredFamily, 'name-resolution');
assert.equal(nameResolutionRecord.definitionId, 'def:User');
assert.equal(nameResolutionRecord.useId, 'use:User');
assert.equal(nameResolutionRecord.resolvedSymbolId, 'symbol:UserFull');
assert.equal(nameResolutionRecord.canonicalName, 'UserFull');
assert.equal(nameResolutionRecord.qualifiedName, 'models.UserFull');
assert.equal(nameResolutionRecord.referenceName, 'User');

const useDefEntry = byId(plan.scopeBindingConstraints, 'use_def_save_use');
const useDefRecord = useDefEntry.targetBindings[0];
assert.equal(useDefEntry.targetScopeBindingRecords[0], useDefRecord);
assert.equal(useDefRecord.definitionId, 'def:saveUser');
assert.equal(useDefRecord.useId, 'use:saveUser');
assert.equal(useDefRecord.resolvedSymbolId, 'symbol:saveUser');
assert.equal(plan['name-resolutionConstraints'], undefined);
assert.equal(plan['use-defConstraints'], undefined);

const runtimeEntry = byId(plan.hostEnvironmentConstraints, 'runtime_node_runtime');
const runtimeRecord = runtimeEntry.sourceHosts[0];
assert.equal(runtimeEntry.sourceHostEnvironmentRecords[0], runtimeRecord);
assert.equal(runtimeEntry.metadata.family, 'hostEnvironment');
assert.equal(runtimeEntry.metadata.authoredFamily, 'runtime');
assert.equal(runtimeRecord.sourceRuntime, 'node');
assert.equal(runtimeRecord.targetRuntime, 'browser');
assert.equal(runtimeRecord.runtimeId, 'runtime:node');
assert.equal(runtimeRecord.runtimeVersion, '20');
assert.equal(runtimeRecord.sourceHost, 'node');
assert.equal(runtimeRecord.targetHost, 'browser');
assert.equal(runtimeRecord.engine, 'v8');
assert.equal(runtimeRecord.adapter, 'fetchAdapter');
assert.equal(runtimeRecord.adapterId, 'adapter:fetch');
assert.equal(plan.runtimeConstraints, undefined);
