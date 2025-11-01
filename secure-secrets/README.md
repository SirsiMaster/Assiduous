# Encrypted Secrets

This directory contains encrypted secrets for the Assiduous platform.

**DO NOT** commit plaintext secrets to this directory.

## Files

### `twilio_2FA_recovery_code.txt.enc`
- **Encryption**: OpenSSL AES-256-CBC
- **Contains**: Twilio 2FA recovery codes
- **Decryption**: 
  ```bash
  openssl enc -d -aes-256-cbc -in twilio_2FA_recovery_code.txt.enc -out twilio_2FA_recovery_code.txt
  # Password required - stored in password manager
  ```

### Google Cloud KMS Encrypted Files (Future)
For Firebase configs and application secrets, we use Google Cloud KMS:
- `firebase-config.json.enc`
- `app-secrets.json.enc`

## Decryption Instructions

### For OpenSSL Encrypted Files (Twilio)
```bash
# Decrypt Twilio recovery codes
openssl enc -d -aes-256-cbc \
  -in secure-secrets/twilio_2FA_recovery_code.txt.enc \
  -out .secrets-decrypted/twilio_2FA_recovery_code.txt

# Enter password when prompted
```

### For KMS Encrypted Files (Firebase/App Secrets)
```bash
# Run the decryption script
./scripts/decrypt-secrets.sh
```

## Environment Variables

For local development, secrets should be in:
- `functions/.env` - Cloud Functions environment variables

For production deployment:
- Secrets are injected via Firebase Secret Manager
- Cloud Functions automatically have access to environment variables

## Security Checklist

- [x] All plaintext secret files in `.gitignore`
- [x] Encrypted files safe to commit
- [x] Decryption passwords stored in password manager (not in repo)
- [x] `.secrets-decrypted/` directory in `.gitignore`
- [ ] KMS keys rotated every 90 days
- [ ] Access to secrets limited to authorized personnel

## Access Control

**Who Has Decryption Access:**
- Project owner (OpenSSL password + GCP KMS access)
- Senior developers (GCP KMS access only for specific keys)

**Emergency Access:**
If you need access to secrets and don't have decryption credentials:
1. Contact project owner
2. Use existing `.env` file in functions/ (already configured)
3. For production, secrets are auto-injected by Firebase

## Related Documentation

- `/docs/SECURITY_COMPLIANCE.md` - Full KMS setup guide
- `/CREDENTIALS_SETUP.md` - API credentials setup
- `/scripts/decrypt-secrets.sh` - Automated decryption script
- `/scripts/encrypt-secrets.sh` - Automated encryption script
