# Testing the SavannaFX Mobile App

## Quick Start

The Expo development server should be starting. Once it's ready, you'll see a QR code and options to:

1. **Press `i`** - Open in iOS Simulator (requires Xcode)
2. **Press `a`** - Open in Android Emulator (requires Android Studio)
3. **Press `w`** - Open in web browser
4. **Scan QR code** - Open in Expo Go app on your physical device

## Prerequisites

### For iOS Simulator:
- Xcode installed
- iOS Simulator available

### For Android Emulator:
- Android Studio installed
- Android emulator set up

### For Physical Device:
- Install **Expo Go** app from App Store (iOS) or Play Store (Android)
- Scan the QR code shown in terminal

## Testing the Home Screen

The home screen should display:
- ✅ Header with profile icon and "Welcome back, Paul"
- ✅ Notification bell with red badge
- ✅ Trading Signal Card (XAUUSD with SELL button)
- ✅ "Trade with Savanna" section with Signals and Analysis cards
- ✅ "LEARN THE CRAFT" section with three icons
- ✅ "Tools of the game" section with four tool icons

## Troubleshooting

### If you see import errors:
- Check that `shared/` directory exists at the project root
- Verify TypeScript paths in `tsconfig.json`

### If NativeWind styles don't work:
- Clear Metro cache: `npx expo start -c`
- Restart the development server

### If Supabase connection fails:
- Verify `shared/constants/supabase.ts` has correct credentials
- Check network connection

## Next Steps After Testing

Once the home screen loads successfully:
1. Verify all UI elements render correctly
2. Test scrolling behavior
3. Check safe area handling (notches, home indicators)
4. Verify colors match the design
5. Test on different screen sizes if possible
