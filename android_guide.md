# How to Build Your Android App 📱

You have successfully converted your web game into an Android project! Now you need to "compile" it into an app you can install on your phone.

## Prerequisites
- **Android Studio**: You must have this installed. [Download here](https://developer.android.com/studio).

## Step-by-Step Guide

### 0. INSTALL ANDROID STUDIO (REQUIRED)
**You cannot build the app without this software.**
1.  **Download:** Go to [developer.android.com/studio](https://developer.android.com/studio)
2.  **Install:** Run the installer. It is large (1GB+), so it will take time.
3.  **Setup:** Open it and follow the "Standard Setup" wizard to download the Android SDK.

### 1. Open the Project
Run this command in your terminal (I can run it for you):
```bash
npx cap open android
```
This will launch **Android Studio** with your game loaded.

### 2. Wait for "Sync"
When Android Studio opens, you will see a loading bar at the bottom right. **Wait for it to finish.** It is downloading necessary tools (Gradle).

### 3. Connect Your Phone (Optional)
- Plug your Android phone into your PC with a USB cable.
- Enable **USB Debugging** on your phone (in Developer Options).
- You should see your phone's name appear in the top toolbar of Android Studio.

### 4. Run the App
- Click the green **Play Button (▶️)** in the top toolbar.
- If you don't have a phone connected, it will ask to create an "Emulator" (a virtual phone on your screen). Follow the prompts to set one up.

### 5. Build the APK (The Important Part)
This creates the file you can actually install on your phone.

1.  **Look at the Top Menu Bar:**
    At the very top of the Android Studio window, you will see text menus: `File`, `Edit`, `View`, `Navigate`, `Code`, `Refactor`, **`Build`**, `Run`...

2.  **Click "Build":**
    Click the word **Build** in that top menu. A dropdown list will appear.

3.  **Find "Build Bundle(s) / APK(s)":**
    Hover your mouse over this option (it's usually near the bottom of the list).

4.  **Click "Build APK(s)":**
    A sub-menu will pop out. Click **Build APK(s)**.

5.  **Wait:**
    Look at the bottom-right corner. A bar will load.

6.  **Click "locate":**
    When it finishes, a small bubble will pop up in the bottom-right corner saying "APK(s) generated successfully".
    **Click the blue word "locate" inside that bubble.**

7.  **Get the File:**
    A folder will open. You will see a file named `app-debug.apk`.
    **This is your game!** Send this file to your phone (email it to yourself, use WhatsApp Web, or plug in your phone and copy it).

## Updating the Game
If you make changes to the code (like changing colors or speed), you must run this command to update the Android version:
```bash
npm run build
npx cap sync
```
Then press Play in Android Studio again.
