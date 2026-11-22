/** Prop registry: name -> { doc, build(ctx, params) }. See PROPS.md. */
import * as houses from './houses.js';
import * as trees from './trees.js';
import * as street from './street.js';
import * as interior from './interior.js';
import * as shops from './shops.js';
import * as outdoor from './outdoor.js';

export const PROPS = {};
for (const mod of [houses, trees, street, interior, shops, outdoor]) {
  for (const [k, v] of Object.entries(mod)) {
    if (v && typeof v.build === 'function') PROPS[k] = v;
  }
}
