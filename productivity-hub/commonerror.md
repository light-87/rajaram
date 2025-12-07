# Common Errors & Solutions

This file documents common errors you may encounter and how to fix them.

---

## ❌ Error: "syntax error at or near '0'"

### **What It Means:**
This PostgreSQL/Neon error typically occurs when your code is trying to insert data into a column that doesn't exist in the database yet.

### **Common Causes:**

1. **Missing Database Column**
   - Code is trying to use a new field (like `setup_fee`)
   - Database schema hasn't been updated with the migration

2. **Invalid Data Type**
   - Sending a string where a number is expected
   - Sending `0` or `"0"` to a field that doesn't accept it

3. **Empty String vs NULL**
   - Sending `""` (empty string) instead of `null` for optional numeric fields

### **How to Fix:**

#### Option 1: Don't Use the New Field Yet
If you haven't run the migration, simply **leave the new field empty** when adding/editing records. The code will skip fields with empty values.

#### Option 2: Run the Database Migration
1. Go to [Neon Dashboard](https://console.neon.tech/)
2. Open **SQL Editor**
3. Run the migration SQL (check `migration-*.sql` files)
4. Restart your app: `npm run dev`

#### Option 3: Check Console Logs
Open browser DevTools (F12) and look for:
```
Submitting data: { name: "...", setup_fee: 0, ... }
```

If you see `setup_fee: 0` or any field with unexpected value, that's your culprit!

### **Prevention:**

✅ Always check if data being submitted matches database schema
✅ Use `null` for empty numeric fields, not `0` or `""`
✅ Only include optional fields in insert/update if they have values
✅ Run migrations immediately when code adds new database fields

---

## ❌ Error: iOS Keyboard Not Appearing

### **What It Means:**
On iPhone/iPad, tapping input fields doesn't bring up the keyboard.

### **Cause:**
Missing or incorrect viewport meta tag in the HTML.

### **How to Fix:**

Check `app/layout.tsx` has this:
```typescript
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};
```

Also ensure `globals.css` has:
```css
input, select, textarea {
  font-size: 16px !important;
}
```

### **After Fix:**
1. Stop dev server and restart: `npm run dev`
2. On iPhone: Close Safari tab completely
3. Clear Safari cache (Settings → Safari → Clear History)
4. Reopen the site

---

## ❌ Error: "Failed to load resource: 400 (Bad Request)" from Neon

### **What It Means:**
The database request was malformed or contains invalid data.

### **How to Debug:**

1. Open browser console (F12)
2. Look for `Submitting data:` log
3. Check each field:
   - Numbers should be numbers, not strings
   - Dates should be `YYYY-MM-DD` format
   - Nulls should be `null`, not `""` or `0`

4. Check network tab for the actual SQL error message

### **Common Fixes:**
- Ensure numeric fields use `parseFloat()` not just string values
- Ensure empty optional fields are `null` not `""`
- Check date fields are properly formatted

---

## 📋 Quick Debugging Checklist

When you get ANY database error:

- [ ] Check browser console for `Submitting data:` log
- [ ] Verify all field values are the correct type (string/number/null)
- [ ] Check if new fields exist in database (`SELECT * FROM table LIMIT 1`)
- [ ] Look for migration files in project (`migration-*.sql`)
- [ ] Try with minimal data (only required fields)
- [ ] Check Neon dashboard for actual SQL error message

---

## 🔍 How to Find SQL Errors in Neon

1. Go to [Neon Dashboard](https://console.neon.tech/)
2. Select your project
3. Click **"Monitoring"** or **"Query History"**
4. Look for failed queries (red status)
5. Click to see the actual SQL and error message

This shows you EXACTLY what SQL was run and what failed!

---

## 💡 Pro Tips

1. **Always run migrations immediately** when code changes add new database fields
2. **Use TypeScript strictly** - it catches type mismatches before runtime
3. **Check console logs** - most errors are logged with helpful details
4. **Keep this file updated** - add new errors as you encounter them

---

*Last updated: 2025-12-07*
