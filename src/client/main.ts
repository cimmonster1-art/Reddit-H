import { api } from './api.js';
import { SubstrateController } from './scene/SubstrateController.js';
import { Hud } from './ui/Hud.js';
import { CardHost } from './ui/CardHost.js';

// Boot: fetch the authoritative world, build the Three.js substrate, wire the
// glass chrome, and start. The server owns all structure; the client only
// renders it and relays intents.
async function boot(): Promise<void> {
  const parent = document.getElementById('organism');
  if (!parent) return;

  let init;
  try {
    init = await api.init();
  } catch (err) {
    const loaderText = document.querySelector('#loader p');
    if (loaderText) loaderText.textContent = 'the substrate is unreachable. pull to refresh.';
    console.error(err);
    return;
  }

  const controller = new SubstrateController(parent, init.world);
  const hud = new Hud((index) => controller.surfaceTo(index));
  new CardHost(controller.selection, (payload) => controller.dive(payload));

  controller.onZoomChange((level, crumbs) => hud.setZoom(level, crumbs));
  controller.mount();
  hud.mount(init.world);
}

boot();
