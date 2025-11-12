# Add Rewards Command

The `add:rewards` command allows administrators to add rewards to users based on their email addresses.

## Usage

```bash
node ace add:rewards [options]
```

## Flags

| Flag | Description | Required | Default |
|------|-------------|----------|---------|
| `--emails` | Comma-separated list of user emails | Yes | - |
| `--module` | Module name for the reward | Yes | - |
| `--amount` | Reward amount (must be > 0) | Yes | - |
| `--currency` | Currency for the reward | No | RM |
| `--remarks` | Optional remarks for the reward | No | - |
| `--dry-run` | Show summary without creating rewards | No | false |
| `--force` | Skip confirmation prompt | No | false |

## Examples

### Basic Usage
```bash
# Add a 50 RM reward for referral to a single user
node ace add:rewards --emails="user@example.com" --module="referral" --amount=50

# Add a 100 RM bonus to multiple users
node ace add:rewards --emails="user1@example.com,user2@example.com" --module="bonus" --amount=100
```

### Advanced Usage
```bash
# Add reward with custom currency and remarks
node ace add:rewards \
  --emails="user@example.com" \
  --module="welcome_bonus" \
  --amount=25 \
  --currency="USD" \
  --remarks="Welcome bonus for new users"

# Dry run to see what would be created
node ace add:rewards \
  --emails="user@example.com" \
  --module="test" \
  --amount=10 \
  --dry-run

# Force creation without confirmation
node ace add:rewards \
  --emails="user@example.com" \
  --module="admin_bonus" \
  --amount=75 \
  --force
```

### Interactive Mode
If you don't provide the required flags, the command will prompt you interactively:

```bash
node ace add:rewards
# The command will ask for:
# - User emails
# - Module name
# - Amount
# - Remarks (optional)
```

## Features

- **Email Validation**: Automatically validates email format
- **User Lookup**: Finds users by email addresses and shows their IDs
- **Bulk Operations**: Support for multiple users in a single command
- **Dry Run**: Preview what will be created without making changes
- **Confirmation**: Asks for confirmation before creating rewards (unless `--force` is used)
- **Error Handling**: Continues processing other users if one fails
- **Summary Report**: Shows detailed summary of created rewards

## Database Schema

The command creates records in the `rewards` table with the following structure:

- `user_id`: References the user from the `users` table
- `module`: String identifier for the reward type
- `currency`: Currency code (defaults to 'RM')
- `amount`: Numeric reward amount
- `remarks`: Optional text description
- `withdrawal_id`: Initially null (no withdrawal)
- `created_at` / `updated_at`: Timestamps

## Security Notes

- Only administrators should have access to this command
- The command validates email formats and user existence
- All operations are logged for audit purposes
- Use `--dry-run` to verify before making changes

## Error Handling

The command handles various error scenarios:

- Invalid email formats
- Non-existent users
- Database errors during creation
- Invalid input validation

If any reward creation fails, the command continues with other users and provides a summary of successes and failures.
