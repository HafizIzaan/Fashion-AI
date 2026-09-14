# Product Requirements

## Navigation
Desktop: Studio, Clothes Library, Generated Results, Settings.
Mobile: Studio, Library, More/compact navigation.

## Clothes Library
- Manual upload of clothing/product images.
- Store clean clothing/accessory-only images.
- Categories: Outerwear, Tops, Dresses, Bottoms, Shoes/Footwear, Accessories. Jewelry is optional/planned.
- Upload an outfit photo and scan it with AI.
- Detection returns category, description, and confidence.
- Detected items are selectable.
- Extraction generates standalone product images and displays the credit cost before generation.
- User can download generated clothing images or explicitly save them to personal/family library.

## Studio
- Build an outfit from library items.
- Desktop supports drag/drop; mobile uses slot-based library selection.
- Outfit slots: outerwear, top, dress, bottoms, shoes, accessories.
- Wrong-category items are rejected with a clear explanation.
- Dress is a main garment; Dress + Shoes + Accessories is valid. Dress + Top + Bottoms is normally invalid unless layering is explicitly supported.
- Outfit rules must be configurable rather than scattered hard-coded conditionals.
- A temporary base/model image can be uploaded without becoming a permanent library record.

## Results
- Generated output can be downloaded directly.
- Explicit Save creates a permanent result record.
- Results are private by default; family sharing is explicit.

## Settings
- Account
- AI Providers
- AI Models
- Credits
- Preferences
- Administration (admin only): family members, family library management, credit management.

## Permissions
- Personal library: owner controls it.
- Family library: family members can view/use; admins control write/delete/management.
- RLS and backend authorization enforce these rules; UI alone is not sufficient.
