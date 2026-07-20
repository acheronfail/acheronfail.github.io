# The Golden Eye

The Golden Eye is an OBS Studio plugin for recording GoldenEye 007 (N64) speedruns. It detects level start/end/result screens, parses level info and times, and manages OBS recordings around runs.

## Optional YouTube upload

The plugin includes an **optional** YouTube integration so runners can publish their recorded clips.

- Connect a Google/YouTube account from **Options → YouTube → Connect YouTube**.
- After connecting, the connected Google account name and email are shown in **Options → YouTube** so you can confirm the upload destination.
- Upload a recorded run clip from the **Runs** screen: open a clip and click **Upload**.

The plugin only uploads the specific clip you select, and only after you click **Upload**. It uses the configured title, description, and visibility settings for the upload. The YouTube integration is entirely optional — the plugin's recording features work without connecting a Google account.

The Golden Eye runs locally inside OBS Studio on the user's computer. It does not require a hosted account and does not operate a developer backend for user data.

## How to access the integration

1. Install OBS Studio and the The Golden Eye plugin.
2. Open OBS and open the The Golden Eye dock.
3. Go to **Options → YouTube** and click **Connect YouTube**, then complete the Google sign-in.
4. Go to **Runs**, open a recorded clip, and click **Upload**.

## Links

- [Project repository](https://github.com/acheronfail/the_golden_eye)
- <a href="privacy.html">Privacy Policy</a>

{{youtube(id="qqb01i8SZio")}}
