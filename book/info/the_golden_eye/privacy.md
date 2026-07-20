# The Golden Eye Privacy Policy

The Golden Eye is an OBS Studio plugin for recording GoldenEye 007 (N64) speedruns. It includes an **optional** YouTube upload feature. The plugin runs locally inside OBS Studio on the user's computer and does not operate a developer backend service for user data.

This policy describes the Google user data the plugin accesses when a user chooses to connect their Google/YouTube account, and how that data is used, stored, shared, and deleted.

## Scopes requested

If, and only if, the user connects YouTube, the plugin requests these Google OAuth scopes:

- `openid`, `email`, `profile` — to identify the connected Google account and display its name and email in the plugin so the user can confirm which account uploads will go to.
- `https://www.googleapis.com/auth/youtube.upload` — to upload user-selected recorded clips to the user's YouTube account.

The plugin does not request broader YouTube scopes and does not read, list, modify, or delete existing YouTube content.

## What Google user data is accessed

When a user connects YouTube, the plugin may receive and handle:

- Google account profile information returned by Google's OpenID Connect UserInfo endpoint: display name, email address, and profile image URL.
- OAuth credentials (access and refresh tokens) needed to upload on the user's behalf.
- The local video file the user selects to upload, plus the upload title, description, and visibility the user has configured.
- The YouTube upload response, such as the uploaded video's ID and URL.

## How the data is used

Google user data is used solely to provide the user-facing YouTube upload feature:

- displaying the connected Google account (name/email) in **Options → YouTube**;
- uploading the specific clip the user selects to their YouTube account;
- recording locally that a clip has been uploaded, so the plugin can indicate this in the Runs screen.

The plugin does not use Google user data for advertising, analytics, profiling, resale, credit/lending, or training AI/ML models.

## How the data is stored and protected

- OAuth credentials are stored locally in the operating system's secure credential store (keyring/keychain).
- A local upload-history file is stored on the user's computer alongside the plugin's settings. It contains the clip's local file identity and the resulting YouTube video ID, URL, title, and upload timestamp. It contains no OAuth credentials.
- No Google user data is transmitted to the developer or stored on any developer-operated server.

## Data sharing and transfer

The Golden Eye does not sell Google user data and does not share or transfer it to third parties such as advertisers or data brokers. Video files and upload metadata are transmitted only to Google/YouTube APIs, and only when the user chooses to upload a clip.

## Data retention and deletion

- OAuth credentials are retained locally until the user clicks **Disconnect YouTube** in **Options → YouTube**, which removes the stored credentials.
- The local upload-history entry for a clip is retained until the user chooses "forget this upload" for that clip, or deletes the plugin's settings/data.
- The plugin does not delete videos from YouTube. Videos uploaded to the user's YouTube account remain there and are managed by the user in YouTube / YouTube Studio.

## Google API Limited Use

The Golden Eye's use of information received from Google APIs will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements. Google user data is used only to provide or improve the user-facing YouTube upload feature and is not used for advertising, transferred to third parties except as required to provide the feature, or used to train AI/ML models.

## Contact

For questions about this privacy policy, please use the project repository:

<https://github.com/acheronfail/the_golden_eye>
