import assert from 'node:assert/strict';
import { parseFrontierSource } from '../dist/index.js';

const document = parseFrontierSource(`
module FrontierGenericRefProbe @id("mod_frontier_generic_ref_probe")

type ErrorInfo @id("type_error_info") {
  message: Text
}

type Result<T, E> @id("type_result") {
  variant Ok @id("variant_ok") (value: T)
  variant Err @id("variant_err") (error: E)
}

type LoadResponse @id("type_load_response") {
  result @id("field_load_result"): Result<Text, ErrorInfo>
  history @id("field_history"): List<Result<Text, ErrorInfo>>
}

view LoadPanel @id("view_load_panel") {
  prop response @id("view_prop_response"): Result<Text, ErrorInfo>
  event refresh @id("view_event_refresh") input Result<Text, ErrorInfo>
}
`);

assert.deepEqual(document.nodes.type_result.parameters, ['T', 'E']);
assert.deepEqual(document.nodes.type_load_response.fields[0].type, {
  kind: 'ref',
  name: 'Result',
  args: ['Text', 'ErrorInfo']
});
assert.deepEqual(document.nodes.type_load_response.fields[1].type, {
  kind: 'list',
  item: { kind: 'ref', name: 'Result', args: ['Text', 'ErrorInfo'] }
});
assert.deepEqual(document.nodes.type_result.variants[0].fields[0].type, 'T');
assert.deepEqual(document.nodes.view_load_panel.props[0].type, {
  kind: 'ref',
  name: 'Result',
  args: ['Text', 'ErrorInfo']
});
assert.deepEqual(document.nodes.view_load_panel.events[0].input, {
  kind: 'ref',
  name: 'Result',
  args: ['Text', 'ErrorInfo']
});
