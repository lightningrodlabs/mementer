import { ActionHash, AgentPubKeyB64, DnaSource, EntryHash, decodeHashFromBase64, Record, Link, HoloHash } from "@holochain/client";
import { pause, runScenario, Scenario  } from "@holochain/tryorama";
import { EntryRecord, HashType, LazyHoloHashMap, RecordBag, getHashType, retype, slice } from '@holochain-open-dev/utils';
import { AsyncReadable, asyncReadable, pipe, retryUntilSuccess, sortLinksByTimestampAscending, uniquify, uniquifyLinks} from '@holochain-open-dev/stores';

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

test("async tests", async () => {
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
    const unit1Hash = unit1Output.info.hash
    const unit1HashB64 = encodeHashToBase64(unit1Hash)
    console.log("unit1Hash", unit1Hash);

    const lazyUnits = new LazyHoloHashMap<EntryHash, AsyncReadable<EntryRecord<Unit>>>(
      (unitHash: ActionHash) =>
        retryUntilSuccess(
          async () => {
            console.log("calling get_unit")
            let unitRecord: Record = await alice_mementer.callZome({zome_name:'mementer', fn_name:'get_unit', payload: unitHash} );
            if (!unitRecord) throw new Error('Unit not found yet');

            const unitN = new EntryRecord<Unit>(unitRecord)

            return unitN;
          },
          700,
          10
        )
    );
    const getUnits = async () :Promise<Link[]> => {
      console.log("CALLING GET UNITS LINKS")
      return alice_mementer.callZome({zome_name:'mementer', fn_name:'get_unit_links'} );
    }
    const allUnits = pipe(
      liveLinksStore(
        () => getUnits(),
      ),
      links => slice(lazyUnits, uniquify(links.map(l => l.target)))
    );
    let done = false
    allUnits.subscribe((units)=>{
      console.log("GOT allUnits", units)
    })
    // const x = lazyUnits.get(decodeHashFromBase64("uhCEk7byNpLOM23bYO26xgMX0K5q95xw8s6-FBfw5AsmSOrVeRIE0"))//unit1Hash)
    // x.subscribe((unit)=>{
    //   console.log("GOT UNIT", unit)
    //   if (unit.status == "complete") {
    //     done = true;
    //   }
    // })

    let count = 0
    while (!done) {
      await pause(700)
      count+= 1
      console.log("fish", count)
    }
  })
})


function liveLinksStore(
  fetchLinks: () => Promise<Array<Link>>,
): AsyncReadable<Array<Link>> {
  return asyncReadable(async (set) => {
    let links: Link[];

    const maybeSet = (newLinksValue: Link[]) => {
      const orderedNewLinks = uniquifyLinks(newLinksValue).sort(
        sortLinksByTimestampAscending
      );

      if (
        links === undefined ||
        !areArrayHashesEqual(
          orderedNewLinks.map((l) => l.create_link_hash),
          links.map((l) => l.create_link_hash)
        )
      ) {
        links = orderedNewLinks;
        set(links);
      }
    };
    const fetch = async () => {
      const nlinks = await fetchLinks();
      maybeSet(nlinks);
    };

    await fetch();

    const interval = setInterval(() => fetch(), 4000);

    return () => {
      clearInterval(interval);
    };
  });
}

function areArrayHashesEqual(
  array1: Array<HoloHash>,
  array2: Array<HoloHash>
): boolean {
  if (array1.length !== array2.length) return false;

  for (let i = 0; i < array1.length; i += 1) {
    if (array1[i].toString() !== array2[i].toString()) {
      return false;
    }
  }

  return true;
}