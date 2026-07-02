# 📱 How to Build and Download Your Standalone Mobile App (.APK)

To install your app directly on an Android phone as a standalone application (instead of using the Expo Go app), you can use **EAS (Expo Application Services) Build**. Expo builds the app for you in the cloud for free!

Follow these step-by-step instructions.

---

## Step 1: Install EAS CLI
Open your command prompt/terminal on your computer, navigate to the `frontend` directory, and run:
```bash
npm install -g eas-cli
```

---

## Step 2: Log In or Create an Expo Account
If you don't have an Expo account, sign up for free at [expo.dev](https://expo.dev). Then, log in on your computer's terminal:
```bash
eas login
```
*(Enter your Expo username and password).*

---

## Step 3: Configure the Build
Set up the build configuration for your project by running:
```bash
eas build:configure
```
* When prompted, choose **All** or **Android**.
* This will create an `eas.json` file in your `frontend` directory.

---

## Step 4: Configure `eas.json` to generate an APK (Important!)
By default, EAS generates an `.aab` file (which is only for uploading to the Google Play Store). To get a direct-download **`.apk`** file that you can install on your phone:

1. Open `eas.json` in the `frontend` directory.
2. Under `"build": { "preview": { ... } }`, make sure `developmentClient` is set to `false` and `distribution` is set to `"internal"`.
3. Alternatively, you can add an `"apk"` profile. Here is a perfect `eas.json` configuration:

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

---

## Step 5: Start the Build
To trigger the build in the Expo Cloud, run this command in your `frontend` terminal:
```bash
eas build --platform android --profile preview
```
1. Press `Enter` to accept all defaults (like generating a keystore).
2. Expo will upload your code and start compiling the Android app.
3. You will get a link in your terminal to monitor the build progress on the Expo website.

---

## Step 6: Download & Install on Your Phone
1. Once the build finishes (takes about 5-10 minutes), the terminal will display a **QR Code**.
2. Scan this QR Code with your phone's camera.
3. Click the link to download the **`.apk`** file directly to your phone.
4. Open the downloaded file to install it! (You may need to allow "Install from Unknown Sources" in your phone settings).
