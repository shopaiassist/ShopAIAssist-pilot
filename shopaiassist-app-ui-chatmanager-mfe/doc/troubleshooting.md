# Troubleshooting

## "Invalid binary plist" error when starting Storybook

This is a MacOS-specific issue logged [here](https://github.com/storybookjs/storybook/issues/20992),
that shows the following error when starting Storybook:

```
Error: Invalid binary plist. Expected 'bplist' at offset 0.
```

The one-time workaround is to temporarily make Safari your default browser, and then switch it back
to whatever default browser you like. Then Storybook will start normally.
