---
name: Bug report
about: Create a report to help us improve
title: "[BUG]"
labels: ''
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**How are you using react hotkeys components? (HotKeys, GlobalHotKeys, HotKeysIgnore etc)**

**Expected behavior**
A clear and concise description of what you expected to happen.

**Platform (please complete the following information):**
 - Version of react-hotkeys
 - Browser [e.g. chrome, safari]
 - OS: [e.g. iOS]

**Are you willing and able to create a PR request to fix this issue?**

**APPLICABLE TO v2.0.0-pre1 AND ABOVE: ======================**

**Include the smallest log that includes your issue:**

Set logging to verbose (you'll need the development build if its possible):

```
import { configure } from 'react-hotkeys';

configure({
  logLevel: 'verbose'
})
```

**What Configuration options are you using?**

```
configure({
  //options
})
```
