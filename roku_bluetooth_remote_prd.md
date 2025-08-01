# Product Requirements Document (PRD)

## Product Title
**Roku Bluetooth Remote Control App**

## Prepared By
React Native + BLE Developer Team

## Objective
Develop a React Native Android application (compatible with Expo Go via EAS build) that mimics the functionality of a Roku Bluetooth remote, specifically for a TCL 43" 4K QLED Roku TV or any Roku device supporting Bluetooth remote pairing.

---

## Background & Rationale

Roku TVs, including TCL 4K QLED models, support Bluetooth remotes (e.g., Roku Voice Remote Pro). This project aims to replicate the remote control experience using a smartphone app built in React Native. The app will allow users to control their Roku TV via Bluetooth with no physical remote required.

---

## Target Devices

- Android smartphones running Android 8.0+
- TCL Roku TV 43” 4K QLED (2020+)
- Roku TVs or devices supporting Bluetooth HID remote (e.g., Roku Ultra, Roku Streaming Stick+, etc.)

---

## Features

### 1. Bluetooth Pairing & Discovery
- Scan for BLE-compatible Roku TVs.
- Display list of nearby devices.
- Allow user to pair with selected Roku TV.
- Show connection status and reconnect on next app launch.

### 2. Remote Control Interface
- Directional pad (Up, Down, Left, Right, OK)
- Back, Home, Options (⋮), Replay
- Volume Up / Down
- Power ON/OFF
- Optional: Voice Input (Phase 2, mic-to-Roku streaming)

### 3. Settings
- Show connected Roku device name
- Manual reconnect
- Toggle Mock Mode (use internal emulator when real device is unavailable)
- Help / Troubleshooting guide

---

## Technical Requirements

### BLE Stack
- Use `react-native-ble-plx` for Bluetooth LE communication
- Pair with Roku TV via BLE (Roku HID/GATT profile)
- Handle reconnect/disconnect and permission issues
- Fallback to mock mode if no real Roku found

### Permissions
- Android Location (required for BLE)
- Bluetooth access and background BLE scan

### BLE Characteristics (Planned)
- Connect to custom GATT profile used by Roku remotes
- Use known UUIDs or discover through reverse engineering (packet sniffing if needed)
- Map input to HID reports mimicking Roku remote key presses

---

## UI/UX

### Home Screen
- App logo + Roku branding (non-infringing)
- “Connect to Roku TV” button
- Connection status

### Remote Control Screen
- Responsive remote layout with large D-Pad
- Volume and Power on side strip
- Feedback on each button press

### Settings Screen
- Toggle for Mock Mode
- Connected device details
- Reconnect or forget device
- Support/FAQ link

---

## Milestones & Timeline

| Milestone                         | Due Date         |
|----------------------------------|------------------|
| Requirements Finalized           | Week 1           |
| BLE Pairing Prototype            | Week 2           |
| Remote UI Design Complete        | Week 3           |
| BLE Remote Control Integration   | Week 4           |
| Testing on TCL Roku Devices      | Week 5           |
| Final Build and QA               | Week 6           |
| Deployment via EAS               | Week 6.5         |

---

## Assumptions & Risks

- BLE communication with Roku TV might require low-level packet analysis or reverse-engineering of Roku remote GATT profiles
- Limited documentation from Roku on HID/BLE integration
- Expo Go limitations require EAS Build for native BLE support
- Bluetooth functionality may differ across Android versions or device manufacturers

---

## Future Enhancements (Phase 2)

- Voice input support (microphone-to-TV)
- Customizable remote layout
- Multi-device pairing and quick switch
- Roku channel browsing within app

---

## Dependencies

- `react-native-ble-plx`
- `expo-device`, `expo-bluetooth`, `expo-permissions`
- `react-navigation` or `expo-router`
- Tailwind CSS or React Native Paper for UI
- Optional: Wireshark + Android BLE sniffer for packet inspection

---

## Success Metrics

- Pairs with Roku TV via BLE within 10 seconds
- All keypresses are reflected on the TV with < 100ms latency
- Stable connection for sessions > 30 minutes
- User can toggle between real and mock mode without crash

---

## Repository Structure Suggestion

```
/roku-ble-remote
├── /src
│   ├── /screens
│   ├── /components
│   ├── /services (BLE logic)
│   ├── /utils
├── App.js
├── app.config.js
└── README.md
```

---

## License & Compliance

- No use of Roku trademarks or proprietary APIs
- Designed for private/internal use or open-source educational demo
