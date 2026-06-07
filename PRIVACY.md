# Privacy

Glossa is designed as a local-first browser extension.

## What Glossa Stores

Glossa stores question cards in Chrome local extension storage:

- selected text
- source URL
- source page title
- creation time

This data stays in your browser profile unless you export it or send it to a model website yourself.

## What Glossa Sends

Glossa does not send card data to a Glossa server.

When you choose a model website, Glossa may:

- copy a generated prompt to your clipboard
- open the model website
- try to fill the model input box

If you submit the prompt on that model website, the content is handled according to that model provider's terms and privacy policy.

## Permissions

Glossa requests Chrome permissions for:

- `storage`: save cards locally
- `sidePanel`: show the card manager
- `activeTab` and `tabs`: read active tab title and URL
- `contextMenus`: save selected text through right click
- `clipboardRead`: save copied PDF text from the side panel
- `clipboardWrite`: copy prompts for model websites
- host access: run the content script on pages and model websites

## Telemetry

The prototype does not include telemetry.

## Future Sync

If sync is added later, it should be optional and clearly separated from local-first behavior.
