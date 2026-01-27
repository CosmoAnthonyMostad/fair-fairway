

## Update Email References

This plan updates all placeholder email addresses from `support@mygolfapp.com` to your new active email `support@mygolfapp.info`.

### Changes

**Files to Update (4 total):**

1. **src/pages/Support.tsx**
   - Update email in contact section button
   - Update mailto link

2. **src/pages/Terms.tsx**
   - Update contact email in Section 12

3. **src/components/settings/HelpCenterDialog.tsx**
   - Update email in "Still need help?" section button

4. **src/components/settings/PrivacySettingsDialog.tsx**
   - Update email in "Account Deletion" section

### Summary

A straightforward find-and-replace across 4 files, changing `.com` to `.info` for all support email references. This ensures users can actually reach you when they contact support.

