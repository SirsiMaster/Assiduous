# Decryption Instructions for Twilio 2FA Recovery Codes

## Encrypted File
`twilio_2FA_recovery_code.txt.enc`

## To Decrypt (on your machine):
```bash
openssl enc -aes-256-cbc -d -pbkdf2 -in twilio_2FA_recovery_code.txt.enc -out twilio_2FA_recovery_code.txt -k "$(whoami)-$(hostname)-secure-2fa-backup"
```

## Security Notes
- Encrypted using AES-256-CBC with PBKDF2 key derivation
- Passphrase is machine-specific: `username-hostname-secure-2fa-backup`
- Only decryptable on this machine with your user account
- Original unencrypted file is gitignored and should never be committed
- Keep encrypted backup in GitHub for disaster recovery

## If You Lose Access
1. Use this encrypted file on your machine
2. Run the decryption command above
3. View the recovery codes to regain Twilio 2FA access
