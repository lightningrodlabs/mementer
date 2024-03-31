import { ActionHash, AgentPubKeyB64, DnaSource, EntryHash, decodeHashFromBase64, Record } from "@holochain/client";
import { pause, runScenario, Scenario  } from "@holochain/tryorama";
import { EntryRecord, RecordBag } from '@holochain-open-dev/utils';

import { assert, test } from "vitest";

import path from 'path'
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const happPath = path.join(__dirname, "../../workdir/mementer.happ")

import * as _ from 'lodash'
import { Base64 } from "js-base64";
export type Dictionary<T> = { [key: string]: T };

interface Unit  {
  parents: Array<string>,
  name: string,
  description: string,
  stewards: Array<AgentPubKeyB64>,
  meta: Dictionary<string>,
}

function encodeHashToBase64(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}

test("mementer basic tests", async () => {
  await runScenario(async (scenario: Scenario) => {

    const appSource = { appBundleSource: { path: happPath } };

    const [alice, bobbo] = await scenario.addPlayersWithApps([appSource, appSource]);
    await scenario.shareAllAgents();

    const [alice_mementer] = alice.cells;
    const [bobbo_mementer] = bobbo.cells;
    const boboAgentKey = encodeHashToBase64(bobbo.agentPubKey);
    const aliceAgentKey = encodeHashToBase64(alice.agentPubKey);

    let rootUnit = {
      parents: [], // full paths to parent nodes (remember it's a DAG)
      description: "The Root",
      name: "", // max 10 char
      stewards: [],  // people who can change this node
      meta: {}
    };

    try {
      await alice_mementer.callZome({zome_name:'mementer', fn_name:'initialize', payload: {units: [["_alive", rootUnit]]}} );
    }
    catch (e) {
      console.log("Error in initialize", e)
    }

    let units:any = await alice_mementer.callZome({zome_name:'mementer',fn_name:'get_units'} );
    assert.equal(units.length, 1)

    // Create a new node
    let unit1 = {
      parents: [""], // full paths to parent nodes (remember it's a DAG)
      description: "lorem ipsem",
      name: "my node", // max 10 char
      stewards: [],  // people who can change this document
      meta: {}
    };
    
    const unit1Output:any = await alice_mementer.callZome({zome_name:'mementer', fn_name:'create_unit', payload: {state: "_alive", unit:unit1}} );
    assert.ok(unit1Output)
    const unit1Hash = encodeHashToBase64(unit1Output.info.hash)
    console.log("unit1Hash", unit1Hash);

    units  = await alice_mementer.callZome({zome_name:'mementer', fn_name:'get_units'} );
    assert.equal(units.length, 2)
    const bag = new RecordBag(units.map((u)=>u.record));
    const entries =Array.from(bag.entryMap.entries()).map(([hash, value])=> {return {hash: encodeHashToBase64(hash),value}})
    assert.deepEqual(entries, [{hash: entries[0].hash, value: rootUnit}, {hash: unit1Hash, value: unit1}]);

    let tree:any = await alice_mementer.callZome({zome_name:'mementer', fn_name:'get_tree'} );
    console.log("Rust tree", tree);
    assert.equal(tree.tree.length, 2)
    let jsTree = buildTree(tree.tree,tree.tree[0])
    console.log("JS tree", jsTree)

    const node = tree.tree[1].val
    assert.equal(node.name, unit1.name)
    assert.equal(encodeHashToBase64(node.units[0].hash),unit1Hash)
  
    let unitRecord: Record = await alice_mementer.callZome({zome_name:'mementer', fn_name:'get_unit', payload: unit1Hash} );
    assert.ok(unitRecord)
    const unitN = new EntryRecord<Unit>(unitRecord)

    console.log("UNIT", unitN.entry)

  })
})


type RustNode = {
  idx: number,
  val: any,
  parent: null | number,
  children: Array<number>
}
type Node = {
  val: any,
  children: Array<Node>
}

function buildTree(tree: Array<RustNode>, node: RustNode): Node {
  let t: Node = {val: node.val, children: []}
  for (const n of node.children) {
    t.children.push(buildTree(tree, tree[n]))
  }
  return t
}