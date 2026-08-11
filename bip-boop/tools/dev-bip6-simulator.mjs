import {
  cp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { watch } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const previewRoot = join(projectRoot, '.simulator', 'bip6')
const productionConfig = JSON.parse(
  await readFile(join(projectRoot, 'app.json'), 'utf8')
)
const productionTarget = Object.values(productionConfig.targets)[0]

const previewConfig = {
  ...productionConfig,
  app: {
    ...productionConfig.app,
    appName: 'bip-boop-plain-orange Preview',
    description: 'Simulator-only Bip 6 preview of the Bip Max watch face',
  },
  targets: {
    'bip6-simulator': {
      ...productionTarget,
      platforms: [
        {
          name: 'Amazfit Bip 6 Simulator',
          deviceSource: 9765120,
          st: 's',
          sr: 'w390',
          dw: 390,
        },
        {
          name: 'Amazfit Bip 6 Simulator',
          deviceSource: 9765121,
          st: 's',
          sr: 'w390',
          dw: 390,
        },
        {
          name: 'Amazfit Bip 6 Simulator',
          deviceSource: 10158337,
          st: 's',
          sr: 'w390',
          dw: 390,
        },
      ],
      designWidth: 390,
    },
  },
  i18n: {
    'en-US': {
      appName: 'bip-boop-plain-orange Preview',
    },
  },
}

delete previewConfig.app._pikeCompatibled

await rm(previewRoot, { recursive: true, force: true })
await mkdir(join(previewRoot, 'assets', 'bip6-simulator'), {
  recursive: true,
})
await mkdir(join(previewRoot, 'watchface'), { recursive: true })
await writeFile(
  join(previewRoot, 'app.json'),
  `${JSON.stringify(previewConfig, null, 2)}\n`
)
await cp(
  join(projectRoot, 'assets', '432x514-amazfit-bip-max'),
  join(previewRoot, 'assets', 'bip6-simulator'),
  { recursive: true }
)

const previewAssets = join(previewRoot, 'assets', 'bip6-simulator')
const resizePng = (height, width, path) => {
  const result = spawnSync('sips', ['-z', `${height}`, `${width}`, path], {
    stdio: 'ignore',
  })
  if (result.status !== 0) {
    throw new Error(`Failed to resize simulator asset: ${path}`)
  }
}

resizePng(450, 390, join(previewAssets, 'background', 'regular.png'))
resizePng(450, 390, join(previewAssets, 'background', 'aod.png'))
for (let digit = 0; digit < 10; digit += 1) {
  resizePng(22, 11, join(previewAssets, 'weather', 'orange', `${digit}.png`))
  resizePng(19, 10, join(previewAssets, 'weather', 'muted', `${digit}.png`))
}
resizePng(22, 10, join(previewAssets, 'weather', 'orange', 'minus.png'))
resizePng(22, 23, join(previewAssets, 'weather', 'orange', 'celsius.png'))
resizePng(22, 23, join(previewAssets, 'weather', 'orange', 'fahrenheit.png'))
resizePng(19, 12, join(previewAssets, 'weather', 'muted', 'percent.png'))
resizePng(13, 13, join(previewAssets, 'weather', 'rain.png'))

await symlink(join(projectRoot, 'app.js'), join(previewRoot, 'app.js'))
const syncWatchFace = async () => {
  const productionWatchFace = await readFile(
    join(projectRoot, 'watchface', 'index.js'),
    'utf8'
  )
  const previewWatchFace = productionWatchFace
    .replace('const WIDTH = DESIGN_WIDTH', 'const WIDTH = 390')
    .replace('const HEIGHT = DESIGN_HEIGHT', 'const HEIGHT = 450')
    .replace('const SIMULATOR_PREVIEW = false', 'const SIMULATOR_PREVIEW = true')
  await writeFile(
    join(previewRoot, 'watchface', 'index.js'),
    previewWatchFace
  )
}

await syncWatchFace()

if (process.argv.includes('--prepare-only')) {
  console.log(`Prepared Bip 6 simulator project at ${previewRoot}`)
  process.exit(0)
}

let syncTimer
const sourceWatcher = watch(
  join(projectRoot, 'watchface', 'index.js'),
  () => {
    clearTimeout(syncTimer)
    syncTimer = setTimeout(() => {
      syncWatchFace().catch((error) => {
        console.error('Failed to sync Bip 6 preview source:', error)
      })
    }, 75)
  }
)

console.log('Starting the simulator-only Bip 6 preview.')
console.log('When Zeus asks for a device, choose Amazfit Bip 6.')
console.log('The production app.json remains Bip Max-only.\n')

const zeus = spawn('zeus', ['dev'], {
  cwd: previewRoot,
  stdio: 'inherit',
})

zeus.on('exit', (code, signal) => {
  sourceWatcher.close()
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
