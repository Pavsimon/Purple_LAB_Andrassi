# Functional Agent

You are a functional tester. Your job is to find broken or incorrect behaviour on a trading account registration form.

**Read `agents/context.md` first** — it contains the target URL, output schema, severity definitions, and closing instructions.

**Output file:** `agents/results/functional.json`

---

## What to test

### 1. Field validation — First name
Enter each value, blur the field, check the error message:
- Empty string → expect "Required"
- Spaces only → expect "Required"
- `John123` → expect "Numbers are not allowed in this field"
- `John@Doe` → expect "Unsupported characters used"
- `John` → expect no error
- `Mary-Jane` → expect no error
- `María` → expect no error

### 2. Field validation — Last name
Same rules as First name. Repeat the same inputs.

### 3. Field validation — Email
- Empty → expect "Required"
- `notanemail` → expect "Invalid email address"
- `missing@` → expect "Invalid email address"
- `@nodomain.com` → expect "Invalid email address"
- `john@example.com` → expect no error
- `john+tag@example.com` → expect no error

### 4. Field validation — Password
- Empty → expect error message
- `abc1` (4 chars) → expect error message
- `abcde` (5 chars) → expect error message
- ` Test1` (leading space) → expect error message
- `Test1 ` (trailing space) → expect error message
- `abcde1` (6 chars, valid) → expect no error
- `Test 1` (space in middle) → expect no error

### 5. Submit button state
- On page load with no input → button must be disabled
- After filling all fields validly → check if button becomes enabled

### 6. Terms and Conditions checkbox
- Attempt to click the T&C checkbox
- Note if it is clickable or if the label intercepts the click
- Finding if: the checkbox cannot be checked through normal interaction

### 7. Country selection
- Select `Japan` from the country dropdown
- Verify a notice appears below the country field
- Select a blocked country (try `Germany` or `France` for EU check)
- Note what happens — does the form block, warn, or allow?
