# Bip Boop

`Bip Boop` is a coded Zepp OS watch-face project for the **Amazfit Bip Max**. It implements the supplied 432 x 514 regular and always-on display designs with live Zepp health and system data.

## Current design

The regular face uses the supplied dark modernist grid, Archivo typography, orange progress accents, weather row, activity panels, and curved edge treatment. Its live values are time, date, battery, steps and target, calories and target, heart rate, sleep duration and goal progress, SpO2, PAI, standing progress, stress, current temperature, and the current weather condition when available. The condition text is mapped from the watch weather forecast index; missing or index-25 data is shown as `Unknown` rather than a fixed condition.

The sleep header reads the user-configured sleep goal through Zepp OS's `getSleepTarget()` settings API (minutes). Zepp returns `0` when no goal is available, so the face deliberately shows `--` rather than inventing a goal.

Step and calorie values and goals are read directly from the Zepp OS `Step` and `Calorie` sensors. If either goal is unavailable or zero, its header shows `--` and its orange progress indicator is hidden; the face does not substitute a hard-coded goal.

The heart-rate progress bar treats 40 BPM as its lower bound and uses the age-based estimate `220 - age` as its upper bound. If the user age is unavailable, it falls back to 220 BPM. This is a visualization scale rather than a medical target or diagnosis.

The AOD version preserves the supplied black composition, outlined time, date, battery, temperature, and weather label while omitting the lower activity grid. The watch-face manifest enables its screen-off presentation with `lockscreen: 1`; the watch must be configured to have AOD follow the current watch face.

## Requirements

Versions observed on 2026-08-10:

| Requirement | Installed / target |
| --- | --- |
| macOS architecture | Apple Silicon (`arm64`) |
| Node.js | `v26.7.0` |
| npm | `11.19.0` |
| Zeus CLI | `1.9.3` |
| ZPM bundled with Zeus | `3.4.2` |
| Zepp OS Simulator | `2.1.2` for macOS Apple Silicon |
| Simulator profile | Bip 6 `v1.1.0`, Zepp OS 5.0, API level 4.2 (fallback only) |
| Target watch | Amazfit Bip Max |
| Target physical resolution | `432 x 514` |
| Watch-face preview resolution | `294 x 350` |
| Target device Zepp OS | 5.0 |
| Latest Bip Max API level | 4.4 |
| Project runtime API baseline | 2.0.0 (supported by the Bip Max 4.4 runtime) |
| Bip Max `deviceSource` | `11206915` |

The Zeus 1.9.3 watch-face wizard currently offers API template baselines 1.0 and 2.0. This project uses the newest offered baseline, 2.0, while explicitly targeting the current Bip Max device entry. The older API baseline keeps the small watch face compatible with the Bip Max's newer 4.4 runtime; it does not claim that the Bip Max itself is an API 2.0 device.

## Development

