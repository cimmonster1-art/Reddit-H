import Phaser from 'phaser';
import { api } from './api.js';
import { OrganismScene } from './game/OrganismScene.js';
import { UIController } from './ui/panels.js';

async function boot(): Promise<void> {
  let init;
  try {
    init = await api.init();
  } catch (err) {
    document.querySelector('#loader p')!.textContent = 'the substrate is unreachable. pull to refresh.';
    console.error(err);
    return;
  }

  const scene = new OrganismScene();
  const ui = new UIController(scene, init);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'organism',
    transparent: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    fps: { target: 60, smoothStep: true },
    render: { antialias: true, powerPreference: 'high-performance' },
    scene,
  });

  game.scene.start('organism', { world: init.world, onSelect: ui.onOrganSelect });

  // mount UI once the scene's create() has run
  game.events.once(Phaser.Core.Events.READY, () => ui.mount());
  // fallback in case READY already fired
  setTimeout(() => {
    if (!document.getElementById('loader')!.hidden) ui.mount();
  }, 600);
}

boot();
