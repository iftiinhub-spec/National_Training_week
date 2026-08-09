# Certificate signature

Place the approved transparent PNG signature in this folder as:

`signature.png`

Recommended image preparation:

- PNG with a transparent background
- Dark green or black ink
- Approximately 1200 × 400 pixels (3:1 aspect ratio)
- Crop empty space around the signature
- Obtain the signatory's written authorization before publishing it

The displayed name and title are configured in `backend/.env`:

```env
CERTIFICATE_SIGNATURE_PATH=assets/signature.png
CERTIFICATE_SIGNATORY_NAME=Full Name
CERTIFICATE_SIGNATORY_TITLE=Program Director
```

Restart the backend after changing these settings. When the image is absent, the certificate displays a clean signature line instead.