1. Launch `/Applications/simulator.app`.
2. Select and start the Bip 6 v1.1.0 device emulator. See [Simulator limitation](#simulator-limitation).
3. For the available Bip 6 fallback profile, run:

   ```bash
   npm run dev:bip6
   ```

4. When Zeus asks which device to preview, choose **Amazfit Bip 6**.
5. Focus the separate Device Simulator window and press `Home` (`fn` + left arrow on a Mac keyboard) to return to the watch face.

`dev:bip6` generates an ignored `.simulator/bip6` project with only the fallback device identifiers and a scaled `390 x 450` preview. It never changes the production `app.json`, which remains Bip Max-only. For a future dedicated Bip Max emulator, use `npm run dev` and choose **Amazfit Bip Max**.

To regenerate and validate the fallback project without launching the simulator, run:

```bash
npm run prepare:bip6
```

Zeus watches the generated source tree. Saving `watchface/index.js` triggers rebuild and simulator refresh automatically. Restart `npm run dev:bip6` after changing production assets or `app.json` so the fallback project receives fresh copied and resized resources.

## Build

Run:

```bash
npm run build
```

The command creates a `.zab` installer in `dist/`. `dist/` and `.zab` files are ignored by Git because they are generated artifacts.

The local production build completed successfully. Zeus also prints a notice that normal builds include intermediate products and explains that `zeus prune --ip` can remove them when a device-specific package is preferred.

## Preview on the Bip Max

Real-watch preview may authenticate with Zepp and upload the development package so Zepp can generate a QR installation code. Run it only when you intend to send this project package to Zepp:

```bash
zeus login       # only if Zeus asks you to authenticate
npm run preview
```

On the iPhone paired with the Bip Max:

1. Open the Zepp App and confirm the Bip Max is paired.
2. Go to **Profile -> Settings -> About**.
3. Tap the Zepp icon seven times until Developer Mode is enabled.
4. Open **Developer Mode -> Scan**.
5. Scan the QR code printed by `zeus preview`.
6. Follow the Zepp App prompt to install the test face on the Bip Max.

The QR scan and device installation are manual owner steps. They were not completed during bootstrap.

## Simulator

The installed simulator is the official Zepp OS Simulator 2.1.2 Apple Silicon build.

1. Launch `/Applications/simulator.app`.
2. Use the download-cloud button to manage device emulator packages.
3. Select **Bip 6 v1.1.0** and open **Emulator**.
4. Run `npm run dev:bip6` and select **Amazfit Bip 6** at the Zeus target prompt.
5. Use the simulator's **Sensor** panel to modify mocked values such as steps, battery, and heart rate.
6. Use **Console** to inspect device logs and unexplained runtime errors.
7. Use **Screenshot** to capture the emulated display; by default Simulator 2.1.2 saves screenshots in `~/Downloads`.

### Simulator limitation

Simulator 2.1.2 does not currently list a dedicated Amazfit Bip Max emulator package. Bip 6 v1.1.0 is used only as the closest available square-screen, Zepp OS 5.0 profile. It has a `390 x 450` screen and API level 4.2; it is **not identical to the Bip Max**.

The production Bip Max package successfully compiled and connected to the simulator, but it cannot be selected as a native Bip 6 package. The `dev:bip6` command therefore creates a disposable fallback package with Bip 6 device identifiers and proportionally scales the 432 x 514 design into 390 x 450. This lets the owner inspect and exercise the UI, but visual fit at the true 432 x 514 size remains unverified until a Bip Max emulator is published or the face is installed on a real Bip Max.

## Bip Max screen configuration

The Bip Max must not be treated as an ordinary `390 x 450` Zepp square watch. Without separate adaptation, Zepp documents that `getDeviceInfo()` can report `390 x 450` and that the drawing area is centered within the physical display.

This project follows the current official special case in `app.json`:

- configuration format: `v3`;
- `app._pikeCompatibled`: `1`;
- square screen: `st: "s"`;
- dedicated resolution qualifier: `sr: "w432"`;
- platform design width: `dw: 432`;
- target design width: `432`;
- explicit `deviceSource`: `11206915`;
- a single dedicated `432x514-amazfit-bip-max` target and asset directory.

The watch face uses direct 432-wide coordinates and does not import `*.s.layout.js` files, so the documentation's paired `*.w432-s.layout.js` rule is not applicable to the current source structure. If layout-loader files are introduced later, add the required `w432-s` counterpart for every square layout and keep the dedicated resources aligned with the current official guidance.

Do not replace this configuration with a generic 390-wide square target merely to match the fallback simulator.

## Project structure

```text
bip-boop/
├── AGENTS.md                         Future-agent target and design handoff
├── README.md                         Development and device instructions
├── app.js                            Zepp application lifecycle bootstrap
├── app.json                          Watch-face and Bip Max target configuration
├── assets/
│   └── 432x514-amazfit-bip-max/
│       ├── background/               Regular and AOD reference-derived layers
│       ├── fonts/                    Subset Archivo 400/600/800 fonts
│       ├── weather/                  Native weather digit assets
│       └── icon.png                  Regular watch-face preview
├── package.json                      Standard Zeus command aliases
├── tools/
│   └── dev-bip6-simulator.mjs        Disposable Bip 6 fallback preview generator
└── watchface/
    └── index.js                      Regular/AOD layout and live data wiring
```

`watchface/index.js` reads the Zepp sensor APIs for health and activity values. Current temperature uses a firmware-managed watch-face data binding, so it updates without being exposed as a JavaScript value.

## Verification status

| Check | Result |
| --- | --- |
| `zeus --version` | Passed; Zeus 1.9.3 |
| `npm run build` / `zeus build` | Passed; `.zab` produced under `dist/` |
| `npm run prepare:bip6` | Passed; complete 390 x 450 fallback project generated without opening the simulator |
| Fallback `zeus build` | Passed against the generated Bip 6 target and resized assets |
| `npm run dev`, choosing Bip 6 target | Expected failure: `no matching target devices` |
| `npm run dev`, choosing Bip Max target | Built, connected, installed/refreshed but is not a native Bip 6 package |
| `npm run dev:bip6`, choosing Bip 6 | Built, connected, and installed as `Bip Boop Preview` without changing production target configuration |
| Hot reload | Passed; source change rebuilt and refreshed |
| Bip Boop fallback runtime | Corrected to Zepp OS 2.0 module imports; latest simulator run logged no new runtime error |
| Final regular/AOD visual check | Pending owner-run simulator test as requested |
| `zeus preview` | Not run; requires explicit authorization to upload the package plus possible Zepp login/QR scan |
| Real Bip Max installation | Manual owner step remains |

## Useful official documentation

- [Zepp OS developer portal](https://developer.zepp.com/)
- [Watch-face quick start](https://docs.zepp.com/docs/watchface/watchface-quick-start/)
- [Zeus CLI](https://docs.zepp.com/docs/guides/tools/cli/)
- [Zepp OS Simulator guide](https://docs.zepp.com/docs/guides/tools/simulator/)
- [Simulator downloads](https://docs.zepp.com/docs/guides/tools/simulator/download/)
- [Watch-face configuration](https://docs.zepp.com/docs/watchface/app-json/)
- [Watch-face specification](https://docs.zepp.com/docs/watchface/specification/)
- [Watch-face API and data types](https://docs.zepp.com/docs/watchface/api/hmUI/widget/data_type/)
- [Device information list](https://docs.zepp.com/docs/reference/related-resources/device-list/)
- [Screen adaptation and Bip Max special case](https://docs.zepp.com/docs/guides/framework/device/screen-adaption/#amazfit-bip-max-screen-adaptation-special-case)
- [Real-device preview](https://docs.zepp.com/docs/guides/quick-start/preview/)
- [Zepp App Developer Mode](https://docs.zepp.com/docs/guides/tools/zepp-app/)
